package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/my-devstack/mydevstack/pkg/proxy/bootstrap"
	http2 "github.com/my-devstack/mydevstack/pkg/proxy/internal/adapters/http"
	configloader "github.com/my-devstack/mydevstack/pkg/proxy/internal/config"
)

func main() {
	cfg, err := loadConfig()
	if err != nil {
		log.Printf("Warning: Could not load config from files, using defaults: %v", err)
		cfg = defaultConfig()
	}

	log.Printf("Starting AWS Proxy Server...")
	log.Printf("  Port: %s", cfg.Port)
	log.Printf("  AWS Endpoint: %s", cfg.AWS.Endpoint)

	container, err := bootstrap.NewContainer(cfg)
	if err != nil {
		log.Fatalf("Failed to create container: %v", err)
	}

	r := gin.Default()
	r.Use(gin.Logger())

	setupRoutes(r, container.Handler)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Println("")
	log.Println("   _____         ________                _________ __                 __    ")
	log.Println("  /     \\ ___.__.\\______ \\   _______  __/   _____//  |______    ____ |  | __")
	log.Println(" /  \\ /  <   |  | |    |  \\_/ __ \\  \\/ /\\_____  \\\\   __\\__  \\ _/ ___\\|  |/ /")
	log.Println("/    Y    \\___  | |    `   \\  ___/\\   / /        \\|  |  / __ \\\\  \\___|    < ")
	log.Println("\\____|__  / ____|/_______  /\\___  >\\_/ /_______  /|__| (____  /\\___  >__|_ \\")
	log.Println("        \\/\\/             \\/     \\/             \\/           \\/     \\/     \\/")
	log.Println("")
	log.Printf("Server listening on %s", addr)
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
	log.Printf("  Step Functions:   http://localhost:%s/api/stepfunctions", cfg.Port)
	log.Printf("  SES:              http://localhost:%s/sesv2/", cfg.Port)
	log.Printf("  MSK (Kafka):      http://localhost:%s/kafka/", cfg.Port)
	log.Printf("  OpenSearch:       http://localhost:%s/opensearch/", cfg.Port)
	log.Printf("  SSM:              http://localhost:%s/ssm/", cfg.Port)
	log.Printf("")
	log.Println("https://my-devstack.github.io/")
	log.Println("")
	log.Println("Support me on https://buymeacoffee.com/beabys")
	log.Println("")
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func loadConfig() (*configloader.Config, error) {
	return configloader.LoadConfig(context.Background())
}

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

func setupRoutes(r *gin.Engine, handler *http2.ProxyHandler) {
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD")
		c.Header("Access-Control-Allow-Headers",
			"Content-Type, Authorization, X-Requested-With, "+
				"X-Amz-Date, X-Amz-Security-Token, X-Api-Key, "+
				"x-amz-content-sha256, x-amz-target, x-amz-user-agent, "+
				"x-amz-id-2, x-amz-request-id, Accept, Accept-Encoding, "+
				"Content-Length, Host, User-Agent, "+
				"x-amz-invocation-type, x-amz-log-type, x-amz-client-context, "+
				"amz-sdk-request, amz-sdk-invocation-id, amz-content-sha256, "+
				"X-Mock-Signature")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusOK)
			return
		}
		c.Next()
	})

	r.GET("/health", handler.HealthCheck)
	r.POST("/proxy/region", handler.SetRegion)

	// Step Functions REST API
	r.GET("/api/stepfunctions", handler.HandleListStateMachines)
	r.POST("/api/stepfunctions", handler.HandleCreateStateMachine)
	r.GET("/api/stepfunctions/:arn", handler.HandleDescribeStateMachine)
	r.PUT("/api/stepfunctions/:arn", handler.HandleUpdateStateMachine)
	r.DELETE("/api/stepfunctions/:arn", handler.HandleDeleteStateMachine)
	r.POST("/api/stepfunctions/:arn/executions", handler.HandleStartExecution)
	r.GET("/api/stepfunctions/:arn/executions", handler.HandleListExecutions)
	r.POST("/api/stepfunctions/:arn/executions/:executionArn/stop", handler.HandleStopExecution)
	r.GET("/api/stepfunctions/:arn/executions/:executionArn", handler.HandleDescribeExecution)
	r.GET("/api/stepfunctions/:arn/executions/:executionArn/history", handler.HandleGetExecutionHistory)

	r.Any("/:service/*path", handler.ServiceRouter)
}
