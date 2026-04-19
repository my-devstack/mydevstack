package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/kinesis"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type KinesisAdapter struct {
	client ports.KinesisClientPort
}

func NewKinesisAdapter(awsCfg aws.Config, endpoint string) ports.KinesisPort {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := kinesis.NewFromConfig(awsCfg, func(o *kinesis.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &KinesisAdapter{client: client}
}

func (a *KinesisAdapter) ListStreams(ctx context.Context, input *kinesis.ListStreamsInput) (*kinesis.ListStreamsOutput, error) {
	return a.client.ListStreams(ctx, input)
}

func (a *KinesisAdapter) CreateStream(ctx context.Context, input *kinesis.CreateStreamInput) (*kinesis.CreateStreamOutput, error) {
	return a.client.CreateStream(ctx, input)
}

func (a *KinesisAdapter) DeleteStream(ctx context.Context, input *kinesis.DeleteStreamInput) (*kinesis.DeleteStreamOutput, error) {
	return a.client.DeleteStream(ctx, input)
}

func (a *KinesisAdapter) DescribeStream(ctx context.Context, input *kinesis.DescribeStreamInput) (*kinesis.DescribeStreamOutput, error) {
	return a.client.DescribeStream(ctx, input)
}

func (a *KinesisAdapter) DescribeStreamSummary(ctx context.Context, input *kinesis.DescribeStreamSummaryInput) (*kinesis.DescribeStreamSummaryOutput, error) {
	return a.client.DescribeStreamSummary(ctx, input)
}

func (a *KinesisAdapter) ListShards(ctx context.Context, input *kinesis.ListShardsInput) (*kinesis.ListShardsOutput, error) {
	return a.client.ListShards(ctx, input)
}

func (a *KinesisAdapter) GetShardIterator(ctx context.Context, input *kinesis.GetShardIteratorInput) (*kinesis.GetShardIteratorOutput, error) {
	return a.client.GetShardIterator(ctx, input)
}

func (a *KinesisAdapter) GetRecords(ctx context.Context, input *kinesis.GetRecordsInput) (*kinesis.GetRecordsOutput, error) {
	return a.client.GetRecords(ctx, input)
}

func (a *KinesisAdapter) PutRecord(ctx context.Context, input *kinesis.PutRecordInput) (*kinesis.PutRecordOutput, error) {
	return a.client.PutRecord(ctx, input)
}

func (a *KinesisAdapter) PutRecords(ctx context.Context, input *kinesis.PutRecordsInput) (*kinesis.PutRecordsOutput, error) {
	return a.client.PutRecords(ctx, input)
}

func (a *KinesisAdapter) MergeShards(ctx context.Context, input *kinesis.MergeShardsInput) (*kinesis.MergeShardsOutput, error) {
	return a.client.MergeShards(ctx, input)
}

func (a *KinesisAdapter) SplitShard(ctx context.Context, input *kinesis.SplitShardInput) (*kinesis.SplitShardOutput, error) {
	return a.client.SplitShard(ctx, input)
}

func (a *KinesisAdapter) UpdateShardCount(ctx context.Context, input *kinesis.UpdateShardCountInput) (*kinesis.UpdateShardCountOutput, error) {
	return a.client.UpdateShardCount(ctx, input)
}

func (a *KinesisAdapter) EnableEnhancedMonitoring(ctx context.Context, input *kinesis.EnableEnhancedMonitoringInput) (*kinesis.EnableEnhancedMonitoringOutput, error) {
	return a.client.EnableEnhancedMonitoring(ctx, input)
}

func (a *KinesisAdapter) DisableEnhancedMonitoring(ctx context.Context, input *kinesis.DisableEnhancedMonitoringInput) (*kinesis.DisableEnhancedMonitoringOutput, error) {
	return a.client.DisableEnhancedMonitoring(ctx, input)
}
