package aws

import (
	"context"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/kinesis"
	"github.com/aws/aws-sdk-go-v2/service/kinesis/types"
	kinmocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewKinesisAdapter(t *testing.T) {
	adapter := NewKinesisAdapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566")
	assert.NotNil(t, adapter)
	assert.IsType(t, &KinesisAdapter{}, adapter)
}

func TestKinesisAdapter_ListStreams(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.ListStreamsInput{}
	expectedOutput := &kinesis.ListStreamsOutput{StreamNames: []string{"test-stream"}}

	mockClient.EXPECT().ListStreams(ctx, input).Return(expectedOutput, nil)
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.ListStreams(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKinesisAdapter_CreateStream(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.CreateStreamInput{StreamName: aws.String("test-stream"), ShardCount: aws.Int32(1)}
	expectedOutput := &kinesis.CreateStreamOutput{}

	mockClient.EXPECT().CreateStream(ctx, input).Return(expectedOutput, nil)
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.CreateStream(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKinesisAdapter_DeleteStream(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.DeleteStreamInput{StreamName: aws.String("test-stream")}
	expectedOutput := &kinesis.DeleteStreamOutput{}

	mockClient.EXPECT().DeleteStream(ctx, input).Return(expectedOutput, nil)
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.DeleteStream(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKinesisAdapter_DescribeStream(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.DescribeStreamInput{StreamName: aws.String("test-stream")}
	expectedOutput := &kinesis.DescribeStreamOutput{StreamDescription: &types.StreamDescription{StreamName: aws.String("test-stream"), StreamStatus: types.StreamStatusActive}}

	mockClient.EXPECT().DescribeStream(ctx, input).Return(expectedOutput, nil)
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.DescribeStream(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKinesisAdapter_DescribeStreamSummary(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.DescribeStreamSummaryInput{StreamName: aws.String("test-stream")}
	expectedOutput := &kinesis.DescribeStreamSummaryOutput{}

	mockClient.EXPECT().DescribeStreamSummary(ctx, input).Return(expectedOutput, nil)
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.DescribeStreamSummary(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKinesisAdapter_ListShards(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.ListShardsInput{StreamName: aws.String("test-stream")}
	expectedOutput := &kinesis.ListShardsOutput{}

	mockClient.EXPECT().ListShards(ctx, input).Return(expectedOutput, nil)
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.ListShards(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKinesisAdapter_GetShardIterator(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.GetShardIteratorInput{StreamName: aws.String("test-stream"), ShardId: aws.String("shard-000000000000")}
	expectedOutput := &kinesis.GetShardIteratorOutput{ShardIterator: aws.String("iterator-123")}

	mockClient.EXPECT().GetShardIterator(ctx, input).Return(expectedOutput, nil)
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.GetShardIterator(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKinesisAdapter_GetRecords(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.GetRecordsInput{ShardIterator: aws.String("iterator-123")}
	expectedOutput := &kinesis.GetRecordsOutput{}

	mockClient.EXPECT().GetRecords(ctx, input).Return(expectedOutput, nil)
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.GetRecords(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKinesisAdapter_PutRecord(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.PutRecordInput{StreamName: aws.String("test-stream"), Data: []byte("test"), PartitionKey: aws.String("pk")}
	expectedOutput := &kinesis.PutRecordOutput{SequenceNumber: aws.String("123")}

	mockClient.EXPECT().PutRecord(ctx, input).Return(expectedOutput, nil)
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.PutRecord(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKinesisAdapter_PutRecords(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.PutRecordsInput{StreamName: aws.String("test-stream")}
	expectedOutput := &kinesis.PutRecordsOutput{}

	mockClient.EXPECT().PutRecords(ctx, input).Return(expectedOutput, nil)
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.PutRecords(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}
