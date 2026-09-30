package httphandlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudfront"
	cftypes "github.com/aws/aws-sdk-go-v2/service/cloudfront/types"
	"github.com/aws/smithy-go"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// setupCloudFrontTest creates a mocked service with a mock CloudFront port wired in.
// NOTE: CloudFront() is set with Maybe() so tests where the handler returns early
// (e.g. parse-error) don't fail the mock.
func setupCloudFrontTest(t *testing.T) (*mockports.ProxyService, *mockports.CloudFrontPort, *ProxyHandler) {
	svc := createMockSvc(t, nil)
	mp := mockports.NewCloudFrontPort(t)
	svc.EXPECT().CloudFront().Return(mp).Maybe()
	versionSvc := createTestVersionService(t)
	handler := createHandler(svc, versionSvc)
	return svc, mp, handler
}

// performCloudFrontRequest executes an HTTP request against the /cloudfront/ service router.
func performCloudFrontRequest(handler *ProxyHandler, method, path string, body []byte) *httptest.ResponseRecorder {
	r := setupTestRouter(handler)
	return performRequest(r, method, path, body)
}

// ---------------------------------------------------------------------------
// ListDistributions
// ---------------------------------------------------------------------------

func TestCloudFront_ListDistributions_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().ListDistributions(mock.Anything, mock.Anything).Return(&cloudfront.ListDistributionsOutput{}, nil)

	w := performCloudFrontRequest(handler, "GET", "/cloudfront/distributions", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCloudFront_ListDistributions_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().ListDistributions(mock.Anything, mock.Anything).Return(nil, errors.New("list distributions error"))

	w := performCloudFrontRequest(handler, "GET", "/cloudfront/distributions", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list distributions")
}

// ---------------------------------------------------------------------------
// CreateDistribution
// ---------------------------------------------------------------------------

func TestCloudFront_CreateDistribution_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().CreateDistribution(mock.Anything, mock.Anything).Return(&cloudfront.CreateDistributionOutput{}, nil)

	body := `{"Comment":"test","Origins":[{"DomainName":"mybucket.s3.amazonaws.com"}]}`
	w := performCloudFrontRequest(handler, "POST", "/cloudfront/distributions", []byte(body))
	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestCloudFront_CreateDistribution_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().CreateDistribution(mock.Anything, mock.Anything).Return(nil, errors.New("create distribution error"))

	body := `{"Comment":"test","Origins":[{"DomainName":"mybucket.s3.amazonaws.com"}]}`
	w := performCloudFrontRequest(handler, "POST", "/cloudfront/distributions", []byte(body))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create distribution")
}

