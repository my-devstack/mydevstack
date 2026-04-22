package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/iam/types"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type ListUsersForGroupInput = ports.ListUsersForGroupInput
type ListUsersForGroupOutput = ports.ListUsersForGroupOutput

type IAMAdapter struct {
	client       ports.IAMClientPort
	directClient *iam.Client
}

func NewIAMAdapter(awsCfg aws.Config, endpoint string) ports.IAMPort {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := iam.NewFromConfig(awsCfg, func(o *iam.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &IAMAdapter{
		client:       client,
		directClient: client,
	}
}

func (a *IAMAdapter) CreateUser(ctx context.Context, input *iam.CreateUserInput) (*iam.CreateUserOutput, error) {
	return a.client.CreateUser(ctx, input)
}

func (a *IAMAdapter) GetUser(ctx context.Context, input *iam.GetUserInput) (*iam.GetUserOutput, error) {
	return a.client.GetUser(ctx, input)
}

func (a *IAMAdapter) ListUsers(ctx context.Context, input *iam.ListUsersInput) (*iam.ListUsersOutput, error) {
	return a.client.ListUsers(ctx, input)
}

func (a *IAMAdapter) DeleteUser(ctx context.Context, input *iam.DeleteUserInput) (*iam.DeleteUserOutput, error) {
	return a.client.DeleteUser(ctx, input)
}

func (a *IAMAdapter) CreateRole(ctx context.Context, input *iam.CreateRoleInput) (*iam.CreateRoleOutput, error) {
	return a.client.CreateRole(ctx, input)
}

func (a *IAMAdapter) GetRole(ctx context.Context, input *iam.GetRoleInput) (*iam.GetRoleOutput, error) {
	return a.client.GetRole(ctx, input)
}

func (a *IAMAdapter) ListRoles(ctx context.Context, input *iam.ListRolesInput) (*iam.ListRolesOutput, error) {
	return a.client.ListRoles(ctx, input)
}

func (a *IAMAdapter) DeleteRole(ctx context.Context, input *iam.DeleteRoleInput) (*iam.DeleteRoleOutput, error) {
	return a.client.DeleteRole(ctx, input)
}

func (a *IAMAdapter) ListPolicies(ctx context.Context, input *iam.ListPoliciesInput) (*iam.ListPoliciesOutput, error) {
	return a.client.ListPolicies(ctx, input)
}

func (a *IAMAdapter) GetPolicy(ctx context.Context, input *iam.GetPolicyInput) (*iam.GetPolicyOutput, error) {
	return a.client.GetPolicy(ctx, input)
}

func (a *IAMAdapter) CreatePolicy(ctx context.Context, input *iam.CreatePolicyInput) (*iam.CreatePolicyOutput, error) {
	return a.client.CreatePolicy(ctx, input)
}

func (a *IAMAdapter) DeletePolicy(ctx context.Context, input *iam.DeletePolicyInput) (*iam.DeletePolicyOutput, error) {
	return a.client.DeletePolicy(ctx, input)
}

func (a *IAMAdapter) CreateAccessKey(ctx context.Context, input *iam.CreateAccessKeyInput) (*iam.CreateAccessKeyOutput, error) {
	return a.client.CreateAccessKey(ctx, input)
}

func (a *IAMAdapter) ListAccessKeys(ctx context.Context, input *iam.ListAccessKeysInput) (*iam.ListAccessKeysOutput, error) {
	return a.client.ListAccessKeys(ctx, input)
}

func (a *IAMAdapter) DeleteAccessKey(ctx context.Context, input *iam.DeleteAccessKeyInput) (*iam.DeleteAccessKeyOutput, error) {
	return a.client.DeleteAccessKey(ctx, input)
}

func (a *IAMAdapter) UpdateAccessKeyStatus(ctx context.Context, input *iam.UpdateAccessKeyInput) (*iam.UpdateAccessKeyOutput, error) {
	return a.client.UpdateAccessKey(ctx, input)
}

func (a *IAMAdapter) AttachRolePolicy(ctx context.Context, input *iam.AttachRolePolicyInput) (*iam.AttachRolePolicyOutput, error) {
	return a.client.AttachRolePolicy(ctx, input)
}

func (a *IAMAdapter) DetachRolePolicy(ctx context.Context, input *iam.DetachRolePolicyInput) (*iam.DetachRolePolicyOutput, error) {
	return a.client.DetachRolePolicy(ctx, input)
}

func (a *IAMAdapter) ListAttachedRolePolicies(ctx context.Context, input *iam.ListAttachedRolePoliciesInput) (*iam.ListAttachedRolePoliciesOutput, error) {
	return a.client.ListAttachedRolePolicies(ctx, input)
}

func (a *IAMAdapter) CreateGroup(ctx context.Context, input *iam.CreateGroupInput) (*iam.CreateGroupOutput, error) {
	return a.client.CreateGroup(ctx, input)
}

func (a *IAMAdapter) GetGroup(ctx context.Context, input *iam.GetGroupInput) (*iam.GetGroupOutput, error) {
	return a.client.GetGroup(ctx, input)
}

func (a *IAMAdapter) ListUsersForGroup(ctx context.Context, input *ListUsersForGroupInput) (*ListUsersForGroupOutput, error) {
	output, err := a.client.GetGroup(ctx, &iam.GetGroupInput{GroupName: input.GroupName})
	if err != nil {
		return nil, err
	}
	users := make([]types.User, len(output.Users))
	copy(users, output.Users)
	return &ListUsersForGroupOutput{
		Users:       users,
		IsTruncated: output.IsTruncated,
		Marker:      output.Marker,
	}, nil
}

func (a *IAMAdapter) ListGroups(ctx context.Context, input *iam.ListGroupsInput) (*iam.ListGroupsOutput, error) {
	return a.client.ListGroups(ctx, input)
}

func (a *IAMAdapter) DeleteGroup(ctx context.Context, input *iam.DeleteGroupInput) (*iam.DeleteGroupOutput, error) {
	return a.client.DeleteGroup(ctx, input)
}

func (a *IAMAdapter) AddUserToGroup(ctx context.Context, input *iam.AddUserToGroupInput) (*iam.AddUserToGroupOutput, error) {
	return a.client.AddUserToGroup(ctx, input)
}

func (a *IAMAdapter) RemoveUserFromGroup(ctx context.Context, input *iam.RemoveUserFromGroupInput) (*iam.RemoveUserFromGroupOutput, error) {
	return a.client.RemoveUserFromGroup(ctx, input)
}

func (a *IAMAdapter) ListGroupsForUser(ctx context.Context, input *iam.ListGroupsForUserInput) (*iam.ListGroupsForUserOutput, error) {
	return a.client.ListGroupsForUser(ctx, input)
}

func (a *IAMAdapter) ListUserPolicies(ctx context.Context, input *iam.ListUserPoliciesInput) (*iam.ListUserPoliciesOutput, error) {
	return a.client.ListUserPolicies(ctx, input)
}

func (a *IAMAdapter) ListRolePolicies(ctx context.Context, input *iam.ListRolePoliciesInput) (*iam.ListRolePoliciesOutput, error) {
	return a.client.ListRolePolicies(ctx, input)
}

func (a *IAMAdapter) GetRolePolicy(ctx context.Context, input *iam.GetRolePolicyInput) (*iam.GetRolePolicyOutput, error) {
	return a.client.GetRolePolicy(ctx, input)
}
