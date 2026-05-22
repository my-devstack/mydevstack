package httphandlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/iam/types"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// setupIAMTest creates a mocked service with a mock IAM port wired in.
// NOTE: IAM() is set with Maybe() so tests where the handler returns early
// (e.g. parse-error, unknown-action) don't fail the mock.
func setupIAMTest(t *testing.T) (*mockports.ProxyService, *mockports.IAMPort, *ProxyHandler) {
	svc := createMockSvc(t, nil)
	mp := mockports.NewIAMPort(t)
	svc.EXPECT().IAM().Return(mp).Maybe()
	versionSvc := createTestVersionService(t)
	handler := createHandler(svc, versionSvc)
	return svc, mp, handler
}

// performIAMRequest executes an HTTP request against the /iam/ service router.
func performIAMRequest(handler *ProxyHandler, method, path string, body []byte) *httptest.ResponseRecorder {
	r := setupTestRouter(handler)
	return performRequest(r, method, path, body)
}

// ---------------------------------------------------------------------------
// CreateUser
// ---------------------------------------------------------------------------

func TestIAM_CreateUser_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().CreateUser(mock.Anything, mock.Anything).Return(&iam.CreateUserOutput{}, nil)

	w := performIAMRequest(handler, "POST", "/iam/users", []byte(`{"UserName":"testuser"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_CreateUser_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().CreateUser(mock.Anything, mock.Anything).Return(nil, errors.New("create user error"))

	w := performIAMRequest(handler, "POST", "/iam/users", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create user")
}

// ---------------------------------------------------------------------------
// GetUser
// ---------------------------------------------------------------------------

func TestIAM_GetUser_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().GetUser(mock.Anything, mock.Anything).Return(&iam.GetUserOutput{}, nil)

	w := performIAMRequest(handler, "GET", "/iam/users/testuser", []byte(`{"UserName":"testuser"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_GetUser_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().GetUser(mock.Anything, mock.Anything).Return(nil, errors.New("get user error"))

	w := performIAMRequest(handler, "GET", "/iam/users/testuser", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to get user")
}

// ---------------------------------------------------------------------------
// ListUsers (also receives ListUsersForGroup due to dispatch ordering)
// ---------------------------------------------------------------------------

func TestIAM_ListUsers_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListUsers(mock.Anything, mock.Anything).Return(&iam.ListUsersOutput{}, nil)

	w := performIAMRequest(handler, "GET", "/iam/users", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_ListUsers_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListUsers(mock.Anything, mock.Anything).Return(nil, errors.New("list users error"))

	w := performIAMRequest(handler, "GET", "/iam/users", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list users")
}

// ---------------------------------------------------------------------------
// DeleteUser
// ---------------------------------------------------------------------------

func TestIAM_DeleteUser_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().DeleteUser(mock.Anything, mock.Anything).Return(&iam.DeleteUserOutput{}, nil)

	w := performIAMRequest(handler, "DELETE", "/iam/users/testuser", []byte(`{"UserName":"testuser"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_DeleteUser_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().DeleteUser(mock.Anything, mock.Anything).Return(nil, errors.New("delete user error"))

	w := performIAMRequest(handler, "DELETE", "/iam/users/testuser", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete user")
}

// ---------------------------------------------------------------------------
// CreateRole
// ---------------------------------------------------------------------------

func TestIAM_CreateRole_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().CreateRole(mock.Anything, mock.Anything).Return(&iam.CreateRoleOutput{}, nil)

	w := performIAMRequest(handler, "POST", "/iam/roles", []byte(`{"RoleName":"testrole"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_CreateRole_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().CreateRole(mock.Anything, mock.Anything).Return(nil, errors.New("create role error"))

	w := performIAMRequest(handler, "POST", "/iam/roles", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create role")
}

// ---------------------------------------------------------------------------
// GetRole (also receives GetRolePolicy due to dispatch ordering)
// ---------------------------------------------------------------------------

func TestIAM_GetRole_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().GetRole(mock.Anything, mock.Anything).Return(&iam.GetRoleOutput{}, nil)

	w := performIAMRequest(handler, "GET", "/iam/roles/testrole", []byte(`{"RoleName":"testrole"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_GetRole_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().GetRole(mock.Anything, mock.Anything).Return(nil, errors.New("get role error"))

	w := performIAMRequest(handler, "GET", "/iam/roles/testrole", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to get role")
}

// ---------------------------------------------------------------------------
// ListRoles
// ---------------------------------------------------------------------------

func TestIAM_ListRoles_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListRoles(mock.Anything, mock.Anything).Return(&iam.ListRolesOutput{}, nil)

	w := performIAMRequest(handler, "GET", "/iam/roles", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_ListRoles_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListRoles(mock.Anything, mock.Anything).Return(nil, errors.New("list roles error"))

	w := performIAMRequest(handler, "GET", "/iam/roles", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list roles")
}

// ---------------------------------------------------------------------------
// DeleteRole
// ---------------------------------------------------------------------------

func TestIAM_DeleteRole_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().DeleteRole(mock.Anything, mock.Anything).Return(&iam.DeleteRoleOutput{}, nil)

	w := performIAMRequest(handler, "DELETE", "/iam/roles/testrole", []byte(`{"RoleName":"testrole"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_DeleteRole_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().DeleteRole(mock.Anything, mock.Anything).Return(nil, errors.New("delete role error"))

	w := performIAMRequest(handler, "DELETE", "/iam/roles/testrole", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete role")
}

// ---------------------------------------------------------------------------
// ListPolicies
// ---------------------------------------------------------------------------

func TestIAM_ListPolicies_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListPolicies(mock.Anything, mock.Anything).Return(&iam.ListPoliciesOutput{}, nil)

	w := performIAMRequest(handler, "GET", "/iam/policies", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_ListPolicies_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListPolicies(mock.Anything, mock.Anything).Return(nil, errors.New("list policies error"))

	w := performIAMRequest(handler, "GET", "/iam/policies", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list policies")
}

// ---------------------------------------------------------------------------
// GetPolicy
// ---------------------------------------------------------------------------

func TestIAM_GetPolicy_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().GetPolicy(mock.Anything, mock.Anything).Return(&iam.GetPolicyOutput{}, nil)

	w := performIAMRequest(handler, "POST", "/iam/policies/get", []byte(`{"PolicyArn":"arn:aws:iam::123:policy/my-policy"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_GetPolicy_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().GetPolicy(mock.Anything, mock.Anything).Return(nil, errors.New("get policy error"))

	w := performIAMRequest(handler, "POST", "/iam/policies/get", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to get policy")
}

// ---------------------------------------------------------------------------
// CreatePolicy
// ---------------------------------------------------------------------------

func TestIAM_CreatePolicy_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().CreatePolicy(mock.Anything, mock.Anything).Return(&iam.CreatePolicyOutput{}, nil)

	w := performIAMRequest(handler, "POST", "/iam/policies", []byte(`{"PolicyName":"my-policy"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_CreatePolicy_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().CreatePolicy(mock.Anything, mock.Anything).Return(nil, errors.New("create policy error"))

	w := performIAMRequest(handler, "POST", "/iam/policies", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create policy")
}

// ---------------------------------------------------------------------------
// DeletePolicy
// ---------------------------------------------------------------------------

func TestIAM_DeletePolicy_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().DeletePolicy(mock.Anything, mock.Anything).Return(&iam.DeletePolicyOutput{}, nil)

	w := performIAMRequest(handler, "POST", "/iam/policies/delete", []byte(`{"PolicyArn":"arn:aws:iam::123:policy/my-policy"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_DeletePolicy_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().DeletePolicy(mock.Anything, mock.Anything).Return(nil, errors.New("delete policy error"))

	w := performIAMRequest(handler, "POST", "/iam/policies/delete", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete policy")
}

// ---------------------------------------------------------------------------
// CreateAccessKey
// ---------------------------------------------------------------------------

func TestIAM_CreateAccessKey_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().CreateAccessKey(mock.Anything, mock.Anything).Return(&iam.CreateAccessKeyOutput{}, nil)

	w := performIAMRequest(handler, "POST", "/iam/access-keys", []byte(`{"UserName":"testuser"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_CreateAccessKey_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().CreateAccessKey(mock.Anything, mock.Anything).Return(nil, errors.New("create access key error"))

	w := performIAMRequest(handler, "POST", "/iam/access-keys", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create access key")
}

// ---------------------------------------------------------------------------
// ListAccessKeys
// ---------------------------------------------------------------------------

func TestIAM_ListAccessKeys_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListAccessKeys(mock.Anything, mock.Anything).Return(&iam.ListAccessKeysOutput{}, nil)

	w := performIAMRequest(handler, "GET", "/iam/access-keys", []byte(`{"UserName":"testuser"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_ListAccessKeys_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListAccessKeys(mock.Anything, mock.Anything).Return(nil, errors.New("list access keys error"))

	w := performIAMRequest(handler, "GET", "/iam/access-keys", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list access keys")
}

// ---------------------------------------------------------------------------
// DeleteAccessKey
// ---------------------------------------------------------------------------

func TestIAM_DeleteAccessKey_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().DeleteAccessKey(mock.Anything, mock.Anything).Return(&iam.DeleteAccessKeyOutput{}, nil)

	w := performIAMRequest(handler, "DELETE", "/iam/access-keys/AKIA123", []byte(`{"UserName":"testuser","AccessKeyId":"AKIA123"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_DeleteAccessKey_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().DeleteAccessKey(mock.Anything, mock.Anything).Return(nil, errors.New("delete access key error"))

	w := performIAMRequest(handler, "DELETE", "/iam/access-keys/AKIA123", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete access key")
}

// ---------------------------------------------------------------------------
// UpdateAccessKeyStatus
// ---------------------------------------------------------------------------

func TestIAM_UpdateAccessKeyStatus_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().UpdateAccessKeyStatus(mock.Anything, mock.Anything).Return(&iam.UpdateAccessKeyOutput{}, nil)

	w := performIAMRequest(handler, "PUT", "/iam/access-keys/AKIA123", []byte(`{"UserName":"testuser","AccessKeyId":"AKIA123","Status":"Active"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_UpdateAccessKeyStatus_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().UpdateAccessKeyStatus(mock.Anything, mock.Anything).Return(nil, errors.New("update access key status error"))

	w := performIAMRequest(handler, "PUT", "/iam/access-keys/AKIA123", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to update access key status")
}

// ---------------------------------------------------------------------------
// AttachRolePolicy
// ---------------------------------------------------------------------------

func TestIAM_AttachRolePolicy_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().AttachRolePolicy(mock.Anything, mock.Anything).Return(&iam.AttachRolePolicyOutput{}, nil)

	w := performIAMRequest(handler, "POST", "/iam/roles/testrole/policies", []byte(`{"RoleName":"testrole","PolicyArn":"arn:aws:iam::123:policy/my-policy"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_AttachRolePolicy_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().AttachRolePolicy(mock.Anything, mock.Anything).Return(nil, errors.New("attach role policy error"))

	w := performIAMRequest(handler, "POST", "/iam/roles/testrole/policies", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to attach role policy")
}

// ---------------------------------------------------------------------------
// DetachRolePolicy
// ---------------------------------------------------------------------------

func TestIAM_DetachRolePolicy_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().DetachRolePolicy(mock.Anything, mock.Anything).Return(&iam.DetachRolePolicyOutput{}, nil)

	w := performIAMRequest(handler, "POST", "/iam/roles/testrole/detach-policy", []byte(`{"RoleName":"testrole","PolicyArn":"arn:aws:iam::123:policy/my-policy"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_DetachRolePolicy_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().DetachRolePolicy(mock.Anything, mock.Anything).Return(nil, errors.New("detach role policy error"))

	w := performIAMRequest(handler, "POST", "/iam/roles/testrole/detach-policy", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to detach role policy")
}

// ---------------------------------------------------------------------------
// ListAttachedRolePolicies
// ---------------------------------------------------------------------------

func TestIAM_ListAttachedRolePolicies_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListAttachedRolePolicies(mock.Anything, mock.Anything).Return(&iam.ListAttachedRolePoliciesOutput{}, nil)

	w := performIAMRequest(handler, "GET", "/iam/roles/testrole/policies", []byte(`{"RoleName":"testrole"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_ListAttachedRolePolicies_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListAttachedRolePolicies(mock.Anything, mock.Anything).Return(nil, errors.New("list attached role policies error"))

	w := performIAMRequest(handler, "GET", "/iam/roles/testrole/policies", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list attached role policies")
}

// ---------------------------------------------------------------------------
// CreateGroup
// ---------------------------------------------------------------------------

func TestIAM_CreateGroup_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().CreateGroup(mock.Anything, mock.Anything).Return(&iam.CreateGroupOutput{}, nil)

	w := performIAMRequest(handler, "POST", "/iam/groups", []byte(`{"GroupName":"testgroup"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_CreateGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().CreateGroup(mock.Anything, mock.Anything).Return(nil, errors.New("create group error"))

	w := performIAMRequest(handler, "POST", "/iam/groups", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create group")
}

// ---------------------------------------------------------------------------
// GetGroup
// ---------------------------------------------------------------------------

func TestIAM_GetGroup_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().GetGroup(mock.Anything, mock.Anything).Return(&iam.GetGroupOutput{}, nil)

	w := performIAMRequest(handler, "GET", "/iam/groups/testgroup", []byte(`{"GroupName":"testgroup"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_GetGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().GetGroup(mock.Anything, mock.Anything).Return(nil, errors.New("get group error"))

	w := performIAMRequest(handler, "GET", "/iam/groups/testgroup", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to get group")
}

// ---------------------------------------------------------------------------
// ListGroups
// NOTE: target "ListGroupsForUser" also dispatches here (ListGroups matches
// first in the switch). The ListGroupsForUser-specific wrapping is tested
// separately via direct handler call.
// ---------------------------------------------------------------------------

func TestIAM_ListGroups_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListGroups(mock.Anything, mock.Anything).Return(&iam.ListGroupsOutput{}, nil)

	w := performIAMRequest(handler, "GET", "/iam/groups", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_ListGroups_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListGroups(mock.Anything, mock.Anything).Return(nil, errors.New("list groups error"))

	w := performIAMRequest(handler, "GET", "/iam/groups", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list groups")
}

// ---------------------------------------------------------------------------
// DeleteGroup
// ---------------------------------------------------------------------------

func TestIAM_DeleteGroup_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().DeleteGroup(mock.Anything, mock.Anything).Return(&iam.DeleteGroupOutput{}, nil)

	w := performIAMRequest(handler, "DELETE", "/iam/groups/testgroup", []byte(`{"GroupName":"testgroup"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_DeleteGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().DeleteGroup(mock.Anything, mock.Anything).Return(nil, errors.New("delete group error"))

	w := performIAMRequest(handler, "DELETE", "/iam/groups/testgroup", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete group")
}

// ---------------------------------------------------------------------------
// AddUserToGroup
// ---------------------------------------------------------------------------

func TestIAM_AddUserToGroup_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().AddUserToGroup(mock.Anything, mock.Anything).Return(&iam.AddUserToGroupOutput{}, nil)

	w := performIAMRequest(handler, "POST", "/iam/groups/testgroup/users", []byte(`{"GroupName":"testgroup","UserName":"testuser"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_AddUserToGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().AddUserToGroup(mock.Anything, mock.Anything).Return(nil, errors.New("add user to group error"))

	w := performIAMRequest(handler, "POST", "/iam/groups/testgroup/users", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to add user to group")
}

// ---------------------------------------------------------------------------
// RemoveUserFromGroup
// ---------------------------------------------------------------------------

func TestIAM_RemoveUserFromGroup_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().RemoveUserFromGroup(mock.Anything, mock.Anything).Return(&iam.RemoveUserFromGroupOutput{}, nil)

	w := performIAMRequest(handler, "DELETE", "/iam/groups/testgroup/users/testuser", []byte(`{"GroupName":"testgroup","UserName":"testuser"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_RemoveUserFromGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().RemoveUserFromGroup(mock.Anything, mock.Anything).Return(nil, errors.New("remove user from group error"))

	w := performIAMRequest(handler, "DELETE", "/iam/groups/testgroup/users/testuser", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to remove user from group")
}

// ---------------------------------------------------------------------------
// ListGroupsForUser – through the router this hits "ListGroups" first due to
// dispatch ordering.  We therefore test ListGroupsForUser directly here.
// ---------------------------------------------------------------------------

func TestIAM_ListGroupsForUser_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListGroupsForUser(mock.Anything, mock.Anything).Return(
		&iam.ListGroupsForUserOutput{Groups: []types.Group{{GroupName: aws.String("admins")}}}, nil,
	)

	// Direct call to avoid router dispatch ordering issue.
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/", nil)
	handler.listGroupsForUser(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp iam.ListGroupsForUserOutput
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Len(t, resp.Groups, 1)
}

func TestIAM_ListGroupsForUser_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListGroupsForUser(mock.Anything, mock.Anything).Return(nil, errors.New("list groups for user error"))

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/", nil)
	handler.listGroupsForUser(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list groups for user")
}

// ---------------------------------------------------------------------------
// ListUsersForGroup – through the router this hits "ListUsers" first.
// We test the wrapping behaviour (GetGroup → gin.H) directly here.
// ---------------------------------------------------------------------------

func TestIAM_ListUsersForGroup_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().GetGroup(mock.Anything, mock.Anything).Return(&iam.GetGroupOutput{
		Users: []types.User{
			{UserName: aws.String("alice")},
			{UserName: aws.String("bob")},
		},
		IsTruncated: true,
		Marker:      aws.String("mkr1"),
	}, nil)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/", nil)
	handler.listUsersForGroup(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.NotNil(t, resp["Users"])
	assert.Equal(t, true, resp["IsTruncated"])
	assert.Equal(t, "mkr1", resp["Marker"])
}

func TestIAM_ListUsersForGroup_Empty(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().GetGroup(mock.Anything, mock.Anything).Return(&iam.GetGroupOutput{
		Users:       []types.User{},
		IsTruncated: false,
		Marker:      nil,
	}, nil)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/", nil)
	handler.listUsersForGroup(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Empty(t, resp["Users"])
	assert.Equal(t, false, resp["IsTruncated"])
	assert.Nil(t, resp["Marker"])
}

func TestIAM_ListUsersForGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().GetGroup(mock.Anything, mock.Anything).Return(nil, errors.New("get group error"))

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/", nil)
	handler.listUsersForGroup(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to get group")
}

// ---------------------------------------------------------------------------
// ListUserPolicies
// ---------------------------------------------------------------------------

func TestIAM_ListUserPolicies_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListUserPolicies(mock.Anything, mock.Anything).Return(&iam.ListUserPoliciesOutput{}, nil)

	w := performIAMRequest(handler, "GET", "/iam/users/testuser/policies", []byte(`{"UserName":"testuser"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_ListUserPolicies_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListUserPolicies(mock.Anything, mock.Anything).Return(nil, errors.New("list user policies error"))

	w := performIAMRequest(handler, "GET", "/iam/users/testuser/policies", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list user policies")
}

// ---------------------------------------------------------------------------
// ListRolePolicies
// ---------------------------------------------------------------------------

func TestIAM_ListRolePolicies_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListRolePolicies(mock.Anything, mock.Anything).Return(&iam.ListRolePoliciesOutput{}, nil)

	w := performIAMRequest(handler, "GET", "/iam/roles/testrole/inline-policies", []byte(`{"RoleName":"testrole"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_ListRolePolicies_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListRolePolicies(mock.Anything, mock.Anything).Return(nil, errors.New("list role policies error"))

	w := performIAMRequest(handler, "GET", "/iam/roles/testrole/inline-policies", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list role policies")
}

// ---------------------------------------------------------------------------
// GetRolePolicy – through the router this hits "GetRole" first.
// Test the actual GetRolePolicy handler directly.
// ---------------------------------------------------------------------------

func TestIAM_GetRolePolicy_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().GetRolePolicy(mock.Anything, mock.Anything).Return(&iam.GetRolePolicyOutput{}, nil)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/", nil)
	handler.getRolePolicy(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_GetRolePolicy_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().GetRolePolicy(mock.Anything, mock.Anything).Return(nil, errors.New("get role policy error"))

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/", nil)
	handler.getRolePolicy(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to get role policy")
}

// ---------------------------------------------------------------------------
// Parse error – invalid JSON body returns 400 for every action
// (via router for reachable actions, direct handler call for shadowed ones)
// ---------------------------------------------------------------------------

func TestIAM_ParseError(t *testing.T) {
	t.Parallel()

	// Only include actions whose handlers call parseBody.
	// Actions that get params from URL (GetUser, DeleteUser, GetRole, DeleteRole,
	// DeleteAccessKey, GetGroup, DeleteGroup, RemoveUserFromGroup) are excluded
	// because they don't parse the request body and bad JSON won't trigger 400.
	routerActions := []struct {
		name   string
		method string
		path   string
	}{
		{name: "CreateUser", method: "POST", path: "/iam/users"},
		{name: "ListUsers", method: "GET", path: "/iam/users"},
		{name: "CreateRole", method: "POST", path: "/iam/roles"},
		{name: "ListRoles", method: "GET", path: "/iam/roles"},
		{name: "ListPolicies", method: "GET", path: "/iam/policies"},
		{name: "GetPolicy", method: "POST", path: "/iam/policies/get"},
		{name: "CreatePolicy", method: "POST", path: "/iam/policies"},
		{name: "DeletePolicy", method: "POST", path: "/iam/policies/delete"},
		{name: "CreateAccessKey", method: "POST", path: "/iam/access-keys"},
		{name: "ListAccessKeys", method: "GET", path: "/iam/access-keys"},
		{name: "UpdateAccessKeyStatus", method: "PUT", path: "/iam/access-keys/AKIA123"},
		{name: "AttachRolePolicy", method: "POST", path: "/iam/roles/testrole/policies"},
		{name: "DetachRolePolicy", method: "POST", path: "/iam/roles/testrole/detach-policy"},
		{name: "ListAttachedRolePolicies", method: "GET", path: "/iam/roles/testrole/policies"},
		{name: "CreateGroup", method: "POST", path: "/iam/groups"},
		{name: "ListGroups", method: "GET", path: "/iam/groups"},
		{name: "AddUserToGroup", method: "POST", path: "/iam/groups/testgroup/users"},
		{name: "ListUserPolicies", method: "GET", path: "/iam/users/testuser/policies"},
		{name: "ListRolePolicies", method: "GET", path: "/iam/roles/testrole/inline-policies"},
	}

	for _, ra := range routerActions {
		ra := ra
		t.Run(ra.name, func(t *testing.T) {
			t.Parallel()
			_, _, handler := setupIAMTest(t)
			w := performIAMRequest(handler, ra.method, ra.path, []byte(`{bad json`))
			assert.Equal(t, http.StatusBadRequest, w.Code, "method=%s path=%s body=%s", ra.method, ra.path, w.Body.String())
			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)
			assert.Contains(t, resp["error"], "Invalid request body")
		})
	}
}

// TestIAM_ParseError_Direct tests parse errors for actions that are shadowed
// by the router dispatch (strings.Contains matches a prefix first).
func TestIAM_ParseError_Direct(t *testing.T) {
	t.Parallel()

	type directCase struct {
		name    string
		handler func(*ProxyHandler, http.ResponseWriter, *http.Request)
	}

	// Only include handlers that parse the request body.
	// GetRolePolicy uses URL params only and is excluded.
	cases := []directCase{
		{
			name: "ListGroupsForUser",
			handler: func(h *ProxyHandler, w http.ResponseWriter, r *http.Request) {
				h.listGroupsForUser(w, r)
			},
		},
		{
			name: "ListUsersForGroup",
			handler: func(h *ProxyHandler, w http.ResponseWriter, r *http.Request) {
				h.listUsersForGroup(w, r)
			},
		},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			_, _, handler := setupIAMTest(t)

			w := httptest.NewRecorder()
			req := httptest.NewRequest("POST", "/", bytes.NewReader([]byte(`{bad json`)))

			tc.handler(handler, w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code, "body=%s", w.Body.String())
			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)
			assert.Contains(t, resp["error"], "Invalid request body")
		})
	}
}
