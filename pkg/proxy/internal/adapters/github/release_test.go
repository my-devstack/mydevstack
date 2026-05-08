package github

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestParseGitHubURL(t *testing.T) {
	tests := []struct {
		name      string
		repoURL   string
		wantOwner string
		wantRepo  string
		wantErr   bool
	}{
		{
			name:      "standard https URL",
			repoURL:   "https://github.com/owner/repo",
			wantOwner: "owner",
			wantRepo:  "repo",
			wantErr:   false,
		},
		{
			name:      "github.com with organization",
			repoURL:   "https://github.com/my-org/my-repo",
			wantOwner: "my-org",
			wantRepo:  "my-repo",
			wantErr:   false,
		},
		{
			name:    "invalid URL",
			repoURL: "not-a-url",
			wantErr: true,
		},
		{
			name:    "URL with only owner",
			repoURL: "https://github.com/owner",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			owner, repo, err := parseGitHubURL(tt.repoURL)
			if (err != nil) != tt.wantErr {
				t.Errorf("parseGitHubURL() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				if owner != tt.wantOwner || repo != tt.wantRepo {
					t.Errorf("parseGitHubURL() = (%v, %v), want (%v, %v)", owner, repo, tt.wantOwner, tt.wantRepo)
				}
			}
		})
	}
}

func TestClient_GetLatestRelease_Success(t *testing.T) {
	var capturedRequest *http.Request
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedRequest = r
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(Release{
			TagName: "v1.2.3",
			HTMLURL: "https://github.com/owner/repo/releases/tag/v1.2.3",
		}); err != nil {
			t.Logf("Failed to encode: %v", err)
		}
	})

	client := NewClient()
	client.httpClient = &http.Client{
		Transport: &redirectTransport{handler: handler},
	}

	release, err := client.GetLatestRelease(context.Background(), "https://github.com/owner/repo")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if capturedRequest == nil {
		t.Fatal("request was not captured")
	}
	if capturedRequest.URL.Path != "/repos/owner/repo/releases/latest" {
		t.Errorf("expected path /repos/owner/repo/releases/latest, got %s", capturedRequest.URL.Path)
	}
	if accept := capturedRequest.Header.Get("Accept"); accept != "application/vnd.github+json" {
		t.Errorf("expected Accept header application/vnd.github+json, got %s", accept)
	}
	if ua := capturedRequest.Header.Get("User-Agent"); ua != "mydevstack" {
		t.Errorf("expected User-Agent header mydevstack, got %s", ua)
	}

	if release.TagName != "v1.2.3" {
		t.Errorf("expected tag v1.2.3, got %s", release.TagName)
	}
	if release.HTMLURL != "https://github.com/owner/repo/releases/tag/v1.2.3" {
		t.Errorf("expected url https://github.com/owner/repo/releases/tag/v1.2.3, got %s", release.HTMLURL)
	}
}

type redirectTransport struct {
	handler http.Handler
}

func (r *redirectTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	newReq := req.Clone(req.Context())
	newReq.URL.Scheme = "http"
	newReq.URL.Host = "127.0.0.1:12345" // dummy host
	rec := httptest.NewRecorder()
	r.handler.ServeHTTP(rec, newReq)
	body := rec.Body.Bytes()
	return &http.Response{
		StatusCode: rec.Code,
		Header:     rec.Header(),
		Body:       io.NopCloser(bytes.NewReader(body)),
		Request:    req,
	}, nil
}

func TestClient_GetLatestRelease_InvalidRepo(t *testing.T) {
	client := NewClient()

	_, err := client.GetLatestRelease(context.Background(), "invalid-url")
	if err == nil {
		t.Error("expected error for invalid URL")
	}
}

func TestClient_GetLatestRelease_Non200Status(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
		if _, err := w.Write([]byte(`{"message": "Not Found"}`)); err != nil {
			t.Logf("Write error: %v", err)
		}
	})

	client := NewClient()
	client.httpClient = &http.Client{
		Transport: &redirectTransport{handler: handler},
	}

	_, err := client.GetLatestRelease(context.Background(), "https://github.com/owner/repo")
	if err == nil {
		t.Fatal("expected error for non-200 status")
	}
	if !strings.Contains(err.Error(), "404") {
		t.Errorf("expected error to contain 404, got %v", err)
	}
}

func TestClient_GetLatestRelease_InvalidJSON(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		if _, err := w.Write([]byte(`{invalid json`)); err != nil {
			t.Logf("Write error: %v", err)
		}
	})

	client := NewClient()
	client.httpClient = &http.Client{
		Transport: &redirectTransport{handler: handler},
	}

	_, err := client.GetLatestRelease(context.Background(), "https://github.com/owner/repo")
	if err == nil {
		t.Fatal("expected error for invalid JSON")
	}
	if !strings.Contains(err.Error(), "failed to decode") {
		t.Errorf("expected error to contain 'failed to decode', got %v", err)
	}
}

func TestClient_GetLatestRelease_NetworkError(t *testing.T) {
	client := NewClient()
	client.httpClient = &http.Client{
		Transport: &errorTransport{err: errors.New("connection refused")},
		Timeout:   1 * time.Second,
	}

	_, err := client.GetLatestRelease(context.Background(), "https://github.com/owner/repo")
	if err == nil {
		t.Fatal("expected error for network failure")
	}
}

type errorTransport struct {
	err error
}

func (t *errorTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	return nil, t.err
}

func TestClient_GetLatestRelease_ContextCancelled(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Simulate slow response
		time.Sleep(5 * time.Second)
		w.WriteHeader(http.StatusOK)
	})

	client := NewClient()
	client.httpClient = &http.Client{
		Transport: &redirectTransport{handler: handler},
		Timeout:   10 * time.Second,
	}

	ctx, cancel := context.WithCancel(context.Background())
	cancel() // Cancel immediately

	_, err := client.GetLatestRelease(ctx, "https://github.com/owner/repo")
	if err == nil {
		t.Fatal("expected error for cancelled context")
	}
}

func TestClient_GetLatestRelease_EmptyPath(t *testing.T) {
	client := NewClient()

	_, err := client.GetLatestRelease(context.Background(), "https://github.com/")
	if err == nil {
		t.Error("expected error for URL with only owner")
	}
}

func TestRelease_JSONParsing(t *testing.T) {
	jsonStr := `{"tag_name": "v2.0.0", "html_url": "https://github.com/test/repo/releases/tag/v2.0.0"}`

	var release Release
	err := json.Unmarshal([]byte(jsonStr), &release)
	if err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	if release.TagName != "v2.0.0" {
		t.Errorf("expected tag_name v2.0.0, got %s", release.TagName)
	}
	if release.HTMLURL != "https://github.com/test/repo/releases/tag/v2.0.0" {
		t.Errorf("expected html_url, got %s", release.HTMLURL)
	}
}

func TestNewClient(t *testing.T) {
	client := NewClient()
	if client == nil {
		t.Fatal("expected non-nil client")
	}
	if client.httpClient == nil {
		t.Fatal("expected non-nil httpClient")
	}
	if client.httpClient.Timeout != 10*time.Second {
		t.Errorf("expected 10s timeout, got %v", client.httpClient.Timeout)
	}
}