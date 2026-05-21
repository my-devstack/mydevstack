package aws

import (
	"context"
	"errors"
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

// --- New methods: UpdateRoute, UpdateIntegration, GetInvokeUrl ---

func TestAPIGatewayV2Adapter_UpdateRoute(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.UpdateRouteInput{
		ApiId:   aws.String("api123"),
		RouteId: aws.String("route456"),
	}
	expectedOutput := &apigatewayv2.UpdateRouteOutput{}
	mockClient.EXPECT().UpdateRoute(ctx, input).Return(expectedOutput, nil)
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.UpdateRoute(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayV2Adapter_UpdateRoute_Error(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.UpdateRouteInput{
		ApiId:   aws.String("api123"),
		RouteId: aws.String("route456"),
	}
	mockClient.EXPECT().UpdateRoute(ctx, input).Return(nil, errors.New("update route failed"))
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.UpdateRoute(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestAPIGatewayV2Adapter_UpdateIntegration(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.UpdateIntegrationInput{
		ApiId:         aws.String("api123"),
		IntegrationId: aws.String("int456"),
	}
	expectedOutput := &apigatewayv2.UpdateIntegrationOutput{}
	mockClient.EXPECT().UpdateIntegration(ctx, input).Return(expectedOutput, nil)
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.UpdateIntegration(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayV2Adapter_UpdateIntegration_Error(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.UpdateIntegrationInput{
		ApiId:         aws.String("api123"),
		IntegrationId: aws.String("int456"),
	}
	mockClient.EXPECT().UpdateIntegration(ctx, input).Return(nil, errors.New("update integration failed"))
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.UpdateIntegration(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestAPIGatewayV2Adapter_GetInvokeUrl(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	adapter := &APIGatewayV2Adapter{client: mockClient, region: "us-east-1"}

	url, err := adapter.GetInvokeUrl(ctx, "api123", "prod", "HTTP")
	assert.NoError(t, err)
	assert.Equal(t, "https://api123.execute-api.us-east-1.amazonaws.com/prod", url)
}

func TestAPIGatewayV2Adapter_GetInvokeUrl_WebSocket(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	adapter := &APIGatewayV2Adapter{client: mockClient, region: "us-east-1"}

	url, err := adapter.GetInvokeUrl(ctx, "api123", "prod", "WEBSOCKET")
	assert.NoError(t, err)
	assert.Equal(t, "wss://api123.execute-api.us-east-1.amazonaws.com/prod", url)
}

func TestAPIGatewayV2Adapter_GetInvokeUrl_Error(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	adapter := &APIGatewayV2Adapter{client: mockClient, region: "us-east-1"}

	url, err := adapter.GetInvokeUrl(ctx, "", "prod", "HTTP")
	assert.Error(t, err)
	assert.Equal(t, "", url)
}

func TestAPIGatewayV2Adapter_GetInvokeUrl_Error_StageName(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	adapter := &APIGatewayV2Adapter{client: mockClient, region: "us-east-1"}

	url, err := adapter.GetInvokeUrl(ctx, "api123", "", "HTTP")
	assert.Error(t, err)
	assert.Equal(t, "", url)
}

// --- Error tests for existing methods ---

func TestAPIGatewayV2Adapter_GetApis_Error(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.GetApisInput{}
	mockClient.EXPECT().GetApis(ctx, input).Return(nil, errors.New("some error"))
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.GetApis(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestAPIGatewayV2Adapter_CreateApi_Error(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.CreateApiInput{Name: aws.String("test-api")}
	mockClient.EXPECT().CreateApi(ctx, input).Return(nil, errors.New("create api failed"))
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.CreateApi(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestAPIGatewayV2Adapter_DeleteApi_Error(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.DeleteApiInput{ApiId: aws.String("api-123")}
	mockClient.EXPECT().DeleteApi(ctx, input).Return(nil, errors.New("delete api failed"))
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.DeleteApi(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestAPIGatewayV2Adapter_GetApi_Error(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.GetApiInput{ApiId: aws.String("api-123")}
	mockClient.EXPECT().GetApi(ctx, input).Return(nil, errors.New("get api failed"))
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.GetApi(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestAPIGatewayV2Adapter_GetRoutes_Error(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.GetRoutesInput{ApiId: aws.String("api-123")}
	mockClient.EXPECT().GetRoutes(ctx, input).Return(nil, errors.New("get routes failed"))
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.GetRoutes(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestAPIGatewayV2Adapter_CreateRoute_Error(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.CreateRouteInput{ApiId: aws.String("api-123")}
	mockClient.EXPECT().CreateRoute(ctx, input).Return(nil, errors.New("create route failed"))
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.CreateRoute(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestAPIGatewayV2Adapter_DeleteRoute_Error(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.DeleteRouteInput{ApiId: aws.String("api-123"), RouteId: aws.String("route-123")}
	mockClient.EXPECT().DeleteRoute(ctx, input).Return(nil, errors.New("delete route failed"))
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.DeleteRoute(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestAPIGatewayV2Adapter_GetIntegrations_Error(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.GetIntegrationsInput{ApiId: aws.String("api-123")}
	mockClient.EXPECT().GetIntegrations(ctx, input).Return(nil, errors.New("get integrations failed"))
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.GetIntegrations(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestAPIGatewayV2Adapter_CreateIntegration_Error(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.CreateIntegrationInput{ApiId: aws.String("api-123")}
	mockClient.EXPECT().CreateIntegration(ctx, input).Return(nil, errors.New("create integration failed"))
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.CreateIntegration(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestAPIGatewayV2Adapter_DeleteIntegration_Error(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.DeleteIntegrationInput{ApiId: aws.String("api-123"), IntegrationId: aws.String("int-123")}
	mockClient.EXPECT().DeleteIntegration(ctx, input).Return(nil, errors.New("delete integration failed"))
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.DeleteIntegration(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestAPIGatewayV2Adapter_GetStages_Error(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.GetStagesInput{ApiId: aws.String("api-123")}
	mockClient.EXPECT().GetStages(ctx, input).Return(nil, errors.New("get stages failed"))
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.GetStages(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestAPIGatewayV2Adapter_GetStage_Error(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.GetStageInput{ApiId: aws.String("api-123"), StageName: aws.String("prod")}
	mockClient.EXPECT().GetStage(ctx, input).Return(nil, errors.New("get stage failed"))
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.GetStage(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestAPIGatewayV2Adapter_CreateStage_Error(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.CreateStageInput{ApiId: aws.String("api-123"), StageName: aws.String("prod")}
	mockClient.EXPECT().CreateStage(ctx, input).Return(nil, errors.New("create stage failed"))
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.CreateStage(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestAPIGatewayV2Adapter_UpdateStage_Error(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.UpdateStageInput{ApiId: aws.String("api-123"), StageName: aws.String("prod")}
	mockClient.EXPECT().UpdateStage(ctx, input).Return(nil, errors.New("update stage failed"))
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.UpdateStage(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestAPIGatewayV2Adapter_DeleteStage_Error(t *testing.T) {
	mockClient := ag2mocks.NewAPIGatewayV2ClientPort(t)
	ctx := context.Background()
	input := &apigatewayv2.DeleteStageInput{ApiId: aws.String("api-123"), StageName: aws.String("prod")}
	mockClient.EXPECT().DeleteStage(ctx, input).Return(nil, errors.New("delete stage failed"))
	adapter := &APIGatewayV2Adapter{client: mockClient}

	output, err := adapter.DeleteStage(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}
