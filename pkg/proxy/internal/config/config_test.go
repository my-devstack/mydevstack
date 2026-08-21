package configloader

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

// Helper to clear all config-related env vars
func clearConfigEnv() {
	envVars := []string{
		CONFIG_FILE,
		"PROXY_PORT",
		"AWS_ENDPOINT",
		"AWS_ACCESS_KEY",
		"AWS_SECRET_KEY",
		"AWS_ENDPOINT_OVERRIDE",
		"EMULATOR",
		"GITHUB_REPO",
		"VERSION_CHECK_HOURS",
	}
	for _, ev := range envVars {
		_ = os.Unsetenv(ev)
	}
}

func init() {
	// Ensure clean environment at test init
	clearConfigEnv()
}

func TestConfig_StructFields(t *testing.T) {
	cfg := &Config{
		Port:              "8080",
		Emulator:          "moto",
		GitHubRepo:        "https://github.com/test/repo",
		VersionCheckHours: 12,
		AWS: AWSProxyConfig{
			Endpoint:  "http://test:4566",
			AccessKey: "key",
			SecretKey: "secret",
		},
	}

	if cfg.Port != "8080" {
		t.Errorf("Port = %v, want 8080", cfg.Port)
	}
	if cfg.Emulator != "moto" {
		t.Errorf("Emulator = %v, want moto", cfg.Emulator)
	}
	if cfg.GitHubRepo != "https://github.com/test/repo" {
		t.Errorf("GitHubRepo = %v, want https://github.com/test/repo", cfg.GitHubRepo)
	}
	if cfg.VersionCheckHours != 12 {
		t.Errorf("VersionCheckHours = %v, want 12", cfg.VersionCheckHours)
	}
	if cfg.AWS.Endpoint != "http://test:4566" {
		t.Errorf("AWS.Endpoint = %v, want http://test:4566", cfg.AWS.Endpoint)
	}
	if cfg.AWS.AccessKey != "key" {
		t.Errorf("AWS.AccessKey = %v, want key", cfg.AWS.AccessKey)
	}
	if cfg.AWS.SecretKey != "secret" {
		t.Errorf("AWS.SecretKey = %v, want secret", cfg.AWS.SecretKey)
	}
}

func TestAWSProxyConfig_StructFields(t *testing.T) {
	awsCfg := AWSProxyConfig{
		Endpoint:  "http://local:4566",
		AccessKey: "ak",
		SecretKey: "sk",
	}

	if awsCfg.Endpoint != "http://local:4566" {
		t.Errorf("Endpoint = %v, want http://local:4566", awsCfg.Endpoint)
	}
	if awsCfg.AccessKey != "ak" {
		t.Errorf("AccessKey = %v, want ak", awsCfg.AccessKey)
	}
	if awsCfg.SecretKey != "sk" {
		t.Errorf("SecretKey = %v, want sk", awsCfg.SecretKey)
	}
}

func TestAWSProxyConfig_EndpointOverride(t *testing.T) {
	// Test empty default
	awsCfg := AWSProxyConfig{
		Endpoint:  "http://local:4566",
		AccessKey: "ak",
		SecretKey: "sk",
	}
	if awsCfg.EndpointOverride != "" {
		t.Errorf("EndpointOverride = %v, want empty string", awsCfg.EndpointOverride)
	}
	
	// Test populated
	awsCfg.EndpointOverride = "https://my-public-host:4566"
	if awsCfg.EndpointOverride != "https://my-public-host:4566" {
		t.Errorf("EndpointOverride = %v, want https://my-public-host:4566", awsCfg.EndpointOverride)
	}
}

