package version

import (
	"context"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

const (
	cacheKeyLatestRelease = "github_latest_release"
	cacheTTL              = 25 * time.Hour // Slightly longer than check interval to avoid cache miss
	maxRetries            = 2
)

var retryDelay = 5 * time.Minute //nolint:gochecknoglobals // mutable for tests

type VersionService struct {
	cache     ports.CachePort
	github    ports.GitHubClientPort
	githubURL string

	mu            sync.RWMutex
	latestVersion string

	stopCh   chan struct{}
	stopOnce sync.Once
}

func NewVersionService(cache ports.CachePort, github ports.GitHubClientPort, githubURL string) *VersionService {
	return &VersionService{
		cache:     cache,
		github:    github,
		githubURL: githubURL,
		stopCh:    make(chan struct{}),
	}
}

func (s *VersionService) StartScheduler(ctx context.Context, t *time.Ticker) {
	defer t.Stop()

	log.Print("[VersionService] Scheduler started")

	s.checkAndUpdateVersion(ctx)
	for {
		select {
		case <-t.C:
			s.checkAndUpdateVersion(ctx)
		case <-s.stopCh:
			log.Printf("[VersionService] Scheduler stopped (stop signal)")
			return
		case <-ctx.Done():
			log.Printf("[VersionService] Scheduler stopped (context cancelled)")
			return
		}
	}
}

// Stop signals the scheduler to stop. Safe to call multiple times.
func (s *VersionService) Stop() {
	s.stopOnce.Do(func() {
		close(s.stopCh)
	})
}

// stopped reports whether the service has been asked to stop, either through
// Stop() or through cancellation of the supplied context.
func (s *VersionService) stopped(ctx context.Context) bool {
	select {
	case <-s.stopCh:
		return true
	case <-ctx.Done():
		return true
	default:
		return false
	}
}

// waitRetry blocks for retryDelay, returning early if the service is stopped or
// the context is cancelled. It returns true when the full delay elapsed and
// false when interrupted, so callers can abort promptly on shutdown instead of
// sleeping for the whole retry delay.
func (s *VersionService) waitRetry(ctx context.Context) bool {
	timer := time.NewTimer(retryDelay)
	defer timer.Stop()

	select {
	case <-timer.C:
		return true
	case <-s.stopCh:
		return false
	case <-ctx.Done():
		return false
	}
}

func (s *VersionService) checkAndUpdateVersion(ctx context.Context) {
	log.Printf("[VersionService] Checking for latest GitHub release...")

	var latest string
	var lastErr error

	for attempt := 0; attempt <= maxRetries; attempt++ {
		if attempt > 0 {
			log.Printf("[VersionService] Retry %d/%d after error: %v", attempt, maxRetries, lastErr)
			if !s.waitRetry(ctx) {
				log.Printf("[VersionService] Retry wait interrupted, aborting version check")
				return
			}
		}

		if s.stopped(ctx) {
			log.Printf("[VersionService] Version check aborted before request")
			return
		}

		release, err := s.github.GetLatestRelease(ctx, s.githubURL)
		if err != nil {
			lastErr = err
			continue
		}

		// Remove 'v' prefix if present for consistent comparison
		latest = strings.TrimPrefix(release.TagName, "v")

		s.mu.Lock()
		s.latestVersion = latest
		s.mu.Unlock()

		// Update cache
		s.cache.Set(cacheKeyLatestRelease, latest, cacheTTL)

		log.Printf("[VersionService] Updated to latest version: %s", latest)
		return
	}

	log.Printf("[VersionService] Failed after %d retries: %v. Will retry on next scheduled run.", maxRetries, lastErr)
}

func (s *VersionService) GetLatestVersion() (string, bool) {
	s.mu.RLock()
	if s.latestVersion != "" {
		s.mu.RUnlock()
		return s.latestVersion, true
	}
	s.mu.RUnlock()

	// Try to get from cache (outside RLock to avoid RLock→Lock upgrade deadlock)
	if cached, found := s.cache.Get(cacheKeyLatestRelease); found {
		s.mu.Lock()
		s.latestVersion = cached
		s.mu.Unlock()
		return cached, true
	}

	return "", false
}

func (s *VersionService) GetGitHubRepo() string {
	return s.githubURL
}
