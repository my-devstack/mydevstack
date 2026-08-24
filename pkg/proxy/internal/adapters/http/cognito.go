package httphandlers

import (
	"fmt"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"
	"github.com/go-chi/chi/v5"
)

// cognitoUserPoolAccountID is the AWS account ID embedded in user pool ARNs.
// Emulators (Floci/LocalStack) default to 000000000000 and do not validate
// the account segment when resolving a user pool from its ARN.
const cognitoUserPoolAccountID = "000000000000"

// cognitoUserPoolARN builds the full ARN for a user pool. Cognito tag
// operations (ListTagsForResource/TagResource/UntagResource) require a full
// ARN (arn:aws:cognito-idp:<region>:<account>:userpool/<poolId>), not the
// bare pool ID.
func (h *ProxyHandler) cognitoUserPoolARN(userPoolID string) string {
	return fmt.Sprintf("arn:aws:cognito-idp:%s:%s:userpool/%s", h.Svc.Region(), cognitoUserPoolAccountID, userPoolID)
}

func (h *ProxyHandler) registerCognitoRoutes(r chi.Router) {
	r.Route("/cognito", func(r chi.Router) {
		r.Get("/user-pools", h.listUserPools)
		r.Post("/user-pools", h.createUserPool)
		r.Get("/user-pools/{userPoolId}", h.describeUserPool)
		r.Delete("/user-pools/{userPoolId}", h.deleteUserPool)
		r.Put("/user-pools/{userPoolId}", h.updateUserPool)

		r.Get("/user-pools/{userPoolId}/users", h.cognitoListUsers)
		r.Post("/user-pools/{userPoolId}/users", h.adminCreateUser)
		r.Get("/user-pools/{userPoolId}/users/{username}", h.adminGetUser)
		r.Put("/user-pools/{userPoolId}/users/{username}", h.adminUpdateUserAttributes)
		r.Delete("/user-pools/{userPoolId}/users/{username}", h.adminDeleteUser)

		r.Get("/user-pools/{userPoolId}/groups", h.cognitoListGroups)
		r.Post("/user-pools/{userPoolId}/groups", h.cognitoCreateGroup)
		r.Get("/user-pools/{userPoolId}/groups/{groupName}", h.cognitoGetGroup)
		r.Put("/user-pools/{userPoolId}/groups/{groupName}", h.cognitoUpdateGroup)
		r.Delete("/user-pools/{userPoolId}/groups/{groupName}", h.cognitoDeleteGroup)

		r.Get("/user-pools/{userPoolId}/clients", h.listUserPoolClients)
		r.Post("/user-pools/{userPoolId}/clients", h.createUserPoolClient)
		r.Get("/user-pools/{userPoolId}/clients/{clientId}", h.describeUserPoolClient)
		r.Put("/user-pools/{userPoolId}/clients/{clientId}", h.updateUserPoolClient)
		r.Delete("/user-pools/{userPoolId}/clients/{clientId}", h.deleteUserPoolClient)

		// Group membership
		r.Put("/user-pools/{userPoolId}/users/{username}/groups", h.adminAddUserToGroup)
		r.Delete("/user-pools/{userPoolId}/users/{username}/groups/{groupName}", h.adminRemoveUserFromGroup)
		r.Get("/user-pools/{userPoolId}/users/{username}/groups", h.adminListGroupsForUser)
		r.Get("/user-pools/{userPoolId}/groups/{groupName}/users", h.listUsersInGroup)

		// Reset password
		r.Put("/user-pools/{userPoolId}/users/{username}/password", h.adminSetUserPassword)

		// Resource servers
		r.Get("/user-pools/{userPoolId}/resource-servers", h.listResourceServers)
		r.Post("/user-pools/{userPoolId}/resource-servers", h.createResourceServer)
		r.Get("/user-pools/{userPoolId}/resource-servers/{identifier}", h.describeResourceServer)
		r.Delete("/user-pools/{userPoolId}/resource-servers/{identifier}", h.deleteResourceServer)

		// Tags
		r.Get("/user-pools/{userPoolId}/tags", h.cognitoListTagsForResource)
		r.Put("/user-pools/{userPoolId}/tags", h.updateTags)

		// Authentication
		r.Post("/initiate-auth", h.initiateAuth)
		r.Post("/admin-initiate-auth", h.adminInitiateAuth)
		r.Post("/respond-to-auth-challenge", h.respondToAuthChallenge)
	})
}

