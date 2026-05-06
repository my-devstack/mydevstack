package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type LambdaAdapter struct {
	client ports.LambdaClientPort
}

func NewLambdaAdapter(awsCfg aws.Config, endpoint string) ports.LambdaPort {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := lambda.NewFromConfig(awsCfg, func(o *lambda.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &LambdaAdapter{client: client}
}

func (a *LambdaAdapter) ListFunctions(ctx context.Context, input *lambda.ListFunctionsInput) (*lambda.ListFunctionsOutput, error) {
	return a.client.ListFunctions(ctx, input)
}

func (a *LambdaAdapter) CreateFunction(ctx context.Context, input *lambda.CreateFunctionInput) (*lambda.CreateFunctionOutput, error) {
	return a.client.CreateFunction(ctx, input)
}

func (a *LambdaAdapter) GetFunction(ctx context.Context, input *lambda.GetFunctionInput) (*lambda.GetFunctionOutput, error) {
	return a.client.GetFunction(ctx, input)
}

func (a *LambdaAdapter) DeleteFunction(ctx context.Context, input *lambda.DeleteFunctionInput) (*lambda.DeleteFunctionOutput, error) {
	return a.client.DeleteFunction(ctx, input)
}

func (a *LambdaAdapter) Invoke(ctx context.Context, input *lambda.InvokeInput) (*lambda.InvokeOutput, error) {
	return a.client.Invoke(ctx, input)
}

func (a *LambdaAdapter) UpdateFunctionConfiguration(ctx context.Context, input *lambda.UpdateFunctionConfigurationInput) (*lambda.UpdateFunctionConfigurationOutput, error) {
	return a.client.UpdateFunctionConfiguration(ctx, input)
}

func (a *LambdaAdapter) UpdateFunctionCode(ctx context.Context, input *lambda.UpdateFunctionCodeInput) (*lambda.UpdateFunctionCodeOutput, error) {
	return a.client.UpdateFunctionCode(ctx, input)
}

func (a *LambdaAdapter) GetFunctionConfiguration(ctx context.Context, input *lambda.GetFunctionConfigurationInput) (*lambda.GetFunctionConfigurationOutput, error) {
	return a.client.GetFunctionConfiguration(ctx, input)
}

func (a *LambdaAdapter) ListEventSourceMappings(ctx context.Context, input *lambda.ListEventSourceMappingsInput) (*lambda.ListEventSourceMappingsOutput, error) {
	return a.client.ListEventSourceMappings(ctx, input)
}

func (a *LambdaAdapter) CreateEventSourceMapping(ctx context.Context, input *lambda.CreateEventSourceMappingInput) (*lambda.CreateEventSourceMappingOutput, error) {
	return a.client.CreateEventSourceMapping(ctx, input)
}

func (a *LambdaAdapter) GetEventSourceMapping(ctx context.Context, input *lambda.GetEventSourceMappingInput) (*lambda.GetEventSourceMappingOutput, error) {
	return a.client.GetEventSourceMapping(ctx, input)
}

func (a *LambdaAdapter) DeleteEventSourceMapping(ctx context.Context, input *lambda.DeleteEventSourceMappingInput) (*lambda.DeleteEventSourceMappingOutput, error) {
	return a.client.DeleteEventSourceMapping(ctx, input)
}
