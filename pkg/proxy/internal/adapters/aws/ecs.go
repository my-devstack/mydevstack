package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ecs"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type ECSAdapter struct {
	client ports.ECSClientPort
}

func NewECSAdapter(awsCfg aws.Config, endpoint string) ports.ECSPort {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := ecs.NewFromConfig(awsCfg, func(o *ecs.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &ECSAdapter{
		client: client,
	}
}

// Clusters

func (a *ECSAdapter) CreateCluster(ctx context.Context, input *ecs.CreateClusterInput) (*ecs.CreateClusterOutput, error) {
	return a.client.CreateCluster(ctx, input)
}

func (a *ECSAdapter) DescribeClusters(ctx context.Context, input *ecs.DescribeClustersInput) (*ecs.DescribeClustersOutput, error) {
	return a.client.DescribeClusters(ctx, input)
}

func (a *ECSAdapter) ListClusters(ctx context.Context, input *ecs.ListClustersInput) (*ecs.ListClustersOutput, error) {
	return a.client.ListClusters(ctx, input)
}

func (a *ECSAdapter) DeleteCluster(ctx context.Context, input *ecs.DeleteClusterInput) (*ecs.DeleteClusterOutput, error) {
	return a.client.DeleteCluster(ctx, input)
}

// Task Definitions

func (a *ECSAdapter) RegisterTaskDefinition(ctx context.Context, input *ecs.RegisterTaskDefinitionInput) (*ecs.RegisterTaskDefinitionOutput, error) {
	return a.client.RegisterTaskDefinition(ctx, input)
}

func (a *ECSAdapter) DescribeTaskDefinition(ctx context.Context, input *ecs.DescribeTaskDefinitionInput) (*ecs.DescribeTaskDefinitionOutput, error) {
	return a.client.DescribeTaskDefinition(ctx, input)
}

func (a *ECSAdapter) ListTaskDefinitions(ctx context.Context, input *ecs.ListTaskDefinitionsInput) (*ecs.ListTaskDefinitionsOutput, error) {
	return a.client.ListTaskDefinitions(ctx, input)
}

func (a *ECSAdapter) ListTaskDefinitionFamilies(ctx context.Context, input *ecs.ListTaskDefinitionFamiliesInput) (*ecs.ListTaskDefinitionFamiliesOutput, error) {
	return a.client.ListTaskDefinitionFamilies(ctx, input)
}

func (a *ECSAdapter) DeregisterTaskDefinition(ctx context.Context, input *ecs.DeregisterTaskDefinitionInput) (*ecs.DeregisterTaskDefinitionOutput, error) {
	return a.client.DeregisterTaskDefinition(ctx, input)
}

// Tasks

func (a *ECSAdapter) RunTask(ctx context.Context, input *ecs.RunTaskInput) (*ecs.RunTaskOutput, error) {
	return a.client.RunTask(ctx, input)
}

func (a *ECSAdapter) StopTask(ctx context.Context, input *ecs.StopTaskInput) (*ecs.StopTaskOutput, error) {
	return a.client.StopTask(ctx, input)
}

func (a *ECSAdapter) DescribeTasks(ctx context.Context, input *ecs.DescribeTasksInput) (*ecs.DescribeTasksOutput, error) {
	return a.client.DescribeTasks(ctx, input)
}

func (a *ECSAdapter) ListTasks(ctx context.Context, input *ecs.ListTasksInput) (*ecs.ListTasksOutput, error) {
	return a.client.ListTasks(ctx, input)
}

// Services

func (a *ECSAdapter) CreateService(ctx context.Context, input *ecs.CreateServiceInput) (*ecs.CreateServiceOutput, error) {
	return a.client.CreateService(ctx, input)
}

func (a *ECSAdapter) DescribeServices(ctx context.Context, input *ecs.DescribeServicesInput) (*ecs.DescribeServicesOutput, error) {
	return a.client.DescribeServices(ctx, input)
}

func (a *ECSAdapter) ListServices(ctx context.Context, input *ecs.ListServicesInput) (*ecs.ListServicesOutput, error) {
	return a.client.ListServices(ctx, input)
}

func (a *ECSAdapter) DeleteService(ctx context.Context, input *ecs.DeleteServiceInput) (*ecs.DeleteServiceOutput, error) {
	return a.client.DeleteService(ctx, input)
}
