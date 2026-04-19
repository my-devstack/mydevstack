package aws

import (
	"context"
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
