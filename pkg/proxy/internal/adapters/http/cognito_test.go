package httphandlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/aws/smithy-go"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// setupCognitoTest creates a mocked service with a mock Cognito port wired in.
// NOTE: Cognito() is set with Maybe() so tests where the handler returns early
// (e.g. parse-error) don't fail the mock.
func setupCognitoTest(t *testing.T) (*mockports.ProxyService, *mockports.CognitoPort, *ProxyHandler) {
	svc := createMockSvc(t, nil)
	mp := mockports.NewCognitoPort(t)
	svc.EXPECT().Cognito().Return(mp).Maybe()
	versionSvc := createTestVersionService(t)
	handler := createHandler(svc, versionSvc)
	return svc, mp, handler
}

// performCognitoRequest executes an HTTP request against the /cognito/ service router.
func performCognitoRequest(handler *ProxyHandler, method, path string, body []byte) *httptest.ResponseRecorder {
	r := setupTestRouter(handler)
	return performRequest(r, method, path, body)
}

// mockNotFoundError implements smithy.APIError for testing ResourceNotFoundException
// mapping to HTTP 404 via sendErrorWithStatus.
type mockNotFoundError struct{}

func (e *mockNotFoundError) ErrorCode() string              { return "ResourceNotFoundException" }
func (e *mockNotFoundError) ErrorMessage() string           { return "Resource not found" }
func (e *mockNotFoundError) ErrorFault() smithy.ErrorFault  { return 0 }
func (e *mockNotFoundError) Error() string                  { return "ResourceNotFoundException: Resource not found" }

// ---------------------------------------------------------------------------
// ListUserPools
// ---------------------------------------------------------------------------

func TestCognito_ListUserPools_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListUserPools(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.ListUserPoolsOutput{}, nil)

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_ListUserPools_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListUserPools(mock.Anything, mock.Anything).Return(nil, errors.New("list user pools error"))

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list user pools")
}

func TestCognito_ListUserPools_Unsupported(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListUserPools(mock.Anything, mock.Anything).Return(nil, &mockUnsupportedError{})

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
	var resp cognitoidentityprovider.ListUserPoolsOutput
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Empty(t, resp.UserPools)
}

