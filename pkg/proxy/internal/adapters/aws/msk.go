package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/kafka"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type MSKAdapter struct {
	client ports.MSKClientPort
}

func NewMSKAdapter(awsCfg aws.Config, endpoint string) ports.MSKPort {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := kafka.NewFromConfig(awsCfg, func(o *kafka.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &MSKAdapter{client: client}
}

func (a *MSKAdapter) ListClustersV2(ctx context.Context, input *kafka.ListClustersV2Input) (*kafka.ListClustersV2Output, error) {
	return a.client.ListClustersV2(ctx, input)
}

func (a *MSKAdapter) DescribeClusterV2(ctx context.Context, input *kafka.DescribeClusterV2Input) (*kafka.DescribeClusterV2Output, error) {
	return a.client.DescribeClusterV2(ctx, input)
}

func (a *MSKAdapter) CreateClusterV2(ctx context.Context, input *kafka.CreateClusterV2Input) (*kafka.CreateClusterV2Output, error) {
	return a.client.CreateClusterV2(ctx, input)
}

func (a *MSKAdapter) DeleteCluster(ctx context.Context, input *kafka.DeleteClusterInput) (*kafka.DeleteClusterOutput, error) {
	return a.client.DeleteCluster(ctx, input)
}

func (a *MSKAdapter) GetBootstrapBrokers(ctx context.Context, input *kafka.GetBootstrapBrokersInput) (*kafka.GetBootstrapBrokersOutput, error) {
	return a.client.GetBootstrapBrokers(ctx, input)
}


