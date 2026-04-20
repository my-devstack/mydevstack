package aws

import (
	"context"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/elasticache"
	"github.com/aws/aws-sdk-go-v2/service/elasticache/types"
	ecmocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewElastiCacheAdapter(t *testing.T) {
	adapter := NewElastiCacheAdapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566")
	assert.NotNil(t, adapter)
	assert.IsType(t, &ElastiCacheAdapter{}, adapter)
}

func TestElastiCacheAdapter_DescribeReplicationGroups(t *testing.T) {
	mockClient := ecmocks.NewElastiCacheClientPort(t)
	ctx := context.Background()
	input := &elasticache.DescribeReplicationGroupsInput{}
	expectedOutput := &elasticache.DescribeReplicationGroupsOutput{ReplicationGroups: []types.ReplicationGroup{{ReplicationGroupId: aws.String("test-cluster"), Status: aws.String("available")}}}

	mockClient.EXPECT().DescribeReplicationGroups(ctx, input).Return(expectedOutput, nil)
	adapter := &ElastiCacheAdapter{client: mockClient}

	output, err := adapter.DescribeReplicationGroups(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestElastiCacheAdapter_CreateReplicationGroup(t *testing.T) {
	mockClient := ecmocks.NewElastiCacheClientPort(t)
	ctx := context.Background()
	input := &elasticache.CreateReplicationGroupInput{ReplicationGroupId: aws.String("test-cluster"), ReplicationGroupDescription: aws.String("test cluster")}
	expectedOutput := &elasticache.CreateReplicationGroupOutput{ReplicationGroup: &types.ReplicationGroup{ReplicationGroupId: aws.String("test-cluster")}}

	mockClient.EXPECT().CreateReplicationGroup(ctx, input).Return(expectedOutput, nil)
	adapter := &ElastiCacheAdapter{client: mockClient}

	output, err := adapter.CreateReplicationGroup(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestElastiCacheAdapter_DeleteReplicationGroup(t *testing.T) {
	mockClient := ecmocks.NewElastiCacheClientPort(t)
	ctx := context.Background()
	input := &elasticache.DeleteReplicationGroupInput{ReplicationGroupId: aws.String("test-cluster")}
	expectedOutput := &elasticache.DeleteReplicationGroupOutput{ReplicationGroup: &types.ReplicationGroup{ReplicationGroupId: aws.String("test-cluster")}}

	mockClient.EXPECT().DeleteReplicationGroup(ctx, input).Return(expectedOutput, nil)
	adapter := &ElastiCacheAdapter{client: mockClient}

	output, err := adapter.DeleteReplicationGroup(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}
