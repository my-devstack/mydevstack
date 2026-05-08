package service

import (
	"testing"
	"time"
)

func TestVersionService_GetGitHubRepo(t *testing.T) {
	svc := NewVersionService("https://github.com/test/repo")

	if got := svc.GetGitHubRepo(); got != "https://github.com/test/repo" {
		t.Errorf("expected https://github.com/test/repo, got %s", got)
	}
}

func TestVersionService_GetLatestVersion_Empty(t *testing.T) {
	svc := NewVersionService("https://github.com/test/repo")

	_, found := svc.GetLatestVersion()
	if found {
		t.Error("expected no version found initially")
	}
}

func TestVersionService_Stop(t *testing.T) {
	svc := NewVersionService("https://github.com/test/repo")

	// Start and immediately stop - this just ensures it doesn't panic
	svc.Stop()
}

func TestCacheKeyConstant(t *testing.T) {
	if cacheKeyLatestRelease != "github_latest_release" {
		t.Errorf("unexpected cache key: %s", cacheKeyLatestRelease)
	}
}

func TestRetryConstants(t *testing.T) {
	if maxRetries != 2 {
		t.Errorf("expected maxRetries=2, got %d", maxRetries)
	}
	if retryDelay != 5*time.Minute {
		t.Errorf("expected retryDelay=5min, got %v", retryDelay)
	}
}

func TestCacheTTL(t *testing.T) {
	if cacheTTL != 25*time.Hour {
		t.Errorf("expected cacheTTL=25h, got %v", cacheTTL)
	}
}