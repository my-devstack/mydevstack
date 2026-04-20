package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/gin-gonic/gin"
)

func (h *ProxyHandler) handleIAM(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")
	bodyBytes := readBody(c)
	ctx := context.Background()

	switch {
	case strings.Contains(xAmzTarget, "CreateUser"):
		h.createUser(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetUser"):
		h.getUser(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "ListUsers"):
		h.listUsers(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteUser"):
		h.deleteUser(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateRole"):
		h.createRole(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetRole"):
		h.getRole(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "ListRoles"):
		h.listRoles(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteRole"):
		h.deleteRole(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "ListPolicies"):
		h.listPolicies(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetPolicy"):
		h.getPolicy(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateAccessKey"):
		h.createAccessKey(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "ListAccessKeys"):
		h.listAccessKeys(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteAccessKey"):
		h.deleteAccessKey(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateAccessKeyStatus"):
		h.updateAccessKeyStatus(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "AttachRolePolicy"):
		h.attachRolePolicy(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DetachRolePolicy"):
		h.detachRolePolicy(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "ListAttachedRolePolicies"):
		h.listAttachedRolePolicies(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateGroup"):
		h.createGroup(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetGroup"):
		h.getGroup(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "ListGroups"):
		h.listGroups(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteGroup"):
		h.deleteGroup(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "AddUserToGroup"):
		h.addUserToGroup(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "RemoveUserFromGroup"):
		h.removeUserFromGroup(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "ListGroupsForUser"):
		h.listGroupsForUser(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "ListUserPolicies"):
		h.listUserPolicies(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "ListRolePolicies"):
		h.listRolePolicies(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetRolePolicy"):
		h.getRolePolicy(ctx, c, bodyBytes)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown IAM action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) createUser(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.CreateUserInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().CreateUser(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create user", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getUser(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.GetUserInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().GetUser(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get user", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) listUsers(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.ListUsersInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().ListUsers(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list users", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteUser(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.DeleteUserInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().DeleteUser(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete user", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createRole(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.CreateRoleInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().CreateRole(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create role", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getRole(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.GetRoleInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().GetRole(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get role", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) listRoles(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.ListRolesInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().ListRoles(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list roles", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteRole(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.DeleteRoleInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().DeleteRole(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete role", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) listPolicies(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.ListPoliciesInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().ListPolicies(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list policies", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getPolicy(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.GetPolicyInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().GetPolicy(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get policy", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createAccessKey(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.CreateAccessKeyInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().CreateAccessKey(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create access key", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) listAccessKeys(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.ListAccessKeysInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().ListAccessKeys(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list access keys", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteAccessKey(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.DeleteAccessKeyInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().DeleteAccessKey(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete access key", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) updateAccessKeyStatus(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.UpdateAccessKeyInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().UpdateAccessKeyStatus(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to update access key status", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) attachRolePolicy(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.AttachRolePolicyInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().AttachRolePolicy(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to attach role policy", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) detachRolePolicy(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.DetachRolePolicyInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().DetachRolePolicy(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to detach role policy", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) listAttachedRolePolicies(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.ListAttachedRolePoliciesInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().ListAttachedRolePolicies(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list attached role policies", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createGroup(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.CreateGroupInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().CreateGroup(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create group", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getGroup(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.GetGroupInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().GetGroup(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get group", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) listGroups(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.ListGroupsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().ListGroups(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list groups", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteGroup(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.DeleteGroupInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().DeleteGroup(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete group", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) addUserToGroup(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.AddUserToGroupInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().AddUserToGroup(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to add user to group", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) removeUserFromGroup(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.RemoveUserFromGroupInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().RemoveUserFromGroup(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to remove user from group", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) listGroupsForUser(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.ListGroupsForUserInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().ListGroupsForUser(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list groups for user", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) listUserPolicies(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.ListUserPoliciesInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().ListUserPolicies(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list user policies", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) listRolePolicies(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.ListRolePoliciesInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().ListRolePolicies(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list role policies", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getRolePolicy(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &iam.GetRolePolicyInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.IAM().GetRolePolicy(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get role policy", err)
		return
	}
	c.JSON(http.StatusOK, result)
}
