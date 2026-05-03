package aws

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type CloudFormationAdapter struct {
	client ports.CloudFormationClientPort
}

func NewCloudFormationAdapter(awsCfg aws.Config, endpoint string) ports.CloudFormationPort {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := cloudformation.NewFromConfig(awsCfg, func(o *cloudformation.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &CloudFormationAdapter{client: client}
}

func (a *CloudFormationAdapter) ListStacks(ctx context.Context, input *cloudformation.ListStacksInput) (*cloudformation.ListStacksOutput, error) {
	result, err := a.client.ListStacks(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("list stacks: %w", err)
	}
	return result, nil
}

func (a *CloudFormationAdapter) CreateStack(ctx context.Context, input *cloudformation.CreateStackInput) (*cloudformation.CreateStackOutput, error) {
	result, err := a.client.CreateStack(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("create stack: %w", err)
	}
	return result, nil
}

func (a *CloudFormationAdapter) DeleteStack(ctx context.Context, input *cloudformation.DeleteStackInput) (*cloudformation.DeleteStackOutput, error) {
	result, err := a.client.DeleteStack(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("delete stack: %w", err)
	}
	return result, nil
}

func (a *CloudFormationAdapter) DescribeStacks(ctx context.Context, input *cloudformation.DescribeStacksInput) (*cloudformation.DescribeStacksOutput, error) {
	result, err := a.client.DescribeStacks(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("describe stacks: %w", err)
	}
	return result, nil
}

func (a *CloudFormationAdapter) GetTemplate(ctx context.Context, input *cloudformation.GetTemplateInput) (*cloudformation.GetTemplateOutput, error) {
	result, err := a.client.GetTemplate(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("get template: %w", err)
	}
	return result, nil
}

func (a *CloudFormationAdapter) ListStackResources(ctx context.Context, input *cloudformation.ListStackResourcesInput) (*cloudformation.ListStackResourcesOutput, error) {
	result, err := a.client.ListStackResources(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("list stack resources: %w", err)
	}
	return result, nil
}
