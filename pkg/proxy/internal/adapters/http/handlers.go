package httphandlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/service"
)

type ProxyHandler struct {
	svc        ports.ProxyService
	versionSvc *service.VersionService

	// health check cache
	mu              sync.RWMutex
	lastHealthCheck time.Time
	backendHealthy  bool
	healthCheckURL  string
}

func NewProxyHandler(svc ports.ProxyService, versionSvc *service.VersionService) *ProxyHandler {
	h := &ProxyHandler{svc: svc, versionSvc: versionSvc}
	// Compute health check URL from emulator config
	if emulator := svc.Config().Emulator; emulator != "" {
		h.healthCheckURL = strings.TrimRight(svc.Config().AWS.Endpoint, "/") + "/_localstack/health"
	}
	return h
}

// checkBackendHealth probes the emulator health endpoint with 30s cache.
// If no health check URL configured, returns healthy by default.
func (h *ProxyHandler) checkBackendHealth() bool {
	h.mu.RLock()
	if !h.lastHealthCheck.IsZero() && time.Since(h.lastHealthCheck) < 30*time.Second {
		defer h.mu.RUnlock()
		return h.backendHealthy
	}
	h.mu.RUnlock()

	h.mu.Lock()
	defer h.mu.Unlock()

	// Double-check after acquiring write lock
	if !h.lastHealthCheck.IsZero() && time.Since(h.lastHealthCheck) < 30*time.Second {
		return h.backendHealthy
	}

	h.lastHealthCheck = time.Now()
	h.backendHealthy = false

	// No health check URL → healthy by default
	if h.healthCheckURL == "" {
		h.backendHealthy = true
		return true
	}

	client := &http.Client{Timeout: 3 * time.Second, CheckRedirect: func(req *http.Request, via []*http.Request) error {
		return http.ErrUseLastResponse
	}}
	resp, err := client.Get(h.healthCheckURL)
	if err != nil {
		return false
	}

	if err = resp.Body.Close(); err != nil {
		log.Printf("Failed to close response body for %s: %v", h.healthCheckURL, err)
		return false
	}
	h.backendHealthy = resp.StatusCode >= 200 && resp.StatusCode < 400
	return h.backendHealthy
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
	case "dynamodbstreams":
		h.handleDynamoDBStreams(c)
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
	case "opensearch":
		h.handleOpenSearch(c)
	case "kafka":
		h.handleMSK(c)
	case "cloudformation":
		h.handleCloudFormation(c)
	case "cloudwatch":
		h.handleCloudWatch(c)
	case "cloudwatchlogs":
		h.handleCloudWatchLogs(c)
	case "sesv2":
		h.handleSES(c)
	default:
		c.JSON(http.StatusNotFound, gin.H{"error": "Service not supported: " + service})
	}
}

func (h *ProxyHandler) HealthCheck(c *gin.Context) {
	status := "unhealthy"
	statusCode := http.StatusServiceUnavailable
	if h.checkBackendHealth() {
		status = "healthy"
		statusCode = http.StatusOK
	}

	response := gin.H{
		"status":        status,
		"proxy":         "aws-proxy",
		"target":        h.svc.Config().AWS.Endpoint,
		"endpoint_url":  h.svc.Config().AWS.Endpoint,
		"region":        h.svc.Region(),
		"emulator":      h.svc.Config().Emulator,
		"github_repo":   h.versionSvc.GetGitHubRepo(),
		"latestVersion": "",
	}

	// Add latest version if available
	if latest, ok := h.versionSvc.GetLatestVersion(); ok && latest != "" {
		response["latestVersion"] = latest
	}

	c.JSON(statusCode, response)
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
	// Transform keys to TitleCase for AWS SDK compatibility
	transformed := transformJSONKeys(string(bodyBytes))
	bodyBytes = []byte(transformed)
	if err := json.Unmarshal(bodyBytes, target); err != nil {
		return fmt.Errorf("failed to parse request body: %w", err)
	}
	return nil
}

func transformJSONKeys(s string) string {
	var result strings.Builder
	result.Grow(len(s))
	inString := false
	capitalizeNext := false

	for _, ch := range s {
		if ch == '"' {
			inString = !inString
			result.WriteRune(ch)
			if !inString {
				capitalizeNext = true
			}
		} else if inString && capitalizeNext && ch >= 'a' && ch <= 'z' {
			result.WriteRune(ch - 'a' + 'A')
			capitalizeNext = false
		} else {
			result.WriteRune(ch)
			capitalizeNext = false
		}
	}
	return result.String()
}

func sendError(c *gin.Context, status int, message string, err error) {
	if err != nil {
		log.Printf("%s: %v", message, err)
	}
	c.JSON(status, gin.H{"error": message})
}
