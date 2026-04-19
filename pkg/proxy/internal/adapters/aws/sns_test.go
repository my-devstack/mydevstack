package aws

import (
	"context"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/aws/aws-sdk-go-v2/service/sns/types"
	snsmocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewSNSAdapter(t *testing.T) {
	adapter := NewSNSAdapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566")
	assert.NotNil(t, adapter)
	assert.IsType(t, &SNSAdapter{}, adapter)
}

func TestSNSAdapter_ListTopics(t *testing.T) {
	mockClient := snsmocks.NewSNSClientPort(t)
	ctx := context.Background()
	input := &sns.ListTopicsInput{}
	expectedOutput := &sns.ListTopicsOutput{Topics: []types.Topic{{TopicArn: aws.String("arn:aws:sns:us-east-1:123456789:test-topic")}}}

	mockClient.EXPECT().ListTopics(ctx, input).Return(expectedOutput, nil)
	adapter := &SNSAdapter{client: mockClient}

	output, err := adapter.ListTopics(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSNSAdapter_CreateTopic(t *testing.T) {
	mockClient := snsmocks.NewSNSClientPort(t)
	ctx := context.Background()
	input := &sns.CreateTopicInput{Name: aws.String("test-topic")}
	expectedOutput := &sns.CreateTopicOutput{TopicArn: aws.String("arn:aws:sns:us-east-1:123456789:test-topic")}

	mockClient.EXPECT().CreateTopic(ctx, input).Return(expectedOutput, nil)
	adapter := &SNSAdapter{client: mockClient}

	output, err := adapter.CreateTopic(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSNSAdapter_DeleteTopic(t *testing.T) {
	mockClient := snsmocks.NewSNSClientPort(t)
	ctx := context.Background()
	input := &sns.DeleteTopicInput{TopicArn: aws.String("arn:aws:sns:us-east-1:123456789:test-topic")}
	expectedOutput := &sns.DeleteTopicOutput{}

	mockClient.EXPECT().DeleteTopic(ctx, input).Return(expectedOutput, nil)
	adapter := &SNSAdapter{client: mockClient}

	output, err := adapter.DeleteTopic(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSNSAdapter_Subscribe(t *testing.T) {
	mockClient := snsmocks.NewSNSClientPort(t)
	ctx := context.Background()
	input := &sns.SubscribeInput{TopicArn: aws.String("arn:aws:sns:us-east-1:123456789:test-topic"), Protocol: aws.String("sqs")}
	expectedOutput := &sns.SubscribeOutput{SubscriptionArn: aws.String("sub-123")}

	mockClient.EXPECT().Subscribe(ctx, input).Return(expectedOutput, nil)
	adapter := &SNSAdapter{client: mockClient}

	output, err := adapter.Subscribe(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSNSAdapter_Unsubscribe(t *testing.T) {
	mockClient := snsmocks.NewSNSClientPort(t)
	ctx := context.Background()
	input := &sns.UnsubscribeInput{SubscriptionArn: aws.String("sub-123")}
	expectedOutput := &sns.UnsubscribeOutput{}

	mockClient.EXPECT().Unsubscribe(ctx, input).Return(expectedOutput, nil)
	adapter := &SNSAdapter{client: mockClient}

	output, err := adapter.Unsubscribe(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSNSAdapter_ListSubscriptions(t *testing.T) {
	mockClient := snsmocks.NewSNSClientPort(t)
	ctx := context.Background()
	input := &sns.ListSubscriptionsInput{}
	expectedOutput := &sns.ListSubscriptionsOutput{}

	mockClient.EXPECT().ListSubscriptions(ctx, input).Return(expectedOutput, nil)
	adapter := &SNSAdapter{client: mockClient}

	output, err := adapter.ListSubscriptions(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSNSAdapter_ListSubscriptionsByTopic(t *testing.T) {
	mockClient := snsmocks.NewSNSClientPort(t)
	ctx := context.Background()
	input := &sns.ListSubscriptionsByTopicInput{TopicArn: aws.String("arn:aws:sns:us-east-1:123456789:test-topic")}
	expectedOutput := &sns.ListSubscriptionsByTopicOutput{}

	mockClient.EXPECT().ListSubscriptionsByTopic(ctx, input).Return(expectedOutput, nil)
	adapter := &SNSAdapter{client: mockClient}

	output, err := adapter.ListSubscriptionsByTopic(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSNSAdapter_Publish(t *testing.T) {
	mockClient := snsmocks.NewSNSClientPort(t)
	ctx := context.Background()
	input := &sns.PublishInput{TopicArn: aws.String("arn:aws:sns:us-east-1:123456789:test-topic"), Message: aws.String("test message")}
	expectedOutput := &sns.PublishOutput{MessageId: aws.String("msg-123")}

	mockClient.EXPECT().Publish(ctx, input).Return(expectedOutput, nil)
	adapter := &SNSAdapter{client: mockClient}

	output, err := adapter.Publish(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}
