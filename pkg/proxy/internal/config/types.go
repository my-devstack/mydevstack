package configloader

var CONFIG_FILE = "CONFIG_FILE"

type Config struct {
	Port              string         `mapstructure:"port"`
	AWS               AWSProxyConfig `mapstructure:"aws"`
	Emulator          string         `mapstructure:"emulator"`
	GitHubRepo        string         `mapstructure:"github_repo"`
	VersionCheckHours int            `mapstructure:"version_check_hours"`
}

type AWSProxyConfig struct {
	Endpoint         string `mapstructure:"endpoint"`
	AccessKey        string `mapstructure:"access_key"`
	SecretKey        string `mapstructure:"secret_key"`
	EndpointOverride string `mapstructure:"endpoint_override"`
}
