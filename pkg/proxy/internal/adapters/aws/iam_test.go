package aws

import (
	"context"
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
