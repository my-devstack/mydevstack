package aws

import (
	"context"
	"errors"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/lambda/types"
	lambdamocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewLambdaAdapter(t *testing.T) {
	awsCfg := aws.Config{Region: "us-east-1"}
	endpoint := "http://localhost:4566"

	adapter := NewLambdaAdapter(awsCfg, endpoint)

	assert.NotNil(t, adapter)
	assert.IsType(t, &LambdaAdapter{}, adapter)
}

func TestLambdaAdapter_ListFunctions(t *testing.T) {
	mockClient := lambdamocks.NewLambdaClientPort(t)
	ctx := context.Background()
	input := &lambda.ListFunctionsInput{}

	expectedOutput := &lambda.ListFunctionsOutput{
		Functions: []types.FunctionConfiguration{{FunctionName: aws.String("test-function")}},
	}

	mockClient.EXPECT().ListFunctions(ctx, input).Return(expectedOutput, nil)

	adapter := &LambdaAdapter{client: mockClient}
	output, err := adapter.ListFunctions(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestLambdaAdapter_CreateFunction(t *testing.T) {
	mockClient := lambdamocks.NewLambdaClientPort(t)
	ctx := context.Background()
	input := &lambda.CreateFunctionInput{FunctionName: aws.String("test-function")}

	expectedOutput := &lambda.CreateFunctionOutput{FunctionName: aws.String("test-function")}

	mockClient.EXPECT().CreateFunction(ctx, input).Return(expectedOutput, nil)

	adapter := &LambdaAdapter{client: mockClient}
	output, err := adapter.CreateFunction(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestLambdaAdapter_GetFunction(t *testing.T) {
	mockClient := lambdamocks.NewLambdaClientPort(t)
	ctx := context.Background()
	input := &lambda.GetFunctionInput{FunctionName: aws.String("test-function")}

	expectedOutput := &lambda.GetFunctionOutput{}

	mockClient.EXPECT().GetFunction(ctx, input).Return(expectedOutput, nil)

	adapter := &LambdaAdapter{client: mockClient}
	output, err := adapter.GetFunction(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestLambdaAdapter_DeleteFunction(t *testing.T) {
	mockClient := lambdamocks.NewLambdaClientPort(t)
	ctx := context.Background()
	input := &lambda.DeleteFunctionInput{FunctionName: aws.String("test-function")}

	expectedOutput := &lambda.DeleteFunctionOutput{}

	mockClient.EXPECT().DeleteFunction(ctx, input).Return(expectedOutput, nil)

	adapter := &LambdaAdapter{client: mockClient}
	output, err := adapter.DeleteFunction(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestLambdaAdapter_Invoke(t *testing.T) {
	mockClient := lambdamocks.NewLambdaClientPort(t)
	ctx := context.Background()
	input := &lambda.InvokeInput{FunctionName: aws.String("test-function")}

	expectedOutput := &lambda.InvokeOutput{}

	mockClient.EXPECT().Invoke(ctx, input).Return(expectedOutput, nil)

	adapter := &LambdaAdapter{client: mockClient}
	output, err := adapter.Invoke(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestLambdaAdapter_UpdateFunctionConfiguration(t *testing.T) {
	mockClient := lambdamocks.NewLambdaClientPort(t)
	ctx := context.Background()
	input := &lambda.UpdateFunctionConfigurationInput{FunctionName: aws.String("test-function")}

	expectedOutput := &lambda.UpdateFunctionConfigurationOutput{FunctionName: aws.String("test-function")}

	mockClient.EXPECT().UpdateFunctionConfiguration(ctx, input).Return(expectedOutput, nil)

	adapter := &LambdaAdapter{client: mockClient}
	output, err := adapter.UpdateFunctionConfiguration(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestLambdaAdapter_UpdateFunctionCode(t *testing.T) {
	mockClient := lambdamocks.NewLambdaClientPort(t)
	ctx := context.Background()
	input := &lambda.UpdateFunctionCodeInput{FunctionName: aws.String("test-function")}

	expectedOutput := &lambda.UpdateFunctionCodeOutput{FunctionName: aws.String("test-function")}

	mockClient.EXPECT().UpdateFunctionCode(ctx, input).Return(expectedOutput, nil)

	adapter := &LambdaAdapter{client: mockClient}
	output, err := adapter.UpdateFunctionCode(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestLambdaAdapter_GetFunctionConfiguration(t *testing.T) {
	mockClient := lambdamocks.NewLambdaClientPort(t)
	ctx := context.Background()
	input := &lambda.GetFunctionConfigurationInput{FunctionName: aws.String("test-function")}

	expectedOutput := &lambda.GetFunctionConfigurationOutput{FunctionName: aws.String("test-function")}

	mockClient.EXPECT().GetFunctionConfiguration(ctx, input).Return(expectedOutput, nil)

	adapter := &LambdaAdapter{client: mockClient}
	output, err := adapter.GetFunctionConfiguration(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestLambdaAdapter_ListFunctions_Error(t *testing.T) {
	mockClient := lambdamocks.NewLambdaClientPort(t)
	ctx := context.Background()
	input := &lambda.ListFunctionsInput{}

	mockClient.EXPECT().ListFunctions(ctx, input).Return(nil, errors.New("some error"))

	adapter := &LambdaAdapter{client: mockClient}
	output, err := adapter.ListFunctions(ctx, input)

	assert.Error(t, err)
	assert.Nil(t, output)
}
