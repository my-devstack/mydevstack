package ports

import (
	"context"
	"time"
)

// VersionServicePort defines the interface for version checking.
type VersionServicePort interface {
	StartScheduler(context.Context, *time.Ticker)
	Stop()
	GetLatestVersion() (string, bool)
	GetGitHubRepo() string
}
