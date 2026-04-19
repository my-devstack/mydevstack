package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type S3Adapter struct {
	client ports.S3ClientPort
}

func NewS3Adapter(awsCfg aws.Config, endpoint string) ports.S3Port {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
		o.UsePathStyle = true
	})
	return &S3Adapter{client: client}
}

func (a *S3Adapter) ListBuckets(ctx context.Context) (*s3.ListBucketsOutput, error) {
	return a.client.ListBuckets(ctx, &s3.ListBucketsInput{})
}

func (a *S3Adapter) ListObjectsV2(ctx context.Context, input *s3.ListObjectsV2Input) (*s3.ListObjectsV2Output, error) {
	return a.client.ListObjectsV2(ctx, input)
}

func (a *S3Adapter) GetObject(ctx context.Context, input *s3.GetObjectInput) (*s3.GetObjectOutput, error) {
	return a.client.GetObject(ctx, input)
}

func (a *S3Adapter) PutObject(ctx context.Context, input *s3.PutObjectInput) (*s3.PutObjectOutput, error) {
	return a.client.PutObject(ctx, input)
}

func (a *S3Adapter) DeleteObject(ctx context.Context, input *s3.DeleteObjectInput) (*s3.DeleteObjectOutput, error) {
	return a.client.DeleteObject(ctx, input)
}

func (a *S3Adapter) DeleteBucket(ctx context.Context, input *s3.DeleteBucketInput) (*s3.DeleteBucketOutput, error) {
	return a.client.DeleteBucket(ctx, input)
}

func (a *S3Adapter) HeadBucket(ctx context.Context, input *s3.HeadBucketInput) (*s3.HeadBucketOutput, error) {
	return a.client.HeadBucket(ctx, input)
}

func (a *S3Adapter) HeadObject(ctx context.Context, input *s3.HeadObjectInput) (*s3.HeadObjectOutput, error) {
	return a.client.HeadObject(ctx, input)
}

func (a *S3Adapter) CreateBucket(ctx context.Context, input *s3.CreateBucketInput) (*s3.CreateBucketOutput, error) {
	return a.client.CreateBucket(ctx, input)
}