func TestCloudFront_CreateDistribution_InvalidBody(t *testing.T) {
	t.Parallel()
	_, _, handler := setupCloudFrontTest(t)

	w := performCloudFrontRequest(handler, "POST", "/cloudfront/distributions", []byte(`{invalid`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Invalid request body")
}

// ---------------------------------------------------------------------------
// GetDistribution
// ---------------------------------------------------------------------------

func TestCloudFront_GetDistribution_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().GetDistribution(mock.Anything, mock.MatchedBy(func(in *cloudfront.GetDistributionInput) bool {
		return in.Id != nil && *in.Id == "EDFDVBD6EXAMPLE"
	})).Return(&cloudfront.GetDistributionOutput{}, nil)

	w := performCloudFrontRequest(handler, "GET", "/cloudfront/distributions/EDFDVBD6EXAMPLE", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCloudFront_GetDistribution_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().GetDistribution(mock.Anything, mock.Anything).Return(nil, errors.New("get distribution error"))

	w := performCloudFrontRequest(handler, "GET", "/cloudfront/distributions/EDFDVBD6EXAMPLE", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to get distribution")
}

// ---------------------------------------------------------------------------
// UpdateDistribution
// ---------------------------------------------------------------------------

func TestCloudFront_UpdateDistribution_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().GetDistributionConfig(mock.Anything, mock.Anything).Return(&cloudfront.GetDistributionConfigOutput{
		DistributionConfig: &cftypes.DistributionConfig{},
		ETag:               aws.String("ETAG123"),
	}, nil)
	mp.EXPECT().UpdateDistribution(mock.Anything, mock.Anything).Return(&cloudfront.UpdateDistributionOutput{}, nil)

	body := `{"Comment":"updated"}`
	w := performCloudFrontRequest(handler, "PUT", "/cloudfront/distributions/EDFDVBD6EXAMPLE", []byte(body))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCloudFront_UpdateDistribution_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().GetDistributionConfig(mock.Anything, mock.Anything).Return(nil, errors.New("get config error"))

	body := `{"Comment":"updated"}`
	w := performCloudFrontRequest(handler, "PUT", "/cloudfront/distributions/EDFDVBD6EXAMPLE", []byte(body))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ---------------------------------------------------------------------------
// DeleteDistribution
// ---------------------------------------------------------------------------

func TestCloudFront_DeleteDistribution_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().GetDistributionConfig(mock.Anything, mock.Anything).Return(&cloudfront.GetDistributionConfigOutput{
		DistributionConfig: &cftypes.DistributionConfig{
			Enabled: aws.Bool(false),
		},
		ETag: aws.String("ETAG123"),
	}, nil)
	mp.EXPECT().DeleteDistribution(mock.Anything, mock.Anything).Return(nil)

	w := performCloudFrontRequest(handler, "DELETE", "/cloudfront/distributions/EDFDVBD6EXAMPLE", nil)
	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["message"], "deleted successfully")
}

func TestCloudFront_DeleteDistribution_DisableFirst(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	// First call returns enabled
	mp.EXPECT().GetDistributionConfig(mock.Anything, mock.Anything).Return(&cloudfront.GetDistributionConfigOutput{
		DistributionConfig: &cftypes.DistributionConfig{
			Enabled: aws.Bool(true),
		},
		ETag: aws.String("ETAG1"),
	}, nil).Once()
	mp.EXPECT().UpdateDistribution(mock.Anything, mock.Anything).Return(&cloudfront.UpdateDistributionOutput{}, nil)
	// Second call returns disabled
	mp.EXPECT().GetDistributionConfig(mock.Anything, mock.Anything).Return(&cloudfront.GetDistributionConfigOutput{
		DistributionConfig: &cftypes.DistributionConfig{
			Enabled: aws.Bool(false),
		},
		ETag: aws.String("ETAG2"),
	}, nil).Once()
	mp.EXPECT().DeleteDistribution(mock.Anything, mock.Anything).Return(nil)

	w := performCloudFrontRequest(handler, "DELETE", "/cloudfront/distributions/EDFDVBD6EXAMPLE", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCloudFront_DeleteDistribution_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().GetDistributionConfig(mock.Anything, mock.Anything).Return(nil, errors.New("get config error"))

	w := performCloudFrontRequest(handler, "DELETE", "/cloudfront/distributions/EDFDVBD6EXAMPLE", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ---------------------------------------------------------------------------
// ListInvalidations
// ---------------------------------------------------------------------------

func TestCloudFront_ListInvalidations_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().ListInvalidations(mock.Anything, mock.MatchedBy(func(in *cloudfront.ListInvalidationsInput) bool {
		return in.DistributionId != nil && *in.DistributionId == "EDFDVBD6EXAMPLE"
	})).Return(&cloudfront.ListInvalidationsOutput{}, nil)

	w := performCloudFrontRequest(handler, "GET", "/cloudfront/distributions/EDFDVBD6EXAMPLE/invalidations", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCloudFront_ListInvalidations_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().ListInvalidations(mock.Anything, mock.Anything).Return(nil, errors.New("list invalidations error"))

	w := performCloudFrontRequest(handler, "GET", "/cloudfront/distributions/EDFDVBD6EXAMPLE/invalidations", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ---------------------------------------------------------------------------
// CreateInvalidation
// ---------------------------------------------------------------------------

func TestCloudFront_CreateInvalidation_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().CreateInvalidation(mock.Anything, mock.MatchedBy(func(in *cloudfront.CreateInvalidationInput) bool {
		return in.DistributionId != nil && *in.DistributionId == "EDFDVBD6EXAMPLE" &&
			in.InvalidationBatch != nil && in.InvalidationBatch.Paths != nil &&
			len(in.InvalidationBatch.Paths.Items) == 1 && in.InvalidationBatch.Paths.Items[0] == "/*"
	})).Return(&cloudfront.CreateInvalidationOutput{}, nil)

	body := `{"Paths":["/*"]}`
	w := performCloudFrontRequest(handler, "POST", "/cloudfront/distributions/EDFDVBD6EXAMPLE/invalidate", []byte(body))
	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestCloudFront_CreateInvalidation_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().CreateInvalidation(mock.Anything, mock.Anything).Return(nil, errors.New("create invalidation error"))

	body := `{"Paths":["/*"]}`
	w := performCloudFrontRequest(handler, "POST", "/cloudfront/distributions/EDFDVBD6EXAMPLE/invalidate", []byte(body))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestCloudFront_CreateInvalidation_MissingPaths(t *testing.T) {
	t.Parallel()
	_, _, handler := setupCloudFrontTest(t)

	body := `{}`
	w := performCloudFrontRequest(handler, "POST", "/cloudfront/distributions/EDFDVBD6EXAMPLE/invalidate", []byte(body))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ---------------------------------------------------------------------------
// ListOriginAccessControls
// ---------------------------------------------------------------------------

func TestCloudFront_ListOriginAccessControls_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().ListOriginAccessControls(mock.Anything, mock.Anything).Return(&cloudfront.ListOriginAccessControlsOutput{}, nil)

	w := performCloudFrontRequest(handler, "GET", "/cloudfront/origin-access-controls", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCloudFront_ListOriginAccessControls_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().ListOriginAccessControls(mock.Anything, mock.Anything).Return(nil, errors.New("list oac error"))

	w := performCloudFrontRequest(handler, "GET", "/cloudfront/origin-access-controls", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ---------------------------------------------------------------------------
// CreateOriginAccessControl
// ---------------------------------------------------------------------------

func TestCloudFront_CreateOriginAccessControl_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().CreateOriginAccessControl(mock.Anything, mock.Anything).Return(&cloudfront.CreateOriginAccessControlOutput{}, nil)

	body := `{"OriginAccessControlConfig":{"Name":"test","SigningBehavior":"always","SigningProtocol":"sigv4"}}`
	w := performCloudFrontRequest(handler, "POST", "/cloudfront/origin-access-controls", []byte(body))
	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestCloudFront_CreateOriginAccessControl_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().CreateOriginAccessControl(mock.Anything, mock.Anything).Return(nil, errors.New("create oac error"))

	body := `{"OriginAccessControlConfig":{"Name":"test","SigningBehavior":"always","SigningProtocol":"sigv4"}}`
	w := performCloudFrontRequest(handler, "POST", "/cloudfront/origin-access-controls", []byte(body))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ---------------------------------------------------------------------------
// DeleteOriginAccessControl
// ---------------------------------------------------------------------------

func TestCloudFront_DeleteOriginAccessControl_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().GetOriginAccessControl(mock.Anything, mock.Anything).Return(&cloudfront.GetOriginAccessControlOutput{
		ETag: aws.String("ETAG123"),
	}, nil)
	mp.EXPECT().DeleteOriginAccessControl(mock.Anything, mock.Anything).Return(nil)

	w := performCloudFrontRequest(handler, "DELETE", "/cloudfront/origin-access-controls/E1Q6Q8EXAMPLE", nil)
	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["message"], "deleted successfully")
}

func TestCloudFront_DeleteOriginAccessControl_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCloudFrontTest(t)
	mp.EXPECT().GetOriginAccessControl(mock.Anything, mock.Anything).Return(nil, errors.New("get oac error"))

	w := performCloudFrontRequest(handler, "DELETE", "/cloudfront/origin-access-controls/E1Q6Q8EXAMPLE", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ---------------------------------------------------------------------------
// NotFound errors
// ---------------------------------------------------------------------------

// mockCloudFrontDistributionNotFoundError implements smithy.APIError for NoSuchDistribution
type mockCloudFrontDistributionNotFoundError struct{}

func (e *mockCloudFrontDistributionNotFoundError) ErrorCode() string             { return "NoSuchDistribution" }
func (e *mockCloudFrontDistributionNotFoundError) ErrorMessage() string          { return "The specified distribution does not exist." }
func (e *mockCloudFrontDistributionNotFoundError) ErrorFault() smithy.ErrorFault { return 0 }
func (e *mockCloudFrontDistributionNotFoundError) Error() string                 { return "NoSuchDistribution: The specified distribution does not exist." }

// mockCloudFrontOACNotFoundError implements smithy.APIError for NoSuchOriginAccessControl
type mockCloudFrontOACNotFoundError struct{}

func (e *mockCloudFrontOACNotFoundError) ErrorCode() string             { return "NoSuchOriginAccessControl" }
func (e *mockCloudFrontOACNotFoundError) ErrorMessage() string          { return "The specified origin access control does not exist." }
func (e *mockCloudFrontOACNotFoundError) ErrorFault() smithy.ErrorFault { return 0 }
func (e *mockCloudFrontOACNotFoundError) Error() string                 { return "NoSuchOriginAccessControl: The specified origin access control does not exist." }

func TestCloudFront_NotFound(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		method    string
		path      string
		body      string
		setupMock func(mp *mockports.CloudFrontPort)
	}{
		{name: "GetDistribution_ResourceNotFoundException", method: "GET", path: "/cloudfront/distributions/INVALID",
			setupMock: func(mp *mockports.CloudFrontPort) { mp.EXPECT().GetDistribution(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "GetDistribution_NoSuchDistribution", method: "GET", path: "/cloudfront/distributions/missing",
			setupMock: func(mp *mockports.CloudFrontPort) { mp.EXPECT().GetDistribution(mock.Anything, mock.Anything).Return(nil, &mockCloudFrontDistributionNotFoundError{}) }},
		{name: "UpdateDistribution", method: "PUT", path: "/cloudfront/distributions/INVALID", body: `{"Comment":"x"}`,
			setupMock: func(mp *mockports.CloudFrontPort) { mp.EXPECT().GetDistributionConfig(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "DeleteDistribution_NoSuchDistribution", method: "DELETE", path: "/cloudfront/distributions/missing",
			setupMock: func(mp *mockports.CloudFrontPort) { mp.EXPECT().GetDistributionConfig(mock.Anything, mock.Anything).Return(nil, &mockCloudFrontDistributionNotFoundError{}) }},
		{name: "ListInvalidations", method: "GET", path: "/cloudfront/distributions/INVALID/invalidations",
			setupMock: func(mp *mockports.CloudFrontPort) { mp.EXPECT().ListInvalidations(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "CreateInvalidation", method: "POST", path: "/cloudfront/distributions/INVALID/invalidate", body: `{"Paths":["/*"]}`,
			setupMock: func(mp *mockports.CloudFrontPort) { mp.EXPECT().CreateInvalidation(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "DeleteOriginAccessControl_NoSuchOAC", method: "DELETE", path: "/cloudfront/origin-access-controls/missing",
			setupMock: func(mp *mockports.CloudFrontPort) { mp.EXPECT().GetOriginAccessControl(mock.Anything, mock.Anything).Return(nil, &mockCloudFrontOACNotFoundError{}) }},
	}
	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			_, mp, handler := setupCloudFrontTest(t)
			tt.setupMock(mp)
			w := performCloudFrontRequest(handler, tt.method, tt.path, []byte(tt.body))
			assert.Equal(t, http.StatusNotFound, w.Code, "method=%s path=%s response=%s", tt.method, tt.path, w.Body.String())
		})
	}
}
