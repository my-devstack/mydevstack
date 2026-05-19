package aws

import (
	"context"
	"errors"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	secmocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewSecretsManagerAdapter(t *testing.T) {
	adapter := NewSecretsManagerAdapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566")
	assert.NotNil(t, adapter)
	assert.IsType(t, &SecretsManagerAdapter{}, adapter)
}

func TestSecretsManagerAdapter_GetSecretValue(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.GetSecretValueInput{SecretId: aws.String("test-secret")}
	expectedOutput := &secretsmanager.GetSecretValueOutput{SecretString: aws.String(`{"key":"value"}`)}

	mockClient.EXPECT().GetSecretValue(ctx, input).Return(expectedOutput, nil)
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.GetSecretValue(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSecretsManagerAdapter_CreateSecret(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.CreateSecretInput{Name: aws.String("test-secret"), SecretString: aws.String(`{"key":"value"}`)}
	expectedOutput := &secretsmanager.CreateSecretOutput{ARN: aws.String("arn:aws:secretsmanager:us-east-1:123456789:secret/test-secret")}

	mockClient.EXPECT().CreateSecret(ctx, input).Return(expectedOutput, nil)
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.CreateSecret(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSecretsManagerAdapter_PutSecretValue(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.PutSecretValueInput{SecretId: aws.String("test-secret"), SecretString: aws.String(`{"key":"new-value"}`)}
	expectedOutput := &secretsmanager.PutSecretValueOutput{ARN: aws.String("arn:aws:secretsmanager:us-east-1:123456789:secret/test-secret")}

	mockClient.EXPECT().PutSecretValue(ctx, input).Return(expectedOutput, nil)
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.PutSecretValue(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSecretsManagerAdapter_DeleteSecret(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.DeleteSecretInput{SecretId: aws.String("test-secret")}
	expectedOutput := &secretsmanager.DeleteSecretOutput{}

	mockClient.EXPECT().DeleteSecret(ctx, input).Return(expectedOutput, nil)
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.DeleteSecret(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSecretsManagerAdapter_DescribeSecret(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.DescribeSecretInput{SecretId: aws.String("test-secret")}
	expectedOutput := &secretsmanager.DescribeSecretOutput{ARN: aws.String("arn:aws:secretsmanager:us-east-1:123456789:secret/test-secret")}

	mockClient.EXPECT().DescribeSecret(ctx, input).Return(expectedOutput, nil)
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.DescribeSecret(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSecretsManagerAdapter_ListSecrets(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.ListSecretsInput{MaxResults: aws.Int32(10)}
	expectedOutput := &secretsmanager.ListSecretsOutput{}

	mockClient.EXPECT().ListSecrets(ctx, input).Return(expectedOutput, nil)
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.ListSecrets(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSecretsManagerAdapter_UpdateSecret(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.UpdateSecretInput{SecretId: aws.String("test-secret"), SecretString: aws.String(`{"key":"updated"}`)}
	expectedOutput := &secretsmanager.UpdateSecretOutput{ARN: aws.String("arn:aws:secretsmanager:us-east-1:123456789:secret/test-secret")}

	mockClient.EXPECT().UpdateSecret(ctx, input).Return(expectedOutput, nil)
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.UpdateSecret(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSecretsManagerAdapter_RestoreSecret(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.RestoreSecretInput{SecretId: aws.String("test-secret")}
	expectedOutput := &secretsmanager.RestoreSecretOutput{ARN: aws.String("arn:aws:secretsmanager:us-east-1:123456789:secret/test-secret")}

	mockClient.EXPECT().RestoreSecret(ctx, input).Return(expectedOutput, nil)
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.RestoreSecret(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSecretsManagerAdapter_GetRandomPassword(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.GetRandomPasswordInput{PasswordLength: aws.Int64(16)}
	expectedOutput := &secretsmanager.GetRandomPasswordOutput{RandomPassword: aws.String("p@ssw0rd!")}

	mockClient.EXPECT().GetRandomPassword(ctx, input).Return(expectedOutput, nil)
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.GetRandomPassword(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSecretsManagerAdapter_RotateSecret(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.RotateSecretInput{SecretId: aws.String("test-secret")}
	expectedOutput := &secretsmanager.RotateSecretOutput{}

	mockClient.EXPECT().RotateSecret(ctx, input).Return(expectedOutput, nil)
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.RotateSecret(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSecretsManagerAdapter_RotateSecret_Error(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.RotateSecretInput{SecretId: aws.String("test-secret")}

	mockClient.EXPECT().RotateSecret(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.RotateSecret(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestSecretsManagerAdapter_ListSecrets_Error(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.ListSecretsInput{MaxResults: aws.Int32(10)}

	mockClient.EXPECT().ListSecrets(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.ListSecrets(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestSecretsManagerAdapter_CreateSecret_Error(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.CreateSecretInput{Name: aws.String("test-secret"), SecretString: aws.String(`{"key":"value"}`)}

	mockClient.EXPECT().CreateSecret(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.CreateSecret(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestSecretsManagerAdapter_GetSecretValue_Error(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.GetSecretValueInput{SecretId: aws.String("test-secret")}

	mockClient.EXPECT().GetSecretValue(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.GetSecretValue(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestSecretsManagerAdapter_PutSecretValue_Error(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.PutSecretValueInput{SecretId: aws.String("test-secret"), SecretString: aws.String(`{"key":"new-value"}`)}

	mockClient.EXPECT().PutSecretValue(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.PutSecretValue(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestSecretsManagerAdapter_DeleteSecret_Error(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.DeleteSecretInput{SecretId: aws.String("test-secret")}

	mockClient.EXPECT().DeleteSecret(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.DeleteSecret(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestSecretsManagerAdapter_DescribeSecret_Error(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.DescribeSecretInput{SecretId: aws.String("test-secret")}

	mockClient.EXPECT().DescribeSecret(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.DescribeSecret(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestSecretsManagerAdapter_UpdateSecret_Error(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.UpdateSecretInput{SecretId: aws.String("test-secret"), SecretString: aws.String(`{"key":"updated"}`)}

	mockClient.EXPECT().UpdateSecret(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.UpdateSecret(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestSecretsManagerAdapter_RestoreSecret_Error(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.RestoreSecretInput{SecretId: aws.String("test-secret")}

	mockClient.EXPECT().RestoreSecret(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.RestoreSecret(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestSecretsManagerAdapter_GetRandomPassword_Error(t *testing.T) {
	mockClient := secmocks.NewSecretsManagerClientPort(t)
	ctx := context.Background()
	input := &secretsmanager.GetRandomPasswordInput{PasswordLength: aws.Int64(16)}

	mockClient.EXPECT().GetRandomPassword(ctx, input).Return(nil, errors.New("some error"))
	adapter := &SecretsManagerAdapter{client: mockClient}

	output, err := adapter.GetRandomPassword(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}
