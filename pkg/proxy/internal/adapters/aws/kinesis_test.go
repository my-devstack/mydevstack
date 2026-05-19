package aws

import (
	"context"
	"errors"
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

func TestKinesisAdapter_MergeShards(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.MergeShardsInput{
		StreamName:          aws.String("test-stream"),
		ShardToMerge:        aws.String("shard-001"),
		AdjacentShardToMerge: aws.String("shard-002"),
	}
	expectedOutput := &kinesis.MergeShardsOutput{}

	mockClient.EXPECT().MergeShards(ctx, input).Return(expectedOutput, nil)
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.MergeShards(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKinesisAdapter_MergeShards_Error(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.MergeShardsInput{
		StreamName:          aws.String("test-stream"),
		ShardToMerge:        aws.String("shard-001"),
		AdjacentShardToMerge: aws.String("shard-002"),
	}

	mockClient.EXPECT().MergeShards(ctx, input).Return(nil, errors.New("some error"))
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.MergeShards(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestKinesisAdapter_SplitShard(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.SplitShardInput{
		StreamName:         aws.String("test-stream"),
		ShardToSplit:       aws.String("shard-001"),
		NewStartingHashKey: aws.String("123"),
	}
	expectedOutput := &kinesis.SplitShardOutput{}

	mockClient.EXPECT().SplitShard(ctx, input).Return(expectedOutput, nil)
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.SplitShard(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKinesisAdapter_SplitShard_Error(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.SplitShardInput{
		StreamName:         aws.String("test-stream"),
		ShardToSplit:       aws.String("shard-001"),
		NewStartingHashKey: aws.String("123"),
	}

	mockClient.EXPECT().SplitShard(ctx, input).Return(nil, errors.New("some error"))
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.SplitShard(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestKinesisAdapter_UpdateShardCount(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.UpdateShardCountInput{
		StreamName:       aws.String("test-stream"),
		TargetShardCount: aws.Int32(4),
	}
	expectedOutput := &kinesis.UpdateShardCountOutput{}

	mockClient.EXPECT().UpdateShardCount(ctx, input).Return(expectedOutput, nil)
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.UpdateShardCount(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKinesisAdapter_UpdateShardCount_Error(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.UpdateShardCountInput{
		StreamName:       aws.String("test-stream"),
		TargetShardCount: aws.Int32(4),
	}

	mockClient.EXPECT().UpdateShardCount(ctx, input).Return(nil, errors.New("some error"))
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.UpdateShardCount(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestKinesisAdapter_EnableEnhancedMonitoring(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.EnableEnhancedMonitoringInput{
		StreamName: aws.String("test-stream"),
		ShardLevelMetrics: []types.MetricsName{"All"},
	}
	expectedOutput := &kinesis.EnableEnhancedMonitoringOutput{}

	mockClient.EXPECT().EnableEnhancedMonitoring(ctx, input).Return(expectedOutput, nil)
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.EnableEnhancedMonitoring(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKinesisAdapter_EnableEnhancedMonitoring_Error(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.EnableEnhancedMonitoringInput{
		StreamName: aws.String("test-stream"),
		ShardLevelMetrics: []types.MetricsName{"All"},
	}

	mockClient.EXPECT().EnableEnhancedMonitoring(ctx, input).Return(nil, errors.New("some error"))
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.EnableEnhancedMonitoring(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestKinesisAdapter_DisableEnhancedMonitoring(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.DisableEnhancedMonitoringInput{
		StreamName: aws.String("test-stream"),
		ShardLevelMetrics: []types.MetricsName{"All"},
	}
	expectedOutput := &kinesis.DisableEnhancedMonitoringOutput{}

	mockClient.EXPECT().DisableEnhancedMonitoring(ctx, input).Return(expectedOutput, nil)
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.DisableEnhancedMonitoring(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKinesisAdapter_DisableEnhancedMonitoring_Error(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.DisableEnhancedMonitoringInput{
		StreamName: aws.String("test-stream"),
		ShardLevelMetrics: []types.MetricsName{"All"},
	}

	mockClient.EXPECT().DisableEnhancedMonitoring(ctx, input).Return(nil, errors.New("some error"))
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.DisableEnhancedMonitoring(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// --- Error tests for already-covered methods ---

func TestKinesisAdapter_ListStreams_Error(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.ListStreamsInput{}

	mockClient.EXPECT().ListStreams(ctx, input).Return(nil, errors.New("some error"))
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.ListStreams(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestKinesisAdapter_CreateStream_Error(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.CreateStreamInput{StreamName: aws.String("test-stream"), ShardCount: aws.Int32(1)}

	mockClient.EXPECT().CreateStream(ctx, input).Return(nil, errors.New("some error"))
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.CreateStream(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestKinesisAdapter_DeleteStream_Error(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.DeleteStreamInput{StreamName: aws.String("test-stream")}

	mockClient.EXPECT().DeleteStream(ctx, input).Return(nil, errors.New("some error"))
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.DeleteStream(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestKinesisAdapter_DescribeStream_Error(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.DescribeStreamInput{StreamName: aws.String("test-stream")}

	mockClient.EXPECT().DescribeStream(ctx, input).Return(nil, errors.New("some error"))
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.DescribeStream(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestKinesisAdapter_DescribeStreamSummary_Error(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.DescribeStreamSummaryInput{StreamName: aws.String("test-stream")}

	mockClient.EXPECT().DescribeStreamSummary(ctx, input).Return(nil, errors.New("some error"))
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.DescribeStreamSummary(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestKinesisAdapter_ListShards_Error(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.ListShardsInput{StreamName: aws.String("test-stream")}

	mockClient.EXPECT().ListShards(ctx, input).Return(nil, errors.New("some error"))
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.ListShards(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestKinesisAdapter_GetShardIterator_Error(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.GetShardIteratorInput{StreamName: aws.String("test-stream"), ShardId: aws.String("shard-000000000000")}

	mockClient.EXPECT().GetShardIterator(ctx, input).Return(nil, errors.New("some error"))
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.GetShardIterator(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestKinesisAdapter_GetRecords_Error(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.GetRecordsInput{ShardIterator: aws.String("iterator-123")}

	mockClient.EXPECT().GetRecords(ctx, input).Return(nil, errors.New("some error"))
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.GetRecords(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestKinesisAdapter_PutRecord_Error(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.PutRecordInput{StreamName: aws.String("test-stream"), Data: []byte("test"), PartitionKey: aws.String("pk")}

	mockClient.EXPECT().PutRecord(ctx, input).Return(nil, errors.New("some error"))
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.PutRecord(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestKinesisAdapter_PutRecords_Error(t *testing.T) {
	mockClient := kinmocks.NewKinesisClientPort(t)
	ctx := context.Background()
	input := &kinesis.PutRecordsInput{StreamName: aws.String("test-stream")}

	mockClient.EXPECT().PutRecords(ctx, input).Return(nil, errors.New("some error"))
	adapter := &KinesisAdapter{client: mockClient}

	output, err := adapter.PutRecords(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}
