package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudfront"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type CloudFrontAdapter struct {
	client ports.CloudFrontClientPort
}

func NewCloudFrontAdapter(awsCfg aws.Config, endpoint string) ports.CloudFrontPort {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := cloudfront.NewFromConfig(awsCfg, func(o *cloudfront.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &CloudFrontAdapter{
		client: client,
	}
}

// Distributions

func (a *CloudFrontAdapter) ListDistributions(ctx context.Context, input *cloudfront.ListDistributionsInput) (*cloudfront.ListDistributionsOutput, error) {
	return a.client.ListDistributions(ctx, input)
}

func (a *CloudFrontAdapter) GetDistribution(ctx context.Context, input *cloudfront.GetDistributionInput) (*cloudfront.GetDistributionOutput, error) {
	return a.client.GetDistribution(ctx, input)
}

func (a *CloudFrontAdapter) CreateDistribution(ctx context.Context, input *cloudfront.CreateDistributionInput) (*cloudfront.CreateDistributionOutput, error) {
	return a.client.CreateDistribution(ctx, input)
}

func (a *CloudFrontAdapter) UpdateDistribution(ctx context.Context, input *cloudfront.UpdateDistributionInput) (*cloudfront.UpdateDistributionOutput, error) {
	return a.client.UpdateDistribution(ctx, input)
}

func (a *CloudFrontAdapter) DeleteDistribution(ctx context.Context, input *cloudfront.DeleteDistributionInput) error {
	_, err := a.client.DeleteDistribution(ctx, input)
	return err
}

func (a *CloudFrontAdapter) GetDistributionConfig(ctx context.Context, input *cloudfront.GetDistributionConfigInput) (*cloudfront.GetDistributionConfigOutput, error) {
	return a.client.GetDistributionConfig(ctx, input)
}

// Invalidations

func (a *CloudFrontAdapter) ListInvalidations(ctx context.Context, input *cloudfront.ListInvalidationsInput) (*cloudfront.ListInvalidationsOutput, error) {
	return a.client.ListInvalidations(ctx, input)
}

func (a *CloudFrontAdapter) CreateInvalidation(ctx context.Context, input *cloudfront.CreateInvalidationInput) (*cloudfront.CreateInvalidationOutput, error) {
	return a.client.CreateInvalidation(ctx, input)
}

// Origin Access Controls

func (a *CloudFrontAdapter) ListOriginAccessControls(ctx context.Context, input *cloudfront.ListOriginAccessControlsInput) (*cloudfront.ListOriginAccessControlsOutput, error) {
	return a.client.ListOriginAccessControls(ctx, input)
}

func (a *CloudFrontAdapter) CreateOriginAccessControl(ctx context.Context, input *cloudfront.CreateOriginAccessControlInput) (*cloudfront.CreateOriginAccessControlOutput, error) {
	return a.client.CreateOriginAccessControl(ctx, input)
}

func (a *CloudFrontAdapter) GetOriginAccessControl(ctx context.Context, input *cloudfront.GetOriginAccessControlInput) (*cloudfront.GetOriginAccessControlOutput, error) {
	return a.client.GetOriginAccessControl(ctx, input)
}

func (a *CloudFrontAdapter) DeleteOriginAccessControl(ctx context.Context, input *cloudfront.DeleteOriginAccessControlInput) error {
	_, err := a.client.DeleteOriginAccessControl(ctx, input)
	return err
}
