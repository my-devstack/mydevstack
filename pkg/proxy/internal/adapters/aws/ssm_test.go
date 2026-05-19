package aws

import (
	"context"
	"errors"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
	"github.com/aws/aws-sdk-go-v2/service/ssm/types"
	ssmmocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewSSMAdapter(t *testing.T) {
	adapter := NewSSMAdapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566")
	assert.NotNil(t, adapter)
	assert.IsType(t, &SSMAdapter{}, adapter)
}

func TestSSMAdapter_GetParameter(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.GetParameterInput{Name: aws.String("/test/param")}
	expectedOutput := &ssm.GetParameterOutput{Parameter: &types.Parameter{Value: aws.String("test-value")}}

	mockClient.EXPECT().GetParameter(ctx, input).Return(expectedOutput, nil)
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.GetParameter(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSSMAdapter_GetParameters(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.GetParametersInput{Names: []string{"/test/param1", "/test/param2"}}
	expectedOutput := &ssm.GetParametersOutput{Parameters: []types.Parameter{{Name: aws.String("/test/param1"), Value: aws.String("value1")}, {Name: aws.String("/test/param2"), Value: aws.String("value2")}}}

	mockClient.EXPECT().GetParameters(ctx, input).Return(expectedOutput, nil)
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.GetParameters(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSSMAdapter_GetParametersByPath(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.GetParametersByPathInput{Path: aws.String("/test/")}
	expectedOutput := &ssm.GetParametersByPathOutput{Parameters: []types.Parameter{{Name: aws.String("/test/param"), Value: aws.String("value")}}}

	mockClient.EXPECT().GetParametersByPath(ctx, input).Return(expectedOutput, nil)
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.GetParametersByPath(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSSMAdapter_PutParameter(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.PutParameterInput{Name: aws.String("/test/param"), Value: aws.String("test-value"), Type: types.ParameterTypeString}
	expectedOutput := &ssm.PutParameterOutput{Version: 1}

	mockClient.EXPECT().PutParameter(ctx, input).Return(expectedOutput, nil)
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.PutParameter(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSSMAdapter_DeleteParameter(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.DeleteParameterInput{Name: aws.String("/test/param")}
	expectedOutput := &ssm.DeleteParameterOutput{}

	mockClient.EXPECT().DeleteParameter(ctx, input).Return(expectedOutput, nil)
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.DeleteParameter(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSSMAdapter_DescribeParameters(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.DescribeParametersInput{}
	expectedOutput := &ssm.DescribeParametersOutput{Parameters: []types.ParameterMetadata{{Name: aws.String("/test/param"), Type: types.ParameterTypeString}}}

	mockClient.EXPECT().DescribeParameters(ctx, input).Return(expectedOutput, nil)
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.DescribeParameters(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSSMAdapter_GetParameter_Error(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.GetParameterInput{Name: aws.String("/test/param")}

	mockClient.EXPECT().GetParameter(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.GetParameter(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestSSMAdapter_GetParameters_Error(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.GetParametersInput{Names: []string{"/test/param1"}}

	mockClient.EXPECT().GetParameters(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.GetParameters(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestSSMAdapter_GetParametersByPath_Error(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.GetParametersByPathInput{Path: aws.String("/test/")}

	mockClient.EXPECT().GetParametersByPath(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.GetParametersByPath(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestSSMAdapter_PutParameter_Error(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.PutParameterInput{Name: aws.String("/test/param"), Value: aws.String("test-value"), Type: types.ParameterTypeString}

	mockClient.EXPECT().PutParameter(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.PutParameter(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestSSMAdapter_DeleteParameter_Error(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.DeleteParameterInput{Name: aws.String("/test/param")}

	mockClient.EXPECT().DeleteParameter(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.DeleteParameter(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestSSMAdapter_DescribeParameters_Error(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.DescribeParametersInput{}

	mockClient.EXPECT().DescribeParameters(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.DescribeParameters(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestSSMAdapter_GetParameterHistory(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.GetParameterHistoryInput{Name: aws.String("test-param")}
	expectedOutput := &ssm.GetParameterHistoryOutput{}

	mockClient.EXPECT().GetParameterHistory(ctx, input).Return(expectedOutput, nil)
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.GetParameterHistory(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSSMAdapter_GetParameterHistory_Error(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.GetParameterHistoryInput{Name: aws.String("test-param")}

	mockClient.EXPECT().GetParameterHistory(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.GetParameterHistory(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestSSMAdapter_ListTagsForResource(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.ListTagsForResourceInput{ResourceId: aws.String("test-resource"), ResourceType: types.ResourceTypeForTaggingParameter}
	expectedOutput := &ssm.ListTagsForResourceOutput{}

	mockClient.EXPECT().ListTagsForResource(ctx, input).Return(expectedOutput, nil)
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.ListTagsForResource(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSSMAdapter_ListTagsForResource_Error(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.ListTagsForResourceInput{ResourceId: aws.String("test-resource"), ResourceType: types.ResourceTypeForTaggingParameter}

	mockClient.EXPECT().ListTagsForResource(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.ListTagsForResource(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestSSMAdapter_AddTagsToResource(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.AddTagsToResourceInput{ResourceId: aws.String("test-resource"), ResourceType: types.ResourceTypeForTaggingParameter, Tags: []types.Tag{{Key: aws.String("key1"), Value: aws.String("value1")}}}
	expectedOutput := &ssm.AddTagsToResourceOutput{}

	mockClient.EXPECT().AddTagsToResource(ctx, input).Return(expectedOutput, nil)
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.AddTagsToResource(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSSMAdapter_AddTagsToResource_Error(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.AddTagsToResourceInput{ResourceId: aws.String("test-resource"), ResourceType: types.ResourceTypeForTaggingParameter, Tags: []types.Tag{{Key: aws.String("key1"), Value: aws.String("value1")}}}

	mockClient.EXPECT().AddTagsToResource(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.AddTagsToResource(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestSSMAdapter_RemoveTagsFromResource(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.RemoveTagsFromResourceInput{ResourceId: aws.String("test-resource"), ResourceType: types.ResourceTypeForTaggingParameter, TagKeys: []string{"key1"}}
	expectedOutput := &ssm.RemoveTagsFromResourceOutput{}

	mockClient.EXPECT().RemoveTagsFromResource(ctx, input).Return(expectedOutput, nil)
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.RemoveTagsFromResource(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSSMAdapter_RemoveTagsFromResource_Error(t *testing.T) {
	mockClient := ssmmocks.NewSSMClientPort(t)
	ctx := context.Background()
	input := &ssm.RemoveTagsFromResourceInput{ResourceId: aws.String("test-resource"), ResourceType: types.ResourceTypeForTaggingParameter, TagKeys: []string{"key1"}}

	mockClient.EXPECT().RemoveTagsFromResource(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SSMAdapter{client: mockClient}

	output, err := adapter.RemoveTagsFromResource(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}
