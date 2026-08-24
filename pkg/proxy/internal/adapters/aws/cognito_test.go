package aws

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"
	cognitomocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewCognitoAdapter(t *testing.T) {
	adapter := NewCognitoAdapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566")
	assert.NotNil(t, adapter)
	assert.IsType(t, &CognitoAdapter{}, adapter)
}

func TestCognitoAdapter_ListUserPools(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.ListUserPoolsInput{MaxResults: aws.Int32(10)}
	expectedOutput := &cognitoidentityprovider.ListUserPoolsOutput{
		UserPools: []types.UserPoolDescriptionType{{Id: aws.String("us-east-1_abc123"), Name: aws.String("test-pool")}},
	}

	mockClient.EXPECT().ListUserPools(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.ListUserPools(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_ListUserPools_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.ListUserPoolsInput{}
	mockClient.EXPECT().ListUserPools(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.ListUserPools(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_CreateUserPool(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.CreateUserPoolInput{PoolName: aws.String("test-pool")}
	expectedOutput := &cognitoidentityprovider.CreateUserPoolOutput{
		UserPool: &types.UserPoolType{Id: aws.String("us-east-1_abc123"), Name: aws.String("test-pool")},
	}

	mockClient.EXPECT().CreateUserPool(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.CreateUserPool(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_CreateUserPool_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.CreateUserPoolInput{PoolName: aws.String("test-pool")}
	mockClient.EXPECT().CreateUserPool(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.CreateUserPool(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_DescribeUserPool(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.DescribeUserPoolInput{UserPoolId: aws.String("us-east-1_abc123")}
	expectedOutput := &cognitoidentityprovider.DescribeUserPoolOutput{
		UserPool: &types.UserPoolType{Id: aws.String("us-east-1_abc123"), Name: aws.String("test-pool")},
	}

	mockClient.EXPECT().DescribeUserPool(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.DescribeUserPool(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_DescribeUserPool_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.DescribeUserPoolInput{UserPoolId: aws.String("us-east-1_abc123")}
	mockClient.EXPECT().DescribeUserPool(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.DescribeUserPool(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_DeleteUserPool(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.DeleteUserPoolInput{UserPoolId: aws.String("us-east-1_abc123")}
	expectedOutput := &cognitoidentityprovider.DeleteUserPoolOutput{}

	mockClient.EXPECT().DeleteUserPool(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.DeleteUserPool(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_DeleteUserPool_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.DeleteUserPoolInput{UserPoolId: aws.String("us-east-1_abc123")}
	mockClient.EXPECT().DeleteUserPool(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.DeleteUserPool(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_UpdateUserPool(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.UpdateUserPoolInput{UserPoolId: aws.String("us-east-1_abc123")}
	expectedOutput := &cognitoidentityprovider.UpdateUserPoolOutput{}

	mockClient.EXPECT().UpdateUserPool(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.UpdateUserPool(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_UpdateUserPool_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.UpdateUserPoolInput{UserPoolId: aws.String("us-east-1_abc123")}
	mockClient.EXPECT().UpdateUserPool(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.UpdateUserPool(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_ListUsers(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.ListUsersInput{UserPoolId: aws.String("us-east-1_abc123")}
	expectedOutput := &cognitoidentityprovider.ListUsersOutput{
		Users: []types.UserType{{Username: aws.String("test-user"), Enabled: true}},
	}

	mockClient.EXPECT().ListUsers(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.ListUsers(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_ListUsers_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.ListUsersInput{UserPoolId: aws.String("us-east-1_abc123")}
	mockClient.EXPECT().ListUsers(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.ListUsers(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_AdminCreateUser(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.AdminCreateUserInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Username:   aws.String("test-user"),
	}
	expectedOutput := &cognitoidentityprovider.AdminCreateUserOutput{
		User: &types.UserType{Username: aws.String("test-user"), Enabled: true},
	}

	mockClient.EXPECT().AdminCreateUser(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.AdminCreateUser(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_AdminCreateUser_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.AdminCreateUserInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Username:   aws.String("test-user"),
	}
	mockClient.EXPECT().AdminCreateUser(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.AdminCreateUser(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_GetUser(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.GetUserInput{AccessToken: aws.String("token")}
	expectedOutput := &cognitoidentityprovider.GetUserOutput{Username: aws.String("test-user")}

	mockClient.EXPECT().GetUser(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.GetUser(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_GetUser_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.GetUserInput{AccessToken: aws.String("token")}
	mockClient.EXPECT().GetUser(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.GetUser(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_AdminDeleteUser(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.AdminDeleteUserInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Username:   aws.String("test-user"),
	}
	expectedOutput := &cognitoidentityprovider.AdminDeleteUserOutput{}

	mockClient.EXPECT().AdminDeleteUser(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.AdminDeleteUser(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_AdminDeleteUser_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.AdminDeleteUserInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Username:   aws.String("test-user"),
	}
	mockClient.EXPECT().AdminDeleteUser(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.AdminDeleteUser(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_AdminGetUser(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.AdminGetUserInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Username:   aws.String("test-user"),
	}
	expectedOutput := &cognitoidentityprovider.AdminGetUserOutput{
		Username:             aws.String("test-user"),
		UserStatus:           types.UserStatusTypeConfirmed,
		Enabled:              true,
		UserCreateDate:       aws.Time(time.Now()),
		UserLastModifiedDate: aws.Time(time.Now()),
	}

	mockClient.EXPECT().AdminGetUser(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.AdminGetUser(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_AdminGetUser_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.AdminGetUserInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Username:   aws.String("test-user"),
	}
	mockClient.EXPECT().AdminGetUser(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.AdminGetUser(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_ListGroups(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.ListGroupsInput{UserPoolId: aws.String("us-east-1_abc123")}
	expectedOutput := &cognitoidentityprovider.ListGroupsOutput{
		Groups: []types.GroupType{{GroupName: aws.String("admins")}},
	}

	mockClient.EXPECT().ListGroups(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.ListGroups(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_ListGroups_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.ListGroupsInput{UserPoolId: aws.String("us-east-1_abc123")}
	mockClient.EXPECT().ListGroups(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.ListGroups(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_CreateGroup(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.CreateGroupInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		GroupName:  aws.String("admins"),
	}
	expectedOutput := &cognitoidentityprovider.CreateGroupOutput{
		Group: &types.GroupType{GroupName: aws.String("admins")},
	}

	mockClient.EXPECT().CreateGroup(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.CreateGroup(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_CreateGroup_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.CreateGroupInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		GroupName:  aws.String("admins"),
	}
	mockClient.EXPECT().CreateGroup(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.CreateGroup(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_GetGroup(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.GetGroupInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		GroupName:  aws.String("admins"),
	}
	expectedOutput := &cognitoidentityprovider.GetGroupOutput{
		Group: &types.GroupType{GroupName: aws.String("admins")},
	}

	mockClient.EXPECT().GetGroup(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.GetGroup(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_GetGroup_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.GetGroupInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		GroupName:  aws.String("admins"),
	}
	mockClient.EXPECT().GetGroup(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.GetGroup(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_DeleteGroup(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.DeleteGroupInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		GroupName:  aws.String("admins"),
	}
	expectedOutput := &cognitoidentityprovider.DeleteGroupOutput{}

	mockClient.EXPECT().DeleteGroup(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.DeleteGroup(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_DeleteGroup_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.DeleteGroupInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		GroupName:  aws.String("admins"),
	}
	mockClient.EXPECT().DeleteGroup(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.DeleteGroup(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_UpdateGroup(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.UpdateGroupInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		GroupName:  aws.String("admins"),
	}
	expectedOutput := &cognitoidentityprovider.UpdateGroupOutput{
		Group: &types.GroupType{GroupName: aws.String("admins")},
	}

	mockClient.EXPECT().UpdateGroup(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.UpdateGroup(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_UpdateGroup_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.UpdateGroupInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		GroupName:  aws.String("admins"),
	}
	mockClient.EXPECT().UpdateGroup(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.UpdateGroup(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_ListUserPoolClients(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.ListUserPoolClientsInput{UserPoolId: aws.String("us-east-1_abc123")}
	expectedOutput := &cognitoidentityprovider.ListUserPoolClientsOutput{
		UserPoolClients: []types.UserPoolClientDescription{{ClientId: aws.String("client123"), ClientName: aws.String("web")}},
	}

	mockClient.EXPECT().ListUserPoolClients(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.ListUserPoolClients(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_ListUserPoolClients_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.ListUserPoolClientsInput{UserPoolId: aws.String("us-east-1_abc123")}
	mockClient.EXPECT().ListUserPoolClients(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.ListUserPoolClients(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_CreateUserPoolClient(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.CreateUserPoolClientInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		ClientName: aws.String("web"),
	}
	expectedOutput := &cognitoidentityprovider.CreateUserPoolClientOutput{
		UserPoolClient: &types.UserPoolClientType{ClientId: aws.String("client123"), ClientName: aws.String("web")},
	}

	mockClient.EXPECT().CreateUserPoolClient(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.CreateUserPoolClient(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_CreateUserPoolClient_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.CreateUserPoolClientInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		ClientName: aws.String("web"),
	}
	mockClient.EXPECT().CreateUserPoolClient(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.CreateUserPoolClient(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_DescribeUserPoolClient(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.DescribeUserPoolClientInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		ClientId:   aws.String("client123"),
	}
	expectedOutput := &cognitoidentityprovider.DescribeUserPoolClientOutput{
		UserPoolClient: &types.UserPoolClientType{ClientId: aws.String("client123"), ClientName: aws.String("web")},
	}

	mockClient.EXPECT().DescribeUserPoolClient(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.DescribeUserPoolClient(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_DescribeUserPoolClient_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.DescribeUserPoolClientInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		ClientId:   aws.String("client123"),
	}
	mockClient.EXPECT().DescribeUserPoolClient(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.DescribeUserPoolClient(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_DeleteUserPoolClient(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.DeleteUserPoolClientInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		ClientId:   aws.String("client123"),
	}
	expectedOutput := &cognitoidentityprovider.DeleteUserPoolClientOutput{}

	mockClient.EXPECT().DeleteUserPoolClient(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.DeleteUserPoolClient(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_DeleteUserPoolClient_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.DeleteUserPoolClientInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		ClientId:   aws.String("client123"),
	}
	mockClient.EXPECT().DeleteUserPoolClient(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.DeleteUserPoolClient(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_AdminUpdateUserAttributes(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.AdminUpdateUserAttributesInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Username:   aws.String("test-user"),
		UserAttributes: []types.AttributeType{
			{Name: aws.String("email"), Value: aws.String("new@test.com")},
		},
	}
	expectedOutput := &cognitoidentityprovider.AdminUpdateUserAttributesOutput{}

	mockClient.EXPECT().AdminUpdateUserAttributes(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.AdminUpdateUserAttributes(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_AdminUpdateUserAttributes_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.AdminUpdateUserAttributesInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Username:   aws.String("test-user"),
	}
	mockClient.EXPECT().AdminUpdateUserAttributes(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.AdminUpdateUserAttributes(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_UpdateUserPoolClient(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.UpdateUserPoolClientInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		ClientId:   aws.String("client123"),
		ClientName: aws.String("web-updated"),
	}
	expectedOutput := &cognitoidentityprovider.UpdateUserPoolClientOutput{
		UserPoolClient: &types.UserPoolClientType{ClientId: aws.String("client123"), ClientName: aws.String("web-updated")},
	}

	mockClient.EXPECT().UpdateUserPoolClient(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.UpdateUserPoolClient(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_UpdateUserPoolClient_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.UpdateUserPoolClientInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		ClientId:   aws.String("client123"),
	}
	mockClient.EXPECT().UpdateUserPoolClient(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.UpdateUserPoolClient(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_AdminSetUserPassword(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.AdminSetUserPasswordInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Username:   aws.String("test-user"),
		Password:   aws.String("NewPass123!"),
		Permanent:  true,
	}
	expectedOutput := &cognitoidentityprovider.AdminSetUserPasswordOutput{}

	mockClient.EXPECT().AdminSetUserPassword(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.AdminSetUserPassword(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_AdminSetUserPassword_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.AdminSetUserPasswordInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Username:   aws.String("test-user"),
		Password:   aws.String("NewPass123!"),
	}
	mockClient.EXPECT().AdminSetUserPassword(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.AdminSetUserPassword(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_AdminAddUserToGroup(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.AdminAddUserToGroupInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Username:   aws.String("test-user"),
		GroupName:  aws.String("admins"),
	}
	expectedOutput := &cognitoidentityprovider.AdminAddUserToGroupOutput{}

	mockClient.EXPECT().AdminAddUserToGroup(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.AdminAddUserToGroup(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_AdminAddUserToGroup_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.AdminAddUserToGroupInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Username:   aws.String("test-user"),
		GroupName:  aws.String("admins"),
	}
	mockClient.EXPECT().AdminAddUserToGroup(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.AdminAddUserToGroup(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_AdminRemoveUserFromGroup(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.AdminRemoveUserFromGroupInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Username:   aws.String("test-user"),
		GroupName:  aws.String("admins"),
	}
	expectedOutput := &cognitoidentityprovider.AdminRemoveUserFromGroupOutput{}

	mockClient.EXPECT().AdminRemoveUserFromGroup(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.AdminRemoveUserFromGroup(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_AdminRemoveUserFromGroup_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.AdminRemoveUserFromGroupInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Username:   aws.String("test-user"),
		GroupName:  aws.String("admins"),
	}
	mockClient.EXPECT().AdminRemoveUserFromGroup(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.AdminRemoveUserFromGroup(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_AdminListGroupsForUser(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.AdminListGroupsForUserInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Username:   aws.String("test-user"),
	}
	expectedOutput := &cognitoidentityprovider.AdminListGroupsForUserOutput{
		Groups: []types.GroupType{{GroupName: aws.String("admins")}},
	}

	mockClient.EXPECT().AdminListGroupsForUser(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.AdminListGroupsForUser(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_AdminListGroupsForUser_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.AdminListGroupsForUserInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Username:   aws.String("test-user"),
	}
	mockClient.EXPECT().AdminListGroupsForUser(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.AdminListGroupsForUser(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_ListUsersInGroup(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.ListUsersInGroupInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		GroupName:  aws.String("admins"),
	}
	expectedOutput := &cognitoidentityprovider.ListUsersInGroupOutput{
		Users: []types.UserType{{Username: aws.String("test-user"), Enabled: true}},
	}

	mockClient.EXPECT().ListUsersInGroup(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.ListUsersInGroup(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_ListUsersInGroup_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.ListUsersInGroupInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		GroupName:  aws.String("admins"),
	}
	mockClient.EXPECT().ListUsersInGroup(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.ListUsersInGroup(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_CreateResourceServer(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.CreateResourceServerInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Identifier: aws.String("test-api"),
		Name:       aws.String("Test API"),
	}
	expectedOutput := &cognitoidentityprovider.CreateResourceServerOutput{
		ResourceServer: &types.ResourceServerType{Identifier: aws.String("test-api"), Name: aws.String("Test API")},
	}

	mockClient.EXPECT().CreateResourceServer(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.CreateResourceServer(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_CreateResourceServer_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.CreateResourceServerInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Identifier: aws.String("test-api"),
		Name:       aws.String("Test API"),
	}
	mockClient.EXPECT().CreateResourceServer(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.CreateResourceServer(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_DescribeResourceServer(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.DescribeResourceServerInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Identifier: aws.String("test-api"),
	}
	expectedOutput := &cognitoidentityprovider.DescribeResourceServerOutput{
		ResourceServer: &types.ResourceServerType{Identifier: aws.String("test-api"), Name: aws.String("Test API")},
	}

	mockClient.EXPECT().DescribeResourceServer(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.DescribeResourceServer(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_DescribeResourceServer_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.DescribeResourceServerInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Identifier: aws.String("test-api"),
	}
	mockClient.EXPECT().DescribeResourceServer(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.DescribeResourceServer(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_ListResourceServers(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.ListResourceServersInput{UserPoolId: aws.String("us-east-1_abc123")}
	expectedOutput := &cognitoidentityprovider.ListResourceServersOutput{
		ResourceServers: []types.ResourceServerType{{Identifier: aws.String("test-api"), Name: aws.String("Test API")}},
	}

	mockClient.EXPECT().ListResourceServers(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.ListResourceServers(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_ListResourceServers_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.ListResourceServersInput{UserPoolId: aws.String("us-east-1_abc123")}
	mockClient.EXPECT().ListResourceServers(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.ListResourceServers(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_DeleteResourceServer(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.DeleteResourceServerInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Identifier: aws.String("test-api"),
	}
	expectedOutput := &cognitoidentityprovider.DeleteResourceServerOutput{}

	mockClient.EXPECT().DeleteResourceServer(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.DeleteResourceServer(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_DeleteResourceServer_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.DeleteResourceServerInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		Identifier: aws.String("test-api"),
	}
	mockClient.EXPECT().DeleteResourceServer(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.DeleteResourceServer(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_ListTagsForResource(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.ListTagsForResourceInput{ResourceArn: aws.String("us-east-1_abc123")}
	expectedOutput := &cognitoidentityprovider.ListTagsForResourceOutput{
		Tags: map[string]string{"Env": "test"},
	}

	mockClient.EXPECT().ListTagsForResource(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.ListTagsForResource(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_ListTagsForResource_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.ListTagsForResourceInput{ResourceArn: aws.String("us-east-1_abc123")}
	mockClient.EXPECT().ListTagsForResource(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.ListTagsForResource(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_TagResource(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.TagResourceInput{
		ResourceArn: aws.String("us-east-1_abc123"),
		Tags:        map[string]string{"Env": "test"},
	}
	expectedOutput := &cognitoidentityprovider.TagResourceOutput{}

	mockClient.EXPECT().TagResource(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.TagResource(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_TagResource_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.TagResourceInput{
		ResourceArn: aws.String("us-east-1_abc123"),
		Tags:        map[string]string{"Env": "test"},
	}
	mockClient.EXPECT().TagResource(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.TagResource(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_UntagResource(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.UntagResourceInput{
		ResourceArn: aws.String("us-east-1_abc123"),
		TagKeys:     []string{"Env"},
	}
	expectedOutput := &cognitoidentityprovider.UntagResourceOutput{}

	mockClient.EXPECT().UntagResource(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.UntagResource(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_UntagResource_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.UntagResourceInput{
		ResourceArn: aws.String("us-east-1_abc123"),
		TagKeys:     []string{"Env"},
	}
	mockClient.EXPECT().UntagResource(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.UntagResource(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_InitiateAuth(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.InitiateAuthInput{
		ClientId: aws.String("client123"),
		AuthFlow: types.AuthFlowTypeUserPasswordAuth,
		AuthParameters: map[string]string{
			"USERNAME": "test-user",
			"PASSWORD": "NewPass123!",
		},
	}
	expectedOutput := &cognitoidentityprovider.InitiateAuthOutput{
		ChallengeName: types.ChallengeNameTypePassword,
	}

	mockClient.EXPECT().InitiateAuth(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.InitiateAuth(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_InitiateAuth_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.InitiateAuthInput{
		ClientId: aws.String("client123"),
		AuthFlow: types.AuthFlowTypeUserPasswordAuth,
	}
	mockClient.EXPECT().InitiateAuth(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.InitiateAuth(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_AdminInitiateAuth(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.AdminInitiateAuthInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		ClientId:   aws.String("client123"),
		AuthFlow:   types.AuthFlowTypeUserPasswordAuth,
		AuthParameters: map[string]string{
			"USERNAME": "test-user",
			"PASSWORD": "NewPass123!",
		},
	}
	expectedOutput := &cognitoidentityprovider.AdminInitiateAuthOutput{
		ChallengeName: types.ChallengeNameTypePassword,
	}

	mockClient.EXPECT().AdminInitiateAuth(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.AdminInitiateAuth(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_AdminInitiateAuth_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.AdminInitiateAuthInput{
		UserPoolId: aws.String("us-east-1_abc123"),
		ClientId:   aws.String("client123"),
		AuthFlow:   types.AuthFlowTypeUserPasswordAuth,
	}
	mockClient.EXPECT().AdminInitiateAuth(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.AdminInitiateAuth(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCognitoAdapter_RespondToAuthChallenge(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.RespondToAuthChallengeInput{
		ClientId:      aws.String("client123"),
		ChallengeName: types.ChallengeNameTypePassword,
		ChallengeResponses: map[string]string{
			"USERNAME": "test-user",
			"PASSWORD": "NewPass123!",
		},
		Session: aws.String("session-token"),
	}
	expectedOutput := &cognitoidentityprovider.RespondToAuthChallengeOutput{
		ChallengeName: types.ChallengeNameTypePassword,
	}

	mockClient.EXPECT().RespondToAuthChallenge(ctx, input).Return(expectedOutput, nil)
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.RespondToAuthChallenge(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCognitoAdapter_RespondToAuthChallenge_Error(t *testing.T) {
	mockClient := cognitomocks.NewCognitoClientPort(t)
	ctx := context.Background()
	input := &cognitoidentityprovider.RespondToAuthChallengeInput{
		ClientId:      aws.String("client123"),
		ChallengeName: types.ChallengeNameTypePassword,
	}
	mockClient.EXPECT().RespondToAuthChallenge(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CognitoAdapter{client: mockClient}

	output, err := adapter.RespondToAuthChallenge(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}