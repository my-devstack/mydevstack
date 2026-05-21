package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/iam"
)

func (h *ProxyHandler) handleIAM(w http.ResponseWriter, r *http.Request) {
	xAmzTarget := r.Header.Get("X-Amz-Target")
	bodyBytes := readBody(r)
	ctx := h.ctx

	switch {
	case strings.Contains(xAmzTarget, "CreateUser"):
		h.createUser(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetUser"):
		h.getUser(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ListUsers"):
		h.listUsers(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteUser"):
		h.deleteUser(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateRole"):
		h.createRole(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetRole"):
		h.getRole(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ListRoles"):
		h.listRoles(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteRole"):
		h.deleteRole(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ListPolicies"):
		h.listPolicies(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetPolicy"):
		h.getPolicy(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeletePolicy"):
		h.deletePolicy(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreatePolicy"):
		h.createPolicy(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateAccessKey"):
		h.createAccessKey(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ListAccessKeys"):
		h.listAccessKeys(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteAccessKey"):
		h.deleteAccessKey(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateAccessKeyStatus"):
		h.updateAccessKeyStatus(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "AttachRolePolicy"):
		h.attachRolePolicy(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DetachRolePolicy"):
		h.detachRolePolicy(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ListAttachedRolePolicies"):
		h.listAttachedRolePolicies(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateGroup"):
		h.createGroup(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetGroup"):
		h.getGroup(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ListGroups"):
		h.listGroups(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteGroup"):
		h.deleteGroup(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "AddUserToGroup"):
		h.addUserToGroup(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "RemoveUserFromGroup"):
		h.removeUserFromGroup(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ListGroupsForUser"):
		h.listGroupsForUser(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ListUsersForGroup"):
		h.listUsersForGroup(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ListUserPolicies"):
		h.listUserPolicies(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ListRolePolicies"):
		h.listRolePolicies(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetRolePolicy"):
		h.getRolePolicy(ctx, w, r, bodyBytes)
	default:
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "Unknown IAM action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) createUser(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.CreateUserInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().CreateUser(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create user", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getUser(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.GetUserInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().GetUser(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get user", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listUsers(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.ListUsersInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().ListUsers(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list users", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteUser(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.DeleteUserInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().DeleteUser(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete user", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createRole(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.CreateRoleInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().CreateRole(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create role", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getRole(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.GetRoleInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().GetRole(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get role", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listRoles(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.ListRolesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().ListRoles(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list roles", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteRole(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.DeleteRoleInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().DeleteRole(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete role", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listPolicies(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.ListPoliciesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().ListPolicies(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list policies", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getPolicy(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.GetPolicyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().GetPolicy(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get policy", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createPolicy(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.CreatePolicyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().CreatePolicy(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create policy", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deletePolicy(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.DeletePolicyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().DeletePolicy(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete policy", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createAccessKey(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.CreateAccessKeyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().CreateAccessKey(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create access key", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listAccessKeys(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.ListAccessKeysInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().ListAccessKeys(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list access keys", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteAccessKey(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.DeleteAccessKeyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().DeleteAccessKey(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete access key", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateAccessKeyStatus(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.UpdateAccessKeyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().UpdateAccessKeyStatus(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update access key status", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) attachRolePolicy(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.AttachRolePolicyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().AttachRolePolicy(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to attach role policy", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) detachRolePolicy(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.DetachRolePolicyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().DetachRolePolicy(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to detach role policy", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listAttachedRolePolicies(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.ListAttachedRolePoliciesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().ListAttachedRolePolicies(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list attached role policies", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createGroup(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.CreateGroupInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().CreateGroup(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getGroup(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.GetGroupInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().GetGroup(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listGroups(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.ListGroupsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().ListGroups(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list groups", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteGroup(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.DeleteGroupInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().DeleteGroup(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) addUserToGroup(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.AddUserToGroupInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().AddUserToGroup(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to add user to group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) removeUserFromGroup(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.RemoveUserFromGroupInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().RemoveUserFromGroup(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to remove user from group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listGroupsForUser(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.ListGroupsForUserInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().ListGroupsForUser(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list groups for user", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listUsersForGroup(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.GetGroupInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().GetGroup(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get group", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"Users":       result.Users,
		"IsTruncated": result.IsTruncated,
		"Marker":      result.Marker,
	})
}

func (h *ProxyHandler) listUserPolicies(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.ListUserPoliciesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().ListUserPolicies(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list user policies", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listRolePolicies(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.ListRolePoliciesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().ListRolePolicies(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list role policies", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getRolePolicy(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &iam.GetRolePolicyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().GetRolePolicy(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get role policy", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
