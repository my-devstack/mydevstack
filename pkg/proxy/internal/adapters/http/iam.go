package httphandlers

import (
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	iamtypes "github.com/aws/aws-sdk-go-v2/service/iam/types"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerIAMRoutes(r chi.Router) {
	r.Route("/iam", func(r chi.Router) {
		r.Get("/users", h.listUsers)
		r.Post("/users", h.createUser)
		r.Get("/users/{userName}", h.getUser)
		r.Delete("/users/{userName}", h.deleteUser)

		r.Post("/access-keys", h.createAccessKey)
		r.Get("/access-keys", h.listAccessKeys)
		r.Delete("/access-keys/{accessKeyId}", h.deleteAccessKey)
		r.Put("/access-keys/{accessKeyId}", h.updateAccessKeyStatus)

		r.Get("/roles", h.listRoles)
		r.Post("/roles", h.createRole)
		r.Get("/roles/{roleName}", h.getRole)
		r.Delete("/roles/{roleName}", h.deleteRole)

		r.Post("/roles/{roleName}/policies", h.attachRolePolicy)
		r.Post("/roles/{roleName}/detach-policy", h.detachRolePolicy)
		r.Get("/roles/{roleName}/policies", h.listAttachedRolePolicies)
		r.Get("/roles/{roleName}/policies/{policyName}", h.getRolePolicy)
		r.Get("/roles/{roleName}/inline-policies", h.listRolePolicies)

		r.Get("/policies", h.listPolicies)
		r.Post("/policies", h.createPolicy)
		r.Post("/policies/get", h.getPolicy)
		r.Post("/policies/delete", h.deletePolicy)

		r.Post("/groups", h.createGroup)
		r.Get("/groups", h.listGroups)
		r.Get("/groups/{groupName}", h.getGroup)
		r.Delete("/groups/{groupName}", h.deleteGroup)
		r.Post("/groups/{groupName}/users", h.addUserToGroup)
		r.Delete("/groups/{groupName}/users/{userName}", h.removeUserFromGroup)
		r.Get("/groups/{groupName}/users", h.listUsersForGroup)
		r.Get("/users/{userName}/groups", h.listGroupsForUser)
		r.Get("/users/{userName}/policies", h.listUserPolicies)
	})
}

func (h *ProxyHandler) createUser(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &iam.CreateUserInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().CreateUser(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create user", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getUser(w http.ResponseWriter, r *http.Request) {
	input := &iam.GetUserInput{
		UserName: aws.String(chi.URLParam(r, "userName")),
	}
	result, err := h.Svc.IAM().GetUser(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get user", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listUsers(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &iam.ListUsersInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().ListUsers(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list users", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteUser(w http.ResponseWriter, r *http.Request) {
	input := &iam.DeleteUserInput{
		UserName: aws.String(chi.URLParam(r, "userName")),
	}
	result, err := h.Svc.IAM().DeleteUser(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete user", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createRole(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &iam.CreateRoleInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().CreateRole(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create role", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getRole(w http.ResponseWriter, r *http.Request) {
	input := &iam.GetRoleInput{
		RoleName: aws.String(chi.URLParam(r, "roleName")),
	}
	result, err := h.Svc.IAM().GetRole(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get role", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listRoles(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &iam.ListRolesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().ListRoles(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list roles", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteRole(w http.ResponseWriter, r *http.Request) {
	input := &iam.DeleteRoleInput{
		RoleName: aws.String(chi.URLParam(r, "roleName")),
	}
	result, err := h.Svc.IAM().DeleteRole(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete role", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listPolicies(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &iam.ListPoliciesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().ListPolicies(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list policies", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getPolicy(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		PolicyArn string `json:"PolicyArn"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &iam.GetPolicyInput{
		PolicyArn: aws.String(body.PolicyArn),
	}
	result, err := h.Svc.IAM().GetPolicy(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get policy", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createPolicy(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &iam.CreatePolicyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().CreatePolicy(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create policy", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deletePolicy(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		PolicyArn string `json:"PolicyArn"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &iam.DeletePolicyInput{
		PolicyArn: aws.String(body.PolicyArn),
	}
	result, err := h.Svc.IAM().DeletePolicy(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete policy", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createAccessKey(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &iam.CreateAccessKeyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().CreateAccessKey(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create access key", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listAccessKeys(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &iam.ListAccessKeysInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().ListAccessKeys(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list access keys", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteAccessKey(w http.ResponseWriter, r *http.Request) {
	input := &iam.DeleteAccessKeyInput{
		AccessKeyId: aws.String(chi.URLParam(r, "accessKeyId")),
	}
	result, err := h.Svc.IAM().DeleteAccessKey(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete access key", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateAccessKeyStatus(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		Status string `json:"Status"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &iam.UpdateAccessKeyInput{
		AccessKeyId: aws.String(chi.URLParam(r, "accessKeyId")),
		Status:      iamtypes.StatusType(body.Status),
	}
	result, err := h.Svc.IAM().UpdateAccessKeyStatus(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update access key status", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) attachRolePolicy(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		PolicyArn string `json:"PolicyArn"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &iam.AttachRolePolicyInput{
		RoleName:  aws.String(chi.URLParam(r, "roleName")),
		PolicyArn: aws.String(body.PolicyArn),
	}
	result, err := h.Svc.IAM().AttachRolePolicy(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to attach role policy", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) detachRolePolicy(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		PolicyArn string `json:"PolicyArn"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &iam.DetachRolePolicyInput{
		RoleName:  aws.String(chi.URLParam(r, "roleName")),
		PolicyArn: aws.String(body.PolicyArn),
	}
	result, err := h.Svc.IAM().DetachRolePolicy(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to detach role policy", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listAttachedRolePolicies(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		PathPrefix string `json:"PathPrefix"`
		Marker     string `json:"Marker"`
		MaxItems   int32  `json:"MaxItems"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &iam.ListAttachedRolePoliciesInput{
		RoleName: aws.String(chi.URLParam(r, "roleName")),
	}
	if body.PathPrefix != "" {
		input.PathPrefix = aws.String(body.PathPrefix)
	}
	if body.Marker != "" {
		input.Marker = aws.String(body.Marker)
	}
	if body.MaxItems > 0 {
		input.MaxItems = aws.Int32(body.MaxItems)
	}
	result, err := h.Svc.IAM().ListAttachedRolePolicies(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list attached role policies", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createGroup(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &iam.CreateGroupInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().CreateGroup(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getGroup(w http.ResponseWriter, r *http.Request) {
	input := &iam.GetGroupInput{
		GroupName: aws.String(chi.URLParam(r, "groupName")),
	}
	result, err := h.Svc.IAM().GetGroup(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listGroups(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &iam.ListGroupsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.IAM().ListGroups(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list groups", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteGroup(w http.ResponseWriter, r *http.Request) {
	input := &iam.DeleteGroupInput{
		GroupName: aws.String(chi.URLParam(r, "groupName")),
	}
	result, err := h.Svc.IAM().DeleteGroup(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) addUserToGroup(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		UserName string `json:"UserName"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &iam.AddUserToGroupInput{
		GroupName: aws.String(chi.URLParam(r, "groupName")),
		UserName:  aws.String(body.UserName),
	}
	result, err := h.Svc.IAM().AddUserToGroup(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to add user to group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) removeUserFromGroup(w http.ResponseWriter, r *http.Request) {
	input := &iam.RemoveUserFromGroupInput{
		GroupName: aws.String(chi.URLParam(r, "groupName")),
		UserName:  aws.String(chi.URLParam(r, "userName")),
	}
	result, err := h.Svc.IAM().RemoveUserFromGroup(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to remove user from group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listGroupsForUser(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		Marker   string `json:"Marker"`
		MaxItems int32  `json:"MaxItems"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &iam.ListGroupsForUserInput{
		UserName: aws.String(chi.URLParam(r, "userName")),
	}
	if body.Marker != "" {
		input.Marker = aws.String(body.Marker)
	}
	if body.MaxItems > 0 {
		input.MaxItems = aws.Int32(body.MaxItems)
	}
	result, err := h.Svc.IAM().ListGroupsForUser(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list groups for user", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listUsersForGroup(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		Marker   string `json:"Marker"`
		MaxItems int32  `json:"MaxItems"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &iam.GetGroupInput{
		GroupName: aws.String(chi.URLParam(r, "groupName")),
	}
	if body.Marker != "" {
		input.Marker = aws.String(body.Marker)
	}
	if body.MaxItems > 0 {
		input.MaxItems = aws.Int32(body.MaxItems)
	}
	result, err := h.Svc.IAM().GetGroup(h.ctx, input)
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

func (h *ProxyHandler) listUserPolicies(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		Marker   string `json:"Marker"`
		MaxItems int32  `json:"MaxItems"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &iam.ListUserPoliciesInput{
		UserName: aws.String(chi.URLParam(r, "userName")),
	}
	if body.Marker != "" {
		input.Marker = aws.String(body.Marker)
	}
	if body.MaxItems > 0 {
		input.MaxItems = aws.Int32(body.MaxItems)
	}
	result, err := h.Svc.IAM().ListUserPolicies(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list user policies", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listRolePolicies(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		Marker   string `json:"Marker"`
		MaxItems int32  `json:"MaxItems"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &iam.ListRolePoliciesInput{
		RoleName: aws.String(chi.URLParam(r, "roleName")),
	}
	if body.Marker != "" {
		input.Marker = aws.String(body.Marker)
	}
	if body.MaxItems > 0 {
		input.MaxItems = aws.Int32(body.MaxItems)
	}
	result, err := h.Svc.IAM().ListRolePolicies(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list role policies", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getRolePolicy(w http.ResponseWriter, r *http.Request) {
	input := &iam.GetRolePolicyInput{
		RoleName:   aws.String(chi.URLParam(r, "roleName")),
		PolicyName: aws.String(chi.URLParam(r, "policyName")),
	}
	result, err := h.Svc.IAM().GetRolePolicy(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get role policy", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
