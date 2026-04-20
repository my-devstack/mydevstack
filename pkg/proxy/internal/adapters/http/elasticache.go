package httphandlers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
)

// handleElastiCache uses raw HTTP calls to work with MiniStack/Floci which expects query protocol (form-encoded)

func (h *ProxyHandler) handleElastiCache(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")
	bodyBytes := readBody(c)
	baseEndpoint := h.svc.Config().AwsEndpoint

	// Extract operation name from X-Amz-Target (e.g., "elasticache.DescribeCacheClusters" -> "DescribeCacheClusters")
	operation := strings.Replace(xAmzTarget, "elasticache.", "", 1)

	// Convert JSON body to form-encoded for MiniStack/Floci
	formData := url.Values{}
	formData.Add("Action", operation)
	formData.Add("Version", "2015-02-01")

	// Parse JSON body and add to form data
	if len(bodyBytes) > 0 {
		var bodyMap map[string]interface{}
		if err := json.Unmarshal(bodyBytes, &bodyMap); err == nil {
			for key, value := range bodyMap {
				if value != nil {
					formData.Add(key, toString(value))
				}
			}
		}
	}

	// Make form-encoded request
	resp, err := makeFormEncodedRequest(baseEndpoint, formData.Encode())
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to call ElastiCache", err)
		return
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("Error closing response body: %v", err)
		}
	}()

	// Read response
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to read response", err)
		return
	}

	// For ElastiCache, the response is typically XML - pass it through as-is
	// The frontend will handle the parsing
	c.Data(resp.StatusCode, "application/json", respBody)
}
