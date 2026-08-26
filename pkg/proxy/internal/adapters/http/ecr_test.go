package httphandlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/ecr"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// setupECRTest creates a mocked service with a mock ECR port wired in.
// NOTE: ECR() is set with Maybe() so tests where the handler returns early
// (e.g. parse-error) don't fail the mock.
func setupECRTest(t *testing.T) (*mockports.ProxyService, *mockports.ECRPort, *ProxyHandler) {
	svc := createMockSvc(t, nil)
	mp := mockports.NewECRPort(t)
	svc.EXPECT().ECR().Return(mp).Maybe()
	versionSvc := createTestVersionService(t)
	handler := createHandler(svc, versionSvc)
	return svc, mp, handler
}

// performECRRequest executes an HTTP request against the /ecr/ service router.
func performECRRequest(handler *ProxyHandler, method, path string, body []byte) *httptest.ResponseRecorder {
	r := setupTestRouter(handler)
	return performRequest(r, method, path, body)
}

// ---------------------------------------------------------------------------
// DescribeRepositories
// ---------------------------------------------------------------------------

func TestECR_DescribeRepositories_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().DescribeRepositories(mock.Anything, mock.Anything).Return(&ecr.DescribeRepositoriesOutput{}, nil)

	w := performECRRequest(handler, "GET", "/ecr/repositories", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECR_DescribeRepositories_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().DescribeRepositories(mock.Anything, mock.Anything).Return(nil, errors.New("describe repositories error"))

	w := performECRRequest(handler, "GET", "/ecr/repositories", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to describe repositories")
}

func TestECR_DescribeRepositories_Filters(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().DescribeRepositories(mock.Anything, mock.MatchedBy(func(in *ecr.DescribeRepositoriesInput) bool {
		return len(in.RepositoryNames) == 1 && in.RepositoryNames[0] == "repo-a" &&
			in.NextToken != nil && *in.NextToken == "token1" &&
			in.MaxResults != nil && *in.MaxResults == 10
	})).Return(&ecr.DescribeRepositoriesOutput{}, nil)

	w := performECRRequest(handler, "GET", "/ecr/repositories", []byte(`{"RepositoryNames":["repo-a"],"NextToken":"token1","MaxResults":10}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

// ---------------------------------------------------------------------------
// CreateRepository
// ---------------------------------------------------------------------------

func TestECR_CreateRepository_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().CreateRepository(mock.Anything, mock.MatchedBy(func(in *ecr.CreateRepositoryInput) bool {
		return in.RepositoryName != nil && *in.RepositoryName == "my-repo"
	})).Return(&ecr.CreateRepositoryOutput{}, nil)

	w := performECRRequest(handler, "POST", "/ecr/repositories", []byte(`{"RepositoryName":"my-repo"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECR_CreateRepository_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().CreateRepository(mock.Anything, mock.Anything).Return(nil, errors.New("create repository error"))

	w := performECRRequest(handler, "POST", "/ecr/repositories", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create repository")
}

// ---------------------------------------------------------------------------
// DescribeRepository
// ---------------------------------------------------------------------------

func TestECR_DescribeRepository_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().DescribeRepositories(mock.Anything, mock.MatchedBy(func(in *ecr.DescribeRepositoriesInput) bool {
		return len(in.RepositoryNames) == 1 && in.RepositoryNames[0] == "my-repo"
	})).Return(&ecr.DescribeRepositoriesOutput{}, nil)

	w := performECRRequest(handler, "GET", "/ecr/repositories/my-repo", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECR_DescribeRepository_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().DescribeRepositories(mock.Anything, mock.Anything).Return(nil, errors.New("describe repository error"))

	w := performECRRequest(handler, "GET", "/ecr/repositories/my-repo", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to describe repository")
}

// ---------------------------------------------------------------------------
// DeleteRepository
// ---------------------------------------------------------------------------

func TestECR_DeleteRepository_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().DeleteRepository(mock.Anything, mock.MatchedBy(func(in *ecr.DeleteRepositoryInput) bool {
		return in.RepositoryName != nil && *in.RepositoryName == "my-repo"
	})).Return(&ecr.DeleteRepositoryOutput{}, nil)

	w := performECRRequest(handler, "DELETE", "/ecr/repositories/my-repo", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECR_DeleteRepository_Force(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().DeleteRepository(mock.Anything, mock.MatchedBy(func(in *ecr.DeleteRepositoryInput) bool {
		return in.RepositoryName != nil && *in.RepositoryName == "my-repo" &&
			in.Force
	})).Return(&ecr.DeleteRepositoryOutput{}, nil)

	w := performECRRequest(handler, "DELETE", "/ecr/repositories/my-repo?force=true", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECR_DeleteRepository_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().DeleteRepository(mock.Anything, mock.Anything).Return(nil, errors.New("delete repository error"))

	w := performECRRequest(handler, "DELETE", "/ecr/repositories/my-repo", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete repository")
}

// ---------------------------------------------------------------------------
// GetAuthorizationToken
// ---------------------------------------------------------------------------

func TestECR_GetAuthorizationToken_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().GetAuthorizationToken(mock.Anything, mock.Anything).Return(&ecr.GetAuthorizationTokenOutput{}, nil)

	w := performECRRequest(handler, "GET", "/ecr/authorization-token", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECR_GetAuthorizationToken_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().GetAuthorizationToken(mock.Anything, mock.Anything).Return(nil, errors.New("get authorization token error"))

	w := performECRRequest(handler, "GET", "/ecr/authorization-token", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to get authorization token")
}

// ---------------------------------------------------------------------------
// ListImages
// ---------------------------------------------------------------------------

func TestECR_ListImages_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().ListImages(mock.Anything, mock.MatchedBy(func(in *ecr.ListImagesInput) bool {
		return in.RepositoryName != nil && *in.RepositoryName == "my-repo"
	})).Return(&ecr.ListImagesOutput{}, nil)

	w := performECRRequest(handler, "GET", "/ecr/images/my-repo", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECR_ListImages_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().ListImages(mock.Anything, mock.Anything).Return(nil, errors.New("list images error"))

	w := performECRRequest(handler, "GET", "/ecr/images/my-repo", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list images")
}

func TestECR_ListImages_Filters(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().ListImages(mock.Anything, mock.MatchedBy(func(in *ecr.ListImagesInput) bool {
		return in.RepositoryName != nil && *in.RepositoryName == "my-repo" &&
			in.NextToken != nil && *in.NextToken == "token1" &&
			in.MaxResults != nil && *in.MaxResults == 10 &&
			in.Filter != nil && string(in.Filter.TagStatus) == "TAGGED"
	})).Return(&ecr.ListImagesOutput{}, nil)

	w := performECRRequest(handler, "GET", "/ecr/images/my-repo", []byte(`{"NextToken":"token1","MaxResults":10,"TagStatus":"TAGGED"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

// ---------------------------------------------------------------------------
// DescribeImages
// ---------------------------------------------------------------------------

func TestECR_DescribeImages_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().DescribeImages(mock.Anything, mock.MatchedBy(func(in *ecr.DescribeImagesInput) bool {
		return in.RepositoryName != nil && *in.RepositoryName == "my-repo"
	})).Return(&ecr.DescribeImagesOutput{}, nil)

	w := performECRRequest(handler, "GET", "/ecr/images/details/my-repo", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECR_DescribeImages_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().DescribeImages(mock.Anything, mock.Anything).Return(nil, errors.New("describe images error"))

	w := performECRRequest(handler, "GET", "/ecr/images/details/my-repo", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to describe images")
}

// ---------------------------------------------------------------------------
// BatchGetImage
// ---------------------------------------------------------------------------

func TestECR_BatchGetImage_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().BatchGetImage(mock.Anything, mock.MatchedBy(func(in *ecr.BatchGetImageInput) bool {
		return in.RepositoryName != nil && *in.RepositoryName == "my-repo" &&
			len(in.ImageIds) == 1
	})).Return(&ecr.BatchGetImageOutput{}, nil)

	w := performECRRequest(handler, "POST", "/ecr/images/batch-get/my-repo", []byte(`{"ImageIds":[{"ImageTag":"v1"}]}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECR_BatchGetImage_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().BatchGetImage(mock.Anything, mock.Anything).Return(nil, errors.New("batch get image error"))

	w := performECRRequest(handler, "POST", "/ecr/images/batch-get/my-repo", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to batch get images")
}

// ---------------------------------------------------------------------------
// BatchDeleteImage
// ---------------------------------------------------------------------------

func TestECR_BatchDeleteImage_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().BatchDeleteImage(mock.Anything, mock.MatchedBy(func(in *ecr.BatchDeleteImageInput) bool {
		return in.RepositoryName != nil && *in.RepositoryName == "my-repo" &&
			len(in.ImageIds) == 1
	})).Return(&ecr.BatchDeleteImageOutput{}, nil)

	w := performECRRequest(handler, "POST", "/ecr/images/batch-delete/my-repo", []byte(`{"ImageIds":[{"ImageTag":"v1"}]}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECR_BatchDeleteImage_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().BatchDeleteImage(mock.Anything, mock.Anything).Return(nil, errors.New("batch delete image error"))

	w := performECRRequest(handler, "POST", "/ecr/images/batch-delete/my-repo", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to batch delete images")
}

// ---------------------------------------------------------------------------
// ListTagsForResource
// ---------------------------------------------------------------------------

func TestECR_ListTagsForResource_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().ListTagsForResource(mock.Anything, mock.MatchedBy(func(in *ecr.ListTagsForResourceInput) bool {
		return in.ResourceArn != nil && *in.ResourceArn == "arn:aws:ecr:us-east-1:000000000000:repository/my-repo"
	})).Return(&ecr.ListTagsForResourceOutput{}, nil)

	w := performECRRequest(handler, "GET", "/ecr/tags/my-repo", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECR_ListTagsForResource_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().ListTagsForResource(mock.Anything, mock.Anything).Return(nil, errors.New("list tags error"))

	w := performECRRequest(handler, "GET", "/ecr/tags/my-repo", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list tags")
}

// ---------------------------------------------------------------------------
// UpdateTags
// ---------------------------------------------------------------------------

func TestECR_UpdateTags_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().TagResource(mock.Anything, mock.MatchedBy(func(in *ecr.TagResourceInput) bool {
		return in.ResourceArn != nil && *in.ResourceArn == "arn:aws:ecr:us-east-1:000000000000:repository/my-repo" &&
			len(in.Tags) == 1 && *in.Tags[0].Key == "Env" && *in.Tags[0].Value == "test"
	})).Return(&ecr.TagResourceOutput{}, nil)
	mp.EXPECT().UntagResource(mock.Anything, mock.MatchedBy(func(in *ecr.UntagResourceInput) bool {
		return in.ResourceArn != nil && *in.ResourceArn == "arn:aws:ecr:us-east-1:000000000000:repository/my-repo" &&
			len(in.TagKeys) == 1 && in.TagKeys[0] == "OldKey"
	})).Return(&ecr.UntagResourceOutput{}, nil)

	w := performECRRequest(handler, "PUT", "/ecr/tags/my-repo", []byte(`{"Tags":{"Env":"test"},"RemovedKeys":["OldKey"]}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECR_UpdateTags_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECRTest(t)
	mp.EXPECT().TagResource(mock.Anything, mock.MatchedBy(func(in *ecr.TagResourceInput) bool {
		return in.ResourceArn != nil && *in.ResourceArn == "arn:aws:ecr:us-east-1:000000000000:repository/my-repo"
	})).Return(nil, errors.New("tag resource error"))

	w := performECRRequest(handler, "PUT", "/ecr/tags/my-repo", []byte(`{"Tags":{"Env":"test"},"RemovedKeys":[]}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to update tags")
}

// ---------------------------------------------------------------------------
// ecrRepositoryARN helper
// ---------------------------------------------------------------------------

func TestECR_RepositoryARN(t *testing.T) {
	t.Parallel()
	_, _, handler := setupECRTest(t)

	tests := []struct {
		name           string
		repositoryName string
		want           string
	}{
		{name: "standard repo", repositoryName: "my-repo", want: "arn:aws:ecr:us-east-1:000000000000:repository/my-repo"},
		{name: "nested repo", repositoryName: "team/app", want: "arn:aws:ecr:us-east-1:000000000000:repository/team/app"},
		{name: "empty repo", repositoryName: "", want: "arn:aws:ecr:us-east-1:000000000000:repository/"},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			assert.Equal(t, tt.want, handler.ecrRepositoryARN(tt.repositoryName))
		})
	}
}

// ---------------------------------------------------------------------------
// Invalid request body → 400
// ---------------------------------------------------------------------------

func TestECR_InvalidBody(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name   string
		method string
		path   string
		body   string
	}{
		{name: "DescribeRepositories", method: "GET", path: "/ecr/repositories", body: `{invalid`},
		{name: "CreateRepository", method: "POST", path: "/ecr/repositories", body: `{invalid`},
		{name: "ListImages", method: "GET", path: "/ecr/images/my-repo", body: `{invalid`},
		{name: "DescribeImages", method: "GET", path: "/ecr/images/details/my-repo", body: `{invalid`},
		{name: "BatchGetImage", method: "POST", path: "/ecr/images/batch-get/my-repo", body: `{invalid`},
		{name: "BatchDeleteImage", method: "POST", path: "/ecr/images/batch-delete/my-repo", body: `{invalid`},
		{name: "UpdateTags", method: "PUT", path: "/ecr/tags/my-repo", body: `{invalid`},
	}
	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			_, _, handler := setupECRTest(t)
			w := performECRRequest(handler, tt.method, tt.path, []byte(tt.body))
			assert.Equal(t, http.StatusBadRequest, w.Code)
			var resp map[string]interface{}
			assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
			assert.Contains(t, resp["error"], "Invalid request body")
		})
	}
}

// ---------------------------------------------------------------------------
// ResourceNotFoundException → 404
// ---------------------------------------------------------------------------

func TestECR_NotFound(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		method    string
		path      string
		body      string
		setupMock func(mp *mockports.ECRPort)
	}{
		{name: "DescribeRepositories", method: "GET", path: "/ecr/repositories", body: `{}`,
			setupMock: func(mp *mockports.ECRPort) { mp.EXPECT().DescribeRepositories(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "CreateRepository", method: "POST", path: "/ecr/repositories", body: `{}`,
			setupMock: func(mp *mockports.ECRPort) { mp.EXPECT().CreateRepository(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "DescribeRepository", method: "GET", path: "/ecr/repositories/my-repo", body: `{}`,
			setupMock: func(mp *mockports.ECRPort) { mp.EXPECT().DescribeRepositories(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "DeleteRepository", method: "DELETE", path: "/ecr/repositories/my-repo", body: `{}`,
			setupMock: func(mp *mockports.ECRPort) { mp.EXPECT().DeleteRepository(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "GetAuthorizationToken", method: "GET", path: "/ecr/authorization-token", body: `{}`,
			setupMock: func(mp *mockports.ECRPort) { mp.EXPECT().GetAuthorizationToken(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "ListImages", method: "GET", path: "/ecr/images/my-repo", body: `{}`,
			setupMock: func(mp *mockports.ECRPort) { mp.EXPECT().ListImages(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "DescribeImages", method: "GET", path: "/ecr/images/details/my-repo", body: `{}`,
			setupMock: func(mp *mockports.ECRPort) { mp.EXPECT().DescribeImages(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "BatchGetImage", method: "POST", path: "/ecr/images/batch-get/my-repo", body: `{}`,
			setupMock: func(mp *mockports.ECRPort) { mp.EXPECT().BatchGetImage(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "BatchDeleteImage", method: "POST", path: "/ecr/images/batch-delete/my-repo", body: `{}`,
			setupMock: func(mp *mockports.ECRPort) { mp.EXPECT().BatchDeleteImage(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "ListTagsForResource", method: "GET", path: "/ecr/tags/my-repo", body: `{}`,
			setupMock: func(mp *mockports.ECRPort) { mp.EXPECT().ListTagsForResource(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "UpdateTags", method: "PUT", path: "/ecr/tags/my-repo", body: `{"Tags":{"key":"value"}}`,
			setupMock: func(mp *mockports.ECRPort) { mp.EXPECT().TagResource(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
	}
	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			_, mp, handler := setupECRTest(t)
			tt.setupMock(mp)
			w := performECRRequest(handler, tt.method, tt.path, []byte(tt.body))
			assert.Equal(t, http.StatusNotFound, w.Code)
		})
	}
}
