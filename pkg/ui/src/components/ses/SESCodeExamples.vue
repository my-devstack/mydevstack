<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import CodeSnippet from '@/components/common/CodeSnippet.vue'

const settingsStore = useSettingsStore()

const snippets = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List email identities
aws sesv2 list-email-identities --endpoint-url http://127.0.0.1:4566

# Create email identity
aws sesv2 create-email-identity \
  --email-identity sender@example.com \
  --endpoint-url http://127.0.0.1:4566

# Create email identity with tags
aws sesv2 create-email-identity \
  --email-identity sender@example.com \
  --tags Key=env,Value=test \
  --endpoint-url http://127.0.0.1:4566

# Create domain identity
aws sesv2 create-email-identity \\
  --email-identity example.com \\
  --endpoint-url http://127.0.0.1:4566

# Get email identity details
aws sesv2 get-email-identity \\
  --email-identity sender@example.com \\
  --endpoint-url http://127.0.0.1:4566

# Send email
aws sesv2 send-email \
  --from-email-address sender@example.com \
  --destination '{"ToAddresses":["recipient@example.com"]}' \
  --content '{"Simple":{"Subject":{"Data":"Hello"},"Body":{"Text":{"Data":"Hello from SES"}}}}' \
  --endpoint-url http://127.0.0.1:4566

# Send email with template
aws sesv2 send-email \
  --from-email-address sender@example.com \
  --destination '{"ToAddresses":["recipient@example.com"]}' \
  --content '{"Template":{"TemplateName":"my-template","TemplateData":"{\\"name\\":\\"John\\"}"}}' \
  --endpoint-url http://127.0.0.1:4566

# List templates
aws sesv2 list-email-templates --endpoint-url http://127.0.0.1:4566

# Create template
aws sesv2 create-email-template \
  --template-name my-template \
  --template-content '{"Subject":"Hello","Html":"<h1>Hello</h1>","Text":"Hello"}' \
  --endpoint-url http://127.0.0.1:4566

# Delete identity
aws sesv2 delete-email-identity \
  --email-identity sender@example.com \
  --endpoint-url http://127.0.0.1:4566

# Delete template
aws sesv2 delete-email-template \
  --template-name my-template \
  --endpoint-url http://127.0.0.1:4566`,
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { SESv2Client, ListEmailIdentitiesCommand, CreateEmailIdentityCommand, SendEmailCommand, ListEmailTemplatesCommand, CreateEmailTemplateCommand, DeleteEmailTemplateCommand, DeleteEmailIdentityCommand } from "@aws-sdk/client-sesv2";

