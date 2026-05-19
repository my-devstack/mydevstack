package aws

import (
	"context"
	"errors"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs/types"
	cwmocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewCloudWatchLogsAdapter(t *testing.T) {
	adapter := NewCloudWatchLogsAdapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566")
	assert.NotNil(t, adapter)
	assert.IsType(t, &CloudWatchLogsAdapter{}, adapter)
}

func TestCloudWatchLogsAdapter_DescribeLogGroups(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.DescribeLogGroupsInput{}
	expectedOutput := &cloudwatchlogs.DescribeLogGroupsOutput{
		LogGroups: []types.LogGroup{{LogGroupName: aws.String("/aws/lambda/test")}},
	}

	mockClient.EXPECT().DescribeLogGroups(ctx, input).Return(expectedOutput, nil)
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.DescribeLogGroups(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCloudWatchLogsAdapter_CreateLogGroup(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.CreateLogGroupInput{
		LogGroupName: aws.String("/aws/lambda/test"),
	}
	expectedOutput := &cloudwatchlogs.CreateLogGroupOutput{}

	mockClient.EXPECT().CreateLogGroup(ctx, input).Return(expectedOutput, nil)
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.CreateLogGroup(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCloudWatchLogsAdapter_DeleteLogGroup(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.DeleteLogGroupInput{
		LogGroupName: aws.String("/aws/lambda/test"),
	}
	expectedOutput := &cloudwatchlogs.DeleteLogGroupOutput{}

	mockClient.EXPECT().DeleteLogGroup(ctx, input).Return(expectedOutput, nil)
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.DeleteLogGroup(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCloudWatchLogsAdapter_DescribeLogStreams(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.DescribeLogStreamsInput{
		LogGroupName: aws.String("/aws/lambda/test"),
	}
	expectedOutput := &cloudwatchlogs.DescribeLogStreamsOutput{
		LogStreams: []types.LogStream{{LogStreamName: aws.String("stream1")}},
	}

	mockClient.EXPECT().DescribeLogStreams(ctx, input).Return(expectedOutput, nil)
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.DescribeLogStreams(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCloudWatchLogsAdapter_GetLogEvents(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.GetLogEventsInput{
		LogGroupName:  aws.String("/aws/lambda/test"),
		LogStreamName: aws.String("stream1"),
	}
	expectedOutput := &cloudwatchlogs.GetLogEventsOutput{
		Events: []types.OutputLogEvent{
			{Message: aws.String("test log"), Timestamp: aws.Int64(1234567890)},
		},
	}

	mockClient.EXPECT().GetLogEvents(ctx, input).Return(expectedOutput, nil)
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.GetLogEvents(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCloudWatchLogsAdapter_PutRetentionPolicy(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.PutRetentionPolicyInput{
		LogGroupName:    aws.String("/aws/lambda/test"),
		RetentionInDays: aws.Int32(30),
	}
	expectedOutput := &cloudwatchlogs.PutRetentionPolicyOutput{}

	mockClient.EXPECT().PutRetentionPolicy(ctx, input).Return(expectedOutput, nil)
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.PutRetentionPolicy(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

// --- Uncovered methods: success + error ---

func TestCloudWatchLogsAdapter_CreateLogStream(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.CreateLogStreamInput{
		LogGroupName:  aws.String("/aws/lambda/test"),
		LogStreamName: aws.String("new-stream"),
	}
	expectedOutput := &cloudwatchlogs.CreateLogStreamOutput{}

	mockClient.EXPECT().CreateLogStream(ctx, input).Return(expectedOutput, nil)
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.CreateLogStream(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCloudWatchLogsAdapter_CreateLogStream_Error(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.CreateLogStreamInput{
		LogGroupName:  aws.String("/aws/lambda/test"),
		LogStreamName: aws.String("new-stream"),
	}

	mockClient.EXPECT().CreateLogStream(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.CreateLogStream(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCloudWatchLogsAdapter_PutLogEvents(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.PutLogEventsInput{
		LogGroupName:  aws.String("/aws/lambda/test"),
		LogStreamName: aws.String("stream1"),
		LogEvents: []types.InputLogEvent{
			{Message: aws.String("test message"), Timestamp: aws.Int64(1234567890)},
		},
	}
	expectedOutput := &cloudwatchlogs.PutLogEventsOutput{
		NextSequenceToken: aws.String("next-token"),
	}

	mockClient.EXPECT().PutLogEvents(ctx, input).Return(expectedOutput, nil)
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.PutLogEvents(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCloudWatchLogsAdapter_PutLogEvents_Error(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.PutLogEventsInput{
		LogGroupName:  aws.String("/aws/lambda/test"),
		LogStreamName: aws.String("stream1"),
		LogEvents: []types.InputLogEvent{
			{Message: aws.String("test message"), Timestamp: aws.Int64(1234567890)},
		},
	}

	mockClient.EXPECT().PutLogEvents(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.PutLogEvents(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCloudWatchLogsAdapter_PutMetricFilter(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.PutMetricFilterInput{
		LogGroupName:  aws.String("/aws/lambda/test"),
		FilterName:    aws.String("ErrorFilter"),
		FilterPattern: aws.String("ERROR"),
		MetricTransformations: []types.MetricTransformation{
			{MetricName: aws.String("ErrorCount"), MetricNamespace: aws.String("MyNamespace"), MetricValue: aws.String("1")},
		},
	}
	expectedOutput := &cloudwatchlogs.PutMetricFilterOutput{}

	mockClient.EXPECT().PutMetricFilter(ctx, input).Return(expectedOutput, nil)
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.PutMetricFilter(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCloudWatchLogsAdapter_PutMetricFilter_Error(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.PutMetricFilterInput{
		LogGroupName:  aws.String("/aws/lambda/test"),
		FilterName:    aws.String("ErrorFilter"),
		FilterPattern: aws.String("ERROR"),
		MetricTransformations: []types.MetricTransformation{
			{MetricName: aws.String("ErrorCount"), MetricNamespace: aws.String("MyNamespace"), MetricValue: aws.String("1")},
		},
	}

	mockClient.EXPECT().PutMetricFilter(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.PutMetricFilter(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCloudWatchLogsAdapter_DescribeMetricFilters(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.DescribeMetricFiltersInput{
		LogGroupName: aws.String("/aws/lambda/test"),
	}
	expectedOutput := &cloudwatchlogs.DescribeMetricFiltersOutput{
		MetricFilters: []types.MetricFilter{
			{FilterName: aws.String("ErrorFilter"), FilterPattern: aws.String("ERROR")},
		},
	}

	mockClient.EXPECT().DescribeMetricFilters(ctx, input).Return(expectedOutput, nil)
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.DescribeMetricFilters(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestCloudWatchLogsAdapter_DescribeMetricFilters_Error(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.DescribeMetricFiltersInput{
		LogGroupName: aws.String("/aws/lambda/test"),
	}

	mockClient.EXPECT().DescribeMetricFilters(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.DescribeMetricFilters(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// --- Existing methods: missing error tests ---

func TestCloudWatchLogsAdapter_DescribeLogGroups_Error(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.DescribeLogGroupsInput{}

	mockClient.EXPECT().DescribeLogGroups(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.DescribeLogGroups(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCloudWatchLogsAdapter_CreateLogGroup_Error(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.CreateLogGroupInput{
		LogGroupName: aws.String("/aws/lambda/test"),
	}

	mockClient.EXPECT().CreateLogGroup(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.CreateLogGroup(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCloudWatchLogsAdapter_DeleteLogGroup_Error(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.DeleteLogGroupInput{
		LogGroupName: aws.String("/aws/lambda/test"),
	}

	mockClient.EXPECT().DeleteLogGroup(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.DeleteLogGroup(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCloudWatchLogsAdapter_DescribeLogStreams_Error(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.DescribeLogStreamsInput{
		LogGroupName: aws.String("/aws/lambda/test"),
	}

	mockClient.EXPECT().DescribeLogStreams(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.DescribeLogStreams(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCloudWatchLogsAdapter_GetLogEvents_Error(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.GetLogEventsInput{
		LogGroupName:  aws.String("/aws/lambda/test"),
		LogStreamName: aws.String("stream1"),
	}

	mockClient.EXPECT().GetLogEvents(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.GetLogEvents(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestCloudWatchLogsAdapter_PutRetentionPolicy_Error(t *testing.T) {
	mockClient := cwmocks.NewCloudWatchLogsClientPort(t)
	ctx := context.Background()
	input := &cloudwatchlogs.PutRetentionPolicyInput{
		LogGroupName:    aws.String("/aws/lambda/test"),
		RetentionInDays: aws.Int32(30),
	}

	mockClient.EXPECT().PutRetentionPolicy(ctx, input).Return(nil, errors.New("some error"))
	adapter := &CloudWatchLogsAdapter{client: mockClient}

	output, err := adapter.PutRetentionPolicy(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}
