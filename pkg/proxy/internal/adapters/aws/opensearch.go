package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/opensearch"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type OpenSearchAdapter struct {
	client ports.OpenSearchClientPort
}

func NewOpenSearchAdapter(awsCfg aws.Config, endpoint string) ports.OpenSearchPort {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := opensearch.NewFromConfig(awsCfg, func(o *opensearch.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &OpenSearchAdapter{client: client}
}

func (a *OpenSearchAdapter) ListDomainNames(ctx context.Context, input *opensearch.ListDomainNamesInput) (*opensearch.ListDomainNamesOutput, error) {
	return a.client.ListDomainNames(ctx, input)
}

func (a *OpenSearchAdapter) DescribeDomain(ctx context.Context, input *opensearch.DescribeDomainInput) (*opensearch.DescribeDomainOutput, error) {
	return a.client.DescribeDomain(ctx, input)
}

func (a *OpenSearchAdapter) CreateDomain(ctx context.Context, input *opensearch.CreateDomainInput) (*opensearch.CreateDomainOutput, error) {
	return a.client.CreateDomain(ctx, input)
}

func (a *OpenSearchAdapter) DeleteDomain(ctx context.Context, input *opensearch.DeleteDomainInput) (*opensearch.DeleteDomainOutput, error) {
	return a.client.DeleteDomain(ctx, input)
}

func (a *OpenSearchAdapter) UpdateDomainConfig(ctx context.Context, input *opensearch.UpdateDomainConfigInput) (*opensearch.UpdateDomainConfigOutput, error) {
	return a.client.UpdateDomainConfig(ctx, input)
}

func (a *OpenSearchAdapter) DescribeDomainConfig(ctx context.Context, input *opensearch.DescribeDomainConfigInput) (*opensearch.DescribeDomainConfigOutput, error) {
	return a.client.DescribeDomainConfig(ctx, input)
}

func (a *OpenSearchAdapter) ListTags(ctx context.Context, input *opensearch.ListTagsInput) (*opensearch.ListTagsOutput, error) {
	return a.client.ListTags(ctx, input)
}

func (a *OpenSearchAdapter) AddTags(ctx context.Context, input *opensearch.AddTagsInput) (*opensearch.AddTagsOutput, error) {
	return a.client.AddTags(ctx, input)
}

func (a *OpenSearchAdapter) RemoveTags(ctx context.Context, input *opensearch.RemoveTagsInput) (*opensearch.RemoveTagsOutput, error) {
	return a.client.RemoveTags(ctx, input)
}

func (a *OpenSearchAdapter) GetCompatibleVersions(ctx context.Context, input *opensearch.GetCompatibleVersionsInput) (*opensearch.GetCompatibleVersionsOutput, error) {
	return a.client.GetCompatibleVersions(ctx, input)
}
