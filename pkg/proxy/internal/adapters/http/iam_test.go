package httphandlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

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

// performIAMRequest executes a POST against the /iam/ service router.
func performIAMRequest(handler *ProxyHandler, target string, body []byte) *httptest.ResponseRecorder {
	r := setupTestRouter(handler)
	return performRequest(r, "POST", "/iam/", target, body)
}

// ---------------------------------------------------------------------------
// Unknown action
// ---------------------------------------------------------------------------

func TestIAM_UnknownAction(t *testing.T) {
	t.Parallel()
	_, _, handler := setupIAMTest(t)

	w := performIAMRequest(handler, "UnknownIAMAction", []byte(`{}`))
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp["error"], "Unknown IAM action")
}

// ---------------------------------------------------------------------------
// CreateUser
// ---------------------------------------------------------------------------

func TestIAM_CreateUser_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().CreateUser(mock.Anything, mock.Anything).Return(&iam.CreateUserOutput{}, nil)

	w := performIAMRequest(handler, "CreateUser", []byte(`{"UserName":"testuser"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_CreateUser_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().CreateUser(mock.Anything, mock.Anything).Return(nil, errors.New("create user error"))

	w := performIAMRequest(handler, "CreateUser", []byte(`{}`))
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

	w := performIAMRequest(handler, "GetUser", []byte(`{"UserName":"testuser"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_GetUser_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().GetUser(mock.Anything, mock.Anything).Return(nil, errors.New("get user error"))

	w := performIAMRequest(handler, "GetUser", []byte(`{}`))
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

	w := performIAMRequest(handler, "ListUsers", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_ListUsers_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListUsers(mock.Anything, mock.Anything).Return(nil, errors.New("list users error"))

	w := performIAMRequest(handler, "ListUsers", []byte(`{}`))
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

	w := performIAMRequest(handler, "DeleteUser", []byte(`{"UserName":"testuser"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_DeleteUser_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().DeleteUser(mock.Anything, mock.Anything).Return(nil, errors.New("delete user error"))

	w := performIAMRequest(handler, "DeleteUser", []byte(`{}`))
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

	w := performIAMRequest(handler, "CreateRole", []byte(`{"RoleName":"testrole"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_CreateRole_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().CreateRole(mock.Anything, mock.Anything).Return(nil, errors.New("create role error"))

	w := performIAMRequest(handler, "CreateRole", []byte(`{}`))
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

	w := performIAMRequest(handler, "GetRole", []byte(`{"RoleName":"testrole"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_GetRole_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().GetRole(mock.Anything, mock.Anything).Return(nil, errors.New("get role error"))

	w := performIAMRequest(handler, "GetRole", []byte(`{}`))
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

	w := performIAMRequest(handler, "ListRoles", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_ListRoles_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListRoles(mock.Anything, mock.Anything).Return(nil, errors.New("list roles error"))

	w := performIAMRequest(handler, "ListRoles", []byte(`{}`))
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

	w := performIAMRequest(handler, "DeleteRole", []byte(`{"RoleName":"testrole"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_DeleteRole_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().DeleteRole(mock.Anything, mock.Anything).Return(nil, errors.New("delete role error"))

	w := performIAMRequest(handler, "DeleteRole", []byte(`{}`))
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

	w := performIAMRequest(handler, "ListPolicies", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_ListPolicies_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListPolicies(mock.Anything, mock.Anything).Return(nil, errors.New("list policies error"))

	w := performIAMRequest(handler, "ListPolicies", []byte(`{}`))
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

	w := performIAMRequest(handler, "GetPolicy", []byte(`{"PolicyArn":"arn:aws:iam::123:policy/my-policy"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_GetPolicy_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().GetPolicy(mock.Anything, mock.Anything).Return(nil, errors.New("get policy error"))

	w := performIAMRequest(handler, "GetPolicy", []byte(`{}`))
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

	w := performIAMRequest(handler, "CreatePolicy", []byte(`{"PolicyName":"my-policy"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_CreatePolicy_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().CreatePolicy(mock.Anything, mock.Anything).Return(nil, errors.New("create policy error"))

	w := performIAMRequest(handler, "CreatePolicy", []byte(`{}`))
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

	w := performIAMRequest(handler, "DeletePolicy", []byte(`{"PolicyArn":"arn:aws:iam::123:policy/my-policy"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_DeletePolicy_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().DeletePolicy(mock.Anything, mock.Anything).Return(nil, errors.New("delete policy error"))

	w := performIAMRequest(handler, "DeletePolicy", []byte(`{}`))
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

	w := performIAMRequest(handler, "CreateAccessKey", []byte(`{"UserName":"testuser"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_CreateAccessKey_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().CreateAccessKey(mock.Anything, mock.Anything).Return(nil, errors.New("create access key error"))

	w := performIAMRequest(handler, "CreateAccessKey", []byte(`{}`))
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

	w := performIAMRequest(handler, "ListAccessKeys", []byte(`{"UserName":"testuser"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_ListAccessKeys_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListAccessKeys(mock.Anything, mock.Anything).Return(nil, errors.New("list access keys error"))

	w := performIAMRequest(handler, "ListAccessKeys", []byte(`{}`))
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

	w := performIAMRequest(handler, "DeleteAccessKey", []byte(`{"UserName":"testuser","AccessKeyId":"AKIA123"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_DeleteAccessKey_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().DeleteAccessKey(mock.Anything, mock.Anything).Return(nil, errors.New("delete access key error"))

	w := performIAMRequest(handler, "DeleteAccessKey", []byte(`{}`))
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

	w := performIAMRequest(handler, "UpdateAccessKeyStatus", []byte(`{"UserName":"testuser","AccessKeyId":"AKIA123","Status":"Active"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_UpdateAccessKeyStatus_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().UpdateAccessKeyStatus(mock.Anything, mock.Anything).Return(nil, errors.New("update access key status error"))

	w := performIAMRequest(handler, "UpdateAccessKeyStatus", []byte(`{}`))
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

	w := performIAMRequest(handler, "AttachRolePolicy", []byte(`{"RoleName":"testrole","PolicyArn":"arn:aws:iam::123:policy/my-policy"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_AttachRolePolicy_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().AttachRolePolicy(mock.Anything, mock.Anything).Return(nil, errors.New("attach role policy error"))

	w := performIAMRequest(handler, "AttachRolePolicy", []byte(`{}`))
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

	w := performIAMRequest(handler, "DetachRolePolicy", []byte(`{"RoleName":"testrole","PolicyArn":"arn:aws:iam::123:policy/my-policy"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_DetachRolePolicy_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().DetachRolePolicy(mock.Anything, mock.Anything).Return(nil, errors.New("detach role policy error"))

	w := performIAMRequest(handler, "DetachRolePolicy", []byte(`{}`))
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

	w := performIAMRequest(handler, "ListAttachedRolePolicies", []byte(`{"RoleName":"testrole"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_ListAttachedRolePolicies_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListAttachedRolePolicies(mock.Anything, mock.Anything).Return(nil, errors.New("list attached role policies error"))

	w := performIAMRequest(handler, "ListAttachedRolePolicies", []byte(`{}`))
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

	w := performIAMRequest(handler, "CreateGroup", []byte(`{"GroupName":"testgroup"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_CreateGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().CreateGroup(mock.Anything, mock.Anything).Return(nil, errors.New("create group error"))

	w := performIAMRequest(handler, "CreateGroup", []byte(`{}`))
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

	w := performIAMRequest(handler, "GetGroup", []byte(`{"GroupName":"testgroup"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_GetGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().GetGroup(mock.Anything, mock.Anything).Return(nil, errors.New("get group error"))

	w := performIAMRequest(handler, "GetGroup", []byte(`{}`))
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

	w := performIAMRequest(handler, "ListGroups", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_ListGroups_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListGroups(mock.Anything, mock.Anything).Return(nil, errors.New("list groups error"))

	w := performIAMRequest(handler, "ListGroups", []byte(`{}`))
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

	w := performIAMRequest(handler, "DeleteGroup", []byte(`{"GroupName":"testgroup"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_DeleteGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().DeleteGroup(mock.Anything, mock.Anything).Return(nil, errors.New("delete group error"))

	w := performIAMRequest(handler, "DeleteGroup", []byte(`{}`))
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

	w := performIAMRequest(handler, "AddUserToGroup", []byte(`{"GroupName":"testgroup","UserName":"testuser"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_AddUserToGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().AddUserToGroup(mock.Anything, mock.Anything).Return(nil, errors.New("add user to group error"))

	w := performIAMRequest(handler, "AddUserToGroup", []byte(`{}`))
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

	w := performIAMRequest(handler, "RemoveUserFromGroup", []byte(`{"GroupName":"testgroup","UserName":"testuser"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_RemoveUserFromGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().RemoveUserFromGroup(mock.Anything, mock.Anything).Return(nil, errors.New("remove user from group error"))

	w := performIAMRequest(handler, "RemoveUserFromGroup", []byte(`{}`))
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
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("POST", "/", nil)
	handler.listGroupsForUser(context.Background(), c, []byte(`{"UserName":"testuser"}`))

	assert.Equal(t, http.StatusOK, w.Code)
	var resp iam.ListGroupsForUserOutput
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Len(t, resp.Groups, 1)
}

func TestIAM_ListGroupsForUser_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListGroupsForUser(mock.Anything, mock.Anything).Return(nil, errors.New("list groups for user error"))

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("POST", "/", nil)
	handler.listGroupsForUser(context.Background(), c, []byte(`{}`))

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

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("POST", "/", nil)
	handler.listUsersForGroup(context.Background(), c, []byte(`{"GroupName":"testgroup"}`))

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

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("POST", "/", nil)
	handler.listUsersForGroup(context.Background(), c, []byte(`{"GroupName":"testgroup"}`))

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

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("POST", "/", nil)
	handler.listUsersForGroup(context.Background(), c, []byte(`{}`))

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

	w := performIAMRequest(handler, "ListUserPolicies", []byte(`{"UserName":"testuser"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_ListUserPolicies_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListUserPolicies(mock.Anything, mock.Anything).Return(nil, errors.New("list user policies error"))

	w := performIAMRequest(handler, "ListUserPolicies", []byte(`{}`))
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

	w := performIAMRequest(handler, "ListRolePolicies", []byte(`{"RoleName":"testrole"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_ListRolePolicies_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().ListRolePolicies(mock.Anything, mock.Anything).Return(nil, errors.New("list role policies error"))

	w := performIAMRequest(handler, "ListRolePolicies", []byte(`{}`))
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

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("POST", "/", nil)
	handler.getRolePolicy(context.Background(), c, []byte(`{"RoleName":"testrole","PolicyName":"my-policy"}`))

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIAM_GetRolePolicy_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupIAMTest(t)
	mp.EXPECT().GetRolePolicy(mock.Anything, mock.Anything).Return(nil, errors.New("get role policy error"))

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("POST", "/", nil)
	handler.getRolePolicy(context.Background(), c, []byte(`{}`))

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

	routerActions := []string{
		"CreateUser", "GetUser", "ListUsers", "DeleteUser",
		"CreateRole", "GetRole", "ListRoles", "DeleteRole",
		"ListPolicies", "GetPolicy", "CreatePolicy", "DeletePolicy",
		"CreateAccessKey", "ListAccessKeys", "DeleteAccessKey", "UpdateAccessKeyStatus",
		"AttachRolePolicy", "DetachRolePolicy", "ListAttachedRolePolicies",
		"CreateGroup", "GetGroup", "ListGroups", "DeleteGroup",
		"AddUserToGroup", "RemoveUserFromGroup",
		"ListUserPolicies", "ListRolePolicies",
	}

	for _, action := range routerActions {
		action := action
		t.Run(action, func(t *testing.T) {
			t.Parallel()
			_, _, handler := setupIAMTest(t)
			w := performIAMRequest(handler, action, []byte(`{bad json`))
			assert.Equal(t, http.StatusBadRequest, w.Code, "action=%s body=%s", action, w.Body.String())
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
		handler func(*ProxyHandler, *gin.Context, []byte)
	}

	cases := []directCase{
		{
			name: "ListGroupsForUser",
			handler: func(h *ProxyHandler, c *gin.Context, body []byte) {
				h.listGroupsForUser(context.Background(), c, body)
			},
		},
		{
			name: "ListUsersForGroup",
			handler: func(h *ProxyHandler, c *gin.Context, body []byte) {
				h.listUsersForGroup(context.Background(), c, body)
			},
		},
		{
			name: "GetRolePolicy",
			handler: func(h *ProxyHandler, c *gin.Context, body []byte) {
				h.getRolePolicy(context.Background(), c, body)
			},
		},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			_, _, handler := setupIAMTest(t)

			gin.SetMode(gin.TestMode)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest("POST", "/", nil)

			tc.handler(handler, c, []byte(`{bad json`))

			assert.Equal(t, http.StatusBadRequest, w.Code, "body=%s", w.Body.String())
			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)
			assert.Contains(t, resp["error"], "Invalid request body")
		})
	}
}
