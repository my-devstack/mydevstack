package httphandlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodbstreams"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/kafka"
	"github.com/aws/aws-sdk-go-v2/service/kinesis"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/opensearch"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/aws/aws-sdk-go-v2/service/sfn"
	"github.com/aws/aws-sdk-go-v2/service/sesv2"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
	"github.com/gin-gonic/gin"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	configloader "github.com/my-devstack/mydevstack/pkg/proxy/internal/config"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ---------------------------------------------------------------------------
// Common test infrastructure
// ---------------------------------------------------------------------------

// TWithCleanup matches the interface required by mock constructors.
type TWithCleanup interface {
	mock.TestingT
	Cleanup(func())
}

// createTestVersionService creates a mocked VersionServicePort with default
// expectations that are safe for most handler tests.
func createTestVersionService(t TWithCleanup) *mockports.VersionServicePort {
	m := mockports.NewVersionServicePort(t)
	m.EXPECT().GetGitHubRepo().Return("https://github.com/test/repo").Maybe()
	m.EXPECT().GetLatestVersion().Return("", false).Maybe()
	return m
}

// setupTestRouter creates a Gin engine in test mode with the health-check and
// service-router routes registered.
func setupTestRouter(handler *ProxyHandler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/health", handler.HealthCheck)
	r.Any("/:service/*path", handler.ServiceRouter)
	return r
}

// performRequest executes an HTTP request against the provided router and
// returns the response recorder.
func performRequest(r *gin.Engine, method, path, target string, body []byte) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(method, path, bytes.NewReader(body))
	if target != "" {
		req.Header.Set("X-Amz-Target", target)
	}
	r.ServeHTTP(w, req)
	return w
}

// createMockSvc creates a fully mocked ports.ProxyService with default config.
// The caller can set up additional expectations for service ports.
func createMockSvc(t TWithCleanup, cfg *configloader.Config) *mockports.ProxyService {
	svc := mockports.NewProxyService(t)
	if cfg == nil {
		cfg = &configloader.Config{
			AWS: configloader.AWSProxyConfig{
				Endpoint: "http://localhost:4566",
			},
		}
	}
	svc.EXPECT().Config().Return(cfg).Maybe()
	svc.EXPECT().Region().Return("us-east-1").Maybe()
	svc.EXPECT().SetRegion(mock.Anything).Return(nil).Maybe()
	svc.EXPECT().SetServices().Return(nil).Maybe()
	return svc
}

// createHandler builds a ProxyHandler from a mock service and version service.
func createHandler(svc ports.ProxyService, versionSvc ports.VersionServicePort) *ProxyHandler {
	return NewProxyHandler(context.Background(), svc, versionSvc)
}

// ---------------------------------------------------------------------------
// TestNewProxyHandler
// ---------------------------------------------------------------------------

func TestNewProxyHandler(t *testing.T) {
	t.Parallel()

	t.Run("with emulator sets healthCheckURL", func(t *testing.T) {
		t.Parallel()
		cfg := &configloader.Config{
			AWS: configloader.AWSProxyConfig{
				Endpoint: "http://localhost:4566",
			},
			Emulator: "localstack",
		}
		svc := createMockSvc(t, cfg)
		versionSvc := createTestVersionService(t)
		handler := createHandler(svc, versionSvc)

		assert.Equal(t, "http://localhost:4566/_localstack/health", handler.healthCheckURL)
	})

	t.Run("without emulator leaves healthCheckURL empty", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := createHandler(svc, versionSvc)

		assert.Empty(t, handler.healthCheckURL)
	})
}

// ---------------------------------------------------------------------------
// TestHealthCheck
// ---------------------------------------------------------------------------

func TestHealthCheck(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	versionSvc := createTestVersionService(t)
	handler := createHandler(svc, versionSvc)
	r := setupTestRouter(handler)

	w := performRequest(r, "GET", "/health", "", nil)
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "healthy", response["status"])
	assert.Equal(t, "aws-proxy", response["proxy"])
	assert.Equal(t, "us-east-1", response["region"])
}

