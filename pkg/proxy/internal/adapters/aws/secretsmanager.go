package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type SecretsManagerAdapter struct {
	client ports.SecretsManagerClientPort
}

func NewSecretsManagerAdapter(awsCfg aws.Config, endpoint string) ports.SecretsManagerPort {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := secretsmanager.NewFromConfig(awsCfg, func(o *secretsmanager.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &SecretsManagerAdapter{client: client}
}

func (a *SecretsManagerAdapter) ListSecrets(ctx context.Context, input *secretsmanager.ListSecretsInput) (*secretsmanager.ListSecretsOutput, error) {
	return a.client.ListSecrets(ctx, input)
}

func (a *SecretsManagerAdapter) CreateSecret(ctx context.Context, input *secretsmanager.CreateSecretInput) (*secretsmanager.CreateSecretOutput, error) {
	return a.client.CreateSecret(ctx, input)
}

func (a *SecretsManagerAdapter) GetSecretValue(ctx context.Context, input *secretsmanager.GetSecretValueInput) (*secretsmanager.GetSecretValueOutput, error) {
	return a.client.GetSecretValue(ctx, input)
}

func (a *SecretsManagerAdapter) PutSecretValue(ctx context.Context, input *secretsmanager.PutSecretValueInput) (*secretsmanager.PutSecretValueOutput, error) {
	return a.client.PutSecretValue(ctx, input)
}

func (a *SecretsManagerAdapter) DeleteSecret(ctx context.Context, input *secretsmanager.DeleteSecretInput) (*secretsmanager.DeleteSecretOutput, error) {
	return a.client.DeleteSecret(ctx, input)
}

func (a *SecretsManagerAdapter) DescribeSecret(ctx context.Context, input *secretsmanager.DescribeSecretInput) (*secretsmanager.DescribeSecretOutput, error) {
	return a.client.DescribeSecret(ctx, input)
}

func (a *SecretsManagerAdapter) UpdateSecret(ctx context.Context, input *secretsmanager.UpdateSecretInput) (*secretsmanager.UpdateSecretOutput, error) {
	return a.client.UpdateSecret(ctx, input)
}

func (a *SecretsManagerAdapter) RestoreSecret(ctx context.Context, input *secretsmanager.RestoreSecretInput) (*secretsmanager.RestoreSecretOutput, error) {
	return a.client.RestoreSecret(ctx, input)
}

func (a *SecretsManagerAdapter) RotateSecret(ctx context.Context, input *secretsmanager.RotateSecretInput) (*secretsmanager.RotateSecretOutput, error) {
	return a.client.RotateSecret(ctx, input)
}

func (a *SecretsManagerAdapter) GetRandomPassword(ctx context.Context, input *secretsmanager.GetRandomPasswordInput) (*secretsmanager.GetRandomPasswordOutput, error) {
	return a.client.GetRandomPassword(ctx, input)
}