func TestLoadConfig_Defaults(t *testing.T) {
	clearConfigEnv()

	cfg, err := LoadConfig(context.Background())
	if err != nil {
		t.Fatalf("LoadConfig() error = %v", err)
	}

	if cfg.Port != "8081" {
		t.Errorf("Port = %v, want 8081", cfg.Port)
	}
	if cfg.AWS.Endpoint != "http://localhost:4566" {
		t.Errorf("AWS.Endpoint = %v, want http://localhost:4566", cfg.AWS.Endpoint)
	}
	if cfg.AWS.AccessKey != "test" {
		t.Errorf("AWS.AccessKey = %v, want test", cfg.AWS.AccessKey)
	}
	if cfg.AWS.SecretKey != "test" {
		t.Errorf("AWS.SecretKey = %v, want test", cfg.AWS.SecretKey)
	}
	if cfg.Emulator != "" {
		t.Errorf("Emulator = %v, want empty string", cfg.Emulator)
	}
	if cfg.GitHubRepo != "https://github.com/my-devstack/mydevstack" {
		t.Errorf("GitHubRepo = %v, want https://github.com/my-devstack/mydevstack", cfg.GitHubRepo)
	}
	if cfg.VersionCheckHours != 24 {
		t.Errorf("VersionCheckHours = %v, want 24", cfg.VersionCheckHours)
	}
}

func TestLoadConfig_WithEnvOverrides(t *testing.T) {
	clearConfigEnv()
	defer clearConfigEnv()

	envs := map[string]string{
		"PROXY_PORT":          "9090",
		"AWS_ENDPOINT":        "http://override:4566",
		"AWS_ACCESS_KEY":      "override_key",
		"AWS_SECRET_KEY":      "override_secret",
		"EMULATOR":            "moto",
		"GITHUB_REPO":         "https://github.com/override/repo",
		"VERSION_CHECK_HOURS": "12",
	}
	for k, v := range envs {
		if err := os.Setenv(k, v); err != nil {
			t.Fatalf("Setenv(%s) failed: %v", k, err)
		}
	}

	cfg, err := LoadConfig(context.Background())
	if err != nil {
		t.Fatalf("LoadConfig() error = %v", err)
	}

	if cfg.Port != "9090" {
		t.Errorf("Port = %v, want 9090", cfg.Port)
	}
	if cfg.AWS.Endpoint != "http://override:4566" {
		t.Errorf("AWS.Endpoint = %v, want http://override:4566", cfg.AWS.Endpoint)
	}
	if cfg.AWS.AccessKey != "override_key" {
		t.Errorf("AWS.AccessKey = %v, want override_key", cfg.AWS.AccessKey)
	}
	if cfg.AWS.SecretKey != "override_secret" {
		t.Errorf("AWS.SecretKey = %v, want override_secret", cfg.AWS.SecretKey)
	}
	if cfg.Emulator != "moto" {
		t.Errorf("Emulator = %v, want moto", cfg.Emulator)
	}
	if cfg.GitHubRepo != "https://github.com/override/repo" {
		t.Errorf("GitHubRepo = %v, want https://github.com/override/repo", cfg.GitHubRepo)
	}
	if cfg.VersionCheckHours != 12 {
		t.Errorf("VersionCheckHours = %v, want 12", cfg.VersionCheckHours)
	}
}

func TestLoadConfig_AWS_ENDPOINT_OVERRIDE(t *testing.T) {
	clearConfigEnv()
	defer clearConfigEnv()
	
	// Test default empty string
	cfg, err := LoadConfig(context.Background())
	if err != nil {
		t.Fatalf("LoadConfig() error = %v", err)
	}
	if cfg.AWS.EndpointOverride != "" {
		t.Errorf("AWS.EndpointOverride = %v, want empty string", cfg.AWS.EndpointOverride)
	}
	
	// Test env var override
	if err := os.Setenv("AWS_ENDPOINT_OVERRIDE", "https://my-public-host:4566"); err != nil {
		t.Fatalf("Setenv failed: %v", err)
	}
	cfg, err = LoadConfig(context.Background())
	if err != nil {
		t.Fatalf("LoadConfig() error = %v", err)
	}
	if cfg.AWS.EndpointOverride != "https://my-public-host:4566" {
		t.Errorf("AWS.EndpointOverride = %v, want https://my-public-host:4566", cfg.AWS.EndpointOverride)
	}
}

