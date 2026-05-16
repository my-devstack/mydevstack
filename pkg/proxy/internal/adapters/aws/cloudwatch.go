package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type CloudWatchAdapter struct {
	client ports.CloudWatchClientPort
}

func NewCloudWatchAdapter(awsCfg aws.Config, endpoint string) *CloudWatchAdapter {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := cloudwatch.NewFromConfig(awsCfg, func(o *cloudwatch.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &CloudWatchAdapter{client: client}
}

func (a *CloudWatchAdapter) DescribeAlarms(ctx context.Context, input *cloudwatch.DescribeAlarmsInput) (*cloudwatch.DescribeAlarmsOutput, error) {
	return a.client.DescribeAlarms(ctx, input)
}

func (a *CloudWatchAdapter) PutMetricAlarm(ctx context.Context, input *cloudwatch.PutMetricAlarmInput) (*cloudwatch.PutMetricAlarmOutput, error) {
	return a.client.PutMetricAlarm(ctx, input)
}

func (a *CloudWatchAdapter) DeleteAlarms(ctx context.Context, input *cloudwatch.DeleteAlarmsInput) (*cloudwatch.DeleteAlarmsOutput, error) {
	return a.client.DeleteAlarms(ctx, input)
}

func (a *CloudWatchAdapter) SetAlarmState(ctx context.Context, input *cloudwatch.SetAlarmStateInput) (*cloudwatch.SetAlarmStateOutput, error) {
	return a.client.SetAlarmState(ctx, input)
}

func (a *CloudWatchAdapter) DescribeAlarmHistory(ctx context.Context, input *cloudwatch.DescribeAlarmHistoryInput) (*cloudwatch.DescribeAlarmHistoryOutput, error) {
	return a.client.DescribeAlarmHistory(ctx, input)
}

func (a *CloudWatchAdapter) ListMetrics(ctx context.Context, input *cloudwatch.ListMetricsInput) (*cloudwatch.ListMetricsOutput, error) {
	return a.client.ListMetrics(ctx, input)
}

func (a *CloudWatchAdapter) GetMetricData(ctx context.Context, input *cloudwatch.GetMetricDataInput) (*cloudwatch.GetMetricDataOutput, error) {
	return a.client.GetMetricData(ctx, input)
}

func (a *CloudWatchAdapter) GetMetricStatistics(ctx context.Context, input *cloudwatch.GetMetricStatisticsInput) (*cloudwatch.GetMetricStatisticsOutput, error) {
	return a.client.GetMetricStatistics(ctx, input)
}

func (a *CloudWatchAdapter) PutMetricData(ctx context.Context, input *cloudwatch.PutMetricDataInput) (*cloudwatch.PutMetricDataOutput, error) {
	return a.client.PutMetricData(ctx, input)
}
