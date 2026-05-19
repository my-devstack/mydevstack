package aws

import (
	"context"
	"errors"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	cfmocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestCloudFormationAdapter_ListStacks(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockClient := cfmocks.NewCloudFormationClientPort(t)
		adapter := &CloudFormationAdapter{client: mockClient}
		ctx := context.Background()
		input := &cloudformation.ListStacksInput{}
		expected := &cloudformation.ListStacksOutput{}
		mockClient.EXPECT().ListStacks(ctx, input).Return(expected, nil)
		result, err := adapter.ListStacks(ctx, input)
		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("error", func(t *testing.T) {
		mockClient := cfmocks.NewCloudFormationClientPort(t)
		adapter := &CloudFormationAdapter{client: mockClient}
		ctx := context.Background()
		input := &cloudformation.ListStacksInput{}
		mockClient.EXPECT().ListStacks(ctx, input).Return(nil, errors.New("api error"))
		result, err := adapter.ListStacks(ctx, input)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "list stacks")
	})
}

func TestCloudFormationAdapter_CreateStack(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockClient := cfmocks.NewCloudFormationClientPort(t)
		adapter := &CloudFormationAdapter{client: mockClient}
		ctx := context.Background()
		input := &cloudformation.CreateStackInput{}
		expected := &cloudformation.CreateStackOutput{}
		mockClient.EXPECT().CreateStack(ctx, input).Return(expected, nil)
		result, err := adapter.CreateStack(ctx, input)
		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("error", func(t *testing.T) {
		mockClient := cfmocks.NewCloudFormationClientPort(t)
		adapter := &CloudFormationAdapter{client: mockClient}
		ctx := context.Background()
		input := &cloudformation.CreateStackInput{}
		mockClient.EXPECT().CreateStack(ctx, input).Return(nil, errors.New("api error"))
		result, err := adapter.CreateStack(ctx, input)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "create stack")
	})
}

func TestCloudFormationAdapter_DeleteStack(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockClient := cfmocks.NewCloudFormationClientPort(t)
		adapter := &CloudFormationAdapter{client: mockClient}
		ctx := context.Background()
		input := &cloudformation.DeleteStackInput{}
		expected := &cloudformation.DeleteStackOutput{}
		mockClient.EXPECT().DeleteStack(ctx, input).Return(expected, nil)
		result, err := adapter.DeleteStack(ctx, input)
		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("error", func(t *testing.T) {
		mockClient := cfmocks.NewCloudFormationClientPort(t)
		adapter := &CloudFormationAdapter{client: mockClient}
		ctx := context.Background()
		input := &cloudformation.DeleteStackInput{}
		mockClient.EXPECT().DeleteStack(ctx, input).Return(nil, errors.New("api error"))
		result, err := adapter.DeleteStack(ctx, input)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "delete stack")
	})
}

func TestCloudFormationAdapter_DescribeStacks(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockClient := cfmocks.NewCloudFormationClientPort(t)
		adapter := &CloudFormationAdapter{client: mockClient}
		ctx := context.Background()
		input := &cloudformation.DescribeStacksInput{}
		expected := &cloudformation.DescribeStacksOutput{}
		mockClient.EXPECT().DescribeStacks(ctx, input).Return(expected, nil)
		result, err := adapter.DescribeStacks(ctx, input)
		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("error", func(t *testing.T) {
		mockClient := cfmocks.NewCloudFormationClientPort(t)
		adapter := &CloudFormationAdapter{client: mockClient}
		ctx := context.Background()
		input := &cloudformation.DescribeStacksInput{}
		mockClient.EXPECT().DescribeStacks(ctx, input).Return(nil, errors.New("api error"))
		result, err := adapter.DescribeStacks(ctx, input)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "describe stacks")
	})
}

func TestCloudFormationAdapter_GetTemplate(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockClient := cfmocks.NewCloudFormationClientPort(t)
		adapter := &CloudFormationAdapter{client: mockClient}
		ctx := context.Background()
		input := &cloudformation.GetTemplateInput{}
		expected := &cloudformation.GetTemplateOutput{}
		mockClient.EXPECT().GetTemplate(ctx, input).Return(expected, nil)
		result, err := adapter.GetTemplate(ctx, input)
		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("error", func(t *testing.T) {
		mockClient := cfmocks.NewCloudFormationClientPort(t)
		adapter := &CloudFormationAdapter{client: mockClient}
		ctx := context.Background()
		input := &cloudformation.GetTemplateInput{}
		mockClient.EXPECT().GetTemplate(ctx, input).Return(nil, errors.New("api error"))
		result, err := adapter.GetTemplate(ctx, input)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "get template")
	})
}

func TestCloudFormationAdapter_ListStackResources(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockClient := cfmocks.NewCloudFormationClientPort(t)
		adapter := &CloudFormationAdapter{client: mockClient}
		ctx := context.Background()
		input := &cloudformation.ListStackResourcesInput{}
		expected := &cloudformation.ListStackResourcesOutput{}
		mockClient.EXPECT().ListStackResources(ctx, input).Return(expected, nil)
		result, err := adapter.ListStackResources(ctx, input)
		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("error", func(t *testing.T) {
		mockClient := cfmocks.NewCloudFormationClientPort(t)
		adapter := &CloudFormationAdapter{client: mockClient}
		ctx := context.Background()
		input := &cloudformation.ListStackResourcesInput{}
		mockClient.EXPECT().ListStackResources(ctx, input).Return(nil, errors.New("api error"))
		result, err := adapter.ListStackResources(ctx, input)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "list stack resources")
	})
}

func TestNewCloudFormationAdapter(t *testing.T) {
	awsCfg := aws.Config{Region: "us-east-1"}
	endpoint := "http://localhost:4566"
	adapter := NewCloudFormationAdapter(awsCfg, endpoint)
	assert.NotNil(t, adapter)
	assert.IsType(t, &CloudFormationAdapter{}, adapter)
	cfAdapter := adapter.(*CloudFormationAdapter)
	assert.NotNil(t, cfAdapter.client)
}
