package configloader

import (
	"context"
	"errors"
	"os"

	config "github.com/beabys/ayotl"
)

// LoadConfig loads the configuration for the proxy server from environment variables and/or a config file.
// It first checks for a config file specified by the CONFIG_FILE environment variable. If the file exists, it loads configuration values from it.
// If the file does not exist, it falls back to environment variables and defaults. The configuration is unmarshaled into a Config struct and returned.
// The configuration file should be in YAML format and can override any of the default values. Environment variables take precedence over config file values, and defaults are used if neither is set.
func LoadConfig(ctx context.Context) (*Config, error) {
	loader := config.NewWithParams(
		&config.Params{
			Defaults: setDefaults(),
			EnvAlias: setEnvAlias(),
		},
	).WithEnv(
		CONFIG_FILE,
		"PROXY_PORT",
		"AWS_ENDPOINT",
		"AWS_ACCESS_KEY",
		"AWS_SECRET_KEY",
		"AWS_ENDPOINT_OVERRIDE",
		"EMULATOR",
		"GITHUB_REPO",
		"VERSION_CHECK_HOURS",
	)
	files := []string{}
	configFile := loader.MustString(CONFIG_FILE, "")
	if configFile != "" {
		files = append(files, configFile)
	}

	if err := loader.LoadConfigs(files...); err != nil {
		if !errors.Is(err, os.ErrNotExist) {
			return nil, err
		}
	}

	cfg := &Config{}
	if err := loader.Unmarshal(cfg); err != nil {
		return nil, err
	}

	return cfg, nil
}

func setDefaults() config.ConfigMap {
	return config.ConfigMap{
		"port":                "8081",
		"aws.endpoint":        "http://localhost:4566",
		"aws.access_key":      "test",
		"aws.secret_key":      "test",
		"emulator":            "",
		"github_repo":         "https://github.com/my-devstack/mydevstack",
		"version_check_hours": 24,
	}
}

func setEnvAlias() config.ConfigEnvAlias {
	return config.ConfigEnvAlias{
		"PROXY_PORT":            "port",
		"AWS_ENDPOINT":          "aws.endpoint",
		"AWS_ACCESS_KEY":        "aws.access_key",
		"AWS_SECRET_KEY":        "aws.secret_key",
		"AWS_ENDPOINT_OVERRIDE": "aws.endpoint_override",
		"SERVICE_PATTERN":       "service_pattern",
		"EMULATOR":              "emulator",
		"GITHUB_REPO":           "github_repo",
		"VERSION_CHECK_HOURS":   "version_check_hours",
	}
}
