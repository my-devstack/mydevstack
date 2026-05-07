package aws

import (
	"context"
	"errors"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	s3mocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewS3Adapter(t *testing.T) {
	awsCfg := aws.Config{
		Region: "us-east-1",
	}
	endpoint := "http://localhost:4566"
	region := "us-east-1"

	adapter := NewS3Adapter(awsCfg, endpoint, region)

	assert.NotNil(t, adapter, "S3Adapter should not be nil")
	assert.IsType(t, &S3Adapter{}, adapter, "Should return S3Adapter type")

	s3Adapter := adapter.(*S3Adapter)
	assert.NotNil(t, s3Adapter.client, "S3Adapter client should not be nil")
}

func TestS3Adapter_ListBuckets(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.ListBucketsInput{}

	expectedOutput := &s3.ListBucketsOutput{
		Buckets: []types.Bucket{{Name: aws.String("test-bucket")}},
	}

	mockClient.EXPECT().ListBuckets(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.ListBuckets(ctx)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_ListObjectsV2(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.ListObjectsV2Input{Bucket: aws.String("test-bucket")}

	expectedOutput := &s3.ListObjectsV2Output{
		Contents: []types.Object{{Key: aws.String("test.txt")}},
	}

	mockClient.EXPECT().ListObjectsV2(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.ListObjectsV2(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_GetObject(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.GetObjectInput{Bucket: aws.String("test-bucket"), Key: aws.String("test.txt")}

	expectedOutput := &s3.GetObjectOutput{
		Body: nil,
	}

	mockClient.EXPECT().GetObject(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.GetObject(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_PutObject(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.PutObjectInput{Bucket: aws.String("test-bucket"), Key: aws.String("test.txt")}

	expectedOutput := &s3.PutObjectOutput{}

	mockClient.EXPECT().PutObject(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.PutObject(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_DeleteObject(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.DeleteObjectInput{Bucket: aws.String("test-bucket"), Key: aws.String("test.txt")}

	expectedOutput := &s3.DeleteObjectOutput{}

	mockClient.EXPECT().DeleteObject(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.DeleteObject(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_DeleteBucket(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.DeleteBucketInput{Bucket: aws.String("test-bucket")}

	expectedOutput := &s3.DeleteBucketOutput{}

	mockClient.EXPECT().DeleteBucket(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.DeleteBucket(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_HeadBucket(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.HeadBucketInput{Bucket: aws.String("test-bucket")}

	expectedOutput := &s3.HeadBucketOutput{}

	mockClient.EXPECT().HeadBucket(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.HeadBucket(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_HeadObject(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.HeadObjectInput{Bucket: aws.String("test-bucket"), Key: aws.String("test.txt")}

	expectedOutput := &s3.HeadObjectOutput{}

	mockClient.EXPECT().HeadObject(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.HeadObject(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_CreateBucket(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.CreateBucketInput{Bucket: aws.String("test-bucket")}

	expectedOutput := &s3.CreateBucketOutput{}

	mockClient.EXPECT().CreateBucket(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.CreateBucket(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_ListBuckets_Error(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.ListBucketsInput{}

	mockClient.EXPECT().ListBuckets(ctx, input).Return(nil, errors.New("some error"))

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.ListBuckets(ctx)

	assert.Error(t, err)
	assert.Nil(t, output)
}
