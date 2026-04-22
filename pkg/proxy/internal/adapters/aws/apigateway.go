package aws

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

// Ensure APIGatewayAdapter implements the port interface
var _ ports.APIGatewayPort = (*APIGatewayAdapter)(nil)

type APIGatewayAdapter struct {
	client ports.APIGatewayClientPort
	region string
}

func NewAPIGatewayAdapter(awsCfg aws.Config, endpoint string) ports.APIGatewayPort {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := apigateway.NewFromConfig(awsCfg, func(o *apigateway.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &APIGatewayAdapter{client: client, region: awsCfg.Region}
}

func (a *APIGatewayAdapter) CreateRestApi(ctx context.Context, input *apigateway.CreateRestApiInput) (*apigateway.CreateRestApiOutput, error) {
	return a.client.CreateRestApi(ctx, input)
}

func (a *APIGatewayAdapter) ImportRestApi(ctx context.Context, input *apigateway.ImportRestApiInput) (*apigateway.ImportRestApiOutput, error) {
	return a.client.ImportRestApi(ctx, input)
}

func (a *APIGatewayAdapter) DeleteRestApi(ctx context.Context, input *apigateway.DeleteRestApiInput) (*apigateway.DeleteRestApiOutput, error) {
	return a.client.DeleteRestApi(ctx, input)
}

func (a *APIGatewayAdapter) GetRestApi(ctx context.Context, input *apigateway.GetRestApiInput) (*apigateway.GetRestApiOutput, error) {
	return a.client.GetRestApi(ctx, input)
}

func (a *APIGatewayAdapter) GetRestApis(ctx context.Context, input *apigateway.GetRestApisInput) (*apigateway.GetRestApisOutput, error) {
	return a.client.GetRestApis(ctx, input)
}

func (a *APIGatewayAdapter) UpdateRestApi(ctx context.Context, input *apigateway.UpdateRestApiInput) (*apigateway.UpdateRestApiOutput, error) {
	return a.client.UpdateRestApi(ctx, input)
}

func (a *APIGatewayAdapter) GetResources(ctx context.Context, input *apigateway.GetResourcesInput) (*apigateway.GetResourcesOutput, error) {
	return a.client.GetResources(ctx, input)
}

func (a *APIGatewayAdapter) GetResource(ctx context.Context, input *apigateway.GetResourceInput) (*apigateway.GetResourceOutput, error) {
	return a.client.GetResource(ctx, input)
}

func (a *APIGatewayAdapter) CreateResource(ctx context.Context, input *apigateway.CreateResourceInput) (*apigateway.CreateResourceOutput, error) {
	return a.client.CreateResource(ctx, input)
}

func (a *APIGatewayAdapter) DeleteResource(ctx context.Context, input *apigateway.DeleteResourceInput) (*apigateway.DeleteResourceOutput, error) {
	return a.client.DeleteResource(ctx, input)
}

func (a *APIGatewayAdapter) PutMethod(ctx context.Context, input *apigateway.PutMethodInput) (*apigateway.PutMethodOutput, error) {
	return a.client.PutMethod(ctx, input)
}

func (a *APIGatewayAdapter) GetMethod(ctx context.Context, input *apigateway.GetMethodInput) (*apigateway.GetMethodOutput, error) {
	return a.client.GetMethod(ctx, input)
}

func (a *APIGatewayAdapter) DeleteMethod(ctx context.Context, input *apigateway.DeleteMethodInput) (*apigateway.DeleteMethodOutput, error) {
	return a.client.DeleteMethod(ctx, input)
}

func (a *APIGatewayAdapter) PutIntegration(ctx context.Context, input *apigateway.PutIntegrationInput) (*apigateway.PutIntegrationOutput, error) {
	return a.client.PutIntegration(ctx, input)
}

func (a *APIGatewayAdapter) GetIntegration(ctx context.Context, input *apigateway.GetIntegrationInput) (*apigateway.GetIntegrationOutput, error) {
	return a.client.GetIntegration(ctx, input)
}

func (a *APIGatewayAdapter) DeleteIntegration(ctx context.Context, input *apigateway.DeleteIntegrationInput) (*apigateway.DeleteIntegrationOutput, error) {
	return a.client.DeleteIntegration(ctx, input)
}

func (a *APIGatewayAdapter) CreateDeployment(ctx context.Context, input *apigateway.CreateDeploymentInput) (*apigateway.CreateDeploymentOutput, error) {
	return a.client.CreateDeployment(ctx, input)
}

func (a *APIGatewayAdapter) DeleteDeployment(ctx context.Context, input *apigateway.DeleteDeploymentInput) (*apigateway.DeleteDeploymentOutput, error) {
	return a.client.DeleteDeployment(ctx, input)
}

func (a *APIGatewayAdapter) GetDeployments(ctx context.Context, input *apigateway.GetDeploymentsInput) (*apigateway.GetDeploymentsOutput, error) {
	return a.client.GetDeployments(ctx, input)
}

func (a *APIGatewayAdapter) CreateStage(ctx context.Context, input *apigateway.CreateStageInput) (*apigateway.CreateStageOutput, error) {
	return a.client.CreateStage(ctx, input)
}

func (a *APIGatewayAdapter) GetStages(ctx context.Context, input *apigateway.GetStagesInput) (*apigateway.GetStagesOutput, error) {
	return a.client.GetStages(ctx, input)
}

func (a *APIGatewayAdapter) UpdateStage(ctx context.Context, input *apigateway.UpdateStageInput) (*apigateway.UpdateStageOutput, error) {
	return a.client.UpdateStage(ctx, input)
}

func (a *APIGatewayAdapter) DeleteStage(ctx context.Context, input *apigateway.DeleteStageInput) (*apigateway.DeleteStageOutput, error) {
	return a.client.DeleteStage(ctx, input)
}

func (a *APIGatewayAdapter) GetInvokeUrl(ctx context.Context, apiId, stageName string) (string, error) {
	if apiId == "" {
		return "", fmt.Errorf("apiId is required")
	}
	if stageName == "" {
		return "", fmt.Errorf("stageName is required")
	}
	return fmt.Sprintf("https://%s.execute-api.%s.amazonaws.com/%s", apiId, a.region, stageName), nil
}
