package configloader

import (
	"context"
	"os"

	config "github.com/beabys/ayotl"
)

type Config struct {
	Port           string `mapstructure:"port"`
	AwsEndpoint    string `mapstructure:"aws_endpoint"`
	AwsAccessKey   string `mapstructure:"aws_access_key"`
	AwsSecretKey   string `mapstructure:"aws_secret_key"`
	ServicePattern string `mapstructure:"service_pattern"`
}

func (c *Config) SetDefaults() config.ConfigMap {
	defaults := make(config.ConfigMap)
	defaults["port"] = "8081"
	defaults["aws_endpoint"] = "http://localhost:4560"
	defaults["aws_access_key"] = "test"
	defaults["aws_secret_key"] = "test"
	defaults["service_pattern"] = "root"
	return defaults
}

func LoadConfig(ctx context.Context) (*Config, error) {

	cfg := &Config{}

	loader := config.New().
		SetConfigImpl(cfg).
		WithEnv("PORT", "AWS_ENDPOINT", "AWS_ACCESS_KEY", "AWS_SECRET_KEY", "SERVICE_PATTERN")

	if err := loader.LoadConfigs("config.yaml", "config.json"); err != nil {
		if !os.IsNotExist(err) {
			return nil, err
		}
	}

	if err := loader.Unmarshal(cfg); err != nil {
		return nil, err
	}

	return cfg, nil
}
