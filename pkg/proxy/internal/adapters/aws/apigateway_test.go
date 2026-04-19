package aws

import (
	"context"
	"errors"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	"github.com/aws/aws-sdk-go-v2/service/apigateway/types"
	apimocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewAPIGatewayAdapter(t *testing.T) {
	awsCfg := aws.Config{
		Region: "us-east-1",
	}
	endpoint := "http://localhost:4566"

	adapter := NewAPIGatewayAdapter(awsCfg, endpoint)

	assert.NotNil(t, adapter, "APIGatewayAdapter should not be nil")
	assert.IsType(t, &APIGatewayAdapter{}, adapter, "Should return APIGatewayAdapter type")

	apiAdapter := adapter.(*APIGatewayAdapter)
	assert.NotNil(t, apiAdapter.client, "APIGatewayAdapter client should not be nil")
}

func TestAPIGatewayAdapter_GetRestApis(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.GetRestApisInput{Limit: aws.Int32(10)}

	expectedOutput := &apigateway.GetRestApisOutput{
		Items: []types.RestApi{{Id: aws.String("api-123")}},
	}

	mockClient.EXPECT().GetRestApis(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.GetRestApis(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_CreateRestApi(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.CreateRestApiInput{Name: aws.String("test-api")}

	expectedOutput := &apigateway.CreateRestApiOutput{
		Id:   aws.String("api-123"),
		Name: aws.String("test-api"),
	}

	mockClient.EXPECT().CreateRestApi(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.CreateRestApi(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_ImportRestApi(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.ImportRestApiInput{Body: []byte("{}")}

	expectedOutput := &apigateway.ImportRestApiOutput{
		Id: aws.String("api-123"),
	}

	mockClient.EXPECT().ImportRestApi(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.ImportRestApi(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_DeleteRestApi(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.DeleteRestApiInput{RestApiId: aws.String("api-123")}

	expectedOutput := &apigateway.DeleteRestApiOutput{}

	mockClient.EXPECT().DeleteRestApi(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.DeleteRestApi(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_GetRestApi(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.GetRestApiInput{RestApiId: aws.String("api-123")}

	expectedOutput := &apigateway.GetRestApiOutput{
		Id:   aws.String("api-123"),
		Name: aws.String("test-api"),
	}

	mockClient.EXPECT().GetRestApi(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.GetRestApi(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_UpdateRestApi(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.UpdateRestApiInput{
		RestApiId: aws.String("api-123"),
		PatchOperations: []types.PatchOperation{{
			Op:    types.OpReplace,
			Path:  aws.String("/name"),
			Value: aws.String("updated-api"),
		}},
	}

	expectedOutput := &apigateway.UpdateRestApiOutput{
		Id:   aws.String("api-123"),
		Name: aws.String("updated-api"),
	}

	mockClient.EXPECT().UpdateRestApi(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.UpdateRestApi(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_GetResources(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.GetResourcesInput{RestApiId: aws.String("api-123")}

	expectedOutput := &apigateway.GetResourcesOutput{
		Items: []types.Resource{{Id: aws.String("resource-123"), Path: aws.String("/")}},
	}

	mockClient.EXPECT().GetResources(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.GetResources(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_GetResource(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.GetResourceInput{
		RestApiId:  aws.String("api-123"),
		ResourceId: aws.String("resource-123"),
	}

	expectedOutput := &apigateway.GetResourceOutput{
		Id:   aws.String("resource-123"),
		Path: aws.String("/"),
	}

	mockClient.EXPECT().GetResource(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.GetResource(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_CreateResource(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.CreateResourceInput{
		RestApiId: aws.String("api-123"),
		ParentId:  aws.String("parent-123"),
		PathPart:  aws.String("users"),
	}

	expectedOutput := &apigateway.CreateResourceOutput{
		Id:       aws.String("resource-123"),
		PathPart: aws.String("users"),
	}

	mockClient.EXPECT().CreateResource(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.CreateResource(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_DeleteResource(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.DeleteResourceInput{
		RestApiId:  aws.String("api-123"),
		ResourceId: aws.String("resource-123"),
	}

	expectedOutput := &apigateway.DeleteResourceOutput{}

	mockClient.EXPECT().DeleteResource(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.DeleteResource(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_PutMethod(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.PutMethodInput{
		RestApiId:         aws.String("api-123"),
		ResourceId:        aws.String("resource-123"),
		HttpMethod:        aws.String("GET"),
		AuthorizationType: aws.String("NONE"),
	}

	expectedOutput := &apigateway.PutMethodOutput{
		HttpMethod:        aws.String("GET"),
		AuthorizationType: aws.String("NONE"),
	}

	mockClient.EXPECT().PutMethod(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.PutMethod(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_GetMethod(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.GetMethodInput{
		RestApiId:  aws.String("api-123"),
		ResourceId: aws.String("resource-123"),
		HttpMethod: aws.String("GET"),
	}

	expectedOutput := &apigateway.GetMethodOutput{
		HttpMethod:        aws.String("GET"),
		AuthorizationType: aws.String("NONE"),
	}

	mockClient.EXPECT().GetMethod(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.GetMethod(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_DeleteMethod(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.DeleteMethodInput{
		RestApiId:  aws.String("api-123"),
		ResourceId: aws.String("resource-123"),
		HttpMethod: aws.String("GET"),
	}

	expectedOutput := &apigateway.DeleteMethodOutput{}

	mockClient.EXPECT().DeleteMethod(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.DeleteMethod(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_PutIntegration(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.PutIntegrationInput{
		RestApiId:  aws.String("api-123"),
		ResourceId: aws.String("resource-123"),
		HttpMethod: aws.String("GET"),
		Type:       types.IntegrationTypeAwsProxy,
		Uri:        aws.String("arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:test/invocations"),
	}

	expectedOutput := &apigateway.PutIntegrationOutput{
		Type: types.IntegrationTypeAwsProxy,
	}

	mockClient.EXPECT().PutIntegration(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.PutIntegration(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_GetIntegration(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.GetIntegrationInput{
		RestApiId:  aws.String("api-123"),
		ResourceId: aws.String("resource-123"),
		HttpMethod: aws.String("GET"),
	}

	expectedOutput := &apigateway.GetIntegrationOutput{
		Type: types.IntegrationTypeAwsProxy,
	}

	mockClient.EXPECT().GetIntegration(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.GetIntegration(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_DeleteIntegration(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.DeleteIntegrationInput{
		RestApiId:  aws.String("api-123"),
		ResourceId: aws.String("resource-123"),
		HttpMethod: aws.String("GET"),
	}

	expectedOutput := &apigateway.DeleteIntegrationOutput{}

	mockClient.EXPECT().DeleteIntegration(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.DeleteIntegration(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_CreateDeployment(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.CreateDeploymentInput{
		RestApiId: aws.String("api-123"),
		StageName: aws.String("prod"),
	}

	expectedOutput := &apigateway.CreateDeploymentOutput{
		Id: aws.String("deployment-123"),
	}

	mockClient.EXPECT().CreateDeployment(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.CreateDeployment(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_DeleteDeployment(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.DeleteDeploymentInput{
		RestApiId:    aws.String("api-123"),
		DeploymentId: aws.String("deployment-123"),
	}

	expectedOutput := &apigateway.DeleteDeploymentOutput{}

	mockClient.EXPECT().DeleteDeployment(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.DeleteDeployment(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_GetDeployments(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.GetDeploymentsInput{RestApiId: aws.String("api-123")}

	expectedOutput := &apigateway.GetDeploymentsOutput{
		Items: []types.Deployment{
			{Id: aws.String("deployment-123"), Description: aws.String("Initial deployment")},
		},
	}

	mockClient.EXPECT().GetDeployments(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.GetDeployments(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_CreateStage(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.CreateStageInput{
		RestApiId:    aws.String("api-123"),
		StageName:    aws.String("prod"),
		DeploymentId: aws.String("deployment-123"),
	}

	expectedOutput := &apigateway.CreateStageOutput{
		StageName: aws.String("prod"),
	}

	mockClient.EXPECT().CreateStage(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.CreateStage(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_GetStages(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.GetStagesInput{RestApiId: aws.String("api-123")}

	expectedOutput := &apigateway.GetStagesOutput{
		Item: []types.Stage{{StageName: aws.String("prod")}},
	}

	mockClient.EXPECT().GetStages(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.GetStages(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_UpdateStage(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.UpdateStageInput{
		RestApiId: aws.String("api-123"),
		StageName: aws.String("prod"),
		PatchOperations: []types.PatchOperation{{
			Op:    types.OpReplace,
			Path:  aws.String("/description"),
			Value: aws.String("Updated description"),
		}},
	}

	expectedOutput := &apigateway.UpdateStageOutput{
		StageName: aws.String("prod"),
	}

	mockClient.EXPECT().UpdateStage(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.UpdateStage(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_DeleteStage(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.DeleteStageInput{
		RestApiId: aws.String("api-123"),
		StageName: aws.String("prod"),
	}

	expectedOutput := &apigateway.DeleteStageOutput{}

	mockClient.EXPECT().DeleteStage(ctx, input).Return(expectedOutput, nil)

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.DeleteStage(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestAPIGatewayAdapter_GetRestApis_Error(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.GetRestApisInput{}

	mockClient.EXPECT().GetRestApis(ctx, input).Return(nil, errors.New("some error"))

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.GetRestApis(ctx, input)

	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestAPIGatewayAdapter_CreateRestApi_Error(t *testing.T) {
	mockClient := apimocks.NewAPIGatewayClientPort(t)
	ctx := context.Background()
	input := &apigateway.CreateRestApiInput{Name: aws.String("test-api")}

	mockClient.EXPECT().CreateRestApi(ctx, input).Return(nil, errors.New("some error"))

	adapter := &APIGatewayAdapter{client: mockClient}
	output, err := adapter.CreateRestApi(ctx, input)

	assert.Error(t, err)
	assert.Nil(t, output)
}
