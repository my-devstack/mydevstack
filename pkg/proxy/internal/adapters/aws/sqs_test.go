package aws

import (
	"context"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/aws/aws-sdk-go-v2/service/sqs/types"
	sqsmocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewSQSAdapter(t *testing.T) {
	adapter := NewSQSAdapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566", "floci")
	assert.NotNil(t, adapter)
	assert.IsType(t, &SQSAdapter{}, adapter)
}

var ctx = context.Background()

func TestSQSAdapter_ListQueues(t *testing.T) {
	mockClient := sqsmocks.NewSQSClientPort(t)
	input := &sqs.ListQueuesInput{}
	expectedOutput := &sqs.ListQueuesOutput{QueueUrls: []string{"https://sqs.us-east-1.amazonaws.com/123456789/test-queue"}}

	mockClient.EXPECT().ListQueues(ctx, input).Return(expectedOutput, nil)
	adapter := &SQSAdapter{client: mockClient}

	output, err := adapter.ListQueues(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSQSAdapter_CreateQueue(t *testing.T) {
	mockClient := sqsmocks.NewSQSClientPort(t)
	input := &sqs.CreateQueueInput{QueueName: aws.String("test-queue")}
	expectedOutput := &sqs.CreateQueueOutput{QueueUrl: aws.String("https://sqs.us-east-1.amazonaws.com/123456789/test-queue")}

	mockClient.EXPECT().CreateQueue(ctx, input).Return(expectedOutput, nil)
	adapter := &SQSAdapter{client: mockClient}

	output, err := adapter.CreateQueue(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSQSAdapter_DeleteQueue(t *testing.T) {
	mockClient := sqsmocks.NewSQSClientPort(t)
	input := &sqs.DeleteQueueInput{QueueUrl: aws.String("https://sqs.us-east-1.amazonaws.com/123456789/test-queue")}
	expectedOutput := &sqs.DeleteQueueOutput{}

	mockClient.EXPECT().DeleteQueue(ctx, input).Return(expectedOutput, nil)
	adapter := &SQSAdapter{client: mockClient}

	output, err := adapter.DeleteQueue(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSQSAdapter_GetQueueUrl(t *testing.T) {
	mockClient := sqsmocks.NewSQSClientPort(t)
	input := &sqs.GetQueueUrlInput{QueueName: aws.String("test-queue")}
	expectedOutput := &sqs.GetQueueUrlOutput{QueueUrl: aws.String("https://sqs.us-east-1.amazonaws.com/123456789/test-queue")}

	mockClient.EXPECT().GetQueueUrl(ctx, input).Return(expectedOutput, nil)
	adapter := &SQSAdapter{client: mockClient}

	output, err := adapter.GetQueueUrl(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSQSAdapter_SendMessage(t *testing.T) {
	mockClient := sqsmocks.NewSQSClientPort(t)
	input := &sqs.SendMessageInput{QueueUrl: aws.String("https://sqs.us-east-1.amazonaws.com/123456789/test-queue"), MessageBody: aws.String("test message")}
	expectedOutput := &sqs.SendMessageOutput{MessageId: aws.String("msg-123")}

	mockClient.EXPECT().SendMessage(ctx, input).Return(expectedOutput, nil)
	adapter := &SQSAdapter{client: mockClient}

	output, err := adapter.SendMessage(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSQSAdapter_ReceiveMessage(t *testing.T) {
	mockClient := sqsmocks.NewSQSClientPort(t)
	input := &sqs.ReceiveMessageInput{QueueUrl: aws.String("https://sqs.us-east-1.amazonaws.com/123456789/test-queue")}
	expectedOutput := &sqs.ReceiveMessageOutput{Messages: []types.Message{{MessageId: aws.String("msg-123")}}}

	mockClient.EXPECT().ReceiveMessage(ctx, input).Return(expectedOutput, nil)
	adapter := &SQSAdapter{client: mockClient}

	output, err := adapter.ReceiveMessage(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSQSAdapter_DeleteMessage(t *testing.T) {
	mockClient := sqsmocks.NewSQSClientPort(t)
	input := &sqs.DeleteMessageInput{QueueUrl: aws.String("https://sqs.us-east-1.amazonaws.com/123456789/test-queue"), ReceiptHandle: aws.String("receipt")}
	expectedOutput := &sqs.DeleteMessageOutput{}

	mockClient.EXPECT().DeleteMessage(ctx, input).Return(expectedOutput, nil)
	adapter := &SQSAdapter{client: mockClient}

	output, err := adapter.DeleteMessage(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSQSAdapter_PurgeQueue(t *testing.T) {
	mockClient := sqsmocks.NewSQSClientPort(t)
	input := &sqs.PurgeQueueInput{QueueUrl: aws.String("https://sqs.us-east-1.amazonaws.com/123456789/test-queue")}
	expectedOutput := &sqs.PurgeQueueOutput{}

	mockClient.EXPECT().PurgeQueue(ctx, input).Return(expectedOutput, nil)
	adapter := &SQSAdapter{client: mockClient}

	output, err := adapter.PurgeQueue(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSQSAdapter_GetQueueAttributes(t *testing.T) {
	mockClient := sqsmocks.NewSQSClientPort(t)
	input := &sqs.GetQueueAttributesInput{QueueUrl: aws.String("https://sqs.us-east-1.amazonaws.com/123456789/test-queue")}
	expectedOutput := &sqs.GetQueueAttributesOutput{}

	mockClient.EXPECT().GetQueueAttributes(ctx, input).Return(expectedOutput, nil)
	adapter := &SQSAdapter{client: mockClient}

	output, err := adapter.GetQueueAttributes(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSQSAdapter_SetQueueAttributes(t *testing.T) {
	mockClient := sqsmocks.NewSQSClientPort(t)
	input := &sqs.SetQueueAttributesInput{QueueUrl: aws.String("https://sqs.us-east-1.amazonaws.com/123456789/test-queue")}
	expectedOutput := &sqs.SetQueueAttributesOutput{}

	mockClient.EXPECT().SetQueueAttributes(ctx, input).Return(expectedOutput, nil)
	adapter := &SQSAdapter{client: mockClient}

	output, err := adapter.SetQueueAttributes(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}