const client = new SESv2Client({
  region: '${settingsStore.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List email identities
const identities = await client.send(new ListEmailIdentitiesCommand({}));
console.log(identities.EmailIdentities);

// Create email identity
await client.send(new CreateEmailIdentityCommand({
  EmailIdentity: 'sender@example.com',
}));

// Create email identity with tags
await client.send(new CreateEmailIdentityCommand({
  EmailIdentity: 'sender@example.com',
  Tags: [
    { Key: 'env', Value: 'test' },
  ],
}));

// Send email
await client.send(new SendEmailCommand({
  FromEmailAddress: 'sender@example.com',
  Destination: { ToAddresses: ['recipient@example.com'] },
  Content: {
    Simple: {
      Subject: { Data: 'Hello' },
      Body: { Text: { Data: 'Hello from SES' } },
    },
  },
}));

// Send email with template
await client.send(new SendEmailCommand({
  FromEmailAddress: 'sender@example.com',
  Destination: { ToAddresses: ['recipient@example.com'] },
  Content: {
    Template: {
      TemplateName: 'my-template',
      TemplateData: JSON.stringify({ name: 'John' }),
    },
  },
}));

// List templates
const templates = await client.send(new ListEmailTemplatesCommand({}));
console.log(templates.TemplatesMetadata);

// Create template
await client.send(new CreateEmailTemplateCommand({
  TemplateName: 'my-template',
  TemplateContent: {
    Subject: 'Hello',
    Html: '<h1>Hello</h1>',
    Text: 'Hello',
  },
}));

// Delete identity
await client.send(new DeleteEmailIdentityCommand({
  EmailIdentity: 'sender@example.com',
}));

// Delete template
await client.send(new DeleteEmailTemplateCommand({
  TemplateName: 'my-template',
}));`,
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3
import json

client = boto3.client(
    'sesv2',
    region_name='${settingsStore.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List email identities
response = client.list_email_identities()
for identity in response['EmailIdentities']:
    print(identity['IdentityName'])

# Create email identity
client.create_email_identity(EmailIdentity='sender@example.com')

# Create email identity with tags
client.create_email_identity(
    EmailIdentity='sender@example.com',
    Tags=[
        {'Key': 'env', 'Value': 'test'},
    ],
)

# Send email
client.send_email(
    FromEmailAddress='sender@example.com',
    Destination={'ToAddresses': ['recipient@example.com']},
    Content={
        'Simple': {
            'Subject': {'Data': 'Hello'},
            'Body': {'Text': {'Data': 'Hello from SES'}},
        }
    },
)

# Send email with template
client.send_email(
    FromEmailAddress='sender@example.com',
    Destination={'ToAddresses': ['recipient@example.com']},
    Content={
        'Template': {
            'TemplateName': 'my-template',
            'TemplateData': json.dumps({'name': 'John'}),
        }
    },
)

# List templates
response = client.list_email_templates()
for template in response['TemplatesMetadata']:
    print(template['TemplateName'])

# Create template
client.create_email_template(
    TemplateName='my-template',
    TemplateContent={
        'Subject': 'Hello',
        'Html': '<h1>Hello</h1>',
        'Text': 'Hello',
    },
)

# Delete identity
client.delete_email_identity(EmailIdentity='sender@example.com')

# Delete template
client.delete_email_template(TemplateName='my-template')`,
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/sesv2"
    "github.com/aws/aws-sdk-go-v2/service/sesv2/types"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

client := sesv2.NewFromConfig(cfg, func(o *sesv2.Options) {
    o.BaseEndpoint = aws.String("http://127.0.0.1:4566")
})

// List email identities
identities, _ := client.ListEmailIdentities(context.Background(), &sesv2.ListEmailIdentitiesInput{})
fmt.Println(identities.EmailIdentities)

// Create email identity
_, _ = client.CreateEmailIdentity(context.Background(), &sesv2.CreateEmailIdentityInput{
    EmailIdentity: aws.String("sender@example.com"),
})

// Create email identity with tags
_, _ = client.CreateEmailIdentity(context.Background(), &sesv2.CreateEmailIdentityInput{
    EmailIdentity: aws.String("sender@example.com"),
    Tags: []types.Tag{
        {Key: aws.String("env"), Value: aws.String("test")},
    },
})

// Send email
_, _ = client.SendEmail(context.Background(), &sesv2.SendEmailInput{
    FromEmailAddress: aws.String("sender@example.com"),
    Destination: &sesv2.Destination{
        ToAddresses: []string{"recipient@example.com"},
    },
    Content: &sesv2.EmailContent{
        Simple: &sesv2.Message{
            Subject: &sesv2.Content{Data: aws.String("Hello")},
            Body: &sesv2.Body{
                Text: &sesv2.Content{Data: aws.String("Hello from SES")},
            },
        },
    },
})

// Send email with template
_, _ = client.SendEmail(context.Background(), &sesv2.SendEmailInput{
    FromEmailAddress: aws.String("sender@example.com"),
    Destination: &sesv2.Destination{
        ToAddresses: []string{"recipient@example.com"},
    },
    Content: &sesv2.EmailContent{
        Template: &sesv2.Template{
            TemplateName: aws.String("my-template"),
            TemplateData: aws.String("{\\"name\\":\\"John\\"}"),
        },
    },
})

// List templates
templates, _ := client.ListEmailTemplates(context.Background(), &sesv2.ListEmailTemplatesInput{})
fmt.Println(templates.TemplatesMetadata)

// Create template
_, _ = client.CreateEmailTemplate(context.Background(), &sesv2.CreateEmailTemplateInput{
    TemplateName: aws.String("my-template"),
    TemplateContent: &sesv2.EmailTemplateContent{
        Subject: aws.String("Hello"),
        Html:    aws.String("<h1>Hello</h1>"),
        Text:    aws.String("Hello"),
    },
})

// Delete identity
_, _ = client.DeleteEmailIdentity(context.Background(), &sesv2.DeleteEmailIdentityInput{
    EmailIdentity: aws.String("sender@example.com"),
})

// Delete template
_, _ = client.DeleteEmailTemplate(context.Background(), &sesv2.DeleteEmailTemplateInput{
    TemplateName: aws.String("my-template"),
})`,
  },
])
</script>

<template>
  <CodeSnippet
    title="Usage Examples"
    :snippets="snippets"
    default-tab="aws-cli"
    :disable-highlight="true"
  />
</template>
