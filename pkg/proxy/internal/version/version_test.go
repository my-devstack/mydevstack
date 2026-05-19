package version

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
	portmocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestVersionService_GetGitHubRepo(t *testing.T) {
	svc := NewVersionService(nil, nil, "https://github.com/test/repo")
	assert.Equal(t, "https://github.com/test/repo", svc.GetGitHubRepo())
}

func TestVersionService_GetLatestVersion_Empty(t *testing.T) {
	mockCache := portmocks.NewCachePort(t)
	mockCache.EXPECT().Get("github_latest_release").Return("", false).Once()

	svc := NewVersionService(mockCache, nil, "https://github.com/test/repo")
	_, found := svc.GetLatestVersion()
	assert.False(t, found)
}

func TestVersionService_GetLatestVersion_FromCache(t *testing.T) {
	mockCache := portmocks.NewCachePort(t)
	mockCache.EXPECT().Get("github_latest_release").Return("1.2.3", true).Once()

	svc := NewVersionService(mockCache, nil, "https://github.com/test/repo")
	version, found := svc.GetLatestVersion()

	assert.True(t, found)
	assert.Equal(t, "1.2.3", version)
}

func TestVersionService_GetLatestVersion_FromMemory(t *testing.T) {
	mockCache := portmocks.NewCachePort(t)
	svc := NewVersionService(mockCache, nil, "https://github.com/test/repo")

	// Manually set version in memory
	svc.mu.Lock()
	svc.latestVersion = "2.0.0"
	svc.mu.Unlock()

	version, found := svc.GetLatestVersion()
	assert.True(t, found)
	assert.Equal(t, "2.0.0", version)
	// Should NOT call cache when memory has it
	mockCache.AssertNotCalled(t, "Get", mock.Anything)
}

func TestVersionService_checkAndUpdateVersion_Success(t *testing.T) {
	mockCache := portmocks.NewCachePort(t)
	mockGitHub := portmocks.NewGitHubClientPort(t)
	ctx := context.Background()

	mockGitHub.EXPECT().GetLatestRelease(ctx, "https://github.com/owner/repo").
		Return(&ports.Release{TagName: "v1.5.0", HTMLURL: "https://github.com/owner/repo/releases/v1.5.0"}, nil)
	mockCache.EXPECT().Set("github_latest_release", "1.5.0", mock.AnythingOfType("time.Duration"))

	svc := NewVersionService(mockCache, mockGitHub, "https://github.com/owner/repo")
	svc.checkAndUpdateVersion(ctx)

	version, found := svc.GetLatestVersion()
	assert.True(t, found)
	assert.Equal(t, "1.5.0", version)
}

func TestVersionService_checkAndUpdateVersion_Success_NoVPrefix(t *testing.T) {
	mockCache := portmocks.NewCachePort(t)
	mockGitHub := portmocks.NewGitHubClientPort(t)
	ctx := context.Background()

	mockGitHub.EXPECT().GetLatestRelease(ctx, "https://github.com/owner/repo").
		Return(&ports.Release{TagName: "1.5.0"}, nil)
	mockCache.EXPECT().Set("github_latest_release", "1.5.0", mock.AnythingOfType("time.Duration"))

	svc := NewVersionService(mockCache, mockGitHub, "https://github.com/owner/repo")
	svc.checkAndUpdateVersion(ctx)

	version, found := svc.GetLatestVersion()
	assert.True(t, found)
	assert.Equal(t, "1.5.0", version)
}

func TestVersionService_checkAndUpdateVersion_Error(t *testing.T) {
	mockCache := portmocks.NewCachePort(t)
	mockGitHub := portmocks.NewGitHubClientPort(t)
	ctx := context.Background()

	mockGitHub.EXPECT().GetLatestRelease(ctx, "https://github.com/owner/repo").
		Return(nil, errors.New("network error")).
		Times(maxRetries + 1) // retries exhausted

	svc := NewVersionService(mockCache, mockGitHub, "https://github.com/owner/repo")
	// Override retry delay to avoid real 5-minute wait
	origDelay := retryDelay
	retryDelay = time.Millisecond
	defer func() { retryDelay = origDelay }()

	svc.checkAndUpdateVersion(ctx)

	// Should not have updated version
	mockCache.EXPECT().Get("github_latest_release").Return("", false).Once()
	_, found := svc.GetLatestVersion()
	assert.False(t, found)
}

