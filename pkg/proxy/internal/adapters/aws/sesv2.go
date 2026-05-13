package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sesv2"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type SESv2Adapter struct {
	client ports.SESv2ClientPort
}

func NewSESv2Adapter(awsCfg aws.Config, endpoint string) *SESv2Adapter {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := sesv2.NewFromConfig(awsCfg, func(o *sesv2.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &SESv2Adapter{client: client}
}

func (a *SESv2Adapter) ListEmailIdentities(ctx context.Context, input *sesv2.ListEmailIdentitiesInput) (*sesv2.ListEmailIdentitiesOutput, error) {
	return a.client.ListEmailIdentities(ctx, input)
}

func (a *SESv2Adapter) GetEmailIdentity(ctx context.Context, input *sesv2.GetEmailIdentityInput) (*sesv2.GetEmailIdentityOutput, error) {
	return a.client.GetEmailIdentity(ctx, input)
}

func (a *SESv2Adapter) CreateEmailIdentity(ctx context.Context, input *sesv2.CreateEmailIdentityInput) (*sesv2.CreateEmailIdentityOutput, error) {
	return a.client.CreateEmailIdentity(ctx, input)
}

func (a *SESv2Adapter) DeleteEmailIdentity(ctx context.Context, input *sesv2.DeleteEmailIdentityInput) (*sesv2.DeleteEmailIdentityOutput, error) {
	return a.client.DeleteEmailIdentity(ctx, input)
}

func (a *SESv2Adapter) SendEmail(ctx context.Context, input *sesv2.SendEmailInput) (*sesv2.SendEmailOutput, error) {
	return a.client.SendEmail(ctx, input)
}

func (a *SESv2Adapter) SendBulkEmail(ctx context.Context, input *sesv2.SendBulkEmailInput) (*sesv2.SendBulkEmailOutput, error) {
	return a.client.SendBulkEmail(ctx, input)
}

func (a *SESv2Adapter) ListEmailTemplates(ctx context.Context, input *sesv2.ListEmailTemplatesInput) (*sesv2.ListEmailTemplatesOutput, error) {
	return a.client.ListEmailTemplates(ctx, input)
}

func (a *SESv2Adapter) GetEmailTemplate(ctx context.Context, input *sesv2.GetEmailTemplateInput) (*sesv2.GetEmailTemplateOutput, error) {
	return a.client.GetEmailTemplate(ctx, input)
}

func (a *SESv2Adapter) CreateEmailTemplate(ctx context.Context, input *sesv2.CreateEmailTemplateInput) (*sesv2.CreateEmailTemplateOutput, error) {
	return a.client.CreateEmailTemplate(ctx, input)
}

func (a *SESv2Adapter) UpdateEmailTemplate(ctx context.Context, input *sesv2.UpdateEmailTemplateInput) (*sesv2.UpdateEmailTemplateOutput, error) {
	return a.client.UpdateEmailTemplate(ctx, input)
}

func (a *SESv2Adapter) DeleteEmailTemplate(ctx context.Context, input *sesv2.DeleteEmailTemplateInput) (*sesv2.DeleteEmailTemplateOutput, error) {
	return a.client.DeleteEmailTemplate(ctx, input)
}

func (a *SESv2Adapter) GetAccount(ctx context.Context, input *sesv2.GetAccountInput) (*sesv2.GetAccountOutput, error) {
	return a.client.GetAccount(ctx, input)
}

func (a *SESv2Adapter) PutAccountSuppressionAttributes(ctx context.Context, input *sesv2.PutAccountSuppressionAttributesInput) (*sesv2.PutAccountSuppressionAttributesOutput, error) {
	return a.client.PutAccountSuppressionAttributes(ctx, input)
}

func (a *SESv2Adapter) ListSuppressedDestinations(ctx context.Context, input *sesv2.ListSuppressedDestinationsInput) (*sesv2.ListSuppressedDestinationsOutput, error) {
	return a.client.ListSuppressedDestinations(ctx, input)
}

func (a *SESv2Adapter) ListContactLists(ctx context.Context, input *sesv2.ListContactListsInput) (*sesv2.ListContactListsOutput, error) {
	return a.client.ListContactLists(ctx, input)
}

func (a *SESv2Adapter) CreateContactList(ctx context.Context, input *sesv2.CreateContactListInput) (*sesv2.CreateContactListOutput, error) {
	return a.client.CreateContactList(ctx, input)
}

func (a *SESv2Adapter) DeleteContactList(ctx context.Context, input *sesv2.DeleteContactListInput) (*sesv2.DeleteContactListOutput, error) {
	return a.client.DeleteContactList(ctx, input)
}

func (a *SESv2Adapter) ListCustomVerificationEmailTemplates(ctx context.Context, input *sesv2.ListCustomVerificationEmailTemplatesInput) (*sesv2.ListCustomVerificationEmailTemplatesOutput, error) {
	return a.client.ListCustomVerificationEmailTemplates(ctx, input)
}
