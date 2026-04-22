package configloader

import (
	"context"
	"os"

	config "github.com/beabys/ayotl"
)

var CONFIG_FILE = "CONFIG_FILE"

type Config struct {
	Port           string         `mapstructure:"port"`
	AWS            AWSProxyConfig `mapstructure:"aws"`
	ServicePattern string         `mapstructure:"service_pattern"`
	Emulator       string         `mapstructure:"emulator"`
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
	return defaults
}

func LoadConfig(ctx context.Context) (*Config, error) {

	cfg := &Config{}

	loader := config.New().
		SetConfigImpl(cfg).
		WithEnv("CONFIG_FILE", "PROXY_PORT", "AWS_ENDPOINT", "AWS_ACCESS_KEY", "AWS_SECRET_KEY", "SERVICE_PATTERN", "EMULATOR")

	if err := loader.LoadConfigs(loader.MustString(CONFIG_FILE, "")); err != nil {
		if !os.IsNotExist(err) {
			return nil, err
		}
	}

	if err := loader.Unmarshal(cfg); err != nil {
		return nil, err
	}

	return cfg, nil
}
