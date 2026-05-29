package aws

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	smithyendpoints "github.com/aws/smithy-go/endpoints"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type SQSAdapter struct {
	client ports.SQSClientPort
}

func NewSQSAdapter(awsCfg aws.Config, endpoint string, emulator string) ports.SQSPort {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := sqs.NewFromConfig(awsCfg, func(o *sqs.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
		// Only use fixed endpoint resolver when emulator is explicitly set to
		// something other than "aws" (e.g., "floci", "localstack").
		// Local mocks expect all SQS actions at a single root endpoint, not at
		// the queue URL host.
		if strings.ToLower(emulator) != "aws" {
			o.EndpointResolverV2 = &fixedEndpointResolver{endpoint: endpoint}
		}
	})
	return &SQSAdapter{client: client}
}

// fixedEndpointResolver forces all SQS requests to the configured endpoint,
// ignoring any QueueUrl-based routing that the SDK would normally use.
type fixedEndpointResolver struct {
	endpoint string
}

func (f *fixedEndpointResolver) ResolveEndpoint(ctx context.Context, params sqs.EndpointParameters) (smithyendpoints.Endpoint, error) {
	return smithyendpoints.Endpoint{
		URI: mustParseURI(f.endpoint),
	}, nil
}

func mustParseURI(s string) url.URL {
	u, err := url.Parse(s)
	if err != nil {
		panic(fmt.Sprintf("failed to parse endpoint URL %q: %v", s, err))
	}
	return *u
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
