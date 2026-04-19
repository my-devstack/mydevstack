package aws

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type SSMAdapter struct {
	client ports.SSMClientPort
}

func NewSSMAdapter(cfg aws.Config, endpoint string) *SSMAdapter {
	client := ssm.NewFromConfig(cfg, func(o *ssm.Options) {
		if endpoint != "" {
			o.BaseEndpoint = aws.String(endpoint)
		}
	})
	return &SSMAdapter{client: client}
}

func (a *SSMAdapter) GetParameter(ctx context.Context, input *ssm.GetParameterInput) (*ssm.GetParameterOutput, error) {
	return a.client.GetParameter(ctx, input)
}

func (a *SSMAdapter) GetParameters(ctx context.Context, input *ssm.GetParametersInput) (*ssm.GetParametersOutput, error) {
	return a.client.GetParameters(ctx, input)
}

func (a *SSMAdapter) GetParametersByPath(ctx context.Context, input *ssm.GetParametersByPathInput) (*ssm.GetParametersByPathOutput, error) {
	return a.client.GetParametersByPath(ctx, input)
}

func (a *SSMAdapter) PutParameter(ctx context.Context, input *ssm.PutParameterInput) (*ssm.PutParameterOutput, error) {
	return a.client.PutParameter(ctx, input)
}

func (a *SSMAdapter) DeleteParameter(ctx context.Context, input *ssm.DeleteParameterInput) (*ssm.DeleteParameterOutput, error) {
	return a.client.DeleteParameter(ctx, input)
}

func (a *SSMAdapter) DescribeParameters(ctx context.Context, input *ssm.DescribeParametersInput) (*ssm.DescribeParametersOutput, error) {
	return a.client.DescribeParameters(ctx, input)
}

func (a *SSMAdapter) GetParameterHistory(ctx context.Context, input *ssm.GetParameterHistoryInput) (*ssm.GetParameterHistoryOutput, error) {
	return a.client.GetParameterHistory(ctx, input)
}

func (a *SSMAdapter) ListTagsForResource(ctx context.Context, input *ssm.ListTagsForResourceInput) (*ssm.ListTagsForResourceOutput, error) {
	return a.client.ListTagsForResource(ctx, input)
}

func (a *SSMAdapter) AddTagsToResource(ctx context.Context, input *ssm.AddTagsToResourceInput) (*ssm.AddTagsToResourceOutput, error) {
	return a.client.AddTagsToResource(ctx, input)
}

func (a *SSMAdapter) RemoveTagsFromResource(ctx context.Context, input *ssm.RemoveTagsFromResourceInput) (*ssm.RemoveTagsFromResourceOutput, error) {
	return a.client.RemoveTagsFromResource(ctx, input)
}
