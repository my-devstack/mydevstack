package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ecr"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type ECRAdapter struct {
	client ports.ECRClientPort
}

func NewECRAdapter(awsCfg aws.Config, endpoint string) ports.ECRPort {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := ecr.NewFromConfig(awsCfg, func(o *ecr.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &ECRAdapter{
		client: client,
	}
}

// Repositories

func (a *ECRAdapter) CreateRepository(ctx context.Context, input *ecr.CreateRepositoryInput) (*ecr.CreateRepositoryOutput, error) {
	return a.client.CreateRepository(ctx, input)
}

func (a *ECRAdapter) DescribeRepositories(ctx context.Context, input *ecr.DescribeRepositoriesInput) (*ecr.DescribeRepositoriesOutput, error) {
	return a.client.DescribeRepositories(ctx, input)
}

func (a *ECRAdapter) DeleteRepository(ctx context.Context, input *ecr.DeleteRepositoryInput) (*ecr.DeleteRepositoryOutput, error) {
	return a.client.DeleteRepository(ctx, input)
}

// Authorization

func (a *ECRAdapter) GetAuthorizationToken(ctx context.Context, input *ecr.GetAuthorizationTokenInput) (*ecr.GetAuthorizationTokenOutput, error) {
	return a.client.GetAuthorizationToken(ctx, input)
}

// Images

func (a *ECRAdapter) ListImages(ctx context.Context, input *ecr.ListImagesInput) (*ecr.ListImagesOutput, error) {
	return a.client.ListImages(ctx, input)
}

func (a *ECRAdapter) DescribeImages(ctx context.Context, input *ecr.DescribeImagesInput) (*ecr.DescribeImagesOutput, error) {
	return a.client.DescribeImages(ctx, input)
}

func (a *ECRAdapter) BatchGetImage(ctx context.Context, input *ecr.BatchGetImageInput) (*ecr.BatchGetImageOutput, error) {
	return a.client.BatchGetImage(ctx, input)
}

func (a *ECRAdapter) BatchDeleteImage(ctx context.Context, input *ecr.BatchDeleteImageInput) (*ecr.BatchDeleteImageOutput, error) {
	return a.client.BatchDeleteImage(ctx, input)
}

// Tags

func (a *ECRAdapter) TagResource(ctx context.Context, input *ecr.TagResourceInput) (*ecr.TagResourceOutput, error) {
	return a.client.TagResource(ctx, input)
}

func (a *ECRAdapter) UntagResource(ctx context.Context, input *ecr.UntagResourceInput) (*ecr.UntagResourceOutput, error) {
	return a.client.UntagResource(ctx, input)
}

func (a *ECRAdapter) ListTagsForResource(ctx context.Context, input *ecr.ListTagsForResourceInput) (*ecr.ListTagsForResourceOutput, error) {
	return a.client.ListTagsForResource(ctx, input)
}