package aws

import (
	"context"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sesv2"
	"github.com/aws/aws-sdk-go-v2/service/sesv2/types"
	sesv2mocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewSESv2Adapter(t *testing.T) {
	adapter := NewSESv2Adapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566")
	assert.NotNil(t, adapter)
	assert.IsType(t, &SESv2Adapter{}, adapter)
}

func TestSESv2Adapter_ListEmailIdentities(t *testing.T) {
	mockClient := sesv2mocks.NewSESv2ClientPort(t)
	ctx := context.Background()
	input := &sesv2.ListEmailIdentitiesInput{}
	expectedOutput := &sesv2.ListEmailIdentitiesOutput{
		EmailIdentities: []types.IdentityInfo{{IdentityName: aws.String("test@example.com")}},
	}

	mockClient.EXPECT().ListEmailIdentities(ctx, input).Return(expectedOutput, nil)
	adapter := &SESv2Adapter{client: mockClient}

	output, err := adapter.ListEmailIdentities(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSESv2Adapter_GetEmailIdentity(t *testing.T) {
	mockClient := sesv2mocks.NewSESv2ClientPort(t)
	ctx := context.Background()
	input := &sesv2.GetEmailIdentityInput{EmailIdentity: aws.String("test@example.com")}
	expectedOutput := &sesv2.GetEmailIdentityOutput{
		IdentityType: types.IdentityTypeEmailAddress,
	}

	mockClient.EXPECT().GetEmailIdentity(ctx, input).Return(expectedOutput, nil)
	adapter := &SESv2Adapter{client: mockClient}

	output, err := adapter.GetEmailIdentity(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSESv2Adapter_CreateEmailIdentity(t *testing.T) {
	mockClient := sesv2mocks.NewSESv2ClientPort(t)
	ctx := context.Background()
	input := &sesv2.CreateEmailIdentityInput{EmailIdentity: aws.String("test@example.com")}
	expectedOutput := &sesv2.CreateEmailIdentityOutput{
		IdentityType: types.IdentityTypeEmailAddress,
	}

	mockClient.EXPECT().CreateEmailIdentity(ctx, input).Return(expectedOutput, nil)
	adapter := &SESv2Adapter{client: mockClient}

	output, err := adapter.CreateEmailIdentity(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSESv2Adapter_DeleteEmailIdentity(t *testing.T) {
	mockClient := sesv2mocks.NewSESv2ClientPort(t)
	ctx := context.Background()
	input := &sesv2.DeleteEmailIdentityInput{EmailIdentity: aws.String("test@example.com")}
	expectedOutput := &sesv2.DeleteEmailIdentityOutput{}

	mockClient.EXPECT().DeleteEmailIdentity(ctx, input).Return(expectedOutput, nil)
	adapter := &SESv2Adapter{client: mockClient}

	output, err := adapter.DeleteEmailIdentity(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSESv2Adapter_SendEmail(t *testing.T) {
	mockClient := sesv2mocks.NewSESv2ClientPort(t)
	ctx := context.Background()
	input := &sesv2.SendEmailInput{
		Destination: &types.Destination{ToAddresses: []string{"recipient@example.com"}},
	}
	expectedOutput := &sesv2.SendEmailOutput{MessageId: aws.String("msg-123")}

	mockClient.EXPECT().SendEmail(ctx, input).Return(expectedOutput, nil)
	adapter := &SESv2Adapter{client: mockClient}

	output, err := adapter.SendEmail(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSESv2Adapter_SendBulkEmail(t *testing.T) {
	mockClient := sesv2mocks.NewSESv2ClientPort(t)
	ctx := context.Background()
	input := &sesv2.SendBulkEmailInput{
		DefaultContent: &types.BulkEmailContent{
			Template: &types.Template{TemplateName: aws.String("MyTemplate")},
		},
	}
	expectedOutput := &sesv2.SendBulkEmailOutput{
		BulkEmailEntryResults: []types.BulkEmailEntryResult{{Status: types.BulkEmailStatusSuccess}},
	}

	mockClient.EXPECT().SendBulkEmail(ctx, input).Return(expectedOutput, nil)
	adapter := &SESv2Adapter{client: mockClient}

	output, err := adapter.SendBulkEmail(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSESv2Adapter_ListEmailTemplates(t *testing.T) {
	mockClient := sesv2mocks.NewSESv2ClientPort(t)
	ctx := context.Background()
	input := &sesv2.ListEmailTemplatesInput{}
	expectedOutput := &sesv2.ListEmailTemplatesOutput{
		TemplatesMetadata: []types.EmailTemplateMetadata{{TemplateName: aws.String("MyTemplate")}},
	}

	mockClient.EXPECT().ListEmailTemplates(ctx, input).Return(expectedOutput, nil)
	adapter := &SESv2Adapter{client: mockClient}

	output, err := adapter.ListEmailTemplates(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSESv2Adapter_GetEmailTemplate(t *testing.T) {
	mockClient := sesv2mocks.NewSESv2ClientPort(t)
	ctx := context.Background()
	input := &sesv2.GetEmailTemplateInput{TemplateName: aws.String("MyTemplate")}
	expectedOutput := &sesv2.GetEmailTemplateOutput{
		TemplateName: aws.String("MyTemplate"),
	}

	mockClient.EXPECT().GetEmailTemplate(ctx, input).Return(expectedOutput, nil)
	adapter := &SESv2Adapter{client: mockClient}

	output, err := adapter.GetEmailTemplate(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSESv2Adapter_UpdateEmailTemplate(t *testing.T) {
	mockClient := sesv2mocks.NewSESv2ClientPort(t)
	ctx := context.Background()
	input := &sesv2.UpdateEmailTemplateInput{
		TemplateName: aws.String("my-template"),
		TemplateContent: &types.EmailTemplateContent{
			Subject: aws.String("Updated Subject"),
			Html:    aws.String("<p>Updated</p>"),
			Text:    aws.String("Updated text"),
		},
	}
	expectedOutput := &sesv2.UpdateEmailTemplateOutput{}

	mockClient.EXPECT().UpdateEmailTemplate(ctx, input).Return(expectedOutput, nil)
	adapter := &SESv2Adapter{client: mockClient}

	output, err := adapter.UpdateEmailTemplate(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSESv2Adapter_CreateEmailTemplate(t *testing.T) {
	mockClient := sesv2mocks.NewSESv2ClientPort(t)
	ctx := context.Background()
	input := &sesv2.CreateEmailTemplateInput{
		TemplateName: aws.String("MyTemplate"),
		TemplateContent: &types.EmailTemplateContent{
			Subject: aws.String("Hello"),
		},
	}
	expectedOutput := &sesv2.CreateEmailTemplateOutput{}

	mockClient.EXPECT().CreateEmailTemplate(ctx, input).Return(expectedOutput, nil)
	adapter := &SESv2Adapter{client: mockClient}

	output, err := adapter.CreateEmailTemplate(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSESv2Adapter_DeleteEmailTemplate(t *testing.T) {
	mockClient := sesv2mocks.NewSESv2ClientPort(t)
	ctx := context.Background()
	input := &sesv2.DeleteEmailTemplateInput{TemplateName: aws.String("MyTemplate")}
	expectedOutput := &sesv2.DeleteEmailTemplateOutput{}

	mockClient.EXPECT().DeleteEmailTemplate(ctx, input).Return(expectedOutput, nil)
	adapter := &SESv2Adapter{client: mockClient}

	output, err := adapter.DeleteEmailTemplate(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSESv2Adapter_GetAccount(t *testing.T) {
	mockClient := sesv2mocks.NewSESv2ClientPort(t)
	ctx := context.Background()
	input := &sesv2.GetAccountInput{}
	expectedOutput := &sesv2.GetAccountOutput{
		DedicatedIpAutoWarmupEnabled: true,
	}

	mockClient.EXPECT().GetAccount(ctx, input).Return(expectedOutput, nil)
	adapter := &SESv2Adapter{client: mockClient}

	output, err := adapter.GetAccount(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSESv2Adapter_PutAccountSuppressionAttributes(t *testing.T) {
	mockClient := sesv2mocks.NewSESv2ClientPort(t)
	ctx := context.Background()
	input := &sesv2.PutAccountSuppressionAttributesInput{
		SuppressedReasons: []types.SuppressionListReason{types.SuppressionListReasonBounce},
	}
	expectedOutput := &sesv2.PutAccountSuppressionAttributesOutput{}

	mockClient.EXPECT().PutAccountSuppressionAttributes(ctx, input).Return(expectedOutput, nil)
	adapter := &SESv2Adapter{client: mockClient}

	output, err := adapter.PutAccountSuppressionAttributes(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSESv2Adapter_ListSuppressedDestinations(t *testing.T) {
	mockClient := sesv2mocks.NewSESv2ClientPort(t)
	ctx := context.Background()
	input := &sesv2.ListSuppressedDestinationsInput{}
	expectedOutput := &sesv2.ListSuppressedDestinationsOutput{
		SuppressedDestinationSummaries: []types.SuppressedDestinationSummary{
			{EmailAddress: aws.String("bounce@example.com")},
		},
	}

	mockClient.EXPECT().ListSuppressedDestinations(ctx, input).Return(expectedOutput, nil)
	adapter := &SESv2Adapter{client: mockClient}

	output, err := adapter.ListSuppressedDestinations(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSESv2Adapter_ListContactLists(t *testing.T) {
	mockClient := sesv2mocks.NewSESv2ClientPort(t)
	ctx := context.Background()
	input := &sesv2.ListContactListsInput{}
	expectedOutput := &sesv2.ListContactListsOutput{
		ContactLists: []types.ContactList{{ContactListName: aws.String("MyList")}},
	}

	mockClient.EXPECT().ListContactLists(ctx, input).Return(expectedOutput, nil)
	adapter := &SESv2Adapter{client: mockClient}

	output, err := adapter.ListContactLists(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSESv2Adapter_CreateContactList(t *testing.T) {
	mockClient := sesv2mocks.NewSESv2ClientPort(t)
	ctx := context.Background()
	input := &sesv2.CreateContactListInput{ContactListName: aws.String("MyList")}
	expectedOutput := &sesv2.CreateContactListOutput{}

	mockClient.EXPECT().CreateContactList(ctx, input).Return(expectedOutput, nil)
	adapter := &SESv2Adapter{client: mockClient}

	output, err := adapter.CreateContactList(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSESv2Adapter_DeleteContactList(t *testing.T) {
	mockClient := sesv2mocks.NewSESv2ClientPort(t)
	ctx := context.Background()
	input := &sesv2.DeleteContactListInput{ContactListName: aws.String("MyList")}
	expectedOutput := &sesv2.DeleteContactListOutput{}

	mockClient.EXPECT().DeleteContactList(ctx, input).Return(expectedOutput, nil)
	adapter := &SESv2Adapter{client: mockClient}

	output, err := adapter.DeleteContactList(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestSESv2Adapter_ListCustomVerificationEmailTemplates(t *testing.T) {
	mockClient := sesv2mocks.NewSESv2ClientPort(t)
	ctx := context.Background()
	input := &sesv2.ListCustomVerificationEmailTemplatesInput{}
	expectedOutput := &sesv2.ListCustomVerificationEmailTemplatesOutput{
		CustomVerificationEmailTemplates: []types.CustomVerificationEmailTemplateMetadata{
			{TemplateName: aws.String("MyCustomTemplate")},
		},
	}

	mockClient.EXPECT().ListCustomVerificationEmailTemplates(ctx, input).Return(expectedOutput, nil)
	adapter := &SESv2Adapter{client: mockClient}

	output, err := adapter.ListCustomVerificationEmailTemplates(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}
