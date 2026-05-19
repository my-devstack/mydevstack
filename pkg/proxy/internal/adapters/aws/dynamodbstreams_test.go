package aws

import (
	"context"
	"errors"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodbstreams"
	"github.com/aws/aws-sdk-go-v2/service/dynamodbstreams/types"
	ddbsmocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewDynamoDBStreamsAdapter(t *testing.T) {
	awsCfg := aws.Config{Region: "us-east-1"}
	endpoint := "http://localhost:4566"

	adapter := NewDynamoDBStreamsAdapter(awsCfg, endpoint)

	assert.NotNil(t, adapter, "DynamoDBStreamsAdapter should not be nil")
	assert.IsType(t, &DynamoDBStreamsAdapter{}, adapter, "Should return DynamoDBStreamsAdapter type")
}

func TestDynamoDBStreamsAdapter_ListStreams(t *testing.T) {
	mockClient := ddbsmocks.NewDynamoDBStreamsClientPort(t)
	ctx := context.Background()
	input := &dynamodbstreams.ListStreamsInput{}
	expectedOutput := &dynamodbstreams.ListStreamsOutput{}

	mockClient.EXPECT().ListStreams(ctx, input).Return(expectedOutput, nil)
	adapter := &DynamoDBStreamsAdapter{client: mockClient}

	output, err := adapter.ListStreams(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestDynamoDBStreamsAdapter_ListStreams_Error(t *testing.T) {
	mockClient := ddbsmocks.NewDynamoDBStreamsClientPort(t)
	ctx := context.Background()
	input := &dynamodbstreams.ListStreamsInput{}

	mockClient.EXPECT().ListStreams(ctx, input).Return(nil, errors.New("some error"))
	adapter := &DynamoDBStreamsAdapter{client: mockClient}

	output, err := adapter.ListStreams(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestDynamoDBStreamsAdapter_DescribeStream(t *testing.T) {
	mockClient := ddbsmocks.NewDynamoDBStreamsClientPort(t)
	ctx := context.Background()
	input := &dynamodbstreams.DescribeStreamInput{StreamArn: aws.String("arn:aws:dynamodb:us-east-1:123456789012:table/test-table/stream/2024-01-01")}
	expectedOutput := &dynamodbstreams.DescribeStreamOutput{}

	mockClient.EXPECT().DescribeStream(ctx, input).Return(expectedOutput, nil)
	adapter := &DynamoDBStreamsAdapter{client: mockClient}

	output, err := adapter.DescribeStream(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestDynamoDBStreamsAdapter_DescribeStream_Error(t *testing.T) {
	mockClient := ddbsmocks.NewDynamoDBStreamsClientPort(t)
	ctx := context.Background()
	input := &dynamodbstreams.DescribeStreamInput{StreamArn: aws.String("arn:aws:dynamodb:us-east-1:123456789012:table/test-table/stream/2024-01-01")}

	mockClient.EXPECT().DescribeStream(ctx, input).Return(nil, errors.New("some error"))
	adapter := &DynamoDBStreamsAdapter{client: mockClient}

	output, err := adapter.DescribeStream(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestDynamoDBStreamsAdapter_GetShardIterator(t *testing.T) {
	mockClient := ddbsmocks.NewDynamoDBStreamsClientPort(t)
	ctx := context.Background()
	input := &dynamodbstreams.GetShardIteratorInput{
		StreamArn:         aws.String("arn:aws:dynamodb:us-east-1:123456789012:table/test-table/stream/2024-01-01"),
		ShardId:           aws.String("shard-000000000000"),
		ShardIteratorType: types.ShardIteratorTypeTrimHorizon,
	}
	expectedOutput := &dynamodbstreams.GetShardIteratorOutput{}

	mockClient.EXPECT().GetShardIterator(ctx, input).Return(expectedOutput, nil)
	adapter := &DynamoDBStreamsAdapter{client: mockClient}

	output, err := adapter.GetShardIterator(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestDynamoDBStreamsAdapter_GetShardIterator_Error(t *testing.T) {
	mockClient := ddbsmocks.NewDynamoDBStreamsClientPort(t)
	ctx := context.Background()
	input := &dynamodbstreams.GetShardIteratorInput{
		StreamArn:         aws.String("arn:aws:dynamodb:us-east-1:123456789012:table/test-table/stream/2024-01-01"),
		ShardId:           aws.String("shard-000000000000"),
		ShardIteratorType: types.ShardIteratorTypeTrimHorizon,
	}

	mockClient.EXPECT().GetShardIterator(ctx, input).Return(nil, errors.New("some error"))
	adapter := &DynamoDBStreamsAdapter{client: mockClient}

	output, err := adapter.GetShardIterator(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestDynamoDBStreamsAdapter_GetRecords(t *testing.T) {
	mockClient := ddbsmocks.NewDynamoDBStreamsClientPort(t)
	ctx := context.Background()
	input := &dynamodbstreams.GetRecordsInput{
		ShardIterator: aws.String("arn:aws:dynamodb:us-east-1:123456789012:table/test-table/stream/2024-01-01|1|AAAAAAAA"),
	}
	expectedOutput := &dynamodbstreams.GetRecordsOutput{}

	mockClient.EXPECT().GetRecords(ctx, input).Return(expectedOutput, nil)
	adapter := &DynamoDBStreamsAdapter{client: mockClient}

	output, err := adapter.GetRecords(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestDynamoDBStreamsAdapter_GetRecords_Error(t *testing.T) {
	mockClient := ddbsmocks.NewDynamoDBStreamsClientPort(t)
	ctx := context.Background()
	input := &dynamodbstreams.GetRecordsInput{
		ShardIterator: aws.String("arn:aws:dynamodb:us-east-1:123456789012:table/test-table/stream/2024-01-01|1|AAAAAAAA"),
	}

	mockClient.EXPECT().GetRecords(ctx, input).Return(nil, errors.New("some error"))
	adapter := &DynamoDBStreamsAdapter{client: mockClient}

	output, err := adapter.GetRecords(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}