func TestHealthCheck_EmulatorUnreachable(t *testing.T) {
	t.Parallel()

	cfg := &configloader.Config{
		AWS: configloader.AWSProxyConfig{
			Endpoint: "http://127.0.0.1:1",
		},
		Emulator: "localstack",
	}
	svc := createMockSvc(t, cfg)
	versionSvc := createTestVersionService(t)
	handler := createHandler(svc, versionSvc)

	// Clear cache to force a fresh check.
	handler.mu.Lock()
	handler.lastHealthCheck = time.Time{}
	handler.mu.Unlock()

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/health", "", nil)

	assert.Equal(t, http.StatusServiceUnavailable, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "unhealthy", response["status"])
}

func TestHealthCheck_NoEmulator(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	versionSvc := createTestVersionService(t)
	handler := createHandler(svc, versionSvc)
	r := setupTestRouter(handler)

	w := performRequest(r, "GET", "/health", "", nil)
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "healthy", response["status"])
}

func TestHealthCheck_WithLatestVersion(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	m := mockports.NewVersionServicePort(t)
	m.EXPECT().GetGitHubRepo().Return("https://github.com/test/repo")
	m.EXPECT().GetLatestVersion().Return("v1.2.3", true)
	handler := createHandler(svc, m)
	r := setupTestRouter(handler)

	w := performRequest(r, "GET", "/health", "", nil)
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "v1.2.3", response["latestVersion"])
}

// ---------------------------------------------------------------------------
// TestServiceRouter – table-driven covering every known service + unknown
// ---------------------------------------------------------------------------

