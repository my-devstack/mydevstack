package httphandlers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/url"

	"github.com/go-chi/chi/v5"
)

// elasticacheOperation performs a raw HTTP form-encoded ElastiCache operation.
func (h *ProxyHandler) elasticacheOperation(w http.ResponseWriter, r *http.Request, operation string) {
	bodyBytes := readBody(r)
	baseEndpoint := h.Svc.Config().AWS.Endpoint

	formData := url.Values{}
	formData.Add("Action", operation)
	formData.Add("Version", "2015-02-01")

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

	resp, err := makeFormEncodedRequest(baseEndpoint, formData.Encode())
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to call ElastiCache", err)
		return
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("Error closing response body: %v", err)
		}
	}()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to read response", err)
		return
	}

	writeData(w, resp.StatusCode, "application/json", respBody)
}

func (h *ProxyHandler) registerElastiCacheRoutes(r chi.Router) {
	r.Route("/elasticache", func(r chi.Router) {
		r.Get("/cache-clusters", func(w http.ResponseWriter, r *http.Request) {
			h.elasticacheOperation(w, r, "DescribeCacheClusters")
		})
		r.Post("/cache-clusters", func(w http.ResponseWriter, r *http.Request) {
			h.elasticacheOperation(w, r, "CreateCacheCluster")
		})
		r.Delete("/cache-clusters/{id}", func(w http.ResponseWriter, r *http.Request) {
			h.elasticacheOperation(w, r, "DeleteCacheCluster")
		})
		r.Get("/replication-groups", func(w http.ResponseWriter, r *http.Request) {
			h.elasticacheOperation(w, r, "DescribeReplicationGroups")
		})
		r.Post("/replication-groups", func(w http.ResponseWriter, r *http.Request) {
			h.elasticacheOperation(w, r, "CreateReplicationGroup")
		})
		r.Delete("/replication-groups/{id}", func(w http.ResponseWriter, r *http.Request) {
			h.elasticacheOperation(w, r, "DeleteReplicationGroup")
		})
		r.Get("/cache-parameter-groups", func(w http.ResponseWriter, r *http.Request) {
			h.elasticacheOperation(w, r, "DescribeCacheParameterGroups")
		})
		r.Get("/cache-parameters", func(w http.ResponseWriter, r *http.Request) {
			h.elasticacheOperation(w, r, "DescribeCacheParameters")
		})
		r.Get("/cache-subnet-groups", func(w http.ResponseWriter, r *http.Request) {
			h.elasticacheOperation(w, r, "DescribeCacheSubnetGroups")
		})
		r.Get("/cache-security-groups", func(w http.ResponseWriter, r *http.Request) {
			h.elasticacheOperation(w, r, "DescribeCacheSecurityGroups")
		})
		r.Get("/snapshots", func(w http.ResponseWriter, r *http.Request) {
			h.elasticacheOperation(w, r, "DescribeSnapshots")
		})
		r.Get("/update-actions", func(w http.ResponseWriter, r *http.Request) {
			h.elasticacheOperation(w, r, "DescribeUpdateActions")
		})
	})
}
