package httphandlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/aws/smithy-go"
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

// writeJSON writes a JSON response with the given status code and data.
func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("writeJSON encode error: %v", err)
	}
}

// writeData writes raw data response with the given status code and content type.
func writeData(w http.ResponseWriter, status int, contentType string, data []byte) {
	w.Header().Set("Content-Type", contentType)
	w.WriteHeader(status)
	if _, err := w.Write(data); err != nil {
		log.Printf("writeData write error: %v", err)
	}
}

// RegisterServiceRoutes registers all service routes to the provided router.
func (h *ProxyHandler) RegisterServiceRoutes(r chi.Router) {
	h.registerAPIGatewayRoutes(r)
	h.registerCloudFormationRoutes(r)
	h.registerCloudWatchRoutes(r)
	h.registerCloudWatchLogsRoutes(r)
	h.registerDynamoDBRoutes(r)
	h.registerDynamoDBStreamsRoutes(r)
	h.registerEC2Routes(r)
	h.registerVpcRoutes(r)
	h.registerIAMRoutes(r)
	h.registerKinesisRoutes(r)
	h.registerKMSRoutes(r)
	h.registerLambdaRoutes(r)
	h.registerMSKRoutes(r)
	h.registerOpenSearchRoutes(r)
	h.registerS3Routes(r)
	h.registerSecretsManagerRoutes(r)
	h.registerSESRoutes(r)
	h.registerStepFunctionsRoutes(r)
	h.registerSNSRoutes(r)
	h.registerSQSRoutes(r)
	h.registerSSMRoutes(r)
	h.registerElastiCacheRoutes(r)
	h.registerRDSRoutes(r)
}

// HealthCheck is a simple endpoint to check if the proxy and backend are healthy.
func (h *ProxyHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	status := "unhealthy"
	statusCode := http.StatusServiceUnavailable
	if h.checkBackendHealth() {
		status = "healthy"
		statusCode = http.StatusOK
	}

	response := map[string]interface{}{
		"status":           status,
		"proxy":            "aws-proxy",
		"target":           h.Svc.Config().AWS.Endpoint,
		"endpoint_url":     h.Svc.Config().AWS.Endpoint,
		"endpoint_override": h.Svc.Config().AWS.EndpointOverride,
		"region":           h.Svc.Region(),
		"emulator":         h.Svc.Config().Emulator,
		"github_repo":      h.VersionSvc.GetGitHubRepo(),
		"latestVersion":    "",
	}

	// Add latest version if available
	if latest, ok := h.VersionSvc.GetLatestVersion(); ok && latest != "" {
		response["latestVersion"] = latest
	}

	writeJSON(w, statusCode, response)
}

// SetRegion allows updating the AWS region at runtime via a POST request with JSON body {"region": "new-region"}.
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

// readBody reads the request body and returns it as a byte slice.
func readBody(r *http.Request) []byte {
	if r.Body != nil {
		bodyBytes, err := io.ReadAll(r.Body)
		if err == nil && len(bodyBytes) > 0 {
			return bodyBytes
		}
	}
	return nil
}

// parseBody parses the JSON body of the request into the provided target struct.
// It also transforms JSON keys to TitleCase to ensure compatibility with AWS SDK expectations.
func parseBody(bodyBytes []byte, target any) error {
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

// urlParam returns the URL parameter value, URL-decoded.
// Chi v5 does not automatically URL-decode path parameters.
func urlParam(r *http.Request, key string) string {
	v := chi.URLParam(r, key)
	decoded, err := url.QueryUnescape(v)
	if err != nil {
		return v
	}
	return decoded
}

// isNotFoundError checks if the error is an AWS "not found" type error
// that should map to HTTP 404 instead of 500.
func isNotFoundError(err error) bool {
	var apiErr smithy.APIError
	if !errors.As(err, &apiErr) {
		return false
	}
	code := apiErr.ErrorCode()
	switch code {
	case "ParameterNotFound",
		"StateMachineDoesNotExist",
		"NoSuchEntity",
		"ResourceNotFoundException",
		"NotFoundException",
		"NotFound":
		return true
	}
	return false
}

// isUnsupportedError checks if the error is an AWS "UnsupportedOperation" type error
// indicating the emulator does not support this operation.
func isUnsupportedError(err error) bool {
	var apiErr smithy.APIError
	if !errors.As(err, &apiErr) {
		return false
	}
	return apiErr.ErrorCode() == "UnsupportedOperation"
}

// sendErrorWithStatus sends an error response with a status derived from the error type.
// Returns 404 for "not found" errors, 500 otherwise.
func sendErrorWithStatus(w http.ResponseWriter, message string, err error) {
	status := http.StatusInternalServerError
	if isNotFoundError(err) {
		status = http.StatusNotFound
	}
	sendError(w, status, message, err)
}
