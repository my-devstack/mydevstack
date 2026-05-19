package ports

import "context"

// Release represents a GitHub release.
type Release struct {
	TagName string
	HTMLURL string
}

// GitHubClientPort defines the interface for fetching GitHub releases.
type GitHubClientPort interface {
	GetLatestRelease(ctx context.Context, repoURL string) (*Release, error)
}
