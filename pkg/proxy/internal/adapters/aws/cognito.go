package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type CognitoAdapter struct {
	client ports.CognitoClientPort
}

func NewCognitoAdapter(awsCfg aws.Config, endpoint string) ports.CognitoPort {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := cognitoidentityprovider.NewFromConfig(awsCfg, func(o *cognitoidentityprovider.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &CognitoAdapter{
		client: client,
	}
}

func (a *CognitoAdapter) ListUserPools(ctx context.Context, input *cognitoidentityprovider.ListUserPoolsInput) (*cognitoidentityprovider.ListUserPoolsOutput, error) {
	return a.client.ListUserPools(ctx, input)
}

func (a *CognitoAdapter) CreateUserPool(ctx context.Context, input *cognitoidentityprovider.CreateUserPoolInput) (*cognitoidentityprovider.CreateUserPoolOutput, error) {
	return a.client.CreateUserPool(ctx, input)
}

func (a *CognitoAdapter) DescribeUserPool(ctx context.Context, input *cognitoidentityprovider.DescribeUserPoolInput) (*cognitoidentityprovider.DescribeUserPoolOutput, error) {
	return a.client.DescribeUserPool(ctx, input)
}

func (a *CognitoAdapter) DeleteUserPool(ctx context.Context, input *cognitoidentityprovider.DeleteUserPoolInput) (*cognitoidentityprovider.DeleteUserPoolOutput, error) {
	return a.client.DeleteUserPool(ctx, input)
}

func (a *CognitoAdapter) UpdateUserPool(ctx context.Context, input *cognitoidentityprovider.UpdateUserPoolInput) (*cognitoidentityprovider.UpdateUserPoolOutput, error) {
	return a.client.UpdateUserPool(ctx, input)
}

func (a *CognitoAdapter) ListUsers(ctx context.Context, input *cognitoidentityprovider.ListUsersInput) (*cognitoidentityprovider.ListUsersOutput, error) {
	return a.client.ListUsers(ctx, input)
}

func (a *CognitoAdapter) AdminCreateUser(ctx context.Context, input *cognitoidentityprovider.AdminCreateUserInput) (*cognitoidentityprovider.AdminCreateUserOutput, error) {
	return a.client.AdminCreateUser(ctx, input)
}

func (a *CognitoAdapter) GetUser(ctx context.Context, input *cognitoidentityprovider.GetUserInput) (*cognitoidentityprovider.GetUserOutput, error) {
	return a.client.GetUser(ctx, input)
}

func (a *CognitoAdapter) AdminDeleteUser(ctx context.Context, input *cognitoidentityprovider.AdminDeleteUserInput) (*cognitoidentityprovider.AdminDeleteUserOutput, error) {
	return a.client.AdminDeleteUser(ctx, input)
}

func (a *CognitoAdapter) AdminGetUser(ctx context.Context, input *cognitoidentityprovider.AdminGetUserInput) (*cognitoidentityprovider.AdminGetUserOutput, error) {
	return a.client.AdminGetUser(ctx, input)
}

func (a *CognitoAdapter) AdminUpdateUserAttributes(ctx context.Context, input *cognitoidentityprovider.AdminUpdateUserAttributesInput) (*cognitoidentityprovider.AdminUpdateUserAttributesOutput, error) {
	return a.client.AdminUpdateUserAttributes(ctx, input)
}

func (a *CognitoAdapter) ListGroups(ctx context.Context, input *cognitoidentityprovider.ListGroupsInput) (*cognitoidentityprovider.ListGroupsOutput, error) {
	return a.client.ListGroups(ctx, input)
}

func (a *CognitoAdapter) CreateGroup(ctx context.Context, input *cognitoidentityprovider.CreateGroupInput) (*cognitoidentityprovider.CreateGroupOutput, error) {
	return a.client.CreateGroup(ctx, input)
}

func (a *CognitoAdapter) GetGroup(ctx context.Context, input *cognitoidentityprovider.GetGroupInput) (*cognitoidentityprovider.GetGroupOutput, error) {
	return a.client.GetGroup(ctx, input)
}

func (a *CognitoAdapter) DeleteGroup(ctx context.Context, input *cognitoidentityprovider.DeleteGroupInput) (*cognitoidentityprovider.DeleteGroupOutput, error) {
	return a.client.DeleteGroup(ctx, input)
}

func (a *CognitoAdapter) UpdateGroup(ctx context.Context, input *cognitoidentityprovider.UpdateGroupInput) (*cognitoidentityprovider.UpdateGroupOutput, error) {
	return a.client.UpdateGroup(ctx, input)
}

func (a *CognitoAdapter) ListUserPoolClients(ctx context.Context, input *cognitoidentityprovider.ListUserPoolClientsInput) (*cognitoidentityprovider.ListUserPoolClientsOutput, error) {
	return a.client.ListUserPoolClients(ctx, input)
}

func (a *CognitoAdapter) CreateUserPoolClient(ctx context.Context, input *cognitoidentityprovider.CreateUserPoolClientInput) (*cognitoidentityprovider.CreateUserPoolClientOutput, error) {
	return a.client.CreateUserPoolClient(ctx, input)
}

func (a *CognitoAdapter) DescribeUserPoolClient(ctx context.Context, input *cognitoidentityprovider.DescribeUserPoolClientInput) (*cognitoidentityprovider.DescribeUserPoolClientOutput, error) {
	return a.client.DescribeUserPoolClient(ctx, input)
}

func (a *CognitoAdapter) DeleteUserPoolClient(ctx context.Context, input *cognitoidentityprovider.DeleteUserPoolClientInput) (*cognitoidentityprovider.DeleteUserPoolClientOutput, error) {
	return a.client.DeleteUserPoolClient(ctx, input)
}

func (a *CognitoAdapter) UpdateUserPoolClient(ctx context.Context, input *cognitoidentityprovider.UpdateUserPoolClientInput) (*cognitoidentityprovider.UpdateUserPoolClientOutput, error) {
	return a.client.UpdateUserPoolClient(ctx, input)
}

func (a *CognitoAdapter) AdminSetUserPassword(ctx context.Context, input *cognitoidentityprovider.AdminSetUserPasswordInput) (*cognitoidentityprovider.AdminSetUserPasswordOutput, error) {
	return a.client.AdminSetUserPassword(ctx, input)
}

func (a *CognitoAdapter) AdminAddUserToGroup(ctx context.Context, input *cognitoidentityprovider.AdminAddUserToGroupInput) (*cognitoidentityprovider.AdminAddUserToGroupOutput, error) {
	return a.client.AdminAddUserToGroup(ctx, input)
}

func (a *CognitoAdapter) AdminRemoveUserFromGroup(ctx context.Context, input *cognitoidentityprovider.AdminRemoveUserFromGroupInput) (*cognitoidentityprovider.AdminRemoveUserFromGroupOutput, error) {
	return a.client.AdminRemoveUserFromGroup(ctx, input)
}

func (a *CognitoAdapter) AdminListGroupsForUser(ctx context.Context, input *cognitoidentityprovider.AdminListGroupsForUserInput) (*cognitoidentityprovider.AdminListGroupsForUserOutput, error) {
	return a.client.AdminListGroupsForUser(ctx, input)
}

func (a *CognitoAdapter) ListUsersInGroup(ctx context.Context, input *cognitoidentityprovider.ListUsersInGroupInput) (*cognitoidentityprovider.ListUsersInGroupOutput, error) {
	return a.client.ListUsersInGroup(ctx, input)
}

func (a *CognitoAdapter) CreateResourceServer(ctx context.Context, input *cognitoidentityprovider.CreateResourceServerInput) (*cognitoidentityprovider.CreateResourceServerOutput, error) {
	return a.client.CreateResourceServer(ctx, input)
}

func (a *CognitoAdapter) DescribeResourceServer(ctx context.Context, input *cognitoidentityprovider.DescribeResourceServerInput) (*cognitoidentityprovider.DescribeResourceServerOutput, error) {
	return a.client.DescribeResourceServer(ctx, input)
}

func (a *CognitoAdapter) ListResourceServers(ctx context.Context, input *cognitoidentityprovider.ListResourceServersInput) (*cognitoidentityprovider.ListResourceServersOutput, error) {
	return a.client.ListResourceServers(ctx, input)
}

func (a *CognitoAdapter) DeleteResourceServer(ctx context.Context, input *cognitoidentityprovider.DeleteResourceServerInput) (*cognitoidentityprovider.DeleteResourceServerOutput, error) {
	return a.client.DeleteResourceServer(ctx, input)
}

func (a *CognitoAdapter) ListTagsForResource(ctx context.Context, input *cognitoidentityprovider.ListTagsForResourceInput) (*cognitoidentityprovider.ListTagsForResourceOutput, error) {
	return a.client.ListTagsForResource(ctx, input)
}

func (a *CognitoAdapter) TagResource(ctx context.Context, input *cognitoidentityprovider.TagResourceInput) (*cognitoidentityprovider.TagResourceOutput, error) {
	return a.client.TagResource(ctx, input)
}

func (a *CognitoAdapter) UntagResource(ctx context.Context, input *cognitoidentityprovider.UntagResourceInput) (*cognitoidentityprovider.UntagResourceOutput, error) {
	return a.client.UntagResource(ctx, input)
}

func (a *CognitoAdapter) InitiateAuth(ctx context.Context, input *cognitoidentityprovider.InitiateAuthInput) (*cognitoidentityprovider.InitiateAuthOutput, error) {
	return a.client.InitiateAuth(ctx, input)
}

func (a *CognitoAdapter) AdminInitiateAuth(ctx context.Context, input *cognitoidentityprovider.AdminInitiateAuthInput) (*cognitoidentityprovider.AdminInitiateAuthOutput, error) {
	return a.client.AdminInitiateAuth(ctx, input)
}

func (a *CognitoAdapter) RespondToAuthChallenge(ctx context.Context, input *cognitoidentityprovider.RespondToAuthChallengeInput) (*cognitoidentityprovider.RespondToAuthChallengeOutput, error) {
	return a.client.RespondToAuthChallenge(ctx, input)
}