func TestCognito_ListUserPools_DefaultMaxResults(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListUserPools(mock.Anything, mock.MatchedBy(func(in *cognitoidentityprovider.ListUserPoolsInput) bool {
		return in.MaxResults != nil && *in.MaxResults == 60
	})).Return(&cognitoidentityprovider.ListUserPoolsOutput{}, nil)

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_ListUserPools_ProvidedMaxResults(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListUserPools(mock.Anything, mock.MatchedBy(func(in *cognitoidentityprovider.ListUserPoolsInput) bool {
		return in.MaxResults != nil && *in.MaxResults == 10
	})).Return(&cognitoidentityprovider.ListUserPoolsOutput{}, nil)

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools", []byte(`{"MaxResults":10}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

// ---------------------------------------------------------------------------
// CreateUserPool
// ---------------------------------------------------------------------------

func TestCognito_CreateUserPool_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().CreateUserPool(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.CreateUserPoolOutput{}, nil)

	w := performCognitoRequest(handler, "POST", "/cognito/user-pools", []byte(`{"PoolName":"test-pool"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_CreateUserPool_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().CreateUserPool(mock.Anything, mock.Anything).Return(nil, errors.New("create user pool error"))

	w := performCognitoRequest(handler, "POST", "/cognito/user-pools", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create user pool")
}

// ---------------------------------------------------------------------------
// DescribeUserPool
// ---------------------------------------------------------------------------

func TestCognito_DescribeUserPool_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().DescribeUserPool(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.DescribeUserPoolOutput{}, nil)

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_DescribeUserPool_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().DescribeUserPool(mock.Anything, mock.Anything).Return(nil, errors.New("describe user pool error"))

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to describe user pool")
}

// ---------------------------------------------------------------------------
// DeleteUserPool
// ---------------------------------------------------------------------------

func TestCognito_DeleteUserPool_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().DeleteUserPool(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.DeleteUserPoolOutput{}, nil)

	w := performCognitoRequest(handler, "DELETE", "/cognito/user-pools/us-east-1_abc123", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_DeleteUserPool_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().DeleteUserPool(mock.Anything, mock.Anything).Return(nil, errors.New("delete user pool error"))

	w := performCognitoRequest(handler, "DELETE", "/cognito/user-pools/us-east-1_abc123", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete user pool")
}

// ---------------------------------------------------------------------------
// UpdateUserPool
// ---------------------------------------------------------------------------

func TestCognito_UpdateUserPool_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().UpdateUserPool(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.UpdateUserPoolOutput{}, nil)

	w := performCognitoRequest(handler, "PUT", "/cognito/user-pools/us-east-1_abc123", []byte(`{"PoolName":"renamed-pool"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_UpdateUserPool_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().UpdateUserPool(mock.Anything, mock.Anything).Return(nil, errors.New("update user pool error"))

	w := performCognitoRequest(handler, "PUT", "/cognito/user-pools/us-east-1_abc123", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to update user pool")
}

// ---------------------------------------------------------------------------
// ListUsers
// ---------------------------------------------------------------------------

func TestCognito_ListUsers_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListUsers(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.ListUsersOutput{}, nil)

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/users", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_ListUsers_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListUsers(mock.Anything, mock.Anything).Return(nil, errors.New("list users error"))

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/users", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list users")
}

func TestCognito_ListUsers_Unsupported(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListUsers(mock.Anything, mock.Anything).Return(nil, &mockUnsupportedError{})

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/users", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
	var resp cognitoidentityprovider.ListUsersOutput
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Empty(t, resp.Users)
}

// ---------------------------------------------------------------------------
// AdminCreateUser
// ---------------------------------------------------------------------------

func TestCognito_AdminCreateUser_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().AdminCreateUser(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.AdminCreateUserOutput{}, nil)

	w := performCognitoRequest(handler, "POST", "/cognito/user-pools/us-east-1_abc123/users", []byte(`{"Username":"alice"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_AdminCreateUser_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().AdminCreateUser(mock.Anything, mock.Anything).Return(nil, errors.New("create user error"))

	w := performCognitoRequest(handler, "POST", "/cognito/user-pools/us-east-1_abc123/users", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create user")
}

// ---------------------------------------------------------------------------
// AdminGetUser
// ---------------------------------------------------------------------------

func TestCognito_AdminGetUser_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().AdminGetUser(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.AdminGetUserOutput{}, nil)

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/users/alice", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_AdminGetUser_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().AdminGetUser(mock.Anything, mock.Anything).Return(nil, errors.New("get user error"))

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/users/alice", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to get user")
}

// ---------------------------------------------------------------------------
// AdminUpdateUserAttributes
// ---------------------------------------------------------------------------

func TestCognito_AdminUpdateUserAttributes_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().AdminUpdateUserAttributes(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.AdminUpdateUserAttributesOutput{}, nil)

	w := performCognitoRequest(handler, "PUT", "/cognito/user-pools/us-east-1_abc123/users/alice", []byte(`{"UserAttributes":[{"Name":"email","Value":"new@test.com"}]}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_AdminUpdateUserAttributes_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().AdminUpdateUserAttributes(mock.Anything, mock.Anything).Return(nil, errors.New("update user attributes error"))

	w := performCognitoRequest(handler, "PUT", "/cognito/user-pools/us-east-1_abc123/users/alice", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to update user attributes")
}

// ---------------------------------------------------------------------------
// AdminDeleteUser
// ---------------------------------------------------------------------------

func TestCognito_AdminDeleteUser_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().AdminDeleteUser(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.AdminDeleteUserOutput{}, nil)

	w := performCognitoRequest(handler, "DELETE", "/cognito/user-pools/us-east-1_abc123/users/alice", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_AdminDeleteUser_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().AdminDeleteUser(mock.Anything, mock.Anything).Return(nil, errors.New("delete user error"))

	w := performCognitoRequest(handler, "DELETE", "/cognito/user-pools/us-east-1_abc123/users/alice", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete user")
}

// ---------------------------------------------------------------------------
// ListGroups
// ---------------------------------------------------------------------------

func TestCognito_ListGroups_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListGroups(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.ListGroupsOutput{}, nil)

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/groups", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_ListGroups_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListGroups(mock.Anything, mock.Anything).Return(nil, errors.New("list groups error"))

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/groups", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list groups")
}

func TestCognito_ListGroups_Unsupported(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListGroups(mock.Anything, mock.Anything).Return(nil, &mockUnsupportedError{})

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/groups", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
	var resp cognitoidentityprovider.ListGroupsOutput
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Empty(t, resp.Groups)
}

// ---------------------------------------------------------------------------
// CreateGroup
// ---------------------------------------------------------------------------

func TestCognito_CreateGroup_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().CreateGroup(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.CreateGroupOutput{}, nil)

	w := performCognitoRequest(handler, "POST", "/cognito/user-pools/us-east-1_abc123/groups", []byte(`{"GroupName":"admins"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_CreateGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().CreateGroup(mock.Anything, mock.Anything).Return(nil, errors.New("create group error"))

	w := performCognitoRequest(handler, "POST", "/cognito/user-pools/us-east-1_abc123/groups", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create group")
}

// ---------------------------------------------------------------------------
// GetGroup
// ---------------------------------------------------------------------------

func TestCognito_GetGroup_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().GetGroup(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.GetGroupOutput{}, nil)

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/groups/admins", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_GetGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().GetGroup(mock.Anything, mock.Anything).Return(nil, errors.New("get group error"))

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/groups/admins", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to get group")
}

// ---------------------------------------------------------------------------
// UpdateGroup
// ---------------------------------------------------------------------------

func TestCognito_UpdateGroup_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().UpdateGroup(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.UpdateGroupOutput{}, nil)

	w := performCognitoRequest(handler, "PUT", "/cognito/user-pools/us-east-1_abc123/groups/admins", []byte(`{"Description":"updated description"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_UpdateGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().UpdateGroup(mock.Anything, mock.Anything).Return(nil, errors.New("update group error"))

	w := performCognitoRequest(handler, "PUT", "/cognito/user-pools/us-east-1_abc123/groups/admins", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to update group")
}

// ---------------------------------------------------------------------------
// DeleteGroup
// ---------------------------------------------------------------------------

func TestCognito_DeleteGroup_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().DeleteGroup(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.DeleteGroupOutput{}, nil)

	w := performCognitoRequest(handler, "DELETE", "/cognito/user-pools/us-east-1_abc123/groups/admins", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_DeleteGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().DeleteGroup(mock.Anything, mock.Anything).Return(nil, errors.New("delete group error"))

	w := performCognitoRequest(handler, "DELETE", "/cognito/user-pools/us-east-1_abc123/groups/admins", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete group")
}

// ---------------------------------------------------------------------------
// ListUserPoolClients
// ---------------------------------------------------------------------------

func TestCognito_ListUserPoolClients_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListUserPoolClients(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.ListUserPoolClientsOutput{}, nil)

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/clients", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_ListUserPoolClients_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListUserPoolClients(mock.Anything, mock.Anything).Return(nil, errors.New("list user pool clients error"))

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/clients", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list user pool clients")
}

func TestCognito_ListUserPoolClients_Unsupported(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListUserPoolClients(mock.Anything, mock.Anything).Return(nil, &mockUnsupportedError{})

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/clients", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
	var resp cognitoidentityprovider.ListUserPoolClientsOutput
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Empty(t, resp.UserPoolClients)
}

func TestCognito_ListUserPoolClients_DefaultMaxResults(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListUserPoolClients(mock.Anything, mock.MatchedBy(func(in *cognitoidentityprovider.ListUserPoolClientsInput) bool {
		return in.MaxResults != nil && *in.MaxResults == 60
	})).Return(&cognitoidentityprovider.ListUserPoolClientsOutput{}, nil)

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/clients", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_ListUserPoolClients_ProvidedMaxResults(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListUserPoolClients(mock.Anything, mock.MatchedBy(func(in *cognitoidentityprovider.ListUserPoolClientsInput) bool {
		return in.MaxResults != nil && *in.MaxResults == 10
	})).Return(&cognitoidentityprovider.ListUserPoolClientsOutput{}, nil)

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/clients", []byte(`{"MaxResults":10}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

// ---------------------------------------------------------------------------
// CreateUserPoolClient
// ---------------------------------------------------------------------------

func TestCognito_CreateUserPoolClient_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().CreateUserPoolClient(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.CreateUserPoolClientOutput{}, nil)

	w := performCognitoRequest(handler, "POST", "/cognito/user-pools/us-east-1_abc123/clients", []byte(`{"ClientName":"web-app"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_CreateUserPoolClient_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().CreateUserPoolClient(mock.Anything, mock.Anything).Return(nil, errors.New("create user pool client error"))

	w := performCognitoRequest(handler, "POST", "/cognito/user-pools/us-east-1_abc123/clients", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create user pool client")
}

// ---------------------------------------------------------------------------
// DescribeUserPoolClient
// ---------------------------------------------------------------------------

func TestCognito_DescribeUserPoolClient_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().DescribeUserPoolClient(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.DescribeUserPoolClientOutput{}, nil)

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/clients/client123", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_DescribeUserPoolClient_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().DescribeUserPoolClient(mock.Anything, mock.Anything).Return(nil, errors.New("describe user pool client error"))

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/clients/client123", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to describe user pool client")
}

// ---------------------------------------------------------------------------
// UpdateUserPoolClient
// ---------------------------------------------------------------------------

func TestCognito_UpdateUserPoolClient_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().UpdateUserPoolClient(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.UpdateUserPoolClientOutput{}, nil)

	w := performCognitoRequest(handler, "PUT", "/cognito/user-pools/us-east-1_abc123/clients/client123", []byte(`{"ClientName":"web-updated"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_UpdateUserPoolClient_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().UpdateUserPoolClient(mock.Anything, mock.Anything).Return(nil, errors.New("update user pool client error"))

	w := performCognitoRequest(handler, "PUT", "/cognito/user-pools/us-east-1_abc123/clients/client123", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to update user pool client")
}

// ---------------------------------------------------------------------------
// DeleteUserPoolClient
// ---------------------------------------------------------------------------

func TestCognito_DeleteUserPoolClient_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().DeleteUserPoolClient(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.DeleteUserPoolClientOutput{}, nil)

	w := performCognitoRequest(handler, "DELETE", "/cognito/user-pools/us-east-1_abc123/clients/client123", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_DeleteUserPoolClient_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().DeleteUserPoolClient(mock.Anything, mock.Anything).Return(nil, errors.New("delete user pool client error"))

	w := performCognitoRequest(handler, "DELETE", "/cognito/user-pools/us-east-1_abc123/clients/client123", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete user pool client")
}

// ---------------------------------------------------------------------------
// AdminAddUserToGroup
// ---------------------------------------------------------------------------

func TestCognito_AdminAddUserToGroup_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().AdminAddUserToGroup(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.AdminAddUserToGroupOutput{}, nil)

	w := performCognitoRequest(handler, "PUT", "/cognito/user-pools/us-east-1_abc123/users/alice/groups", []byte(`{"GroupName":"admins"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_AdminAddUserToGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().AdminAddUserToGroup(mock.Anything, mock.Anything).Return(nil, errors.New("add user to group error"))

	w := performCognitoRequest(handler, "PUT", "/cognito/user-pools/us-east-1_abc123/users/alice/groups", []byte(`{"GroupName":"admins"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to add user to group")
}

// ---------------------------------------------------------------------------
// AdminRemoveUserFromGroup
// ---------------------------------------------------------------------------

func TestCognito_AdminRemoveUserFromGroup_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().AdminRemoveUserFromGroup(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.AdminRemoveUserFromGroupOutput{}, nil)

	w := performCognitoRequest(handler, "DELETE", "/cognito/user-pools/us-east-1_abc123/users/alice/groups/admins", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_AdminRemoveUserFromGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().AdminRemoveUserFromGroup(mock.Anything, mock.Anything).Return(nil, errors.New("remove user from group error"))

	w := performCognitoRequest(handler, "DELETE", "/cognito/user-pools/us-east-1_abc123/users/alice/groups/admins", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to remove user from group")
}

// ---------------------------------------------------------------------------
// AdminListGroupsForUser
// ---------------------------------------------------------------------------

func TestCognito_AdminListGroupsForUser_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().AdminListGroupsForUser(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.AdminListGroupsForUserOutput{}, nil)

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/users/alice/groups", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_AdminListGroupsForUser_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().AdminListGroupsForUser(mock.Anything, mock.Anything).Return(nil, errors.New("list groups for user error"))

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/users/alice/groups", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list groups for user")
}

// ---------------------------------------------------------------------------
// ListUsersInGroup
// ---------------------------------------------------------------------------

func TestCognito_ListUsersInGroup_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListUsersInGroup(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.ListUsersInGroupOutput{}, nil)

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/groups/admins/users", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_ListUsersInGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListUsersInGroup(mock.Anything, mock.Anything).Return(nil, errors.New("list users in group error"))

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/groups/admins/users", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list users in group")
}

// ---------------------------------------------------------------------------
// AdminSetUserPassword
// ---------------------------------------------------------------------------

func TestCognito_AdminSetUserPassword_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().AdminSetUserPassword(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.AdminSetUserPasswordOutput{}, nil)

	w := performCognitoRequest(handler, "PUT", "/cognito/user-pools/us-east-1_abc123/users/alice/password", []byte(`{"Password":"NewPass123!","Permanent":true}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_AdminSetUserPassword_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().AdminSetUserPassword(mock.Anything, mock.Anything).Return(nil, errors.New("set user password error"))

	w := performCognitoRequest(handler, "PUT", "/cognito/user-pools/us-east-1_abc123/users/alice/password", []byte(`{"Password":"NewPass123!"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to set user password")
}

// ---------------------------------------------------------------------------
// ListResourceServers
// ---------------------------------------------------------------------------

func TestCognito_ListResourceServers_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListResourceServers(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.ListResourceServersOutput{}, nil)

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/resource-servers", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_ListResourceServers_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListResourceServers(mock.Anything, mock.Anything).Return(nil, errors.New("list resource servers error"))

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/resource-servers", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list resource servers")
}

// ---------------------------------------------------------------------------
// CreateResourceServer
// ---------------------------------------------------------------------------

func TestCognito_CreateResourceServer_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().CreateResourceServer(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.CreateResourceServerOutput{}, nil)

	w := performCognitoRequest(handler, "POST", "/cognito/user-pools/us-east-1_abc123/resource-servers", []byte(`{"Identifier":"test-api","Name":"Test API"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_CreateResourceServer_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().CreateResourceServer(mock.Anything, mock.Anything).Return(nil, errors.New("create resource server error"))

	w := performCognitoRequest(handler, "POST", "/cognito/user-pools/us-east-1_abc123/resource-servers", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create resource server")
}

// ---------------------------------------------------------------------------
// DescribeResourceServer
// ---------------------------------------------------------------------------

func TestCognito_DescribeResourceServer_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().DescribeResourceServer(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.DescribeResourceServerOutput{}, nil)

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/resource-servers/test-api", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_DescribeResourceServer_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().DescribeResourceServer(mock.Anything, mock.Anything).Return(nil, errors.New("describe resource server error"))

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/resource-servers/test-api", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to describe resource server")
}

// ---------------------------------------------------------------------------
// DeleteResourceServer
// ---------------------------------------------------------------------------

func TestCognito_DeleteResourceServer_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().DeleteResourceServer(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.DeleteResourceServerOutput{}, nil)

	w := performCognitoRequest(handler, "DELETE", "/cognito/user-pools/us-east-1_abc123/resource-servers/test-api", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_DeleteResourceServer_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().DeleteResourceServer(mock.Anything, mock.Anything).Return(nil, errors.New("delete resource server error"))

	w := performCognitoRequest(handler, "DELETE", "/cognito/user-pools/us-east-1_abc123/resource-servers/test-api", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete resource server")
}

// ---------------------------------------------------------------------------
// ListTagsForResource
// ---------------------------------------------------------------------------

func TestCognito_ListTagsForResource_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListTagsForResource(mock.Anything, mock.MatchedBy(func(input *cognitoidentityprovider.ListTagsForResourceInput) bool {
		return input.ResourceArn != nil && *input.ResourceArn == "arn:aws:cognito-idp:us-east-1:000000000000:userpool/us-east-1_abc123"
	})).Return(&cognitoidentityprovider.ListTagsForResourceOutput{}, nil)

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/tags", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_ListTagsForResource_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().ListTagsForResource(mock.Anything, mock.Anything).Return(nil, errors.New("list tags error"))

	w := performCognitoRequest(handler, "GET", "/cognito/user-pools/us-east-1_abc123/tags", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list tags")
}

// ---------------------------------------------------------------------------
// UpdateTags
// ---------------------------------------------------------------------------

func TestCognito_UpdateTags_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().TagResource(mock.Anything, mock.MatchedBy(func(input *cognitoidentityprovider.TagResourceInput) bool {
		return input.ResourceArn != nil && *input.ResourceArn == "arn:aws:cognito-idp:us-east-1:000000000000:userpool/us-east-1_abc123"
	})).Return(&cognitoidentityprovider.TagResourceOutput{}, nil)
	mp.EXPECT().UntagResource(mock.Anything, mock.MatchedBy(func(input *cognitoidentityprovider.UntagResourceInput) bool {
		return input.ResourceArn != nil && *input.ResourceArn == "arn:aws:cognito-idp:us-east-1:000000000000:userpool/us-east-1_abc123"
	})).Return(&cognitoidentityprovider.UntagResourceOutput{}, nil)

	w := performCognitoRequest(handler, "PUT", "/cognito/user-pools/us-east-1_abc123/tags", []byte(`{"Tags":{"Env":"test"},"RemovedKeys":["OldKey"]}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_UpdateTags_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().TagResource(mock.Anything, mock.MatchedBy(func(input *cognitoidentityprovider.TagResourceInput) bool {
		return input.ResourceArn != nil && *input.ResourceArn == "arn:aws:cognito-idp:us-east-1:000000000000:userpool/us-east-1_abc123"
	})).Return(nil, errors.New("tag resource error"))

	w := performCognitoRequest(handler, "PUT", "/cognito/user-pools/us-east-1_abc123/tags", []byte(`{"Tags":{"Env":"test"},"RemovedKeys":[]}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to update tags")
}

// ---------------------------------------------------------------------------
// cognitoUserPoolARN helper
// ---------------------------------------------------------------------------

func TestCognito_UserPoolARN(t *testing.T) {
	t.Parallel()
	_, _, handler := setupCognitoTest(t)

	tests := []struct {
		name       string
		userPoolID string
		want       string
	}{
		{name: "standard pool id", userPoolID: "us-east-1_abc123", want: "arn:aws:cognito-idp:us-east-1:000000000000:userpool/us-east-1_abc123"},
		{name: "custom pool id", userPoolID: "my-pool", want: "arn:aws:cognito-idp:us-east-1:000000000000:userpool/my-pool"},
		{name: "empty pool id", userPoolID: "", want: "arn:aws:cognito-idp:us-east-1:000000000000:userpool/"},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			assert.Equal(t, tt.want, handler.cognitoUserPoolARN(tt.userPoolID))
		})
	}
}

// ---------------------------------------------------------------------------
// InitiateAuth
// ---------------------------------------------------------------------------

func TestCognito_InitiateAuth_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().InitiateAuth(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.InitiateAuthOutput{}, nil)

	w := performCognitoRequest(handler, "POST", "/cognito/initiate-auth", []byte(`{"ClientId":"client123","AuthFlow":"USER_PASSWORD_AUTH","AuthParameters":{"USERNAME":"alice","PASSWORD":"pass"}}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_InitiateAuth_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().InitiateAuth(mock.Anything, mock.Anything).Return(nil, errors.New("initiate auth error"))

	w := performCognitoRequest(handler, "POST", "/cognito/initiate-auth", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to initiate auth")
}

// ---------------------------------------------------------------------------
// AdminInitiateAuth
// ---------------------------------------------------------------------------

func TestCognito_AdminInitiateAuth_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().AdminInitiateAuth(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.AdminInitiateAuthOutput{}, nil)

	w := performCognitoRequest(handler, "POST", "/cognito/admin-initiate-auth", []byte(`{"UserPoolId":"us-east-1_abc123","ClientId":"client123","AuthFlow":"USER_PASSWORD_AUTH","AuthParameters":{"USERNAME":"alice","PASSWORD":"pass"}}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_AdminInitiateAuth_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().AdminInitiateAuth(mock.Anything, mock.Anything).Return(nil, errors.New("admin initiate auth error"))

	w := performCognitoRequest(handler, "POST", "/cognito/admin-initiate-auth", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to admin initiate auth")
}

// ---------------------------------------------------------------------------
// RespondToAuthChallenge
// ---------------------------------------------------------------------------

func TestCognito_RespondToAuthChallenge_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().RespondToAuthChallenge(mock.Anything, mock.Anything).Return(&cognitoidentityprovider.RespondToAuthChallengeOutput{}, nil)

	w := performCognitoRequest(handler, "POST", "/cognito/respond-to-auth-challenge", []byte(`{"ClientId":"client123","ChallengeName":"PASSWORD","ChallengeResponses":{"USERNAME":"alice","PASSWORD":"pass"},"Session":"sess"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCognito_RespondToAuthChallenge_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupCognitoTest(t)
	mp.EXPECT().RespondToAuthChallenge(mock.Anything, mock.Anything).Return(nil, errors.New("respond to auth challenge error"))

	w := performCognitoRequest(handler, "POST", "/cognito/respond-to-auth-challenge", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to respond to auth challenge")
}

// ---------------------------------------------------------------------------
// Parse error – invalid JSON body returns 400 for every action that parses
// the request body. Handlers that only read URL params (describeUserPool,
// deleteUserPool, adminGetUser, adminDeleteUser, getGroup, deleteGroup,
// describeUserPoolClient, deleteUserPoolClient, adminRemoveUserFromGroup,
// adminListGroupsForUser, listUsersInGroup, listResourceServers,
// describeResourceServer, deleteResourceServer, cognitoListTagsForResource)
// are excluded because they don't parse the request body.
// ---------------------------------------------------------------------------

func TestCognito_ParseError(t *testing.T) {
	t.Parallel()

	routerActions := []struct {
		name   string
		method string
		path   string
	}{
		{name: "ListUserPools", method: "GET", path: "/cognito/user-pools"},
		{name: "CreateUserPool", method: "POST", path: "/cognito/user-pools"},
		{name: "UpdateUserPool", method: "PUT", path: "/cognito/user-pools/us-east-1_abc123"},
		{name: "ListUsers", method: "GET", path: "/cognito/user-pools/us-east-1_abc123/users"},
		{name: "AdminCreateUser", method: "POST", path: "/cognito/user-pools/us-east-1_abc123/users"},
		{name: "AdminUpdateUserAttributes", method: "PUT", path: "/cognito/user-pools/us-east-1_abc123/users/alice"},
		{name: "ListGroups", method: "GET", path: "/cognito/user-pools/us-east-1_abc123/groups"},
		{name: "CreateGroup", method: "POST", path: "/cognito/user-pools/us-east-1_abc123/groups"},
		{name: "UpdateGroup", method: "PUT", path: "/cognito/user-pools/us-east-1_abc123/groups/admins"},
		{name: "ListUserPoolClients", method: "GET", path: "/cognito/user-pools/us-east-1_abc123/clients"},
		{name: "CreateUserPoolClient", method: "POST", path: "/cognito/user-pools/us-east-1_abc123/clients"},
		{name: "UpdateUserPoolClient", method: "PUT", path: "/cognito/user-pools/us-east-1_abc123/clients/client123"},
		{name: "AdminAddUserToGroup", method: "PUT", path: "/cognito/user-pools/us-east-1_abc123/users/alice/groups"},
		{name: "AdminSetUserPassword", method: "PUT", path: "/cognito/user-pools/us-east-1_abc123/users/alice/password"},
		{name: "CreateResourceServer", method: "POST", path: "/cognito/user-pools/us-east-1_abc123/resource-servers"},
		{name: "UpdateTags", method: "PUT", path: "/cognito/user-pools/us-east-1_abc123/tags"},
		{name: "InitiateAuth", method: "POST", path: "/cognito/initiate-auth"},
		{name: "AdminInitiateAuth", method: "POST", path: "/cognito/admin-initiate-auth"},
		{name: "RespondToAuthChallenge", method: "POST", path: "/cognito/respond-to-auth-challenge"},
	}

	for _, ra := range routerActions {
		ra := ra
		t.Run(ra.name, func(t *testing.T) {
			t.Parallel()
			_, _, handler := setupCognitoTest(t)
			w := performCognitoRequest(handler, ra.method, ra.path, []byte(`{bad json`))
			assert.Equal(t, http.StatusBadRequest, w.Code, "method=%s path=%s body=%s", ra.method, ra.path, w.Body.String())
			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)
			assert.Contains(t, resp["error"], "Invalid request body")
		})
	}
}

// ---------------------------------------------------------------------------
// ResourceNotFoundException → 404
// ---------------------------------------------------------------------------

func TestCognito_NotFound(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		method    string
		path      string
		body      string
		setupMock func(mp *mockports.CognitoPort)
	}{
		{name: "ListUserPools", method: "GET", path: "/cognito/user-pools", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().ListUserPools(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "CreateUserPool", method: "POST", path: "/cognito/user-pools", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().CreateUserPool(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "DescribeUserPool", method: "GET", path: "/cognito/user-pools/us-east-1_abc123", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().DescribeUserPool(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "DeleteUserPool", method: "DELETE", path: "/cognito/user-pools/us-east-1_abc123", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().DeleteUserPool(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "UpdateUserPool", method: "PUT", path: "/cognito/user-pools/us-east-1_abc123", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().UpdateUserPool(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "ListUsers", method: "GET", path: "/cognito/user-pools/us-east-1_abc123/users", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().ListUsers(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "AdminCreateUser", method: "POST", path: "/cognito/user-pools/us-east-1_abc123/users", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().AdminCreateUser(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "AdminGetUser", method: "GET", path: "/cognito/user-pools/us-east-1_abc123/users/alice", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().AdminGetUser(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "AdminUpdateUserAttributes", method: "PUT", path: "/cognito/user-pools/us-east-1_abc123/users/alice", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().AdminUpdateUserAttributes(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "AdminDeleteUser", method: "DELETE", path: "/cognito/user-pools/us-east-1_abc123/users/alice", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().AdminDeleteUser(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "ListGroups", method: "GET", path: "/cognito/user-pools/us-east-1_abc123/groups", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().ListGroups(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "CreateGroup", method: "POST", path: "/cognito/user-pools/us-east-1_abc123/groups", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().CreateGroup(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "GetGroup", method: "GET", path: "/cognito/user-pools/us-east-1_abc123/groups/admins", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().GetGroup(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "UpdateGroup", method: "PUT", path: "/cognito/user-pools/us-east-1_abc123/groups/admins", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().UpdateGroup(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "DeleteGroup", method: "DELETE", path: "/cognito/user-pools/us-east-1_abc123/groups/admins", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().DeleteGroup(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "ListUserPoolClients", method: "GET", path: "/cognito/user-pools/us-east-1_abc123/clients", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().ListUserPoolClients(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "CreateUserPoolClient", method: "POST", path: "/cognito/user-pools/us-east-1_abc123/clients", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().CreateUserPoolClient(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "DescribeUserPoolClient", method: "GET", path: "/cognito/user-pools/us-east-1_abc123/clients/client123", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().DescribeUserPoolClient(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "UpdateUserPoolClient", method: "PUT", path: "/cognito/user-pools/us-east-1_abc123/clients/client123", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().UpdateUserPoolClient(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "DeleteUserPoolClient", method: "DELETE", path: "/cognito/user-pools/us-east-1_abc123/clients/client123", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().DeleteUserPoolClient(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "AdminAddUserToGroup", method: "PUT", path: "/cognito/user-pools/us-east-1_abc123/users/alice/groups", body: `{"GroupName":"admins"}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().AdminAddUserToGroup(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "AdminRemoveUserFromGroup", method: "DELETE", path: "/cognito/user-pools/us-east-1_abc123/users/alice/groups/admins", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().AdminRemoveUserFromGroup(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "AdminListGroupsForUser", method: "GET", path: "/cognito/user-pools/us-east-1_abc123/users/alice/groups", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().AdminListGroupsForUser(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "ListUsersInGroup", method: "GET", path: "/cognito/user-pools/us-east-1_abc123/groups/admins/users", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().ListUsersInGroup(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "AdminSetUserPassword", method: "PUT", path: "/cognito/user-pools/us-east-1_abc123/users/alice/password", body: `{"Password":"NewPass123!"}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().AdminSetUserPassword(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "ListResourceServers", method: "GET", path: "/cognito/user-pools/us-east-1_abc123/resource-servers", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().ListResourceServers(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "CreateResourceServer", method: "POST", path: "/cognito/user-pools/us-east-1_abc123/resource-servers", body: `{"Identifier":"test-api","Name":"Test API"}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().CreateResourceServer(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "DescribeResourceServer", method: "GET", path: "/cognito/user-pools/us-east-1_abc123/resource-servers/test-api", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().DescribeResourceServer(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "DeleteResourceServer", method: "DELETE", path: "/cognito/user-pools/us-east-1_abc123/resource-servers/test-api", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().DeleteResourceServer(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "ListTagsForResource", method: "GET", path: "/cognito/user-pools/us-east-1_abc123/tags", body: `{}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().ListTagsForResource(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "UpdateTags", method: "PUT", path: "/cognito/user-pools/us-east-1_abc123/tags", body: `{"Tags":{"Env":"test"},"RemovedKeys":[]}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().TagResource(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "InitiateAuth", method: "POST", path: "/cognito/initiate-auth", body: `{"ClientId":"client123","AuthFlow":"USER_PASSWORD_AUTH"}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().InitiateAuth(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "AdminInitiateAuth", method: "POST", path: "/cognito/admin-initiate-auth", body: `{"UserPoolId":"us-east-1_abc123","ClientId":"client123","AuthFlow":"USER_PASSWORD_AUTH"}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().AdminInitiateAuth(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
		{name: "RespondToAuthChallenge", method: "POST", path: "/cognito/respond-to-auth-challenge", body: `{"ClientId":"client123","ChallengeName":"PASSWORD"}`,
			setupMock: func(mp *mockports.CognitoPort) { mp.EXPECT().RespondToAuthChallenge(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{}) }},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			_, mp, handler := setupCognitoTest(t)
			tc.setupMock(mp)
			w := performCognitoRequest(handler, tc.method, tc.path, []byte(tc.body))
			assert.Equal(t, http.StatusNotFound, w.Code, "method=%s path=%s response=%s", tc.method, tc.path, w.Body.String())
			var resp map[string]interface{}
			assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
			assert.Contains(t, resp["error"], "Failed to")
		})
	}
}
