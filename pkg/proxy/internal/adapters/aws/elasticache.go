package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/elasticache"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type ElastiCacheAdapter struct {
	client ports.ElastiCacheClientPort
}

func NewElastiCacheAdapter(awsCfg aws.Config, endpoint string) ports.ElastiCachePort {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := elasticache.NewFromConfig(awsCfg, func(o *elasticache.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &ElastiCacheAdapter{client: client}
}

func (a *ElastiCacheAdapter) DescribeReplicationGroups(ctx context.Context, input *elasticache.DescribeReplicationGroupsInput) (*elasticache.DescribeReplicationGroupsOutput, error) {
	return a.client.DescribeReplicationGroups(ctx, input)
}

func (a *ElastiCacheAdapter) CreateReplicationGroup(ctx context.Context, input *elasticache.CreateReplicationGroupInput) (*elasticache.CreateReplicationGroupOutput, error) {
	return a.client.CreateReplicationGroup(ctx, input)
}

func (a *ElastiCacheAdapter) DeleteReplicationGroup(ctx context.Context, input *elasticache.DeleteReplicationGroupInput) (*elasticache.DeleteReplicationGroupOutput, error) {
	return a.client.DeleteReplicationGroup(ctx, input)
}
