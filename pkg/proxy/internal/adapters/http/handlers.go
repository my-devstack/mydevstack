package httphandlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type ProxyHandler struct {
	Svc        ports.ProxyService
	VersionSvc ports.VersionServicePort
	ctx        context.Context

	// health check cache
	mu              sync.RWMutex
	lastHealthCheck time.Time
	backendHealthy  bool
	healthCheckURL  string
}

func NewProxyHandler(ctx context.Context, svc ports.ProxyService, versionSvc ports.VersionServicePort) *ProxyHandler {
	h := &ProxyHandler{Svc: svc, VersionSvc: versionSvc, ctx: ctx}
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

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("writeJSON encode error: %v", err)
	}
}

func writeData(w http.ResponseWriter, status int, contentType string, data []byte) {
	w.Header().Set("Content-Type", contentType)
	w.WriteHeader(status)
	if _, err := w.Write(data); err != nil {
		log.Printf("writeData write error: %v", err)
	}
}

func (h *ProxyHandler) ServiceRouter(w http.ResponseWriter, r *http.Request) {
	service := chi.URLParam(r, "service")

	switch service {
	case "secretsmanager":
		h.handleSecretsManager(w, r)
	case "s3":
		h.handleS3(w, r)
	case "lambda":
		h.handleLambda(w, r)
	case "sqs":
		h.handleSQS(w, r)
	case "sns":
		h.handleSNS(w, r)
	case "kms":
		h.handleKMS(w, r)
	case "dynamodb":
		h.handleDynamoDB(w, r)
	case "dynamodbstreams":
		h.handleDynamoDBStreams(w, r)
	case "apigateway":
		h.handleAPIGateway(w, r)
	case "ssm":
		h.handleSSM(w, r)
	case "iam":
		h.handleIAM(w, r)
	case "kinesis":
		h.handleKinesis(w, r)
	case "rds":
		h.handleRDS(w, r)
	case "elasticache":
		h.handleElastiCache(w, r)
	case "opensearch":
		h.handleOpenSearch(w, r)
	case "kafka":
		h.handleMSK(w, r)
	case "stepfunctions":
		h.handleStepFunctions(w, r)
	case "cloudformation":
		h.handleCloudFormation(w, r)
	case "cloudwatch":
		h.handleCloudWatch(w, r)
	case "cloudwatchlogs":
		h.handleCloudWatchLogs(w, r)
	case "sesv2":
		h.handleSES(w, r)
	default:
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Service not supported: " + service})
	}
}

func (h *ProxyHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	status := "unhealthy"
	statusCode := http.StatusServiceUnavailable
	if h.checkBackendHealth() {
		status = "healthy"
		statusCode = http.StatusOK
	}

	response := map[string]interface{}{
		"status":        status,
		"proxy":         "aws-proxy",
		"target":        h.Svc.Config().AWS.Endpoint,
		"endpoint_url":  h.Svc.Config().AWS.Endpoint,
		"region":        h.Svc.Region(),
		"emulator":      h.Svc.Config().Emulator,
		"github_repo":   h.VersionSvc.GetGitHubRepo(),
		"latestVersion": "",
	}

	// Add latest version if available
	if latest, ok := h.VersionSvc.GetLatestVersion(); ok && latest != "" {
		response["latestVersion"] = latest
	}

	writeJSON(w, statusCode, response)
}

func (h *ProxyHandler) SetRegion(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Region string `json:"region"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request: region is required"})
		return
	}

	if req.Region == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Region cannot be empty"})
		return
	}

	if err := h.Svc.SetRegion(req.Region); err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update region", err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"region": req.Region, "message": "Region updated successfully"})
}

func readBody(r *http.Request) []byte {
	if r.Body != nil {
		bodyBytes, err := io.ReadAll(r.Body)
		if err == nil && len(bodyBytes) > 0 {
			return bodyBytes
		}
	}
	return nil
}

func parseBody(bodyBytes []byte, target interface{}) error {
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

func sendError(w http.ResponseWriter, status int, message string, err error) {
	if err != nil {
		log.Printf("%s: %v", message, err)
	}
	writeJSON(w, status, map[string]string{"error": message})
}