func TestLoadConfig_FromFile(t *testing.T) {
	clearConfigEnv()
	defer clearConfigEnv()

	tmpDir := t.TempDir()
	configFile := filepath.Join(tmpDir, "config.yaml")

	configContent := `port: "9000"
aws:
  endpoint: "http://file:4566"
  access_key: "file_key"
  secret_key: "file_secret"
emulator: "moto"
github_repo: "https://github.com/file/repo"
version_check_hours: 12
`
	if err := os.WriteFile(configFile, []byte(configContent), 0644); err != nil {
		t.Fatalf("Failed to write config file: %v", err)
	}

	if err := os.Setenv(CONFIG_FILE, configFile); err != nil {
		t.Fatalf("Setenv failed: %v", err)
	}

	cfg, err := LoadConfig(context.Background())
	if err != nil {
		t.Fatalf("LoadConfig() error = %v", err)
	}

	if cfg.Port != "9000" {
		t.Errorf("Port = %v, want 9000", cfg.Port)
	}
	if cfg.AWS.Endpoint != "http://file:4566" {
		t.Errorf("AWS.Endpoint = %v, want http://file:4566", cfg.AWS.Endpoint)
	}
	if cfg.AWS.AccessKey != "file_key" {
		t.Errorf("AWS.AccessKey = %v, want file_key", cfg.AWS.AccessKey)
	}
	if cfg.AWS.SecretKey != "file_secret" {
		t.Errorf("AWS.SecretKey = %v, want file_secret", cfg.AWS.SecretKey)
	}
	if cfg.Emulator != "moto" {
		t.Errorf("Emulator = %v, want moto", cfg.Emulator)
	}
	if cfg.GitHubRepo != "https://github.com/file/repo" {
		t.Errorf("GitHubRepo = %v, want https://github.com/file/repo", cfg.GitHubRepo)
	}
	if cfg.VersionCheckHours != 12 {
		t.Errorf("VersionCheckHours = %v, want 12", cfg.VersionCheckHours)
	}
}

func TestLoadConfig_NonExistentFile(t *testing.T) {
	clearConfigEnv()
	defer clearConfigEnv()

	nonexistent := filepath.Join(t.TempDir(), "nonexistent.yaml")
	if err := os.Setenv(CONFIG_FILE, nonexistent); err != nil {
		t.Fatalf("Setenv failed: %v", err)
	}

	cfg, err := LoadConfig(context.Background())
	if err != nil {
		t.Fatalf("LoadConfig() error = %v", err)
	}

	// Should return defaults when file does not exist
	if cfg.Port != "8081" {
		t.Errorf("Port = %v, want 8081 (default)", cfg.Port)
	}
}

func TestLoadConfig_UnmarshalError(t *testing.T) {
	clearConfigEnv()
	defer clearConfigEnv()

	tmpDir := t.TempDir()
	configFile := filepath.Join(tmpDir, "config.yaml")

	// version_check_hours is int; a non-parseable string causes mapstructure to fail
	configContent := `port: "8080"
aws:
  endpoint: "http://local:4566"
  access_key: "ak"
  secret_key: "sk"
version_check_hours: "not_a_number"
`
	if err := os.WriteFile(configFile, []byte(configContent), 0644); err != nil {
		t.Fatalf("Failed to write config file: %v", err)
	}
	if err := os.Setenv(CONFIG_FILE, configFile); err != nil {
		t.Fatalf("Setenv failed: %v", err)
	}

	_, err := LoadConfig(context.Background())
	if err == nil {
		t.Error("LoadConfig() expected Unmarshal error for bad int value, got nil")
	}
}

func TestLoadConfig_InvalidYamlFile(t *testing.T) {
	clearConfigEnv()
	defer clearConfigEnv()

	tmpDir := t.TempDir()
	configFile := filepath.Join(tmpDir, "bad.yaml")

	// Write a file with invalid YAML content that will cause a parse error
	if err := os.WriteFile(configFile, []byte("'"), 0644); err != nil {
		t.Fatalf("Failed to write config file: %v", err)
	}

	if err := os.Setenv(CONFIG_FILE, configFile); err != nil {
		t.Fatalf("Setenv failed: %v", err)
	}

	_, err := LoadConfig(context.Background())
	if err == nil {
		t.Error("LoadConfig() expected error for invalid YAML, got nil")
	}
}
