package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type SNSAdapter struct {
	client ports.SNSClientPort
}

func NewSNSAdapter(awsCfg aws.Config, endpoint string) *SNSAdapter {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := sns.NewFromConfig(awsCfg, func(o *sns.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &SNSAdapter{client: client}
}

func (a *SNSAdapter) ListTopics(ctx context.Context, input *sns.ListTopicsInput) (*sns.ListTopicsOutput, error) {
	return a.client.ListTopics(ctx, input)
}

func (a *SNSAdapter) CreateTopic(ctx context.Context, input *sns.CreateTopicInput) (*sns.CreateTopicOutput, error) {
	return a.client.CreateTopic(ctx, input)
}

func (a *SNSAdapter) DeleteTopic(ctx context.Context, input *sns.DeleteTopicInput) (*sns.DeleteTopicOutput, error) {
	return a.client.DeleteTopic(ctx, input)
}

func (a *SNSAdapter) Subscribe(ctx context.Context, input *sns.SubscribeInput) (*sns.SubscribeOutput, error) {
	return a.client.Subscribe(ctx, input)
}

func (a *SNSAdapter) Unsubscribe(ctx context.Context, input *sns.UnsubscribeInput) (*sns.UnsubscribeOutput, error) {
	return a.client.Unsubscribe(ctx, input)
}

func (a *SNSAdapter) ListSubscriptions(ctx context.Context, input *sns.ListSubscriptionsInput) (*sns.ListSubscriptionsOutput, error) {
	return a.client.ListSubscriptions(ctx, input)
}

func (a *SNSAdapter) ListSubscriptionsByTopic(ctx context.Context, input *sns.ListSubscriptionsByTopicInput) (*sns.ListSubscriptionsByTopicOutput, error) {
	return a.client.ListSubscriptionsByTopic(ctx, input)
}

func (a *SNSAdapter) Publish(ctx context.Context, input *sns.PublishInput) (*sns.PublishOutput, error) {
	return a.client.Publish(ctx, input)
}
