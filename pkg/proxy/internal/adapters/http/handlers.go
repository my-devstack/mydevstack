package httphandlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type ProxyHandler struct {
	svc ports.ProxyService
}

func NewProxyHandler(svc ports.ProxyService) *ProxyHandler {
	return &ProxyHandler{svc: svc}
}

func (h *ProxyHandler) ServiceRouter(c *gin.Context) {
	service := c.Param("service")

	switch service {
	case "secretsmanager":
		h.handleSecretsManager(c)
	case "s3":
		h.handleS3(c)
	case "lambda":
		h.handleLambda(c)
	case "sqs":
		h.handleSQS(c)
	case "sns":
		h.handleSNS(c)
	case "kms":
		h.handleKMS(c)
	case "dynamodb":
		h.handleDynamoDB(c)
	case "apigateway":
		h.handleAPIGateway(c)
	case "ssm":
		h.handleSSM(c)
	case "iam":
		h.handleIAM(c)
	case "kinesis":
		h.handleKinesis(c)
	case "rds":
		h.handleRDS(c)
	case "elasticache":
		h.handleElastiCache(c)
	default:
		c.JSON(http.StatusNotFound, gin.H{"error": "Service not supported: " + service})
	}
}

func (h *ProxyHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":       "healthy",
		"proxy":        "aws-proxy",
		"target":       h.svc.Config().AWS.Endpoint,
		"endpoint_url": h.svc.Config().AWS.Endpoint,
		"region":       h.svc.Region(),
		"emulator":     h.svc.Config().Emulator,
	})
}

func (h *ProxyHandler) SetRegion(c *gin.Context) {
	var req struct {
		Region string `json:"region"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: region is required"})
		return
	}

	if req.Region == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Region cannot be empty"})
		return
	}

	if err := h.svc.SetRegion(req.Region); err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to update region", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"region": req.Region, "message": "Region updated successfully"})
}

func (h *ProxyHandler) BackendHealthCheck(c *gin.Context) {
	testURLs := []string{
		h.svc.Config().AWS.Endpoint + "/",
		h.svc.Config().AWS.Endpoint + "/_health",
		h.svc.Config().AWS.Endpoint + "/health",
	}

	for _, targetURL := range testURLs {
		req, err := http.NewRequest("GET", targetURL, nil)
		if err != nil {
			log.Printf("Failed to create request for %s: %v", targetURL, err)
			continue
		}
		client := &http.Client{Timeout: 3 * time.Second, CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		}}
		resp, err := client.Do(req)
		if err == nil {
			if closeErr := resp.Body.Close(); closeErr != nil {
				log.Printf("Failed to close response body: %v", closeErr)
			}
			if resp.StatusCode >= 200 && resp.StatusCode < 400 {
				c.JSON(http.StatusOK, gin.H{
					"status":     "healthy",
					"backend":    "reachable",
					"target":     h.svc.Config().AWS.Endpoint,
					"statusCode": resp.StatusCode,
					"region":     h.svc.Region(),
					"emulator":   h.svc.Config().Emulator,
				})
				return
			}
		}
	}

	c.JSON(http.StatusServiceUnavailable, gin.H{
		"status":   "unhealthy",
		"backend":  "unreachable",
		"target":   h.svc.Config().AWS.Endpoint,
		"region":   h.svc.Region(),
		"emulator": h.svc.Config().Emulator,
	})
}

func readBody(c *gin.Context) []byte {
	if c.Request.Body != nil {
		if bodyBytes, err := io.ReadAll(c.Request.Body); err == nil {
			return bodyBytes
		}
	}
	return nil
}

func parseBody(c *gin.Context, bodyBytes []byte, target interface{}) error {
	if len(bodyBytes) == 0 {
		return nil
	}
	if err := json.Unmarshal(bodyBytes, target); err != nil {
		return fmt.Errorf("failed to parse request body: %w", err)
	}
	return nil
}

func sendError(c *gin.Context, status int, message string, err error) {
	if err != nil {
		log.Printf("%s: %v", message, err)
	}
	c.JSON(status, gin.H{"error": message})
}
