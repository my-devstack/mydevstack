package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodbstreams"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type DynamoDBStreamsAdapter struct {
	client ports.DynamoDBStreamsClientPort
}

func NewDynamoDBStreamsAdapter(awsCfg aws.Config, endpoint string) ports.DynamoDBStreamsPort {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := dynamodbstreams.NewFromConfig(awsCfg, func(o *dynamodbstreams.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &DynamoDBStreamsAdapter{client: client}
}

func (a *DynamoDBStreamsAdapter) ListStreams(ctx context.Context, input *dynamodbstreams.ListStreamsInput) (*dynamodbstreams.ListStreamsOutput, error) {
	return a.client.ListStreams(ctx, input)
}

func (a *DynamoDBStreamsAdapter) DescribeStream(ctx context.Context, input *dynamodbstreams.DescribeStreamInput) (*dynamodbstreams.DescribeStreamOutput, error) {
	return a.client.DescribeStream(ctx, input)
}

func (a *DynamoDBStreamsAdapter) GetShardIterator(ctx context.Context, input *dynamodbstreams.GetShardIteratorInput) (*dynamodbstreams.GetShardIteratorOutput, error) {
	return a.client.GetShardIterator(ctx, input)
}

func (a *DynamoDBStreamsAdapter) GetRecords(ctx context.Context, input *dynamodbstreams.GetRecordsInput) (*dynamodbstreams.GetRecordsOutput, error) {
	return a.client.GetRecords(ctx, input)
}