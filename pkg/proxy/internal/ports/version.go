package ports

// VersionServicePort defines the interface for version checking.
type VersionServicePort interface {
	GetLatestVersion() (string, bool)
	GetGitHubRepo() string
}
