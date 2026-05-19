package aws

import (
	"context"
	"errors"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/iam/types"
	iammocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewIAMAdapter(t *testing.T) {
	adapter := NewIAMAdapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566")
	assert.NotNil(t, adapter)
	assert.IsType(t, &IAMAdapter{}, adapter)
}

func TestIAMAdapter_CreateUser(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.CreateUserInput{UserName: aws.String("test-user")}
	expectedOutput := &iam.CreateUserOutput{User: &types.User{UserName: aws.String("test-user")}}

	mockClient.EXPECT().CreateUser(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.CreateUser(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_GetUser(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.GetUserInput{UserName: aws.String("test-user")}
	expectedOutput := &iam.GetUserOutput{User: &types.User{UserName: aws.String("test-user")}}

	mockClient.EXPECT().GetUser(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.GetUser(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_ListUsers(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.ListUsersInput{}
	expectedOutput := &iam.ListUsersOutput{Users: []types.User{{UserName: aws.String("test-user")}}}

	mockClient.EXPECT().ListUsers(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.ListUsers(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_DeleteUser(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.DeleteUserInput{UserName: aws.String("test-user")}
	expectedOutput := &iam.DeleteUserOutput{}

	mockClient.EXPECT().DeleteUser(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.DeleteUser(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_CreateRole(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.CreateRoleInput{RoleName: aws.String("test-role")}
	expectedOutput := &iam.CreateRoleOutput{Role: &types.Role{RoleName: aws.String("test-role")}}

	mockClient.EXPECT().CreateRole(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.CreateRole(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_GetRole(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.GetRoleInput{RoleName: aws.String("test-role")}
	expectedOutput := &iam.GetRoleOutput{Role: &types.Role{RoleName: aws.String("test-role")}}

	mockClient.EXPECT().GetRole(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.GetRole(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_ListRoles(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.ListRolesInput{}
	expectedOutput := &iam.ListRolesOutput{Roles: []types.Role{{RoleName: aws.String("test-role")}}}

	mockClient.EXPECT().ListRoles(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.ListRoles(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_DeleteRole(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.DeleteRoleInput{RoleName: aws.String("test-role")}
	expectedOutput := &iam.DeleteRoleOutput{}

	mockClient.EXPECT().DeleteRole(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.DeleteRole(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_CreateAccessKey(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.CreateAccessKeyInput{UserName: aws.String("test-user")}
	expectedOutput := &iam.CreateAccessKeyOutput{AccessKey: &types.AccessKey{AccessKeyId: aws.String("AKIA123456789"), SecretAccessKey: aws.String("secret")}}

	mockClient.EXPECT().CreateAccessKey(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.CreateAccessKey(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_ListAccessKeys(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.ListAccessKeysInput{UserName: aws.String("test-user")}
	expectedOutput := &iam.ListAccessKeysOutput{AccessKeyMetadata: []types.AccessKeyMetadata{{AccessKeyId: aws.String("AKIA123456789")}}}

	mockClient.EXPECT().ListAccessKeys(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.ListAccessKeys(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_DeleteAccessKey(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.DeleteAccessKeyInput{AccessKeyId: aws.String("AKIA123456789"), UserName: aws.String("test-user")}
	expectedOutput := &iam.DeleteAccessKeyOutput{}

	mockClient.EXPECT().DeleteAccessKey(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.DeleteAccessKey(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_AttachRolePolicy(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.AttachRolePolicyInput{RoleName: aws.String("test-role"), PolicyArn: aws.String("arn:aws:iam::123456789:policy/test-policy")}
	expectedOutput := &iam.AttachRolePolicyOutput{}

	mockClient.EXPECT().AttachRolePolicy(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.AttachRolePolicy(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_DetachRolePolicy(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.DetachRolePolicyInput{RoleName: aws.String("test-role"), PolicyArn: aws.String("arn:aws:iam::123456789:policy/test-policy")}
	expectedOutput := &iam.DetachRolePolicyOutput{}

	mockClient.EXPECT().DetachRolePolicy(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.DetachRolePolicy(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_CreateGroup(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.CreateGroupInput{GroupName: aws.String("test-group")}
	expectedOutput := &iam.CreateGroupOutput{Group: &types.Group{GroupName: aws.String("test-group")}}

	mockClient.EXPECT().CreateGroup(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.CreateGroup(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_GetGroup(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.GetGroupInput{GroupName: aws.String("test-group")}
	expectedOutput := &iam.GetGroupOutput{Group: &types.Group{GroupName: aws.String("test-group")}}

	mockClient.EXPECT().GetGroup(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.GetGroup(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_ListGroups(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.ListGroupsInput{}
	expectedOutput := &iam.ListGroupsOutput{Groups: []types.Group{{GroupName: aws.String("test-group")}}}

	mockClient.EXPECT().ListGroups(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.ListGroups(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_DeleteGroup(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.DeleteGroupInput{GroupName: aws.String("test-group")}
	expectedOutput := &iam.DeleteGroupOutput{}

	mockClient.EXPECT().DeleteGroup(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.DeleteGroup(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_DeletePolicy(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.DeletePolicyInput{PolicyArn: aws.String("arn:aws:iam::123456789:policy/test-policy")}
	expectedOutput := &iam.DeletePolicyOutput{}

	mockClient.EXPECT().DeletePolicy(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.DeletePolicy(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_CreatePolicy(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.CreatePolicyInput{
		PolicyName:     aws.String("test-policy"),
		PolicyDocument: aws.String(`{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"s3:*","Resource":"*"}]}`),
		Description:    aws.String("Test policy"),
	}
	expectedOutput := &iam.CreatePolicyOutput{Policy: &types.Policy{PolicyName: aws.String("test-policy")}}

	mockClient.EXPECT().CreatePolicy(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.CreatePolicy(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_ListUsersForGroup(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &ListUsersForGroupInput{GroupName: aws.String("test-group")}
	expectedOutput := &iam.GetGroupOutput{
		Group:       &types.Group{GroupName: aws.String("test-group")},
		Users:       []types.User{{UserName: aws.String("user1")}},
		IsTruncated: false,
	}

	mockClient.EXPECT().GetGroup(ctx, &iam.GetGroupInput{GroupName: input.GroupName}).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}

	output, err := adapter.ListUsersForGroup(ctx, input)
	assert.NoError(t, err)
	assert.Len(t, output.Users, 1)
	assert.Equal(t, "user1", *output.Users[0].UserName)
}

func TestIAMAdapter_ListPolicies(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.ListPoliciesInput{}
	expectedOutput := &iam.ListPoliciesOutput{}
	mockClient.EXPECT().ListPolicies(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.ListPolicies(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_GetPolicy(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.GetPolicyInput{PolicyArn: aws.String("arn:aws:iam::123456789:policy/test-policy")}
	expectedOutput := &iam.GetPolicyOutput{Policy: &types.Policy{PolicyName: aws.String("test-policy")}}
	mockClient.EXPECT().GetPolicy(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.GetPolicy(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_UpdateAccessKeyStatus(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.UpdateAccessKeyInput{UserName: aws.String("test-user"), AccessKeyId: aws.String("AKIA123456789"), Status: types.StatusTypeActive}
	expectedOutput := &iam.UpdateAccessKeyOutput{}
	mockClient.EXPECT().UpdateAccessKey(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.UpdateAccessKeyStatus(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_ListAttachedRolePolicies(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.ListAttachedRolePoliciesInput{RoleName: aws.String("test-role")}
	expectedOutput := &iam.ListAttachedRolePoliciesOutput{}
	mockClient.EXPECT().ListAttachedRolePolicies(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.ListAttachedRolePolicies(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_AddUserToGroup(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.AddUserToGroupInput{GroupName: aws.String("test-group"), UserName: aws.String("test-user")}
	expectedOutput := &iam.AddUserToGroupOutput{}
	mockClient.EXPECT().AddUserToGroup(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.AddUserToGroup(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_RemoveUserFromGroup(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.RemoveUserFromGroupInput{GroupName: aws.String("test-group"), UserName: aws.String("test-user")}
	expectedOutput := &iam.RemoveUserFromGroupOutput{}
	mockClient.EXPECT().RemoveUserFromGroup(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.RemoveUserFromGroup(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_ListGroupsForUser(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.ListGroupsForUserInput{UserName: aws.String("test-user")}
	expectedOutput := &iam.ListGroupsForUserOutput{}
	mockClient.EXPECT().ListGroupsForUser(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.ListGroupsForUser(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_ListUserPolicies(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.ListUserPoliciesInput{UserName: aws.String("test-user")}
	expectedOutput := &iam.ListUserPoliciesOutput{}
	mockClient.EXPECT().ListUserPolicies(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.ListUserPolicies(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_ListRolePolicies(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.ListRolePoliciesInput{RoleName: aws.String("test-role")}
	expectedOutput := &iam.ListRolePoliciesOutput{}
	mockClient.EXPECT().ListRolePolicies(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.ListRolePolicies(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_GetRolePolicy(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.GetRolePolicyInput{RoleName: aws.String("test-role"), PolicyName: aws.String("test-policy")}
	expectedOutput := &iam.GetRolePolicyOutput{}
	mockClient.EXPECT().GetRolePolicy(ctx, input).Return(expectedOutput, nil)
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.GetRolePolicy(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestIAMAdapter_ListPolicies_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.ListPoliciesInput{}
	mockClient.EXPECT().ListPolicies(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.ListPolicies(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_GetPolicy_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.GetPolicyInput{PolicyArn: aws.String("arn:aws:iam::123456789:policy/test-policy")}
	mockClient.EXPECT().GetPolicy(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.GetPolicy(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_UpdateAccessKeyStatus_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.UpdateAccessKeyInput{UserName: aws.String("test-user"), AccessKeyId: aws.String("AKIA123456789"), Status: types.StatusTypeActive}
	mockClient.EXPECT().UpdateAccessKey(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.UpdateAccessKeyStatus(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_ListAttachedRolePolicies_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.ListAttachedRolePoliciesInput{RoleName: aws.String("test-role")}
	mockClient.EXPECT().ListAttachedRolePolicies(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.ListAttachedRolePolicies(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_AddUserToGroup_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.AddUserToGroupInput{GroupName: aws.String("test-group"), UserName: aws.String("test-user")}
	mockClient.EXPECT().AddUserToGroup(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.AddUserToGroup(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_RemoveUserFromGroup_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.RemoveUserFromGroupInput{GroupName: aws.String("test-group"), UserName: aws.String("test-user")}
	mockClient.EXPECT().RemoveUserFromGroup(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.RemoveUserFromGroup(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_ListGroupsForUser_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.ListGroupsForUserInput{UserName: aws.String("test-user")}
	mockClient.EXPECT().ListGroupsForUser(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.ListGroupsForUser(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_ListUserPolicies_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.ListUserPoliciesInput{UserName: aws.String("test-user")}
	mockClient.EXPECT().ListUserPolicies(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.ListUserPolicies(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_ListRolePolicies_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.ListRolePoliciesInput{RoleName: aws.String("test-role")}
	mockClient.EXPECT().ListRolePolicies(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.ListRolePolicies(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_GetRolePolicy_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.GetRolePolicyInput{RoleName: aws.String("test-role"), PolicyName: aws.String("test-policy")}
	mockClient.EXPECT().GetRolePolicy(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.GetRolePolicy(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_CreateUser_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.CreateUserInput{UserName: aws.String("test-user")}
	mockClient.EXPECT().CreateUser(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.CreateUser(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_GetUser_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.GetUserInput{UserName: aws.String("test-user")}
	mockClient.EXPECT().GetUser(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.GetUser(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_ListUsers_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.ListUsersInput{}
	mockClient.EXPECT().ListUsers(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.ListUsers(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_DeleteUser_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.DeleteUserInput{UserName: aws.String("test-user")}
	mockClient.EXPECT().DeleteUser(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.DeleteUser(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_CreateRole_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.CreateRoleInput{RoleName: aws.String("test-role")}
	mockClient.EXPECT().CreateRole(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.CreateRole(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_GetRole_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.GetRoleInput{RoleName: aws.String("test-role")}
	mockClient.EXPECT().GetRole(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.GetRole(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_ListRoles_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.ListRolesInput{}
	mockClient.EXPECT().ListRoles(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.ListRoles(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_DeleteRole_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.DeleteRoleInput{RoleName: aws.String("test-role")}
	mockClient.EXPECT().DeleteRole(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.DeleteRole(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_CreatePolicy_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.CreatePolicyInput{
		PolicyName:     aws.String("test-policy"),
		PolicyDocument: aws.String(`{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"s3:*","Resource":"*"}]}`),
		Description:    aws.String("Test policy"),
	}
	mockClient.EXPECT().CreatePolicy(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.CreatePolicy(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_DeletePolicy_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.DeletePolicyInput{PolicyArn: aws.String("arn:aws:iam::123456789:policy/test-policy")}
	mockClient.EXPECT().DeletePolicy(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.DeletePolicy(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_CreateAccessKey_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.CreateAccessKeyInput{UserName: aws.String("test-user")}
	mockClient.EXPECT().CreateAccessKey(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.CreateAccessKey(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_ListAccessKeys_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.ListAccessKeysInput{UserName: aws.String("test-user")}
	mockClient.EXPECT().ListAccessKeys(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.ListAccessKeys(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_DeleteAccessKey_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.DeleteAccessKeyInput{AccessKeyId: aws.String("AKIA123456789"), UserName: aws.String("test-user")}
	mockClient.EXPECT().DeleteAccessKey(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.DeleteAccessKey(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_AttachRolePolicy_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.AttachRolePolicyInput{RoleName: aws.String("test-role"), PolicyArn: aws.String("arn:aws:iam::123456789:policy/test-policy")}
	mockClient.EXPECT().AttachRolePolicy(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.AttachRolePolicy(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_DetachRolePolicy_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.DetachRolePolicyInput{RoleName: aws.String("test-role"), PolicyArn: aws.String("arn:aws:iam::123456789:policy/test-policy")}
	mockClient.EXPECT().DetachRolePolicy(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.DetachRolePolicy(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_CreateGroup_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.CreateGroupInput{GroupName: aws.String("test-group")}
	mockClient.EXPECT().CreateGroup(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.CreateGroup(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_GetGroup_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.GetGroupInput{GroupName: aws.String("test-group")}
	mockClient.EXPECT().GetGroup(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.GetGroup(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_ListGroups_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.ListGroupsInput{}
	mockClient.EXPECT().ListGroups(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.ListGroups(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_DeleteGroup_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &iam.DeleteGroupInput{GroupName: aws.String("test-group")}
	mockClient.EXPECT().DeleteGroup(ctx, input).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.DeleteGroup(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestIAMAdapter_ListUsersForGroup_Error(t *testing.T) {
	mockClient := iammocks.NewIAMClientPort(t)
	ctx := context.Background()
	input := &ListUsersForGroupInput{GroupName: aws.String("test-group")}
	mockClient.EXPECT().GetGroup(ctx, &iam.GetGroupInput{GroupName: input.GroupName}).Return(nil, errors.New("some error"))
	adapter := &IAMAdapter{client: mockClient}
	output, err := adapter.ListUsersForGroup(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}
