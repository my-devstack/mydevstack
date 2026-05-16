package aws

import (
	"context"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch/types"
	cwmocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewCloudWatchAdapter(t *testing.T) {
	adapter := NewCloudWatchAdapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566")
	assert.NotNil(t, adapter)
	assert.IsType(t, &CloudWatchAdapter{}, adapter)
}

func TestCloudWatchAdapter_DescribeAlarms(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchClientPort(t)
	ctx := context.Background()
	input := &cloudwatch.DescribeAlarmsInput{}
	expectedOutput := &cloudwatch.DescribeAlarmsOutput{
		MetricAlarms: []types.MetricAlarm{{AlarmName: aws.String("test-alarm")}},
	}

	mockClient.EXPECT().DescribeAlarms(ctx, input).Return(expectedOutput, nil)
	adapter := &CloudWatchAdapter{client: mockClient}

	output, err := adapter.DescribeAlarms(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCloudWatchAdapter_PutMetricAlarm(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchClientPort(t)
	ctx := context.Background()
	input := &cloudwatch.PutMetricAlarmInput{
		AlarmName: aws.String("test-alarm"),
	}
	expectedOutput := &cloudwatch.PutMetricAlarmOutput{}

	mockClient.EXPECT().PutMetricAlarm(ctx, input).Return(expectedOutput, nil)
	adapter := &CloudWatchAdapter{client: mockClient}

	output, err := adapter.PutMetricAlarm(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCloudWatchAdapter_DeleteAlarms(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchClientPort(t)
	ctx := context.Background()
	input := &cloudwatch.DeleteAlarmsInput{AlarmNames: []string{"test-alarm"}}
	expectedOutput := &cloudwatch.DeleteAlarmsOutput{}

	mockClient.EXPECT().DeleteAlarms(ctx, input).Return(expectedOutput, nil)
	adapter := &CloudWatchAdapter{client: mockClient}

	output, err := adapter.DeleteAlarms(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCloudWatchAdapter_SetAlarmState(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchClientPort(t)
	ctx := context.Background()
	input := &cloudwatch.SetAlarmStateInput{
		AlarmName:   aws.String("test-alarm"),
		StateValue:  types.StateValueAlarm,
		StateReason: aws.String("testing"),
	}
	expectedOutput := &cloudwatch.SetAlarmStateOutput{}

	mockClient.EXPECT().SetAlarmState(ctx, input).Return(expectedOutput, nil)
	adapter := &CloudWatchAdapter{client: mockClient}

	output, err := adapter.SetAlarmState(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCloudWatchAdapter_DescribeAlarmHistory(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchClientPort(t)
	ctx := context.Background()
	input := &cloudwatch.DescribeAlarmHistoryInput{AlarmName: aws.String("test-alarm")}
	expectedOutput := &cloudwatch.DescribeAlarmHistoryOutput{
		AlarmHistoryItems: []types.AlarmHistoryItem{
			{AlarmName: aws.String("test-alarm")},
		},
	}

	mockClient.EXPECT().DescribeAlarmHistory(ctx, input).Return(expectedOutput, nil)
	adapter := &CloudWatchAdapter{client: mockClient}

	output, err := adapter.DescribeAlarmHistory(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCloudWatchAdapter_ListMetrics(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchClientPort(t)
	ctx := context.Background()
	input := &cloudwatch.ListMetricsInput{}
	expectedOutput := &cloudwatch.ListMetricsOutput{
		Metrics: []types.Metric{{MetricName: aws.String("CPUUtilization"), Namespace: aws.String("AWS/EC2")}},
	}

	mockClient.EXPECT().ListMetrics(ctx, input).Return(expectedOutput, nil)
	adapter := &CloudWatchAdapter{client: mockClient}

	output, err := adapter.ListMetrics(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCloudWatchAdapter_GetMetricData(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchClientPort(t)
	ctx := context.Background()
	input := &cloudwatch.GetMetricDataInput{}
	expectedOutput := &cloudwatch.GetMetricDataOutput{
		MetricDataResults: []types.MetricDataResult{
			{Id: aws.String("m1"), StatusCode: types.StatusCodeComplete},
		},
	}

	mockClient.EXPECT().GetMetricData(ctx, input).Return(expectedOutput, nil)
	adapter := &CloudWatchAdapter{client: mockClient}

	output, err := adapter.GetMetricData(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCloudWatchAdapter_GetMetricStatistics(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchClientPort(t)
	ctx := context.Background()
	input := &cloudwatch.GetMetricStatisticsInput{
		Namespace:  aws.String("AWS/EC2"),
		MetricName: aws.String("CPUUtilization"),
		Statistics: []types.Statistic{types.StatisticAverage},
	}
	expectedOutput := &cloudwatch.GetMetricStatisticsOutput{
		Datapoints: []types.Datapoint{{Average: aws.Float64(50.0)}},
	}

	mockClient.EXPECT().GetMetricStatistics(ctx, input).Return(expectedOutput, nil)
	adapter := &CloudWatchAdapter{client: mockClient}

	output, err := adapter.GetMetricStatistics(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCloudWatchAdapter_PutMetricData(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchClientPort(t)
	ctx := context.Background()
	input := &cloudwatch.PutMetricDataInput{
		Namespace: aws.String("Test/Namespace"),
		MetricData: []types.MetricDatum{
			{MetricName: aws.String("TestMetric"), Value: aws.Float64(42.0)},
		},
	}
	expectedOutput := &cloudwatch.PutMetricDataOutput{}

	mockClient.EXPECT().PutMetricData(ctx, input).Return(expectedOutput, nil)
	adapter := &CloudWatchAdapter{client: mockClient}

	output, err := adapter.PutMetricData(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}
