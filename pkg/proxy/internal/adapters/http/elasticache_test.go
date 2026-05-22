package httphandlers

import (
	"net/http"
	"testing"

	configloader "github.com/my-devstack/mydevstack/pkg/proxy/internal/config"
	"github.com/stretchr/testify/assert"
)

// ---------------------------------------------------------------------------
// Handler tests for handleElastiCache
// ---------------------------------------------------------------------------

func TestHandleElastiCache(t *testing.T) {
	t.Parallel()

	cfg := &configloader.Config{
		AWS: configloader.AWSProxyConfig{
			Endpoint: "http://127.0.0.1:1",
		},
	}
	svc := createMockSvc(t, cfg)
	versionSvc := createTestVersionService(t)
	handler := createHandler(svc, versionSvc)
	r := setupTestRouter(handler)

	t.Run("valid body endpoint unreachable returns 500", func(t *testing.T) {
		w := performRequest(r, "GET", "/elasticache/cache-clusters", []byte(`{"CacheClusterId":"test"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("invalid body endpoint unreachable returns 500", func(t *testing.T) {
		w := performRequest(r, "GET", "/elasticache/cache-clusters", []byte(`{invalid`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}
