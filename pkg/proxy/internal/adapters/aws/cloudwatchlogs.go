package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type CloudWatchLogsAdapter struct {
	client ports.CloudWatchLogsClientPort
}

func NewCloudWatchLogsAdapter(awsCfg aws.Config, endpoint string) *CloudWatchLogsAdapter {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := cloudwatchlogs.NewFromConfig(awsCfg, func(o *cloudwatchlogs.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &CloudWatchLogsAdapter{client: client}
}

func (a *CloudWatchLogsAdapter) DescribeLogGroups(ctx context.Context, input *cloudwatchlogs.DescribeLogGroupsInput) (*cloudwatchlogs.DescribeLogGroupsOutput, error) {
	return a.client.DescribeLogGroups(ctx, input)
}

func (a *CloudWatchLogsAdapter) CreateLogGroup(ctx context.Context, input *cloudwatchlogs.CreateLogGroupInput) (*cloudwatchlogs.CreateLogGroupOutput, error) {
	return a.client.CreateLogGroup(ctx, input)
}

func (a *CloudWatchLogsAdapter) DeleteLogGroup(ctx context.Context, input *cloudwatchlogs.DeleteLogGroupInput) (*cloudwatchlogs.DeleteLogGroupOutput, error) {
	return a.client.DeleteLogGroup(ctx, input)
}

func (a *CloudWatchLogsAdapter) DescribeLogStreams(ctx context.Context, input *cloudwatchlogs.DescribeLogStreamsInput) (*cloudwatchlogs.DescribeLogStreamsOutput, error) {
	return a.client.DescribeLogStreams(ctx, input)
}

func (a *CloudWatchLogsAdapter) CreateLogStream(ctx context.Context, input *cloudwatchlogs.CreateLogStreamInput) (*cloudwatchlogs.CreateLogStreamOutput, error) {
	return a.client.CreateLogStream(ctx, input)
}

func (a *CloudWatchLogsAdapter) PutLogEvents(ctx context.Context, input *cloudwatchlogs.PutLogEventsInput) (*cloudwatchlogs.PutLogEventsOutput, error) {
	return a.client.PutLogEvents(ctx, input)
}

func (a *CloudWatchLogsAdapter) GetLogEvents(ctx context.Context, input *cloudwatchlogs.GetLogEventsInput) (*cloudwatchlogs.GetLogEventsOutput, error) {
	return a.client.GetLogEvents(ctx, input)
}

func (a *CloudWatchLogsAdapter) PutRetentionPolicy(ctx context.Context, input *cloudwatchlogs.PutRetentionPolicyInput) (*cloudwatchlogs.PutRetentionPolicyOutput, error) {
	return a.client.PutRetentionPolicy(ctx, input)
}

func (a *CloudWatchLogsAdapter) PutMetricFilter(ctx context.Context, input *cloudwatchlogs.PutMetricFilterInput) (*cloudwatchlogs.PutMetricFilterOutput, error) {
	return a.client.PutMetricFilter(ctx, input)
}

func (a *CloudWatchLogsAdapter) DescribeMetricFilters(ctx context.Context, input *cloudwatchlogs.DescribeMetricFiltersInput) (*cloudwatchlogs.DescribeMetricFiltersOutput, error) {
	return a.client.DescribeMetricFilters(ctx, input)
}
