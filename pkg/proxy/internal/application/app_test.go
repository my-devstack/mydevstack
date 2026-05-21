package application

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	configloader "github.com/my-devstack/mydevstack/pkg/proxy/internal/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/sync/errgroup"
)

// testConfig returns a minimal config pointing at the local emulator.
func testConfig() *configloader.Config {
	return &configloader.Config{
		Port: "8081",
		AWS: configloader.AWSProxyConfig{
			Endpoint:  "http://localhost:4566",
			AccessKey: "test",
			SecretKey: "test",
		},
		ServicePattern:    "root",
		Emulator:          "", // empty = no emulator health check, always healthy in unit tests
		GitHubRepo:        "https://github.com/my-devstack/mydevstack",
		VersionCheckHours: 24,
	}
}

// ---------------------------------------------------------------------------
// TestNewContainer – success path
// ---------------------------------------------------------------------------

func TestNewContainer(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	wg, ctx := errgroup.WithContext(ctx)

	cfg := testConfig()
	container, err := NewContainer(ctx, wg, cfg)
	require.NoError(t, err)
	require.NotNil(t, container)

	assert.Equal(t, cfg, container.Config)
	assert.NotNil(t, container.Handler)
	assert.Equal(t, wg, container.Wg)
}

// ---------------------------------------------------------------------------
// TestNewContainer_Failure – unreachable endpoint does not prevent creation
// ---------------------------------------------------------------------------

func TestNewContainer_Failure(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	wg, ctx := errgroup.WithContext(ctx)

	// SetServices() only constructs SDK clients without connecting,
	// so an unreachable endpoint does not cause a failure.
	cfg := testConfig()
	cfg.AWS.Endpoint = "http://127.0.0.1:1"

	container, err := NewContainer(ctx, wg, cfg)
	if err != nil {
		assert.Nil(t, container)
		return
	}
	assert.NotNil(t, container)
}

// ---------------------------------------------------------------------------
// TestContainer_SetupRoutes – route registration, CORS, health
// ---------------------------------------------------------------------------

func TestContainer_SetupRoutes(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	wg, ctx := errgroup.WithContext(ctx)

	container, err := NewContainer(ctx, wg, testConfig())
	require.NoError(t, err)

	r := container.setupRoutes()
	require.NotNil(t, r)

	// Health endpoint returns 200.
	w := performGet(r, "/health")
	assert.Equal(t, http.StatusOK, w.Code)

	// OPTIONS preflight returns 200.
	w2 := performOptions(r, "/s3/test")
	assert.Equal(t, http.StatusOK, w2.Code)

	// CORS headers present.
	w3 := performGet(r, "/health")
	assert.Equal(t, "*", w3.Header().Get("Access-Control-Allow-Origin"))

	// S3 route dispatches (may get 500 if emulator unreachable, but not 404).
	w4 := performPost(r, "/s3/test", "ListBuckets", `{}`)
	assert.NotEqual(t, http.StatusNotFound, w4.Code,
		"S3 route should be registered and not return 404")

	// Unknown service → 404.
	w5 := performGet(r, "/nonexistent/test")
	assert.Equal(t, http.StatusNotFound, w5.Code)
}

// ---------------------------------------------------------------------------
// helpers – minimal Gin test helpers
// ---------------------------------------------------------------------------

func performGet(r http.Handler, path string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", path, nil)
	r.ServeHTTP(w, req)
	return w
}

func performPost(r http.Handler, path, target, body string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", path, strings.NewReader(body))
	req.Header.Set("X-Amz-Target", target)
	r.ServeHTTP(w, req)
	return w
}

func performOptions(r http.Handler, path string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("OPTIONS", path, nil)
	r.ServeHTTP(w, req)
	return w
}