func TestServiceRouter(t *testing.T) {
	t.Parallel()

	type serviceCase struct {
		name       string
		service    string
		target     string
		wantStatus int
	}

	runServiceCase := func(t *testing.T, sc serviceCase, setupPorts func(t TWithCleanup, svc *mockports.ProxyService)) {
		t.Helper()
		var svc *mockports.ProxyService
		// RDS and ElastiCache make raw HTTP calls; use an unreachable endpoint so they return 500.
		if sc.service == "rds" || sc.service == "elasticache" {
			cfg := &configloader.Config{
				AWS: configloader.AWSProxyConfig{
					Endpoint: "http://127.0.0.1:1",
				},
			}
			svc = createMockSvc(t, cfg)
		} else {
			svc = createMockSvc(t, nil)
		}
		versionSvc := createTestVersionService(t)
		setupPorts(t, svc)
		handler := createHandler(svc, versionSvc)
		r := setupTestRouter(handler)

		w := performRequest(r, "POST", "/"+sc.service+"/", sc.target, []byte("{}"))
		assert.Equal(t, sc.wantStatus, w.Code,
			"service=%q target=%q body=%s", sc.service, sc.target, w.Body.String())
	}

	cases := []serviceCase{
		{name: "unknown", service: "unknown", target: "Unknown", wantStatus: http.StatusNotFound},
		{name: "secretsmanager", service: "secretsmanager", target: "ListSecrets", wantStatus: http.StatusOK},
		{name: "s3", service: "s3", target: "ListBuckets", wantStatus: http.StatusOK},
		{name: "lambda", service: "lambda", target: "ListFunctions", wantStatus: http.StatusOK},
		{name: "sqs", service: "sqs", target: "ListQueues", wantStatus: http.StatusOK},
		{name: "sns", service: "sns", target: "ListTopics", wantStatus: http.StatusOK},
		{name: "kms", service: "kms", target: "ListKeys", wantStatus: http.StatusOK},
		{name: "dynamodb", service: "dynamodb", target: "ListTables", wantStatus: http.StatusOK},
		{name: "dynamodbstreams", service: "dynamodbstreams", target: "ListStreams", wantStatus: http.StatusOK},
		{name: "apigateway", service: "apigateway", target: "GetRestApis", wantStatus: http.StatusOK},
		{name: "ssm", service: "ssm", target: "DescribeParameters", wantStatus: http.StatusOK},
		{name: "iam", service: "iam", target: "ListUsers", wantStatus: http.StatusOK},
		{name: "kinesis", service: "kinesis", target: "ListStreams", wantStatus: http.StatusOK},
		{name: "rds", service: "rds", target: "DescribeDBInstances", wantStatus: http.StatusInternalServerError},
		{name: "elasticache", service: "elasticache", target: "DescribeReplicationGroups", wantStatus: http.StatusInternalServerError},
		{name: "opensearch", service: "opensearch", target: "ListDomainNames", wantStatus: http.StatusOK},
		{name: "kafka", service: "kafka", target: "ListClustersV2", wantStatus: http.StatusOK},
		{name: "stepfunctions", service: "stepfunctions", target: "ListStateMachines", wantStatus: http.StatusOK},
		{name: "cloudformation", service: "cloudformation", target: "cloudformation.ListStacks", wantStatus: http.StatusOK},
		{name: "cloudwatch", service: "cloudwatch", target: "DescribeAlarms", wantStatus: http.StatusOK},
		{name: "cloudwatchlogs", service: "cloudwatchlogs", target: "DescribeLogGroups", wantStatus: http.StatusOK},
		{name: "sesv2", service: "sesv2", target: "ListEmailIdentities", wantStatus: http.StatusOK},
	}

	for _, sc := range cases {
		sc := sc
		t.Run(sc.name, func(t *testing.T) {
			t.Parallel()
			runServiceCase(t, sc, func(t TWithCleanup, svc *mockports.ProxyService) {
				switch sc.service {
				case "unknown":
					// No mock setup needed; will hit default 404.
				case "secretsmanager":
					mp := mockports.NewSecretsManagerPort(t)
					mp.EXPECT().ListSecrets(mock.Anything, mock.Anything).Return(&secretsmanager.ListSecretsOutput{}, nil)
					svc.EXPECT().SecretsManager().Return(mp)
				case "s3":
					mp := mockports.NewS3Port(t)
					mp.EXPECT().ListBuckets(mock.Anything).Return(&s3.ListBucketsOutput{}, nil)
					svc.EXPECT().S3().Return(mp)
				case "lambda":
					mp := mockports.NewLambdaPort(t)
					mp.EXPECT().ListFunctions(mock.Anything, mock.Anything).Return(&lambda.ListFunctionsOutput{}, nil)
					svc.EXPECT().Lambda().Return(mp)
				case "sqs":
					mp := mockports.NewSQSPort(t)
					mp.EXPECT().ListQueues(mock.Anything, mock.Anything).Return(&sqs.ListQueuesOutput{}, nil)
					svc.EXPECT().SQS().Return(mp)
				case "sns":
					mp := mockports.NewSNSPort(t)
					mp.EXPECT().ListTopics(mock.Anything, mock.Anything).Return(&sns.ListTopicsOutput{}, nil)
					svc.EXPECT().SNS().Return(mp)
				case "kms":
					mp := mockports.NewKMSPort(t)
					mp.EXPECT().ListKeys(mock.Anything, mock.Anything).Return(&kms.ListKeysOutput{}, nil)
					svc.EXPECT().KMS().Return(mp)
				case "dynamodb":
					mp := mockports.NewDynamoDBPort(t)
					mp.EXPECT().ListTables(mock.Anything, mock.Anything).Return(&dynamodb.ListTablesOutput{}, nil)
					svc.EXPECT().DynamoDB().Return(mp)
				case "dynamodbstreams":
					mp := mockports.NewDynamoDBStreamsPort(t)
					mp.EXPECT().ListStreams(mock.Anything, mock.Anything).Return(&dynamodbstreams.ListStreamsOutput{}, nil)
					svc.EXPECT().DynamoDBStreams().Return(mp)
				case "apigateway":
					mp := mockports.NewAPIGatewayPort(t)
					mp.EXPECT().GetRestApis(mock.Anything, mock.Anything).Return(&apigateway.GetRestApisOutput{}, nil)
					svc.EXPECT().APIGateway().Return(mp)
				case "ssm":
					mp := mockports.NewSSMPort(t)
					mp.EXPECT().DescribeParameters(mock.Anything, mock.Anything).Return(&ssm.DescribeParametersOutput{}, nil)
					svc.EXPECT().SSM().Return(mp)
				case "iam":
					mp := mockports.NewIAMPort(t)
					mp.EXPECT().ListUsers(mock.Anything, mock.Anything).Return(&iam.ListUsersOutput{}, nil)
					svc.EXPECT().IAM().Return(mp)
				case "kinesis":
					mp := mockports.NewKinesisPort(t)
					mp.EXPECT().ListStreams(mock.Anything, mock.Anything).Return(&kinesis.ListStreamsOutput{}, nil)
					svc.EXPECT().Kinesis().Return(mp)
				case "opensearch":
					mp := mockports.NewOpenSearchPort(t)
					mp.EXPECT().ListDomainNames(mock.Anything, mock.Anything).Return(&opensearch.ListDomainNamesOutput{}, nil)
					svc.EXPECT().OpenSearch().Return(mp)
				case "kafka":
					mp := mockports.NewMSKPort(t)
					mp.EXPECT().ListClustersV2(mock.Anything, mock.Anything).Return(&kafka.ListClustersV2Output{}, nil)
					svc.EXPECT().MSK().Return(mp)
				case "stepfunctions":
					mp := mockports.NewStepFunctionsPort(t)
					mp.EXPECT().ListStateMachines(mock.Anything, mock.Anything).Return(&sfn.ListStateMachinesOutput{}, nil)
					svc.EXPECT().StepFunctions().Return(mp)
				case "cloudformation":
					mp := mockports.NewCloudFormationPort(t)
					mp.EXPECT().ListStacks(mock.Anything, mock.Anything).Return(&cloudformation.ListStacksOutput{}, nil)
					svc.EXPECT().CloudFormation().Return(mp)
				case "cloudwatch":
					mp := mockports.NewCloudWatchPort(t)
					mp.EXPECT().DescribeAlarms(mock.Anything, mock.Anything).Return(&cloudwatch.DescribeAlarmsOutput{}, nil)
					svc.EXPECT().CloudWatch().Return(mp)
				case "cloudwatchlogs":
					mp := mockports.NewCloudWatchLogsPort(t)
					mp.EXPECT().DescribeLogGroups(mock.Anything, mock.Anything).Return(&cloudwatchlogs.DescribeLogGroupsOutput{}, nil)
					svc.EXPECT().CloudWatchLogs().Return(mp)
				case "sesv2":
					mp := mockports.NewSESv2Port(t)
					mp.EXPECT().ListEmailIdentities(mock.Anything, mock.Anything).Return(&sesv2.ListEmailIdentitiesOutput{}, nil)
					svc.EXPECT().SESv2().Return(mp)
				}
			})
		})
	}
}

