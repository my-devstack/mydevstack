package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"

	"github.com/my-devstack/mydevstack/pkg/proxy/internal/application"
	configloader "github.com/my-devstack/mydevstack/pkg/proxy/internal/config"
	"golang.org/x/sync/errgroup"
)

func main() {
	// First we Set a context and a stopFn
	ctx, stopFn := signal.NotifyContext(context.Background(), os.Interrupt, os.Kill, syscall.SIGTERM)
	defer stopFn()
	wg, ctx := errgroup.WithContext(ctx)

	cfg, err := loadConfig()
	if err != nil {
		log.Printf("Warning: Could not load config from files, using defaults: %v", err)
		cfg = defaultConfig()
	}

	// set up the dependency injection container and initialize all services
	container, err := application.NewContainer(ctx, wg, cfg)
	if err != nil {
		log.Fatalf("Failed to create container: %v", err)
	}

	addr := fmt.Sprintf(":%s", cfg.Port)

	log.Printf("Starting AWS Proxy Server...")
	log.Printf("  Port: %s", cfg.Port)
	log.Printf("  AWS Endpoint: %s", cfg.AWS.Endpoint)
	log.Println("")
	log.Println("   _____         ________                _________ __                 __    ")
	log.Println("  /     \\ ___.__.\\______ \\   _______  __/   _____//  |______    ____ |  | __")
	log.Println(" /  \\ /  <   |  | |    |  \\_/ __ \\  \\/ /\\_____  \\\\   __\\__  \\ _/ ___\\|  |/ /")
	log.Println("/    Y    \\___  | |    `   \\  ___/\\   / /        \\|  |  / __ \\\\  \\___|    < ")
	log.Println("\\____|__  / ____|/_______  /\\___  >\\_/ /_______  /|__| (____  /\\___  >__|_ \\")
	log.Println("        \\/\\/             \\/     \\/             \\/           \\/     \\/     \\/")
	log.Println("")
	log.Printf("Proxy endpoints:")
	log.Printf("  API Gateway:      http://localhost:%s/apigateway/", cfg.Port)
	log.Printf("  Secrets Manager:  http://localhost:%s/secretsmanager/", cfg.Port)
	log.Printf("  S3:               http://localhost:%s/s3/", cfg.Port)
	log.Printf("  Lambda:           http://localhost:%s/lambda/", cfg.Port)
	log.Printf("  SQS:              http://localhost:%s/sqs/", cfg.Port)
	log.Printf("  SNS:              http://localhost:%s/sns/", cfg.Port)
	log.Printf("  KMS:              http://localhost:%s/kms/", cfg.Port)
	log.Printf("  DynamoDB:         http://localhost:%s/dynamodb/", cfg.Port)
	log.Printf("  DynamoDB Streams: http://localhost:%s/dynamodbstreams/", cfg.Port)
	log.Printf("  RDS:              http://localhost:%s/rds/", cfg.Port)
	log.Printf("  CloudFormation:   http://localhost:%s/cloudformation/", cfg.Port)
	log.Printf("  CloudWatch:       http://localhost:%s/cloudwatch/", cfg.Port)
	log.Printf("  CloudWatch Logs:  http://localhost:%s/cloudwatchlogs/", cfg.Port)
	log.Printf("  ElastiCache:      http://localhost:%s/elasticache/", cfg.Port)
	log.Printf("  IAM:              http://localhost:%s/iam/", cfg.Port)
	log.Printf("  Kinesis:          http://localhost:%s/kinesis/", cfg.Port)
	log.Printf("  Step Functions:   http://localhost:%s/stepfunctions/", cfg.Port)
	log.Printf("  SES:              http://localhost:%s/sesv2/", cfg.Port)
	log.Printf("  MSK (Kafka):      http://localhost:%s/kafka/", cfg.Port)
	log.Printf("  OpenSearch:       http://localhost:%s/opensearch/", cfg.Port)
	log.Printf("  SSM:              http://localhost:%s/ssm/", cfg.Port)
	log.Printf("")
	log.Println("https://my-devstack.github.io/")
	log.Println("")
	log.Println("Support me on https://buymeacoffee.com/beabys")
	log.Println("")

	// Start the version check scheduler
	container.RunScheduler(cfg.VersionCheckHours)

	// running the webserver in a goroutine and waiting for shutdown signal
	container.RunServer(addr)

	// block until we receive a shutdown signal, then gracefully stop the server and scheduler
	err = wg.Wait()
	if err != nil {
		log.Fatalf("application stopped with error: %v", err)
	}
	log.Print("application stopped")
}

func loadConfig() (*configloader.Config, error) {
	return configloader.LoadConfig(context.Background())
}

// deprecated: will be removed in favor of loading from config files. This is only used as a fallback if config loading fails, and is not intended to be used directly in tests.
func defaultConfig() *configloader.Config {
	githubRepo := getEnv("GITHUB_REPO", "https://github.com/my-devstack/mydevstack")
	versionCheckHours := 24
	if v := os.Getenv("VERSION_CHECK_HOURS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			versionCheckHours = n
		}
	}

	return &configloader.Config{
		Port: getEnv("PROXY_PORT", "8081"),
		AWS: configloader.AWSProxyConfig{
			Endpoint:  getEnv("AWS_ENDPOINT", "http://localhost:4566"),
			AccessKey: getEnv("AWS_ACCESS_KEY", "test"),
			SecretKey: getEnv("AWS_SECRET_KEY", "test"),
		},
		ServicePattern:    getEnv("SERVICE_PATTERN", "root"),
		GitHubRepo:        githubRepo,
		VersionCheckHours: versionCheckHours,
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
