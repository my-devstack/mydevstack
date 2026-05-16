package aws

import (
	"context"
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
