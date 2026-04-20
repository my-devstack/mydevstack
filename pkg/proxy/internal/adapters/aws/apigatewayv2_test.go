package aws

import (
	"context"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/apigatewayv2"
	"github.com/aws/aws-sdk-go-v2/service/apigatewayv2/types"
	ag2mocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewAPIGatewayV2Adapter(t *testing.T) {
	adapter := NewAPIGatewayV2Adapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566")
	assert.NotNil(t, adapter)
	assert.IsType(t, &APIGatewayV2Adapter{}, adapter)
}

func TestAPIGatewayV2Adapter_GetApis(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.GetApisInput{}
	expectedOutput := &apigatewayv2.GetApisOutput{Items: []types.Api{{ApiId: aws.String("api-123")}}}

	mockClient.EXPECT().GetApis(ctx, input).Return(expectedOutput, nil)
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.GetApis(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayV2Adapter_CreateApi(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.CreateApiInput{Name: aws.String("test-api")}
	expectedOutput := &apigatewayv2.CreateApiOutput{ApiId: aws.String("api-123")}

	mockClient.EXPECT().CreateApi(ctx, input).Return(expectedOutput, nil)
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.CreateApi(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayV2Adapter_DeleteApi(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.DeleteApiInput{ApiId: aws.String("api-123")}
	expectedOutput := &apigatewayv2.DeleteApiOutput{}

	mockClient.EXPECT().DeleteApi(ctx, input).Return(expectedOutput, nil)
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.DeleteApi(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayV2Adapter_GetApi(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.GetApiInput{ApiId: aws.String("api-123")}
	expectedOutput := &apigatewayv2.GetApiOutput{ApiId: aws.String("api-123")}

	mockClient.EXPECT().GetApi(ctx, input).Return(expectedOutput, nil)
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.GetApi(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayV2Adapter_GetRoutes(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.GetRoutesInput{ApiId: aws.String("api-123")}
	expectedOutput := &apigatewayv2.GetRoutesOutput{}

	mockClient.EXPECT().GetRoutes(ctx, input).Return(expectedOutput, nil)
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.GetRoutes(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayV2Adapter_CreateRoute(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.CreateRouteInput{ApiId: aws.String("api-123")}
	expectedOutput := &apigatewayv2.CreateRouteOutput{RouteId: aws.String("route-123")}

	mockClient.EXPECT().CreateRoute(ctx, input).Return(expectedOutput, nil)
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.CreateRoute(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayV2Adapter_DeleteRoute(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.DeleteRouteInput{ApiId: aws.String("api-123"), RouteId: aws.String("route-123")}
	expectedOutput := &apigatewayv2.DeleteRouteOutput{}

	mockClient.EXPECT().DeleteRoute(ctx, input).Return(expectedOutput, nil)
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.DeleteRoute(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayV2Adapter_GetIntegrations(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.GetIntegrationsInput{ApiId: aws.String("api-123")}
	expectedOutput := &apigatewayv2.GetIntegrationsOutput{}

	mockClient.EXPECT().GetIntegrations(ctx, input).Return(expectedOutput, nil)
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.GetIntegrations(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayV2Adapter_CreateIntegration(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.CreateIntegrationInput{ApiId: aws.String("api-123")}
	expectedOutput := &apigatewayv2.CreateIntegrationOutput{IntegrationId: aws.String("int-123")}

	mockClient.EXPECT().CreateIntegration(ctx, input).Return(expectedOutput, nil)
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.CreateIntegration(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayV2Adapter_DeleteIntegration(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.DeleteIntegrationInput{ApiId: aws.String("api-123"), IntegrationId: aws.String("int-123")}
	expectedOutput := &apigatewayv2.DeleteIntegrationOutput{}

	mockClient.EXPECT().DeleteIntegration(ctx, input).Return(expectedOutput, nil)
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.DeleteIntegration(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

// Stage tests
func TestAPIGatewayV2Adapter_GetStages(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.GetStagesInput{ApiId: aws.String("api-123")}
	expectedOutput := &apigatewayv2.GetStagesOutput{}

	mockClient.EXPECT().GetStages(ctx, input).Return(expectedOutput, nil)
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.GetStages(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayV2Adapter_GetStage(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.GetStageInput{ApiId: aws.String("api-123"), StageName: aws.String("prod")}
	expectedOutput := &apigatewayv2.GetStageOutput{StageName: aws.String("prod")}

	mockClient.EXPECT().GetStage(ctx, input).Return(expectedOutput, nil)
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.GetStage(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayV2Adapter_CreateStage(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.CreateStageInput{ApiId: aws.String("api-123"), StageName: aws.String("prod")}
	expectedOutput := &apigatewayv2.CreateStageOutput{StageName: aws.String("prod")}

	mockClient.EXPECT().CreateStage(ctx, input).Return(expectedOutput, nil)
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.CreateStage(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayV2Adapter_UpdateStage(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.UpdateStageInput{ApiId: aws.String("api-123"), StageName: aws.String("prod")}
	expectedOutput := &apigatewayv2.UpdateStageOutput{StageName: aws.String("prod")}

	mockClient.EXPECT().UpdateStage(ctx, input).Return(expectedOutput, nil)
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.UpdateStage(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayV2Adapter_DeleteStage(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.DeleteStageInput{ApiId: aws.String("api-123"), StageName: aws.String("prod")}
	expectedOutput := &apigatewayv2.DeleteStageOutput{}

	mockClient.EXPECT().DeleteStage(ctx, input).Return(expectedOutput, nil)
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.DeleteStage(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}
