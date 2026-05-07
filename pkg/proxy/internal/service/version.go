package service

import (
	"context"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/my-devstack/mydevstack/pkg/proxy/internal/adapters/github"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/cache"
)

const (
	cacheKeyLatestRelease = "github_latest_release"
	cacheTTL              = 25 * time.Hour // Slightly longer than check interval to avoid cache miss
	maxRetries            = 2
	retryDelay            = 5 * time.Minute
)

type VersionService struct {
	cache     *cache.Cache
	github    *github.Client
	githubURL string

	mu           sync.RWMutex
	latestVersion string
	stopCh       chan struct{}
}

func NewVersionService(githubURL string) *VersionService {
	return &VersionService{
		cache:     cache.New(),
		github:    github.NewClient(),
		githubURL: githubURL,
		stopCh:    make(chan struct{}),
	}
}

func (s *VersionService) StartScheduler(intervalHours int) {
	interval := time.Duration(intervalHours) * time.Hour

	// Run immediately on start
	s.checkAndUpdateVersion(context.Background())

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	log.Printf("[VersionService] Scheduler started, checking every %d hours", intervalHours)

	for {
		select {
		case <-ticker.C:
			s.checkAndUpdateVersion(context.Background())
		case <-s.stopCh:
			log.Printf("[VersionService] Scheduler stopped")
			return
		}
	}
}

func (s *VersionService) Stop() {
	close(s.stopCh)
}

func (s *VersionService) checkAndUpdateVersion(ctx context.Context) {
	log.Printf("[VersionService] Checking for latest GitHub release...")

	var latest string
	var lastErr error

	for attempt := 0; attempt <= maxRetries; attempt++ {
		if attempt > 0 {
			log.Printf("[VersionService] Retry %d/%d after error: %v", attempt, maxRetries, lastErr)
			time.Sleep(retryDelay)
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
	defer s.mu.RUnlock()

	if s.latestVersion != "" {
		return s.latestVersion, true
	}

	// Try to get from cache
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