package aws

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	s3mocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
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
	assert.NotNil(t, s3Adapter.presignClient, "S3Adapter presignClient should not be nil")
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

// --- GetBucketVersioning ---

func TestS3Adapter_GetBucketVersioning(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.GetBucketVersioningInput{Bucket: aws.String("test-bucket")}
	expectedOutput := &s3.GetBucketVersioningOutput{}

	mockClient.EXPECT().GetBucketVersioning(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.GetBucketVersioning(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_GetBucketVersioning_Error(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.GetBucketVersioningInput{Bucket: aws.String("test-bucket")}

	mockClient.EXPECT().GetBucketVersioning(ctx, input).Return(nil, errors.New("some error"))

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.GetBucketVersioning(ctx, input)

	assert.Error(t, err)
	assert.Nil(t, output)
}

// --- GetBucketEncryption ---

func TestS3Adapter_GetBucketEncryption(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.GetBucketEncryptionInput{Bucket: aws.String("test-bucket")}
	expectedOutput := &s3.GetBucketEncryptionOutput{}

	mockClient.EXPECT().GetBucketEncryption(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.GetBucketEncryption(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_GetBucketEncryption_Error(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.GetBucketEncryptionInput{Bucket: aws.String("test-bucket")}

	mockClient.EXPECT().GetBucketEncryption(ctx, input).Return(nil, errors.New("some error"))

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.GetBucketEncryption(ctx, input)

	assert.Error(t, err)
	assert.Nil(t, output)
}

// --- GetBucketTagging ---

func TestS3Adapter_GetBucketTagging(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.GetBucketTaggingInput{Bucket: aws.String("test-bucket")}
	expectedOutput := &s3.GetBucketTaggingOutput{}

	mockClient.EXPECT().GetBucketTagging(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.GetBucketTagging(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_GetBucketTagging_Error(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.GetBucketTaggingInput{Bucket: aws.String("test-bucket")}

	mockClient.EXPECT().GetBucketTagging(ctx, input).Return(nil, errors.New("some error"))

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.GetBucketTagging(ctx, input)

	assert.Error(t, err)
	assert.Nil(t, output)
}

// --- GetBucketPolicy ---

func TestS3Adapter_GetBucketPolicy(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.GetBucketPolicyInput{Bucket: aws.String("test-bucket")}
	expectedOutput := &s3.GetBucketPolicyOutput{}

	mockClient.EXPECT().GetBucketPolicy(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.GetBucketPolicy(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_GetBucketPolicy_Error(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.GetBucketPolicyInput{Bucket: aws.String("test-bucket")}

	mockClient.EXPECT().GetBucketPolicy(ctx, input).Return(nil, errors.New("some error"))

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.GetBucketPolicy(ctx, input)

	assert.Error(t, err)
	assert.Nil(t, output)
}

// --- PutBucketPolicy ---

func TestS3Adapter_PutBucketPolicy(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.PutBucketPolicyInput{
		Bucket: aws.String("test-bucket"),
		Policy: aws.String("{}"),
	}
	expectedOutput := &s3.PutBucketPolicyOutput{}

	mockClient.EXPECT().PutBucketPolicy(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.PutBucketPolicy(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_PutBucketPolicy_Error(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.PutBucketPolicyInput{
		Bucket: aws.String("test-bucket"),
		Policy: aws.String("{}"),
	}

	mockClient.EXPECT().PutBucketPolicy(ctx, input).Return(nil, errors.New("some error"))

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.PutBucketPolicy(ctx, input)

	assert.Error(t, err)
	assert.Nil(t, output)
}

// --- PutBucketVersioning ---

func TestS3Adapter_PutBucketVersioning(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.PutBucketVersioningInput{
		Bucket: aws.String("test-bucket"),
		VersioningConfiguration: &types.VersioningConfiguration{Status: types.BucketVersioningStatusEnabled},
	}
	expectedOutput := &s3.PutBucketVersioningOutput{}

	mockClient.EXPECT().PutBucketVersioning(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.PutBucketVersioning(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_PutBucketVersioning_Error(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.PutBucketVersioningInput{
		Bucket: aws.String("test-bucket"),
		VersioningConfiguration: &types.VersioningConfiguration{Status: types.BucketVersioningStatusEnabled},
	}

	mockClient.EXPECT().PutBucketVersioning(ctx, input).Return(nil, errors.New("some error"))

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.PutBucketVersioning(ctx, input)

	assert.Error(t, err)
	assert.Nil(t, output)
}

// --- PutBucketEncryption ---

func TestS3Adapter_PutBucketEncryption(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.PutBucketEncryptionInput{
		Bucket: aws.String("test-bucket"),
		ServerSideEncryptionConfiguration: &types.ServerSideEncryptionConfiguration{
			Rules: []types.ServerSideEncryptionRule{},
		},
	}
	expectedOutput := &s3.PutBucketEncryptionOutput{}

	mockClient.EXPECT().PutBucketEncryption(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.PutBucketEncryption(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_PutBucketEncryption_Error(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.PutBucketEncryptionInput{
		Bucket: aws.String("test-bucket"),
		ServerSideEncryptionConfiguration: &types.ServerSideEncryptionConfiguration{
			Rules: []types.ServerSideEncryptionRule{},
		},
	}

	mockClient.EXPECT().PutBucketEncryption(ctx, input).Return(nil, errors.New("some error"))

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.PutBucketEncryption(ctx, input)

	assert.Error(t, err)
	assert.Nil(t, output)
}

// --- PutBucketTagging ---

func TestS3Adapter_PutBucketTagging(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.PutBucketTaggingInput{
		Bucket:  aws.String("test-bucket"),
		Tagging: &types.Tagging{TagSet: []types.Tag{}},
	}
	expectedOutput := &s3.PutBucketTaggingOutput{}

	mockClient.EXPECT().PutBucketTagging(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.PutBucketTagging(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_PutBucketTagging_Error(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.PutBucketTaggingInput{
		Bucket:  aws.String("test-bucket"),
		Tagging: &types.Tagging{TagSet: []types.Tag{}},
	}

	mockClient.EXPECT().PutBucketTagging(ctx, input).Return(nil, errors.New("some error"))

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.PutBucketTagging(ctx, input)

	assert.Error(t, err)
	assert.Nil(t, output)
}

// --- PutPublicAccessBlock ---

func TestS3Adapter_PutPublicAccessBlock(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.PutPublicAccessBlockInput{
		Bucket:                       aws.String("test-bucket"),
		PublicAccessBlockConfiguration: &types.PublicAccessBlockConfiguration{},
	}
	expectedOutput := &s3.PutPublicAccessBlockOutput{}

	mockClient.EXPECT().PutPublicAccessBlock(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.PutPublicAccessBlock(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_PutPublicAccessBlock_Error(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.PutPublicAccessBlockInput{
		Bucket:                       aws.String("test-bucket"),
		PublicAccessBlockConfiguration: &types.PublicAccessBlockConfiguration{},
	}

	mockClient.EXPECT().PutPublicAccessBlock(ctx, input).Return(nil, errors.New("some error"))

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.PutPublicAccessBlock(ctx, input)

	assert.Error(t, err)
	assert.Nil(t, output)
}

// --- GetPublicAccessBlock ---

func TestS3Adapter_GetPublicAccessBlock(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.GetPublicAccessBlockInput{Bucket: aws.String("test-bucket")}
	expectedOutput := &s3.GetPublicAccessBlockOutput{}

	mockClient.EXPECT().GetPublicAccessBlock(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.GetPublicAccessBlock(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_GetPublicAccessBlock_Error(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.GetPublicAccessBlockInput{Bucket: aws.String("test-bucket")}

	mockClient.EXPECT().GetPublicAccessBlock(ctx, input).Return(nil, errors.New("some error"))

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.GetPublicAccessBlock(ctx, input)

	assert.Error(t, err)
	assert.Nil(t, output)
}

// --- PutBucketNotificationConfiguration ---

func TestS3Adapter_PutBucketNotificationConfiguration(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.PutBucketNotificationConfigurationInput{
		Bucket:                    aws.String("test-bucket"),
		NotificationConfiguration: &types.NotificationConfiguration{},
	}
	expectedOutput := &s3.PutBucketNotificationConfigurationOutput{}

	mockClient.EXPECT().PutBucketNotificationConfiguration(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.PutBucketNotificationConfiguration(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_PutBucketNotificationConfiguration_Error(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.PutBucketNotificationConfigurationInput{
		Bucket:                    aws.String("test-bucket"),
		NotificationConfiguration: &types.NotificationConfiguration{},
	}

	mockClient.EXPECT().PutBucketNotificationConfiguration(ctx, input).Return(nil, errors.New("some error"))

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.PutBucketNotificationConfiguration(ctx, input)

	assert.Error(t, err)
	assert.Nil(t, output)
}

// --- GetBucketNotificationConfiguration ---

func TestS3Adapter_GetBucketNotificationConfiguration(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.GetBucketNotificationConfigurationInput{Bucket: aws.String("test-bucket")}
	expectedOutput := &s3.GetBucketNotificationConfigurationOutput{}

	mockClient.EXPECT().GetBucketNotificationConfiguration(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.GetBucketNotificationConfiguration(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_GetBucketNotificationConfiguration_Error(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.GetBucketNotificationConfigurationInput{Bucket: aws.String("test-bucket")}

	mockClient.EXPECT().GetBucketNotificationConfiguration(ctx, input).Return(nil, errors.New("some error"))

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.GetBucketNotificationConfiguration(ctx, input)

	assert.Error(t, err)
	assert.Nil(t, output)
}

// --- GetBucketLifecycleConfiguration ---

func TestS3Adapter_GetBucketLifecycleConfiguration(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.GetBucketLifecycleConfigurationInput{Bucket: aws.String("test-bucket")}
	expectedOutput := &s3.GetBucketLifecycleConfigurationOutput{
		Rules: []types.LifecycleRule{
			{
				ID:     aws.String("rule1"),
				Status: types.ExpirationStatusEnabled,
				Filter: &types.LifecycleRuleFilter{},
				Expiration: &types.LifecycleExpiration{
					Days: aws.Int32(30),
				},
			},
		},
	}

	mockClient.EXPECT().GetBucketLifecycleConfiguration(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.GetBucketLifecycleConfiguration(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_GetBucketLifecycleConfiguration_Error(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.GetBucketLifecycleConfigurationInput{Bucket: aws.String("test-bucket")}

	mockClient.EXPECT().GetBucketLifecycleConfiguration(ctx, input).Return(nil, errors.New("some error"))

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.GetBucketLifecycleConfiguration(ctx, input)

	assert.Error(t, err)
	assert.Nil(t, output)
}

// --- PutBucketLifecycleConfiguration ---

func TestS3Adapter_PutBucketLifecycleConfiguration(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.PutBucketLifecycleConfigurationInput{
		Bucket: aws.String("test-bucket"),
		LifecycleConfiguration: &types.BucketLifecycleConfiguration{
			Rules: []types.LifecycleRule{
				{
					ID:     aws.String("rule1"),
					Status: types.ExpirationStatusEnabled,
					Filter: &types.LifecycleRuleFilter{},
				},
			},
		},
	}
	expectedOutput := &s3.PutBucketLifecycleConfigurationOutput{}

	mockClient.EXPECT().PutBucketLifecycleConfiguration(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.PutBucketLifecycleConfiguration(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_PutBucketLifecycleConfiguration_Error(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.PutBucketLifecycleConfigurationInput{
		Bucket: aws.String("test-bucket"),
		LifecycleConfiguration: &types.BucketLifecycleConfiguration{
			Rules: []types.LifecycleRule{},
		},
	}

	mockClient.EXPECT().PutBucketLifecycleConfiguration(ctx, input).Return(nil, errors.New("some error"))

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.PutBucketLifecycleConfiguration(ctx, input)

	assert.Error(t, err)
	assert.Nil(t, output)
}

// --- DeleteBucketLifecycleConfiguration ---

func TestS3Adapter_DeleteBucketLifecycleConfiguration(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.DeleteBucketLifecycleInput{Bucket: aws.String("test-bucket")}
	expectedOutput := &s3.DeleteBucketLifecycleOutput{}

	mockClient.EXPECT().DeleteBucketLifecycle(ctx, input).Return(expectedOutput, nil)

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.DeleteBucketLifecycle(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestS3Adapter_DeleteBucketLifecycleConfiguration_Error(t *testing.T) {
	mockClient := s3mocks.NewS3ClientPort(t)
	ctx := context.Background()
	input := &s3.DeleteBucketLifecycleInput{Bucket: aws.String("test-bucket")}

	mockClient.EXPECT().DeleteBucketLifecycle(ctx, input).Return(nil, errors.New("some error"))

	adapter := &S3Adapter{client: mockClient, region: "us-east-1"}
	output, err := adapter.DeleteBucketLifecycle(ctx, input)

	assert.Error(t, err)
	assert.Nil(t, output)
}

// --- PresignGetObject ---

func TestS3Adapter_PresignGetObject(t *testing.T) {
	mockPresign := s3mocks.NewPresignClientPort(t)
	ctx := context.Background()
	expected := &v4.PresignedHTTPRequest{URL: "https://presigned.example.com/get"}

	mockPresign.EXPECT().PresignGetObject(mock.Anything, mock.Anything, mock.Anything).Return(expected, nil)

	adapter := &S3Adapter{presignClient: mockPresign, region: "us-east-1"}
	url, err := adapter.PresignGetObject(ctx, "bucket", "key", time.Hour)

	assert.NoError(t, err)
	assert.Equal(t, "https://presigned.example.com/get", url)
}

func TestS3Adapter_PresignGetObject_Error(t *testing.T) {
	mockPresign := s3mocks.NewPresignClientPort(t)
	ctx := context.Background()

	mockPresign.EXPECT().PresignGetObject(mock.Anything, mock.Anything, mock.Anything).Return(nil, errors.New("presign error"))

	adapter := &S3Adapter{presignClient: mockPresign, region: "us-east-1"}
	url, err := adapter.PresignGetObject(ctx, "bucket", "key", time.Hour)

	assert.Error(t, err)
	assert.Equal(t, "", url)
}

// --- PresignPutObject ---

func TestS3Adapter_PresignPutObject(t *testing.T) {
	mockPresign := s3mocks.NewPresignClientPort(t)
	ctx := context.Background()
	expected := &v4.PresignedHTTPRequest{URL: "https://presigned.example.com/put"}

	mockPresign.EXPECT().PresignPutObject(mock.Anything, mock.Anything, mock.Anything).Return(expected, nil)

	adapter := &S3Adapter{presignClient: mockPresign, region: "us-east-1"}
	url, err := adapter.PresignPutObject(ctx, "bucket", "key", time.Hour)

	assert.NoError(t, err)
	assert.Equal(t, "https://presigned.example.com/put", url)
}

func TestS3Adapter_PresignPutObject_Error(t *testing.T) {
	mockPresign := s3mocks.NewPresignClientPort(t)
	ctx := context.Background()

	mockPresign.EXPECT().PresignPutObject(mock.Anything, mock.Anything, mock.Anything).Return(nil, errors.New("presign error"))

	adapter := &S3Adapter{presignClient: mockPresign, region: "us-east-1"}
	url, err := adapter.PresignPutObject(ctx, "bucket", "key", time.Hour)

	assert.Error(t, err)
	assert.Equal(t, "", url)
}


