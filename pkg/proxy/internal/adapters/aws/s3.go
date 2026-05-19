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
	client        ports.S3ClientPort
	presignClient ports.PresignClientPort
	region        string
}

func NewS3Adapter(awsCfg aws.Config, endpoint string, region string) ports.S3Port {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	s3Client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
		o.UsePathStyle = true
	})
	presignClient := s3.NewPresignClient(s3Client)
	return &S3Adapter{client: s3Client, presignClient: presignClient, region: region}
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

func (a *S3Adapter) GetBucketVersioning(ctx context.Context, input *s3.GetBucketVersioningInput) (*s3.GetBucketVersioningOutput, error) {
	return a.client.GetBucketVersioning(ctx, input)
}

func (a *S3Adapter) GetBucketEncryption(ctx context.Context, input *s3.GetBucketEncryptionInput) (*s3.GetBucketEncryptionOutput, error) {
	return a.client.GetBucketEncryption(ctx, input)
}

func (a *S3Adapter) GetBucketTagging(ctx context.Context, input *s3.GetBucketTaggingInput) (*s3.GetBucketTaggingOutput, error) {
	return a.client.GetBucketTagging(ctx, input)
}

func (a *S3Adapter) GetBucketPolicy(ctx context.Context, input *s3.GetBucketPolicyInput) (*s3.GetBucketPolicyOutput, error) {
	return a.client.GetBucketPolicy(ctx, input)
}

func (a *S3Adapter) PutBucketPolicy(ctx context.Context, input *s3.PutBucketPolicyInput) (*s3.PutBucketPolicyOutput, error) {
	return a.client.PutBucketPolicy(ctx, input)
}

func (a *S3Adapter) PutBucketVersioning(ctx context.Context, input *s3.PutBucketVersioningInput) (*s3.PutBucketVersioningOutput, error) {
	return a.client.PutBucketVersioning(ctx, input)
}

func (a *S3Adapter) PutBucketEncryption(ctx context.Context, input *s3.PutBucketEncryptionInput) (*s3.PutBucketEncryptionOutput, error) {
	return a.client.PutBucketEncryption(ctx, input)
}

func (a *S3Adapter) PutBucketTagging(ctx context.Context, input *s3.PutBucketTaggingInput) (*s3.PutBucketTaggingOutput, error) {
	return a.client.PutBucketTagging(ctx, input)
}

func (a *S3Adapter) PutPublicAccessBlock(ctx context.Context, input *s3.PutPublicAccessBlockInput) (*s3.PutPublicAccessBlockOutput, error) {
	return a.client.PutPublicAccessBlock(ctx, input)
}

func (a *S3Adapter) GetPublicAccessBlock(ctx context.Context, input *s3.GetPublicAccessBlockInput) (*s3.GetPublicAccessBlockOutput, error) {
	return a.client.GetPublicAccessBlock(ctx, input)
}

func (a *S3Adapter) PutBucketNotificationConfiguration(ctx context.Context, input *s3.PutBucketNotificationConfigurationInput) (*s3.PutBucketNotificationConfigurationOutput, error) {
	return a.client.PutBucketNotificationConfiguration(ctx, input)
}

func (a *S3Adapter) GetBucketNotificationConfiguration(ctx context.Context, input *s3.GetBucketNotificationConfigurationInput) (*s3.GetBucketNotificationConfigurationOutput, error) {
	return a.client.GetBucketNotificationConfiguration(ctx, input)
}

func (a *S3Adapter) PresignGetObject(ctx context.Context, bucket, key string, expires time.Duration) (string, error) {
	input := &s3.GetObjectInput{
		Bucket: &bucket,
		Key:    &key,
	}
	resp, err := a.presignClient.PresignGetObject(ctx, input, func(o *s3.PresignOptions) {
		o.Expires = expires
	})
	if err != nil {
		return "", err
	}
	return resp.URL, nil
}

func (a *S3Adapter) PresignPutObject(ctx context.Context, bucket, key string, expires time.Duration) (string, error) {
	input := &s3.PutObjectInput{
		Bucket: &bucket,
		Key:    &key,
	}
	resp, err := a.presignClient.PresignPutObject(ctx, input, func(o *s3.PresignOptions) {
		o.Expires = expires
	})
	if err != nil {
		return "", err
	}
	return resp.URL, nil
}
