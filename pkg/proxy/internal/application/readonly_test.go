package application

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
	configloader "github.com/my-devstack/mydevstack/pkg/proxy/internal/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestReadOnlyMiddleware(t *testing.T) {
	t.Parallel()

	type testCase struct {
		name       string
		readOnly   bool
		method     string
		path       string
		wantStatus int
		wantBody   string // substring match for error payload; empty = skip
	}

	cases := []testCase{
		// Flag off: everything passes through
		{name: "flag off POST passes", readOnly: false, method: http.MethodPost, path: "/s3/buckets", wantStatus: http.StatusOK},
		{name: "flag off PUT passes", readOnly: false, method: http.MethodPut, path: "/s3/buckets/x", wantStatus: http.StatusOK},
		{name: "flag off DELETE passes", readOnly: false, method: http.MethodDelete, path: "/s3/buckets/x", wantStatus: http.StatusOK},
		{name: "flag off PATCH passes", readOnly: false, method: http.MethodPatch, path: "/s3/buckets/x", wantStatus: http.StatusOK},

		// Flag on: GET/HEAD/OPTIONS pass
		{name: "flag on GET passes", readOnly: true, method: http.MethodGet, path: "/s3/buckets", wantStatus: http.StatusOK},
		{name: "flag on HEAD passes", readOnly: true, method: http.MethodHead, path: "/s3/buckets", wantStatus: http.StatusOK},
		{name: "flag on OPTIONS passes", readOnly: true, method: http.MethodOptions, path: "/s3/buckets", wantStatus: http.StatusOK},

		// Flag on: POST /proxy/region allowed
		{name: "flag on POST /proxy/region passes", readOnly: true, method: http.MethodPost, path: "/proxy/region", wantStatus: http.StatusOK},

		// Flag on: mutating methods blocked
		{name: "flag on POST blocked", readOnly: true, method: http.MethodPost, path: "/s3/buckets", wantStatus: http.StatusForbidden, wantBody: "Action not allowed: server is in read-only mode"},
		{name: "flag on PUT blocked", readOnly: true, method: http.MethodPut, path: "/s3/buckets/x", wantStatus: http.StatusForbidden, wantBody: "Action not allowed: server is in read-only mode"},
		{name: "flag on PATCH blocked", readOnly: true, method: http.MethodPatch, path: "/s3/buckets/x", wantStatus: http.StatusForbidden, wantBody: "Action not allowed: server is in read-only mode"},
		{name: "flag on DELETE blocked", readOnly: true, method: http.MethodDelete, path: "/s3/buckets/x", wantStatus: http.StatusForbidden, wantBody: "Action not allowed: server is in read-only mode"},

		// Flag on: POST to other paths blocked (not allowlisted)
		{name: "flag on POST /health blocked", readOnly: true, method: http.MethodPost, path: "/health", wantStatus: http.StatusForbidden},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			cfg := &configloader.Config{ReadOnlyMode: tc.readOnly}
			r := chi.NewRouter()
			r.Use(readOnlyMiddleware(cfg))

			// Register a catch-all that returns 200 to prove pass-through.
			r.HandleFunc("/*", func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write([]byte("ok"))
			})

			w := httptest.NewRecorder()
			req, err := http.NewRequest(tc.method, tc.path, strings.NewReader("{}"))
			require.NoError(t, err)
			r.ServeHTTP(w, req)

			assert.Equal(t, tc.wantStatus, w.Code, "body=%s", w.Body.String())

			if tc.wantStatus == http.StatusForbidden {
				var resp map[string]string
				require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
				assert.Equal(t, "READ_ONLY", resp["code"])
				if tc.wantBody != "" {
					assert.Equal(t, tc.wantBody, resp["error"])
				}
			}
		})
	}
}
