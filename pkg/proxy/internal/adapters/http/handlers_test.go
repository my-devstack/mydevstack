package httphandlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/aws/aws-sdk-go-v2/service/opensearch"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gin-gonic/gin"
	configloader "github.com/my-devstack/mydevstack/pkg/proxy/internal/config"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/service"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/mock"
)

type testProxyService struct {
	s3Port   ports.S3Port
	cfPort   ports.CloudFormationPort
	osPort   ports.OpenSearchPort
	cfg      *configloader.Config
	emulator string
}

func (s *testProxyService) S3() ports.S3Port {
	return s.s3Port
}

func (s *testProxyService) Lambda() ports.LambdaPort                   { return nil }
func (s *testProxyService) SecretsManager() ports.SecretsManagerPort   { return nil }
func (s *testProxyService) StepFunctions() ports.StepFunctionsPort     { return nil }
func (s *testProxyService) SQS() ports.SQSPort                         { return nil }
func (s *testProxyService) SNS() ports.SNSPort                         { return nil }
func (s *testProxyService) KMS() ports.KMSPort                         { return nil }
func (s *testProxyService) DynamoDB() ports.DynamoDBPort               { return nil }
func (s *testProxyService) DynamoDBStreams() ports.DynamoDBStreamsPort { return nil }
func (s *testProxyService) APIGateway() ports.APIGatewayPort           { return nil }
func (s *testProxyService) APIGatewayV2() ports.APIGatewayV2Port       { return nil }
func (s *testProxyService) SSM() ports.SSMPort                         { return nil }
func (s *testProxyService) IAM() ports.IAMPort                         { return nil }
func (s *testProxyService) Kinesis() ports.KinesisPort                 { return nil }
func (s *testProxyService) RDS() ports.RDSPort                         { return nil }
func (s *testProxyService) ElastiCache() ports.ElastiCachePort         { return nil }
func (s *testProxyService) CloudFormation() ports.CloudFormationPort   { return s.cfPort }
func (s *testProxyService) SESv2() ports.SESv2Port                     { return nil }
func (s *testProxyService) OpenSearch() ports.OpenSearchPort           { return s.osPort }
func (s *testProxyService) MSK() ports.MSKPort { return nil }
func (s *testProxyService) Config() *configloader.Config {
	if s.cfg != nil {
		return s.cfg
	}
	cfg := &configloader.Config{
		AWS: configloader.AWSProxyConfig{
			Endpoint: "http://localhost:4566",
		},
	}
	if s.emulator != "" {
		cfg.Emulator = s.emulator
	}
	return cfg
}

func (s *testProxyService) Region() string {
	return "us-east-1"
}

func (s *testProxyService) SetRegion(region string) error {
	return nil
}

func (s *testProxyService) SetServices() error {
	return nil
}

// createTestVersionService creates a mock version service for testing
func createTestVersionService() *service.VersionService {
	return service.NewVersionService("https://github.com/test/test")
}

func setupTestRouter(handler *ProxyHandler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/health", handler.HealthCheck)
	r.Any("/:service/*path", handler.ServiceRouter)
	return r
}

func TestHealthCheck(t *testing.T) {
	svc := &testProxyService{}
	versionSvc := createTestVersionService()
	handler := NewProxyHandler(svc, versionSvc)
	r := setupTestRouter(handler)

	w := httptest.NewRecorder()
	req, err := http.NewRequest("GET", "/health", nil)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("HealthCheck status = %v, want %v", w.Code, http.StatusOK)
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if response["status"] != "healthy" {
		t.Errorf("HealthCheck status = %v, want healthy", response["status"])
	}
	if response["proxy"] != "aws-proxy" {
		t.Errorf("HealthCheck proxy = %v, want aws-proxy", response["proxy"])
	}
}

func TestHealthCheck_EmulatorUnreachable(t *testing.T) {
	svc := &testProxyService{
		emulator: "localstack",
		cfg: &configloader.Config{
			AWS: configloader.AWSProxyConfig{
				Endpoint: "http://127.0.0.1:1",
			},
			Emulator: "localstack",
		},
	}
	handler := NewProxyHandler(svc, createTestVersionService())
	// Clear cache to force fresh check
	handler.mu.Lock()
	handler.lastHealthCheck = time.Time{}
	handler.mu.Unlock()

	r := setupTestRouter(handler)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/health", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusServiceUnavailable {
		t.Errorf("HealthCheck status = %v, want %v (emulator unreachable)", w.Code, http.StatusServiceUnavailable)
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}
	if response["status"] != "unhealthy" {
		t.Errorf("HealthCheck status = %v, want unhealthy", response["status"])
	}
}

