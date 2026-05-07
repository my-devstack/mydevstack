package configloader

import (
	"context"
	"os"

	config "github.com/beabys/ayotl"
)

var CONFIG_FILE = "CONFIG_FILE"

type Config struct {
	Port              string         `mapstructure:"port"`
	AWS               AWSProxyConfig `mapstructure:"aws"`
	ServicePattern    string         `mapstructure:"service_pattern"`
	Emulator          string         `mapstructure:"emulator"`
	GitHubRepo        string         `mapstructure:"github_repo"`
	VersionCheckHours int            `mapstructure:"version_check_hours"`
}

type AWSProxyConfig struct {
	Endpoint  string `mapstructure:"endpoint"`
	AccessKey string `mapstructure:"access_key"`
	SecretKey string `mapstructure:"secret_key"`
}

func (c *Config) SetDefaults() config.ConfigMap {
	defaults := make(config.ConfigMap)
	defaults["port"] = "8081"
	defaults["aws.endpoint"] = "http://localhost:4566"
	defaults["aws.access_key"] = "test"
	defaults["aws.secret_key"] = "test"
	defaults["service_pattern"] = "root"
	defaults["emulator"] = ""
	defaults["github_repo"] = "https://github.com/my-devstack/mydevstack"
	defaults["version_check_hours"] = 24
	return defaults
}

func LoadConfig(ctx context.Context) (*Config, error) {

	cfg := &Config{}

	loader := config.New().
		SetConfigImpl(cfg).
		WithEnv("CONFIG_FILE", "PROXY_PORT", "AWS_ENDPOINT", "AWS_ACCESS_KEY", "AWS_SECRET_KEY", "SERVICE_PATTERN", "EMULATOR", "GITHUB_REPO", "VERSION_CHECK_HOURS")

	if err := loader.LoadConfigs(loader.MustString(CONFIG_FILE, "")); err != nil {
		if !os.IsNotExist(err) {
			return nil, err
		}
	}

	if err := loader.Unmarshal(cfg); err != nil {
		return nil, err
	}

	// Apply defaults if not set
	if cfg.GitHubRepo == "" {
		cfg.GitHubRepo = "https://github.com/my-devstack/mydevstack"
	}
	if cfg.VersionCheckHours == 0 {
		cfg.VersionCheckHours = 24
	}

	return cfg, nil
}
