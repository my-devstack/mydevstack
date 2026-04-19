package aws

import (
	"context"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/kms/types"
	kmsmocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewKMSAdapter(t *testing.T) {
	adapter := NewKMSAdapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566")
	assert.NotNil(t, adapter)
	assert.IsType(t, &KMSAdapter{}, adapter)
}

func TestKMSAdapter_ListKeys(t *testing.T) {
	mockClient := kmsmocks.NewKMSClientPort(t)
	ctx := context.Background()
	input := &kms.ListKeysInput{}
	expectedOutput := &kms.ListKeysOutput{Keys: []types.KeyListEntry{{KeyId: aws.String("key-123")}}}

	mockClient.EXPECT().ListKeys(ctx, input).Return(expectedOutput, nil)
	adapter := &KMSAdapter{client: mockClient}

	output, err := adapter.ListKeys(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKMSAdapter_CreateKey(t *testing.T) {
	mockClient := kmsmocks.NewKMSClientPort(t)
	ctx := context.Background()
	input := &kms.CreateKeyInput{}
	expectedOutput := &kms.CreateKeyOutput{KeyMetadata: &types.KeyMetadata{KeyId: aws.String("key-123")}}

	mockClient.EXPECT().CreateKey(ctx, input).Return(expectedOutput, nil)
	adapter := &KMSAdapter{client: mockClient}

	output, err := adapter.CreateKey(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKMSAdapter_DeleteAlias(t *testing.T) {
	mockClient := kmsmocks.NewKMSClientPort(t)
	ctx := context.Background()
	input := &kms.DeleteAliasInput{AliasName: aws.String("alias/test")}
	expectedOutput := &kms.DeleteAliasOutput{}

	mockClient.EXPECT().DeleteAlias(ctx, input).Return(expectedOutput, nil)
	adapter := &KMSAdapter{client: mockClient}

	output, err := adapter.DeleteAlias(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKMSAdapter_DescribeKey(t *testing.T) {
	mockClient := kmsmocks.NewKMSClientPort(t)
	ctx := context.Background()
	input := &kms.DescribeKeyInput{KeyId: aws.String("key-123")}
	expectedOutput := &kms.DescribeKeyOutput{KeyMetadata: &types.KeyMetadata{KeyId: aws.String("key-123")}}

	mockClient.EXPECT().DescribeKey(ctx, input).Return(expectedOutput, nil)
	adapter := &KMSAdapter{client: mockClient}

	output, err := adapter.DescribeKey(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKMSAdapter_Encrypt(t *testing.T) {
	mockClient := kmsmocks.NewKMSClientPort(t)
	ctx := context.Background()
	input := &kms.EncryptInput{KeyId: aws.String("key-123"), Plaintext: []byte("test")}
	expectedOutput := &kms.EncryptOutput{CiphertextBlob: []byte("encrypted")}

	mockClient.EXPECT().Encrypt(ctx, input).Return(expectedOutput, nil)
	adapter := &KMSAdapter{client: mockClient}

	output, err := adapter.Encrypt(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKMSAdapter_Decrypt(t *testing.T) {
	mockClient := kmsmocks.NewKMSClientPort(t)
	ctx := context.Background()
	input := &kms.DecryptInput{CiphertextBlob: []byte("encrypted")}
	expectedOutput := &kms.DecryptOutput{Plaintext: []byte("test")}

	mockClient.EXPECT().Decrypt(ctx, input).Return(expectedOutput, nil)
	adapter := &KMSAdapter{client: mockClient}

	output, err := adapter.Decrypt(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKMSAdapter_GenerateDataKey(t *testing.T) {
	mockClient := kmsmocks.NewKMSClientPort(t)
	ctx := context.Background()
	input := &kms.GenerateDataKeyInput{KeyId: aws.String("key-123")}
	expectedOutput := &kms.GenerateDataKeyOutput{Plaintext: []byte("key")}

	mockClient.EXPECT().GenerateDataKey(ctx, input).Return(expectedOutput, nil)
	adapter := &KMSAdapter{client: mockClient}

	output, err := adapter.GenerateDataKey(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestKMSAdapter_GenerateRandom(t *testing.T) {
	mockClient := kmsmocks.NewKMSClientPort(t)
	ctx := context.Background()
	input := &kms.GenerateRandomInput{}
	expectedOutput := &kms.GenerateRandomOutput{Plaintext: []byte("random")}

	mockClient.EXPECT().GenerateRandom(ctx, input).Return(expectedOutput, nil)
	adapter := &KMSAdapter{client: mockClient}

	output, err := adapter.GenerateRandom(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}