func TestHealthCheck_NoEmulator(t *testing.T) {
	svc := &testProxyService{}
	handler := NewProxyHandler(svc, createTestVersionService())
	r := setupTestRouter(handler)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/health", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("HealthCheck status = %v, want %v (no emulator = healthy by default)", w.Code, http.StatusOK)
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}
	if response["status"] != "healthy" {
		t.Errorf("HealthCheck status = %v, want healthy", response["status"])
	}
}

func TestServiceRouter(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		path       string
		target     string
		wantStatus int
	}{
		{
			name:       "unknown service returns 404",
			method:     "GET",
			path:       "/unknown/test",
			target:     "",
			wantStatus: http.StatusNotFound,
		},
		{
			name:       "s3 service routes correctly",
			method:     "GET",
			path:       "/s3/",
			target:     "ListBuckets",
			wantStatus: http.StatusOK,
		},
		{
			name:       "lambda service returns bad request for no target",
			method:     "GET",
			path:       "/lambda/",
			target:     "",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "secretsmanager service returns bad request for no target",
			method:     "GET",
			path:       "/secretsmanager/",
			target:     "",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "cloudformation service routes correctly",
			method:     "POST",
			path:       "/cloudformation/",
			target:     "cloudformation.ListStacks",
			wantStatus: http.StatusOK,
		},
		{
			name:       "cloudformation unknown action",
			method:     "POST",
			path:       "/cloudformation/",
			target:     "cloudformation.UnknownAction",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "OpenSearch ListDomainNames",
			method:     "GET",
			path:       "/opensearch/",
			target:     "opensearch.ListDomainNames",
			wantStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockS3 := mockports.NewS3Port(t)
			mockS3.EXPECT().ListBuckets(mock.Anything).Return(&s3.ListBucketsOutput{}, nil).Maybe()

			var mockCF *mockports.CloudFormationPort
			if tt.path == "/cloudformation/" {
				mockCF = mockports.NewCloudFormationPort(t)
				mockCF.EXPECT().ListStacks(mock.Anything, mock.Anything).Return(&cloudformation.ListStacksOutput{}, nil).Maybe()
			}

			var mockOS *mockports.OpenSearchPort
			if tt.path == "/opensearch/" {
				mockOS = mockports.NewOpenSearchPort(t)
				mockOS.EXPECT().ListDomainNames(mock.Anything, mock.Anything).Return(&opensearch.ListDomainNamesOutput{}, nil).Maybe()
			}

			svc := &testProxyService{
				s3Port: mockS3,
				cfPort: mockCF,
				osPort: mockOS,
			}
			handler := NewProxyHandler(svc, createTestVersionService())
			r := setupTestRouter(handler)

			w := httptest.NewRecorder()
			req, err := http.NewRequest(tt.method, tt.path, nil)
			if err != nil {
				t.Fatalf("Failed to create request: %v", err)
			}
			if tt.target != "" {
				req.Header.Set("X-Amz-Target", tt.target)
			}
			r.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("ServiceRouter status = %v, want %v, body: %s", w.Code, tt.wantStatus, w.Body.String())
			}
		})
	}
}

func TestS3ListBuckets(t *testing.T) {
	mockS3 := mockports.NewS3Port(t)
	mockS3.EXPECT().ListBuckets(mock.Anything).Return(&s3.ListBucketsOutput{}, nil)
	svc := &testProxyService{
		s3Port: mockS3,
	}
	handler := NewProxyHandler(svc, createTestVersionService())
	r := setupTestRouter(handler)

	w := httptest.NewRecorder()
	req, err := http.NewRequest("GET", "/s3/", nil)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	req.Header.Set("X-Amz-Target", "ListBuckets")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("ListBuckets status = %v, want %v", w.Code, http.StatusOK)
	}
}

func TestCORSHeaders(t *testing.T) {
	svc := &testProxyService{}
	handler := NewProxyHandler(svc, createTestVersionService())
	r := setupTestRouter(handler)

	w := httptest.NewRecorder()
	req, err := http.NewRequest("OPTIONS", "/s3/test", nil)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK && w.Code != http.StatusBadRequest {
		t.Errorf("CORS OPTIONS status = %v, want OK or BadRequest", w.Code)
	}
}

func TestBackendHealthCheck_Reachable(t *testing.T) {
	svc := &testProxyService{
		cfg: &configloader.Config{
			AWS: configloader.AWSProxyConfig{
				Endpoint: "http://localhost:9999",
			},
		},
	}
	handler := NewProxyHandler(svc, createTestVersionService())
	r := setupTestRouter(handler)

	w := httptest.NewRecorder()
	req, err := http.NewRequest("GET", "/health", nil)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	r.ServeHTTP(w, req)

	if w.Code != http.StatusServiceUnavailable && w.Code != http.StatusOK {
		t.Errorf("BackendHealthCheck status = %v, want ServiceUnavailable or OK", w.Code)
	}
}
