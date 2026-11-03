package application

import (
	"encoding/json"
	"log"
	"net/http"

	configloader "github.com/my-devstack/mydevstack/pkg/proxy/internal/config"
)

// readOnlyMiddleware blocks mutating HTTP methods (POST/PUT/PATCH/DELETE) when
// the server is configured in read-only mode. GET/HEAD/OPTIONS pass through
// untouched. POST /proxy/region is explicitly allowed.
func readOnlyMiddleware(cfg *configloader.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !cfg.ReadOnlyMode {
				next.ServeHTTP(w, r)
				return
			}

			// Allow safe methods
			switch r.Method {
			case http.MethodGet, http.MethodHead, http.MethodOptions:
				next.ServeHTTP(w, r)
				return
			}

			// Explicit allowlist: POST /proxy/region
			if r.Method == http.MethodPost && r.URL.Path == "/proxy/region" {
				next.ServeHTTP(w, r)
				return
			}

			// Block all other mutating methods
			log.Printf("[READ_ONLY] blocked %s %s", r.Method, r.URL.Path)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			resp := map[string]string{
				"error": "Action not allowed: server is in read-only mode",
				"code":  "READ_ONLY",
			}
			if err := json.NewEncoder(w).Encode(resp); err != nil {
				log.Printf("readOnlyMiddleware encode error: %v", err)
			}
		})
	}
}
