package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

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
	log.Printf("Server listening on %s", addr)
	log.Printf("Proxy endpoints:")
	log.Printf("  Secrets Manager: http://localhost:%s/secretsmanager/", cfg.Port)
	log.Printf("  S3:              http://localhost:%s/s3/", cfg.Port)
	log.Printf("  Lambda:          http://localhost:%s/lambda/", cfg.Port)
	log.Printf("  SQS:             http://localhost:%s/sqs/", cfg.Port)
	log.Printf("  SNS:             http://localhost:%s/sns/", cfg.Port)
	log.Printf("  KMS:             http://localhost:%s/kms/", cfg.Port)
	log.Printf("  DynamoDB:        http://localhost:%s/dynamodb/", cfg.Port)
	log.Printf("  RDS:             http://localhost:%s/rds/", cfg.Port)
	log.Printf("  CloudFormation:  http://localhost:%s/cloudformation/", cfg.Port)

	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func loadConfig() (*configloader.Config, error) {
	return configloader.LoadConfig(context.Background())
}

func defaultConfig() *configloader.Config {
	return &configloader.Config{
		Port: getEnv("PROXY_PORT", "8081"),
		AWS: configloader.AWSProxyConfig{
			Endpoint:  getEnv("AWS_ENDPOINT", "http://localhost:4566"),
			AccessKey: getEnv("AWS_ACCESS_KEY", "test"),
			SecretKey: getEnv("AWS_SECRET_KEY", "test"),
		},
		ServicePattern: getEnv("SERVICE_PATTERN", "root"),
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

	r.GET("/health", handler.BackendHealthCheck)
	r.GET("/_health", handler.BackendHealthCheck)
	r.POST("/proxy/region", handler.SetRegion)

	r.Any("/:service/*path", handler.ServiceRouter)
}