func TestVersionService_checkAndUpdateVersion_RetryThenSuccess(t *testing.T) {
	mockCache := portmocks.NewCachePort(t)
	mockGitHub := portmocks.NewGitHubClientPort(t)
	ctx := context.Background()

	// First call fails, second succeeds
	mockGitHub.EXPECT().GetLatestRelease(ctx, "https://github.com/owner/repo").
		Return(nil, errors.New("first error")).Once()
	mockGitHub.EXPECT().GetLatestRelease(ctx, "https://github.com/owner/repo").
		Return(&ports.Release{TagName: "v2.0.0"}, nil).Once()
	mockCache.EXPECT().Set("github_latest_release", "2.0.0", mock.AnythingOfType("time.Duration"))

	svc := NewVersionService(mockCache, mockGitHub, "https://github.com/owner/repo")
	// Override retry delay to avoid real 5-minute wait
	origDelay := retryDelay
	retryDelay = time.Millisecond
	defer func() { retryDelay = origDelay }()

	svc.checkAndUpdateVersion(ctx)

	version, found := svc.GetLatestVersion()
	assert.True(t, found)
	assert.Equal(t, "2.0.0", version)
}

func TestVersionService_Stop(t *testing.T) {
	svc := NewVersionService(nil, nil, "https://github.com/test/repo")
	svc.Stop() // just ensure no panic
}

func TestVersionService_StartScheduler_Ticks(t *testing.T) {
	mockCache := portmocks.NewCachePort(t)
	mockGitHub := portmocks.NewGitHubClientPort(t)
	ctx := context.Background()

	// Expect 3 calls: initial + 2 ticks
	mockGitHub.EXPECT().GetLatestRelease(ctx, "https://github.com/owner/repo").
		Return(&ports.Release{TagName: "v1.0.0"}, nil).Times(3)
	mockCache.EXPECT().Set("github_latest_release", "1.0.0", mock.AnythingOfType("time.Duration")).Times(3)

	svc := NewVersionService(mockCache, mockGitHub, "https://github.com/owner/repo")

	// Fake ticker: buffered channel with 2 ticks
	ticker := make(chan time.Time, 2)
	ticker <- time.Now()
	ticker <- time.Now()

	// Wrap in *time.Ticker
	tkr := &time.Ticker{C: ticker}

	done := make(chan struct{})
	go func() {
		svc.StartScheduler(ctx, tkr)
		close(done)
	}()

	// Give goroutine time to process initial + 2 ticks
	time.Sleep(10 * time.Millisecond)
	svc.Stop()
	<-done // wait for goroutine to exit
}

func TestVersionService_StartScheduler(t *testing.T) {
	mockCache := portmocks.NewCachePort(t)
	mockGitHub := portmocks.NewGitHubClientPort(t)

	// Expect only the initial call (ticker won't fire during test)
	mockGitHub.EXPECT().GetLatestRelease(mock.Anything, "https://github.com/owner/repo").
		Return(&ports.Release{TagName: "v1.0.0"}, nil).Once()
	mockCache.EXPECT().Set("github_latest_release", "1.0.0", mock.AnythingOfType("time.Duration")).Once()

	svc := NewVersionService(mockCache, mockGitHub, "https://github.com/owner/repo")

	tkr := time.NewTicker(1 * time.Hour) // won't fire — we test StartScheduler wrapper, not the loop
	done := make(chan struct{})
	go func() {
		svc.StartScheduler(context.Background(), tkr)
		close(done)
	}()

	time.Sleep(5 * time.Millisecond) // let initial check run
	svc.Stop()
	<-done
}

func TestVersionService_Constants(t *testing.T) {
	assert.Equal(t, "github_latest_release", cacheKeyLatestRelease)
	assert.Equal(t, 2, maxRetries)
	assert.Equal(t, 25*time.Hour, cacheTTL)
}

func TestVersionService_RetryDelayDefault(t *testing.T) {
	// Verify default retry delay is 5 minutes
	assert.Equal(t, 5*time.Minute, retryDelay)
}
