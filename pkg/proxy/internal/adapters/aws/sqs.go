package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type SQSAdapter struct {
	client ports.SQSClientPort
}

func NewSQSAdapter(awsCfg aws.Config, endpoint string) ports.SQSPort {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := sqs.NewFromConfig(awsCfg, func(o *sqs.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &SQSAdapter{client: client}
}

func (a *SQSAdapter) ListQueues(ctx context.Context, input *sqs.ListQueuesInput) (*sqs.ListQueuesOutput, error) {
	return a.client.ListQueues(ctx, input)
}

func (a *SQSAdapter) CreateQueue(ctx context.Context, input *sqs.CreateQueueInput) (*sqs.CreateQueueOutput, error) {
	return a.client.CreateQueue(ctx, input)
}

func (a *SQSAdapter) DeleteQueue(ctx context.Context, input *sqs.DeleteQueueInput) (*sqs.DeleteQueueOutput, error) {
	return a.client.DeleteQueue(ctx, input)
}

func (a *SQSAdapter) GetQueueUrl(ctx context.Context, input *sqs.GetQueueUrlInput) (*sqs.GetQueueUrlOutput, error) {
	return a.client.GetQueueUrl(ctx, input)
}

func (a *SQSAdapter) SendMessage(ctx context.Context, input *sqs.SendMessageInput) (*sqs.SendMessageOutput, error) {
	return a.client.SendMessage(ctx, input)
}

func (a *SQSAdapter) ReceiveMessage(ctx context.Context, input *sqs.ReceiveMessageInput) (*sqs.ReceiveMessageOutput, error) {
	return a.client.ReceiveMessage(ctx, input)
}

func (a *SQSAdapter) DeleteMessage(ctx context.Context, input *sqs.DeleteMessageInput) (*sqs.DeleteMessageOutput, error) {
	return a.client.DeleteMessage(ctx, input)
}

func (a *SQSAdapter) PurgeQueue(ctx context.Context, input *sqs.PurgeQueueInput) (*sqs.PurgeQueueOutput, error) {
	return a.client.PurgeQueue(ctx, input)
}

func (a *SQSAdapter) GetQueueAttributes(ctx context.Context, input *sqs.GetQueueAttributesInput) (*sqs.GetQueueAttributesOutput, error) {
	return a.client.GetQueueAttributes(ctx, input)
}

func (a *SQSAdapter) SetQueueAttributes(ctx context.Context, input *sqs.SetQueueAttributesInput) (*sqs.SetQueueAttributesOutput, error) {
	return a.client.SetQueueAttributes(ctx, input)
}
