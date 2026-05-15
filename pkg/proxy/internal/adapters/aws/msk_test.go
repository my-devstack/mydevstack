package aws

import (
	"context"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/kafka"
	mskmocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewMSKAdapter(t *testing.T) {
	adapter := NewMSKAdapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566")
	assert.NotNil(t, adapter)
	assert.IsType(t, &MSKAdapter{}, adapter)
}

func TestMSKAdapter_ListClustersV2(t *testing.T) {
	mockClient := mskmocks.NewMSKClientPort(t)
	ctx := context.Background()
	input := &kafka.ListClustersV2Input{}
	expectedOutput := &kafka.ListClustersV2Output{}

	mockClient.EXPECT().ListClustersV2(ctx, input).Return(expectedOutput, nil)
	adapter := &MSKAdapter{client: mockClient}

	output, err := adapter.ListClustersV2(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestMSKAdapter_DescribeClusterV2(t *testing.T) {
	mockClient := mskmocks.NewMSKClientPort(t)
	ctx := context.Background()
	input := &kafka.DescribeClusterV2Input{ClusterArn: aws.String("arn:aws:kafka:us-east-1:123456789012:cluster/test-cluster")}
	expectedOutput := &kafka.DescribeClusterV2Output{}

	mockClient.EXPECT().DescribeClusterV2(ctx, input).Return(expectedOutput, nil)
	adapter := &MSKAdapter{client: mockClient}

	output, err := adapter.DescribeClusterV2(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestMSKAdapter_CreateClusterV2(t *testing.T) {
	mockClient := mskmocks.NewMSKClientPort(t)
	ctx := context.Background()
	input := &kafka.CreateClusterV2Input{ClusterName: aws.String("test-cluster")}
	expectedOutput := &kafka.CreateClusterV2Output{}

	mockClient.EXPECT().CreateClusterV2(ctx, input).Return(expectedOutput, nil)
	adapter := &MSKAdapter{client: mockClient}

	output, err := adapter.CreateClusterV2(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestMSKAdapter_DeleteCluster(t *testing.T) {
	mockClient := mskmocks.NewMSKClientPort(t)
	ctx := context.Background()
	input := &kafka.DeleteClusterInput{ClusterArn: aws.String("arn:aws:kafka:us-east-1:123456789012:cluster/test-cluster")}
	expectedOutput := &kafka.DeleteClusterOutput{}

	mockClient.EXPECT().DeleteCluster(ctx, input).Return(expectedOutput, nil)
	adapter := &MSKAdapter{client: mockClient}

	output, err := adapter.DeleteCluster(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestMSKAdapter_GetBootstrapBrokers(t *testing.T) {
	mockClient := mskmocks.NewMSKClientPort(t)
	ctx := context.Background()
	input := &kafka.GetBootstrapBrokersInput{ClusterArn: aws.String("arn:aws:kafka:us-east-1:123456789012:cluster/test-cluster")}
	expectedOutput := &kafka.GetBootstrapBrokersOutput{}

	mockClient.EXPECT().GetBootstrapBrokers(ctx, input).Return(expectedOutput, nil)
	adapter := &MSKAdapter{client: mockClient}

	output, err := adapter.GetBootstrapBrokers(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}


