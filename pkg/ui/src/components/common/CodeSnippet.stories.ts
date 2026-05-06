import type { Meta, StoryObj } from '@storybook/vue3-vite';
import CodeSnippet from './CodeSnippet.vue';
import type { Snippet } from './CodeSnippet.vue';

const meta: Meta<typeof CodeSnippet> = {
  title: 'UI/CodeSnippet',
  component: CodeSnippet,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    defaultTab: { control: 'text' },
    disableHighlight: { control: 'boolean' }
  },
  args: {
    title: 'Code Examples'
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

const awsCliExample: Snippet[] = [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `aws s3 ls
aws s3 mb s3://my-bucket
aws s3 cp file.txt s3://my-bucket/`
  },
  {
    language: 'python',
    label: 'Python (Boto3)',
    code: `import boto3

s3 = boto3.client('s3')
response = s3.list_buckets()

for bucket in response['Buckets']:
    print(bucket['Name'])`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

const client = new S3Client({ region: 'us-east-1' });
const command = new ListBucketsCommand({});
const response = await client.send(command);`
  }
];

const terraformExample: Snippet[] = [
  {
    language: 'terraform',
    label: 'Terraform',
    code: `resource "aws_s3_bucket" "example" {
  bucket = "my-bucket-name"

  tags = {
    Name        = "my-bucket"
    Environment = "dev"
  }
}`
  },
  {
    language: 'json',
    label: 'JSON',
    code: `{
  "bucket": "my-bucket-name",
  "region": "us-east-1",
  "tags": {
    "Environment": "dev"
  }
}`
  }
];

const singleSnippet: Snippet[] = [
  {
    language: 'bash',
    code: `#!/bin/bash
echo "Hello, World!"
ls -la`
  }
];

export const MultipleTabs: Story = {
  args: {
    snippets: awsCliExample,
    title: 'S3 Bucket Operations'
  },
  render: (args) => ({
    components: { CodeSnippet },
    setup() {
      return { args };
    },
    template: '<CodeSnippet v-bind="args" />'
  })
};

export const TwoTabs: Story = {
  args: {
    snippets: terraformExample,
    title: 'Infrastructure as Code'
  },
  render: (args) => ({
    components: { CodeSnippet },
    setup() {
      return { args };
    },
    template: '<CodeSnippet v-bind="args" />'
  })
};

export const SingleTab: Story = {
  args: {
    snippets: singleSnippet,
    title: 'Shell Script'
  },
  render: (args) => ({
    components: { CodeSnippet },
    setup() {
      return { args };
    },
    template: '<CodeSnippet v-bind="args" />'
  })
};

export const NoTitle: Story = {
  args: {
    snippets: awsCliExample
  },
  render: (args) => ({
    components: { CodeSnippet },
    setup() {
      return { args };
    },
    template: '<CodeSnippet v-bind="args" />'
  })
};

export const DefaultTab: Story = {
  args: {
    snippets: awsCliExample,
    defaultTab: 'python'
  },
  render: (args) => ({
    components: { CodeSnippet },
    setup() {
      return { args };
    },
    template: '<CodeSnippet v-bind="args" />'
  })
};

export const DisableHighlight: Story = {
  args: {
    snippets: singleSnippet,
    disableHighlight: true
  },
  render: (args) => ({
    components: { CodeSnippet },
    setup() {
      return { args };
    },
    template: '<CodeSnippet v-bind="args" />'
  })
};

export const PythonOnly: Story = {
  args: {
    snippets: [
      {
        language: 'python',
        label: 'Python',
        code: `import json

def handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Hello!'})
    }`
      }
    ],
    title: 'Lambda Handler'
  },
  render: (args) => ({
    components: { CodeSnippet },
    setup() {
      return { args };
    },
    template: '<CodeSnippet v-bind="args" />'
  })
};

export const GoExample: Story = {
  args: {
    snippets: [
      {
        language: 'go',
        label: 'Go',
        code: `package main

import (
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/s3"
)

func main() {
    cfg, _ := config.LoadDefaultConfig()
    client := s3.NewFromConfig(cfg)
    fmt.Println("S3 client initialized")
}`
      }
    ]
  },
  render: (args) => ({
    components: { CodeSnippet },
    setup() {
      return { args };
    },
    template: '<CodeSnippet v-bind="args" />'
  })
};