// ---------------------------------------------------------------------------
// TestCORSHeaders
// ---------------------------------------------------------------------------

func TestCORSHeaders(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	versionSvc := createTestVersionService(t)
	handler := createHandler(svc, versionSvc)
	r := setupTestRouter(handler)

	// OPTIONS requests to a known service path should not cause a 5xx.
	w := performRequest(r, "OPTIONS", "/s3/test", "", nil)
	assert.NotEqual(t, http.StatusInternalServerError, w.Code)

	// Also verify OPTIONS on the health endpoint.
	w2 := performRequest(r, "OPTIONS", "/health", "", nil)
	assert.NotEqual(t, http.StatusInternalServerError, w2.Code)
}

// ---------------------------------------------------------------------------
// TestSetRegion
// ---------------------------------------------------------------------------

func TestSetRegion(t *testing.T) {
	t.Parallel()

	t.Run("valid region", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := createHandler(svc, versionSvc)

		gin.SetMode(gin.TestMode)
		r := gin.New()
		r.POST("/region", handler.SetRegion)

		body := `{"region":"us-west-2"}`
		w := performRequest(r, "POST", "/region", "", []byte(body))
		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
		assert.Equal(t, "us-west-2", resp["region"])
	})

	t.Run("empty region", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := createHandler(svc, versionSvc)

		gin.SetMode(gin.TestMode)
		r := gin.New()
		r.POST("/region", handler.SetRegion)

		body := `{"region":""}`
		w := performRequest(r, "POST", "/region", "", []byte(body))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("invalid JSON", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := createHandler(svc, versionSvc)

		gin.SetMode(gin.TestMode)
		r := gin.New()
		r.POST("/region", handler.SetRegion)

		body := `{bad json`
		w := performRequest(r, "POST", "/region", "", []byte(body))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("service error", func(t *testing.T) {
		t.Parallel()
		svc := mockports.NewProxyService(t)
		cfg := &configloader.Config{
			AWS: configloader.AWSProxyConfig{
				Endpoint: "http://localhost:4566",
			},
		}
		svc.EXPECT().Config().Return(cfg).Maybe()
		svc.EXPECT().Region().Return("us-east-1").Maybe()
		svc.EXPECT().SetRegion("fail-region").Return(errors.New("region service error"))
		svc.EXPECT().SetServices().Return(nil).Maybe()

		versionSvc := createTestVersionService(t)
		handler := createHandler(svc, versionSvc)

		gin.SetMode(gin.TestMode)
		r := gin.New()
		r.POST("/region", handler.SetRegion)

		body := `{"region":"fail-region"}`
		w := performRequest(r, "POST", "/region", "", []byte(body))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

// ---------------------------------------------------------------------------
// TestTransformJSONKeys (unit test for transformJSONKeys)
// ---------------------------------------------------------------------------

func TestTransformJSONKeys(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "mixed case keys",
			input: `{"listBuckets":{}}`,
			want:  `{"listBuckets":{}}`,
		},
		{
			name:  "already capitalized",
			input: `{"ListBuckets":{}}`,
			want:  `{"ListBuckets":{}}`,
		},
		{
			name:  "empty object",
			input: `{}`,
			want:  `{}`,
		},
		{
			name:  "with number values",
			input: `{"maxResults":10}`,
			want:  `{"maxResults":10}`,
		},
		{
			name:  "with special chars in value",
			input: `{"errorMessage":"hello world"}`,
			want:  `{"errorMessage":"hello world"}`,
		},
		{
			name:  "nested objects",
			input: `{"outerKey":{"innerKey":"val"}}`,
			want:  `{"outerKey":{"innerKey":"val"}}`,
		},
		{
			name:  "capitalize first letter of value after colon start",
			input: `{"keyName":"valueName"}`,
			want:  `{"keyName":"valueName"}`,
		},
		{
			name:  "multiple keys with capitalize paths",
			input: `{"listBuckets":{},"createFunction":{"functionName":"fn"}}`,
			want:  `{"listBuckets":{},"createFunction":{"functionName":"fn"}}`,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			got := transformJSONKeys(tt.input)
			assert.Equal(t, tt.want, got)
		})
	}
}

// ---------------------------------------------------------------------------
// TestReadBody (unit test for readBody)
// ---------------------------------------------------------------------------

func TestReadBody(t *testing.T) {
	t.Parallel()

	t.Run("with body", func(t *testing.T) {
		t.Parallel()
		gin.SetMode(gin.TestMode)
		req, _ := http.NewRequest("POST", "/", bytes.NewReader([]byte(`{"key":"val"}`)))
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = req

		body := readBody(c)
		assert.Equal(t, `{"key":"val"}`, string(body))
	})

	t.Run("nil body", func(t *testing.T) {
		t.Parallel()
		gin.SetMode(gin.TestMode)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		req, _ := http.NewRequest("POST", "/", nil)
		c.Request = req

		body := readBody(c)
		assert.Nil(t, body)
	})
}

// ---------------------------------------------------------------------------
// TestParseBody (unit test for parseBody)
// ---------------------------------------------------------------------------

func TestParseBody(t *testing.T) {
	t.Parallel()

	t.Run("valid JSON", func(t *testing.T) {
		t.Parallel()
		gin.SetMode(gin.TestMode)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		type testStruct struct {
			Foo string `json:"Foo"`
		}
		var out testStruct
		err := parseBody(c, []byte(`{"foo":"bar"}`), &out)
		assert.NoError(t, err)
		assert.Equal(t, "bar", out.Foo)
	})

	t.Run("empty body", func(t *testing.T) {
		t.Parallel()
		gin.SetMode(gin.TestMode)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		var out map[string]interface{}
		err := parseBody(c, []byte{}, &out)
		assert.NoError(t, err)
		assert.Nil(t, out)
	})

	t.Run("invalid JSON", func(t *testing.T) {
		t.Parallel()
		gin.SetMode(gin.TestMode)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		var out map[string]interface{}
		err := parseBody(c, []byte(`{invalid}`), &out)
		assert.Error(t, err)
	})
}

// ---------------------------------------------------------------------------
// TestSendError (unit test for sendError)
// ---------------------------------------------------------------------------

func TestSendError(t *testing.T) {
	t.Parallel()

	t.Run("with err", func(t *testing.T) {
		t.Parallel()
		gin.SetMode(gin.TestMode)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		sendError(c, http.StatusInternalServerError, "something failed", errors.New("detail"))

		assert.Equal(t, http.StatusInternalServerError, w.Code)
		var resp map[string]interface{}
		assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
		assert.Equal(t, "something failed", resp["error"])
	})

	t.Run("without err", func(t *testing.T) {
		t.Parallel()
		gin.SetMode(gin.TestMode)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		sendError(c, http.StatusBadRequest, "bad request", nil)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		var resp map[string]interface{}
		assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
		assert.Equal(t, "bad request", resp["error"])
	})
}

// ---------------------------------------------------------------------------
// TestCheckBackendHealth
// ---------------------------------------------------------------------------

func TestCheckBackendHealth(t *testing.T) {
	t.Parallel()

	t.Run("no emulator always healthy", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := createHandler(svc, versionSvc)

		assert.True(t, handler.checkBackendHealth(),
			"without emulator backend should always be healthy")
	})

	t.Run("cache returns cached value", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := createHandler(svc, versionSvc)

		healthy1 := handler.checkBackendHealth()
		healthy2 := handler.checkBackendHealth()

		assert.True(t, healthy1)
		assert.True(t, healthy2)
	})

	t.Run("cache expiry triggers fresh check", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := createHandler(svc, versionSvc)

		handler.checkBackendHealth()

		handler.mu.Lock()
		handler.lastHealthCheck = time.Time{}
		handler.mu.Unlock()

		assert.True(t, handler.checkBackendHealth())
	})

	t.Run("double-check locking consistency", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := createHandler(svc, versionSvc)

		handler.mu.Lock()
		handler.lastHealthCheck = time.Now()
		handler.backendHealthy = true
		handler.mu.Unlock()

		assert.True(t, handler.checkBackendHealth())
	})
}

