<script setup lang="ts">
import { computed } from 'vue'
import CodeSnippet from '@/components/common/CodeSnippet.vue'

const props = defineProps<{
  region: string
  accessKey: string
  secretKey: string
  distributionId?: string
}>()

const distId = computed(() => props.distributionId || 'E1ABCDEF123456')

const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# Create a CloudFront distribution
aws cloudfront create-distribution \\
  --distribution-config '{
    "CallerReference": "unique-ref-123",
    "Origins": {
      "Quantity": 1,
      "Items": [{
        "Id": "S3-my-bucket",
        "DomainName": "my-bucket.s3.amazonaws.com",
        "S3OriginConfig": {"OriginAccessIdentity": ""}
      }]
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-my-bucket",
      "ViewerProtocolPolicy": "redirect-to-https",
      "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
  }' \\
  --region ${props.region}

# List distributions
aws cloudfront list-distributions --region ${props.region}

# Get distribution details
aws cloudfront get-distribution \\
  --id ${distId.value} \\
  --region ${props.region}

# Create an invalidation
aws cloudfront create-invalidation \\
  --distribution-id ${distId.value} \\
  --paths "/*" \\
  --region ${props.region}

# Create an Origin Access Control
aws cloudfront create-origin-access-control \\
  --origin-access-control-config '{
    "Name": "my-oac",
    "SigningProtocol": "sigv4",
    "SigningBehavior": "always",
    "OriginAccessControlOriginType": "s3"
  }' \\
  --region ${props.region}

# Delete a distribution (must be disabled first)
aws cloudfront delete-distribution \\
  --id ${distId.value} \\
  --if-match $(aws cloudfront get-distribution-config --id ${distId.value} --query 'ETag' --output text) \\
  --region ${props.region}`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { CloudFrontClient, CreateDistributionCommand, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";

const client = new CloudFrontClient({
  region: '${props.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${props.accessKey}',
    secretAccessKey: '${props.secretKey}',
  },
});

// Create distribution
await client.send(new CreateDistributionCommand({
  DistributionConfig: {
    CallerReference: 'unique-ref-123',
    Origins: {
      Quantity: 1,
      Items: [{
        Id: 'S3-my-bucket',
        DomainName: 'my-bucket.s3.amazonaws.com',
        S3OriginConfig: { OriginAccessIdentity: '' },
      }],
    },
    DefaultCacheBehavior: {
      TargetOriginId: 'S3-my-bucket',
      ViewerProtocolPolicy: 'redirect-to-https',
      CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
    },
    Enabled: true,
    PriceClass: 'PriceClass_100',
  },
}));

// Create invalidation
await client.send(new CreateInvalidationCommand({
  DistributionId: '${distId.value}',
  InvalidationBatch: {
    Paths: { Quantity: 1, Items: ['/*'] },
    CallerReference: 'invalidation-ref-123',
  },
}));`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3

client = boto3.client(
    'cloudfront',
    region_name='${props.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${props.accessKey}',
    aws_secret_access_key='${props.secretKey}',
)

# Create distribution
response = client.create_distribution(
    DistributionConfig={
        'CallerReference': 'unique-ref-123',
        'Origins': {
            'Quantity': 1,
            'Items': [{
                'Id': 'S3-my-bucket',
                'DomainName': 'my-bucket.s3.amazonaws.com',
                'S3OriginConfig': {'OriginAccessIdentity': ''},
            }],
        },
        'DefaultCacheBehavior': {
            'TargetOriginId': 'S3-my-bucket',
            'ViewerProtocolPolicy': 'redirect-to-https',
            'CachePolicyId': '658327ea-f89d-4fab-a63d-7e88639e58f6',
        },
        'Enabled': True,
        'PriceClass': 'PriceClass_100',
    }
)

# Create invalidation
client.create_invalidation(
    DistributionId='${distId.value}',
    InvalidationBatch={
        'Paths': {'Quantity': 1, 'Items': ['/*']},
        'CallerReference': 'invalidation-ref-123',
    }
)`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
import (
    "context"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/credentials"
    "github.com/aws/aws-sdk-go-v2/service/cloudfront"
    "github.com/aws/aws-sdk-go-v2/service/cloudfront/types"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${props.region}"),
    config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
        "${props.accessKey}",
        "${props.secretKey}",
        "",
    )),
)

client := cloudfront.NewFromConfig(cfg, func(o *cloudfront.Options) {
    o.BaseEndpoint = aws.String("http://127.0.0.1:4566")
})

// Create distribution
_, _ = client.CreateDistribution(context.Background(), &cloudfront.CreateDistributionInput{
    DistributionConfig: &types.DistributionConfig{
        CallerReference: aws.String("unique-ref-123"),
        Origins: &types.Origins{
            Quantity: aws.Int32(1),
            Items: []types.Origin{{
                Id:         aws.String("S3-my-bucket"),
                DomainName: aws.String("my-bucket.s3.amazonaws.com"),
                S3OriginConfig: &types.S3OriginConfig{
                    OriginAccessIdentity: aws.String(""),
                },
            }},
        },
        Enabled: aws.Bool(true),
        PriceClass: types.PriceClass("PriceClass_100"),
    },
})`
  },
])
</script>

<template>
  <CodeSnippet
    title="CloudFront Usage Examples"
    :snippets="codeExamples"
    default-tab="aws-cli"
    :disable-highlight="true"
  />
</template>
