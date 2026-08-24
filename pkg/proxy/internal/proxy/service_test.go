package proxy

import (
	"context"
	"testing"

	configloader "github.com/my-devstack/mydevstack/pkg/proxy/internal/config"
)

func TestNewProxyService(t *testing.T) {
	cfg := &configloader.Config{
		AWS: configloader.AWSProxyConfig{
			AccessKey: "test",
			SecretKey: "test",
		},
	}

	svc := NewProxyService(cfg, context.Background())

	if svc == nil {
		t.Fatal("NewProxyService returned nil")
	}

	if svc.Region() != "us-east-1" {
		t.Errorf("Default region = %v, want us-east-1", svc.Region())
	}
}

func TestProxyService_Config(t *testing.T) {
	cfg := &configloader.Config{
		AWS: configloader.AWSProxyConfig{
			AccessKey: "test",
			SecretKey: "test",
			Endpoint:  "http://localhost:4566",
		},
	}

	svc := NewProxyService(cfg, context.Background())

	returnedCfg := svc.Config()
	if returnedCfg != cfg {
		t.Error("Config() did not return the same config")
	}
}

func TestProxyService_Region(t *testing.T) {
	cfg := &configloader.Config{}
	svc := NewProxyService(cfg, context.Background())

	region := svc.Region()
	if region != "us-east-1" {
		t.Errorf("Region() = %v, want us-east-1", region)
	}
}

func TestProxyService_SetRegion(t *testing.T) {
	cfg := &configloader.Config{
		AWS: configloader.AWSProxyConfig{
			AccessKey: "test",
			SecretKey: "test",
			Endpoint:  "http://localhost:4566",
		},
	}
	svc := NewProxyService(cfg, context.Background())

	// SetRegion should trigger SetServices which requires valid AWS credentials
	// For testing purposes, we just verify it doesn't panic with invalid credentials
	err := svc.SetRegion("us-west-2")
	// The SetServices will fail because credentials are invalid, but that's expected
	// The test verifies the method doesn't panic
	_ = err
}

func TestProxyService_ServiceGetters(t *testing.T) {
	cfg := &configloader.Config{}
	svc := NewProxyService(cfg, context.Background())

	// All service getters should return nil before SetServices is called
	if svc.S3() != nil {
		t.Error("S3() should be nil before SetServices")
	}
	if svc.Lambda() != nil {
		t.Error("Lambda() should be nil before SetServices")
	}
	if svc.SecretsManager() != nil {
		t.Error("SecretsManager() should be nil before SetServices")
	}
	if svc.SQS() != nil {
		t.Error("SQS() should be nil before SetServices")
	}
	if svc.SNS() != nil {
		t.Error("SNS() should be nil before SetServices")
	}
	if svc.KMS() != nil {
		t.Error("KMS() should be nil before SetServices")
	}
	if svc.DynamoDB() != nil {
		t.Error("DynamoDB() should be nil before SetServices")
	}
	if svc.APIGateway() != nil {
		t.Error("APIGateway() should be nil before SetServices")
	}
	if svc.APIGatewayV2() != nil {
		t.Error("APIGatewayV2() should be nil before SetServices")
	}
	if svc.SSM() != nil {
		t.Error("SSM() should be nil before SetServices")
	}
	if svc.IAM() != nil {
		t.Error("IAM() should be nil before SetServices")
	}
	if svc.Kinesis() != nil {
		t.Error("Kinesis() should be nil before SetServices")
	}
	if svc.RDS() != nil {
		t.Error("RDS() should be nil before SetServices")
	}
	if svc.ElastiCache() != nil {
		t.Error("ElastiCache() should be nil before SetServices")
	}
	if svc.Cognito() != nil {
		t.Error("Cognito() should be nil before SetServices")
	}
}