func TestCheckBackendHealth_EmulatorUnreachable(t *testing.T) {
	t.Parallel()

	cfg := &configloader.Config{
		AWS: configloader.AWSProxyConfig{
			Endpoint: "http://127.0.0.1:1",
		},
		Emulator: "localstack",
	}
	svc := createMockSvc(t, cfg)
	versionSvc := createTestVersionService(t)
	handler := createHandler(svc, versionSvc)

	handler.mu.Lock()
	handler.lastHealthCheck = time.Time{}
	handler.mu.Unlock()

	assert.False(t, handler.checkBackendHealth(),
		"should be unhealthy when emulator is unreachable")
}

func TestCheckBackendHealth_HTTPServer(t *testing.T) {
	t.Parallel()

	t.Run("200 returns healthy", func(t *testing.T) {
		t.Parallel()
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		}))
		defer server.Close()

		cfg := &configloader.Config{
			AWS: configloader.AWSProxyConfig{
				Endpoint: server.URL,
			},
			Emulator: "localstack",
		}
		svc := createMockSvc(t, cfg)
		versionSvc := createTestVersionService(t)
		handler := createHandler(svc, versionSvc)
		handler.healthCheckURL = server.URL + "/_localstack/health"

		handler.mu.Lock()
		handler.lastHealthCheck = time.Time{}
		handler.mu.Unlock()

		assert.True(t, handler.checkBackendHealth())
	})

	t.Run("500 returns unhealthy", func(t *testing.T) {
		t.Parallel()
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusInternalServerError)
		}))
		defer server.Close()

		cfg := &configloader.Config{
			AWS: configloader.AWSProxyConfig{
				Endpoint: server.URL,
			},
			Emulator: "localstack",
		}
		svc := createMockSvc(t, cfg)
		versionSvc := createTestVersionService(t)
		handler := createHandler(svc, versionSvc)
		handler.healthCheckURL = server.URL + "/_localstack/health"

		handler.mu.Lock()
		handler.lastHealthCheck = time.Time{}
		handler.mu.Unlock()

		assert.False(t, handler.checkBackendHealth())
	})

	t.Run("double-check locking returns cached value", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := createHandler(svc, versionSvc)

		// Set cache to a recent value
		handler.mu.Lock()
		handler.lastHealthCheck = time.Now()
		handler.backendHealthy = false
		handler.mu.Unlock()

		// Should return cached value without making HTTP call
		assert.False(t, handler.checkBackendHealth())
	})

	t.Run("non-200 status code", func(t *testing.T) {
		t.Parallel()
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusNotFound)
		}))
		defer server.Close()

		cfg := &configloader.Config{
			AWS: configloader.AWSProxyConfig{
				Endpoint: server.URL,
			},
			Emulator: "localstack",
		}
		svc := createMockSvc(t, cfg)
		versionSvc := createTestVersionService(t)
		handler := createHandler(svc, versionSvc)
		handler.healthCheckURL = server.URL + "/_localstack/health"

		handler.mu.Lock()
		handler.lastHealthCheck = time.Time{}
		handler.mu.Unlock()

		assert.False(t, handler.checkBackendHealth())
	})

}
