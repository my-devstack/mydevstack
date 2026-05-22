package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type KMSAdapter struct {
	client ports.KMSClientPort
}

func NewKMSAdapter(awsCfg aws.Config, endpoint string) ports.KMSPort {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := kms.NewFromConfig(awsCfg, func(o *kms.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &KMSAdapter{client: client}
}

func (a *KMSAdapter) ListKeys(ctx context.Context, input *kms.ListKeysInput) (*kms.ListKeysOutput, error) {
	return a.client.ListKeys(ctx, input)
}

func (a *KMSAdapter) CreateKey(ctx context.Context, input *kms.CreateKeyInput) (*kms.CreateKeyOutput, error) {
	return a.client.CreateKey(ctx, input)
}

func (a *KMSAdapter) DeleteAlias(ctx context.Context, input *kms.DeleteAliasInput) (*kms.DeleteAliasOutput, error) {
	return a.client.DeleteAlias(ctx, input)
}

func (a *KMSAdapter) DescribeKey(ctx context.Context, input *kms.DescribeKeyInput) (*kms.DescribeKeyOutput, error) {
	return a.client.DescribeKey(ctx, input)
}

func (a *KMSAdapter) Encrypt(ctx context.Context, input *kms.EncryptInput) (*kms.EncryptOutput, error) {
	return a.client.Encrypt(ctx, input)
}

func (a *KMSAdapter) Decrypt(ctx context.Context, input *kms.DecryptInput) (*kms.DecryptOutput, error) {
	return a.client.Decrypt(ctx, input)
}

func (a *KMSAdapter) GenerateDataKey(ctx context.Context, input *kms.GenerateDataKeyInput) (*kms.GenerateDataKeyOutput, error) {
	return a.client.GenerateDataKey(ctx, input)
}

func (a *KMSAdapter) GenerateRandom(ctx context.Context, input *kms.GenerateRandomInput) (*kms.GenerateRandomOutput, error) {
	return a.client.GenerateRandom(ctx, input)
}

func (a *KMSAdapter) GetKeyPolicy(ctx context.Context, input *kms.GetKeyPolicyInput) (*kms.GetKeyPolicyOutput, error) {
	return a.client.GetKeyPolicy(ctx, input)
}

func (a *KMSAdapter) EnableKey(ctx context.Context, input *kms.EnableKeyInput) (*kms.EnableKeyOutput, error) {
	return a.client.EnableKey(ctx, input)
}

func (a *KMSAdapter) DisableKey(ctx context.Context, input *kms.DisableKeyInput) (*kms.DisableKeyOutput, error) {
	return a.client.DisableKey(ctx, input)
}

func (a *KMSAdapter) ScheduleKeyDeletion(ctx context.Context, input *kms.ScheduleKeyDeletionInput) (*kms.ScheduleKeyDeletionOutput, error) {
	return a.client.ScheduleKeyDeletion(ctx, input)
}