func (h *ProxyHandler) listUserPools(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		NextToken  string `json:"NextToken"`
		MaxResults int32  `json:"MaxResults"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &cognitoidentityprovider.ListUserPoolsInput{}
	if body.NextToken != "" {
		input.NextToken = aws.String(body.NextToken)
	}
	if body.MaxResults > 0 {
		input.MaxResults = aws.Int32(body.MaxResults)
	} else {
		input.MaxResults = aws.Int32(60)
	}
	result, err := h.Svc.Cognito().ListUserPools(h.ctx, input)
	if err != nil {
		if isUnsupportedError(err) {
			writeJSON(w, http.StatusOK, &cognitoidentityprovider.ListUserPoolsOutput{
				UserPools: []types.UserPoolDescriptionType{},
			})
			return
		}
		sendErrorWithStatus(w, "Failed to list user pools", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createUserPool(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cognitoidentityprovider.CreateUserPoolInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Cognito().CreateUserPool(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to create user pool", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeUserPool(w http.ResponseWriter, r *http.Request) {
	input := &cognitoidentityprovider.DescribeUserPoolInput{
		UserPoolId: aws.String(chi.URLParam(r, "userPoolId")),
	}
	result, err := h.Svc.Cognito().DescribeUserPool(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to describe user pool", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteUserPool(w http.ResponseWriter, r *http.Request) {
	input := &cognitoidentityprovider.DeleteUserPoolInput{
		UserPoolId: aws.String(chi.URLParam(r, "userPoolId")),
	}
	result, err := h.Svc.Cognito().DeleteUserPool(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to delete user pool", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateUserPool(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cognitoidentityprovider.UpdateUserPoolInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.UserPoolId = aws.String(chi.URLParam(r, "userPoolId"))
	result, err := h.Svc.Cognito().UpdateUserPool(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to update user pool", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) cognitoListUsers(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		Filter          string `json:"Filter"`
		Limit           int32  `json:"Limit"`
		PaginationToken string `json:"PaginationToken"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &cognitoidentityprovider.ListUsersInput{
		UserPoolId: aws.String(chi.URLParam(r, "userPoolId")),
	}
	if body.Filter != "" {
		input.Filter = aws.String(body.Filter)
	}
	if body.Limit > 0 {
		input.Limit = aws.Int32(body.Limit)
	}
	if body.PaginationToken != "" {
		input.PaginationToken = aws.String(body.PaginationToken)
	}
	result, err := h.Svc.Cognito().ListUsers(h.ctx, input)
	if err != nil {
		if isUnsupportedError(err) {
			writeJSON(w, http.StatusOK, &cognitoidentityprovider.ListUsersOutput{
				Users: []types.UserType{},
			})
			return
		}
		sendErrorWithStatus(w, "Failed to list users", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) adminCreateUser(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cognitoidentityprovider.AdminCreateUserInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.UserPoolId = aws.String(chi.URLParam(r, "userPoolId"))
	result, err := h.Svc.Cognito().AdminCreateUser(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to create user", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) adminGetUser(w http.ResponseWriter, r *http.Request) {
	input := &cognitoidentityprovider.AdminGetUserInput{
		UserPoolId: aws.String(chi.URLParam(r, "userPoolId")),
		Username:   aws.String(chi.URLParam(r, "username")),
	}
	result, err := h.Svc.Cognito().AdminGetUser(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to get user", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) adminUpdateUserAttributes(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cognitoidentityprovider.AdminUpdateUserAttributesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.UserPoolId = aws.String(chi.URLParam(r, "userPoolId"))
	input.Username = aws.String(chi.URLParam(r, "username"))
	result, err := h.Svc.Cognito().AdminUpdateUserAttributes(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to update user attributes", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) adminDeleteUser(w http.ResponseWriter, r *http.Request) {
	input := &cognitoidentityprovider.AdminDeleteUserInput{
		UserPoolId: aws.String(chi.URLParam(r, "userPoolId")),
		Username:   aws.String(chi.URLParam(r, "username")),
	}
	result, err := h.Svc.Cognito().AdminDeleteUser(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to delete user", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) cognitoListGroups(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		Limit     int32  `json:"Limit"`
		NextToken string `json:"NextToken"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &cognitoidentityprovider.ListGroupsInput{
		UserPoolId: aws.String(chi.URLParam(r, "userPoolId")),
	}
	if body.Limit > 0 {
		input.Limit = aws.Int32(body.Limit)
	}
	if body.NextToken != "" {
		input.NextToken = aws.String(body.NextToken)
	}
	result, err := h.Svc.Cognito().ListGroups(h.ctx, input)
	if err != nil {
		if isUnsupportedError(err) {
			writeJSON(w, http.StatusOK, &cognitoidentityprovider.ListGroupsOutput{
				Groups: []types.GroupType{},
			})
			return
		}
		sendErrorWithStatus(w, "Failed to list groups", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) cognitoCreateGroup(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cognitoidentityprovider.CreateGroupInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.UserPoolId = aws.String(chi.URLParam(r, "userPoolId"))
	result, err := h.Svc.Cognito().CreateGroup(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to create group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) cognitoGetGroup(w http.ResponseWriter, r *http.Request) {
	input := &cognitoidentityprovider.GetGroupInput{
		UserPoolId: aws.String(chi.URLParam(r, "userPoolId")),
		GroupName:  aws.String(chi.URLParam(r, "groupName")),
	}
	result, err := h.Svc.Cognito().GetGroup(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to get group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) cognitoUpdateGroup(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cognitoidentityprovider.UpdateGroupInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.UserPoolId = aws.String(chi.URLParam(r, "userPoolId"))
	input.GroupName = aws.String(chi.URLParam(r, "groupName"))
	result, err := h.Svc.Cognito().UpdateGroup(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to update group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) cognitoDeleteGroup(w http.ResponseWriter, r *http.Request) {
	input := &cognitoidentityprovider.DeleteGroupInput{
		UserPoolId: aws.String(chi.URLParam(r, "userPoolId")),
		GroupName:  aws.String(chi.URLParam(r, "groupName")),
	}
	result, err := h.Svc.Cognito().DeleteGroup(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to delete group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listUserPoolClients(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		MaxResults int32  `json:"MaxResults"`
		NextToken  string `json:"NextToken"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &cognitoidentityprovider.ListUserPoolClientsInput{
		UserPoolId: aws.String(chi.URLParam(r, "userPoolId")),
	}
	if body.MaxResults > 0 {
		input.MaxResults = aws.Int32(body.MaxResults)
	} else {
		input.MaxResults = aws.Int32(60)
	}
	if body.NextToken != "" {
		input.NextToken = aws.String(body.NextToken)
	}
	result, err := h.Svc.Cognito().ListUserPoolClients(h.ctx, input)
	if err != nil {
		if isUnsupportedError(err) {
			writeJSON(w, http.StatusOK, &cognitoidentityprovider.ListUserPoolClientsOutput{
				UserPoolClients: []types.UserPoolClientDescription{},
			})
			return
		}
		sendErrorWithStatus(w, "Failed to list user pool clients", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createUserPoolClient(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cognitoidentityprovider.CreateUserPoolClientInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.UserPoolId = aws.String(chi.URLParam(r, "userPoolId"))
	result, err := h.Svc.Cognito().CreateUserPoolClient(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to create user pool client", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeUserPoolClient(w http.ResponseWriter, r *http.Request) {
	input := &cognitoidentityprovider.DescribeUserPoolClientInput{
		UserPoolId: aws.String(chi.URLParam(r, "userPoolId")),
		ClientId:   aws.String(chi.URLParam(r, "clientId")),
	}
	result, err := h.Svc.Cognito().DescribeUserPoolClient(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to describe user pool client", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateUserPoolClient(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cognitoidentityprovider.UpdateUserPoolClientInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.UserPoolId = aws.String(chi.URLParam(r, "userPoolId"))
	input.ClientId = aws.String(chi.URLParam(r, "clientId"))
	result, err := h.Svc.Cognito().UpdateUserPoolClient(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to update user pool client", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteUserPoolClient(w http.ResponseWriter, r *http.Request) {
	input := &cognitoidentityprovider.DeleteUserPoolClientInput{
		UserPoolId: aws.String(chi.URLParam(r, "userPoolId")),
		ClientId:   aws.String(chi.URLParam(r, "clientId")),
	}
	result, err := h.Svc.Cognito().DeleteUserPoolClient(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to delete user pool client", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) adminAddUserToGroup(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		GroupName string `json:"GroupName"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &cognitoidentityprovider.AdminAddUserToGroupInput{
		UserPoolId: aws.String(chi.URLParam(r, "userPoolId")),
		Username:   aws.String(chi.URLParam(r, "username")),
		GroupName:  aws.String(body.GroupName),
	}
	result, err := h.Svc.Cognito().AdminAddUserToGroup(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to add user to group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) adminRemoveUserFromGroup(w http.ResponseWriter, r *http.Request) {
	input := &cognitoidentityprovider.AdminRemoveUserFromGroupInput{
		UserPoolId: aws.String(chi.URLParam(r, "userPoolId")),
		Username:   aws.String(chi.URLParam(r, "username")),
		GroupName:  aws.String(chi.URLParam(r, "groupName")),
	}
	result, err := h.Svc.Cognito().AdminRemoveUserFromGroup(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to remove user from group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) adminListGroupsForUser(w http.ResponseWriter, r *http.Request) {
	input := &cognitoidentityprovider.AdminListGroupsForUserInput{
		UserPoolId: aws.String(chi.URLParam(r, "userPoolId")),
		Username:   aws.String(chi.URLParam(r, "username")),
	}
	result, err := h.Svc.Cognito().AdminListGroupsForUser(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to list groups for user", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listUsersInGroup(w http.ResponseWriter, r *http.Request) {
	input := &cognitoidentityprovider.ListUsersInGroupInput{
		UserPoolId: aws.String(chi.URLParam(r, "userPoolId")),
		GroupName:  aws.String(chi.URLParam(r, "groupName")),
	}
	result, err := h.Svc.Cognito().ListUsersInGroup(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to list users in group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) adminSetUserPassword(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cognitoidentityprovider.AdminSetUserPasswordInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.UserPoolId = aws.String(chi.URLParam(r, "userPoolId"))
	input.Username = aws.String(chi.URLParam(r, "username"))
	result, err := h.Svc.Cognito().AdminSetUserPassword(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to set user password", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listResourceServers(w http.ResponseWriter, r *http.Request) {
	input := &cognitoidentityprovider.ListResourceServersInput{
		UserPoolId: aws.String(chi.URLParam(r, "userPoolId")),
	}
	result, err := h.Svc.Cognito().ListResourceServers(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to list resource servers", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createResourceServer(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cognitoidentityprovider.CreateResourceServerInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.UserPoolId = aws.String(chi.URLParam(r, "userPoolId"))
	result, err := h.Svc.Cognito().CreateResourceServer(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to create resource server", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeResourceServer(w http.ResponseWriter, r *http.Request) {
	input := &cognitoidentityprovider.DescribeResourceServerInput{
		UserPoolId: aws.String(chi.URLParam(r, "userPoolId")),
		Identifier: aws.String(chi.URLParam(r, "identifier")),
	}
	result, err := h.Svc.Cognito().DescribeResourceServer(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to describe resource server", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteResourceServer(w http.ResponseWriter, r *http.Request) {
	input := &cognitoidentityprovider.DeleteResourceServerInput{
		UserPoolId: aws.String(chi.URLParam(r, "userPoolId")),
		Identifier: aws.String(chi.URLParam(r, "identifier")),
	}
	result, err := h.Svc.Cognito().DeleteResourceServer(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to delete resource server", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) cognitoListTagsForResource(w http.ResponseWriter, r *http.Request) {
	input := &cognitoidentityprovider.ListTagsForResourceInput{
		ResourceArn: aws.String(h.cognitoUserPoolARN(chi.URLParam(r, "userPoolId"))),
	}
	result, err := h.Svc.Cognito().ListTagsForResource(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to list tags", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateTags(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		Tags        map[string]string `json:"Tags"`
		RemovedKeys []string          `json:"RemovedKeys"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	resourceArn := h.cognitoUserPoolARN(chi.URLParam(r, "userPoolId"))
	for key, value := range body.Tags {
		_, err := h.Svc.Cognito().TagResource(h.ctx, &cognitoidentityprovider.TagResourceInput{
			ResourceArn: aws.String(resourceArn),
			Tags:        map[string]string{key: value},
		})
		if err != nil {
			sendErrorWithStatus(w, "Failed to update tags", err)
			return
		}
	}
	for _, key := range body.RemovedKeys {
		_, err := h.Svc.Cognito().UntagResource(h.ctx, &cognitoidentityprovider.UntagResourceInput{
			ResourceArn: aws.String(resourceArn),
			TagKeys:     []string{key},
		})
		if err != nil {
			sendErrorWithStatus(w, "Failed to update tags", err)
			return
		}
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Tags updated successfully"})
}

func (h *ProxyHandler) initiateAuth(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cognitoidentityprovider.InitiateAuthInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Cognito().InitiateAuth(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to initiate auth", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) adminInitiateAuth(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cognitoidentityprovider.AdminInitiateAuthInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Cognito().AdminInitiateAuth(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to admin initiate auth", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) respondToAuthChallenge(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cognitoidentityprovider.RespondToAuthChallengeInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Cognito().RespondToAuthChallenge(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to respond to auth challenge", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
