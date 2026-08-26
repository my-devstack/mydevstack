<script setup lang="ts">
import { computed } from 'vue'
import CodeSnippet from '@/components/common/CodeSnippet.vue'

const props = defineProps<{
  region: string
  accessKey: string
  secretKey: string
  repositoryName?: string
}>()

const repoName = computed(() => props.repositoryName || 'my-app')
const registryEndpoint = computed(() => `000000000000.dkr.ecr.${props.region}.amazonaws.com`)

const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# Authenticate Docker to the registry
aws ecr get-login-password --region ${props.region} \\
  | docker login --username AWS --password-stdin ${registryEndpoint.value}

# Create a repository
aws ecr create-repository \\
  --repository-name ${repoName.value} \\
  --region ${props.region}

# Build and tag your image
docker build -t ${repoName.value} .
docker tag ${repoName.value}:latest ${registryEndpoint.value}/${repoName.value}:latest

# Push the image to ECR
docker push ${registryEndpoint.value}/${repoName.value}:latest

# Pull the image from ECR
docker pull ${registryEndpoint.value}/${repoName.value}:latest

# List images in the repository
aws ecr list-images \\
  --repository-name ${repoName.value} \\
  --region ${props.region}

# Delete an image by tag
aws ecr batch-delete-image \\
  --repository-name ${repoName.value} \\
  --image-ids imageTag=latest \\
  --region ${props.region}

# Delete the repository (force removes images)
aws ecr delete-repository \\
  --repository-name ${repoName.value} \\
  --force \\
  --region ${props.region}`
  },
  {
    language: 'bash',
    label: 'Docker Commands',
    code: `# 1. Get the login password and authenticate Docker
aws ecr get-login-password --region ${props.region} \\
  | docker login --username AWS --password-stdin ${registryEndpoint.value}

# 2. Build your image
docker build -t ${repoName.value} .

# 3. Tag the image for ECR
docker tag ${repoName.value}:latest ${registryEndpoint.value}/${repoName.value}:latest

# 4. Push the image
docker push ${registryEndpoint.value}/${repoName.value}:latest

# 5. Pull the image
docker pull ${registryEndpoint.value}/${repoName.value}:latest

# 6. Run a container from the image
docker run -p 8080:80 ${registryEndpoint.value}/${repoName.value}:latest`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { ECRClient, CreateRepositoryCommand, ListImagesCommand } from "@aws-sdk/client-ecr";

const client = new ECRClient({
  region: '${props.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${props.accessKey}',
    secretAccessKey: '${props.secretKey}',
  },
});

// Create repository
await client.send(new CreateRepositoryCommand({
  repositoryName: '${repoName.value}',
}));

// List images
const listResponse = await client.send(new ListImagesCommand({
  repositoryName: '${repoName.value}',
}));
console.log(listResponse.imageIds);`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3

client = boto3.client(
    'ecr',
    region_name='${props.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${props.accessKey}',
    aws_secret_access_key='${props.secretKey}',
)

# Create repository
client.create_repository(repositoryName='${repoName.value}')

# List images
response = client.list_images(repositoryName='${repoName.value}')
for image in response['imageIds']:
    print(image)`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/credentials"
    "github.com/aws/aws-sdk-go-v2/service/ecr"
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

client := ecr.NewFromConfig(cfg, func(o *ecr.Options) {
    o.BaseURL = aws.String("http://127.0.0.1:4566")
})

// Create repository
_, _ = client.CreateRepository(context.Background(), &ecr.CreateRepositoryInput{
    RepositoryName: aws.String("${repoName.value}"),
})

// List images
listOutput, _ := client.ListImages(context.Background(), &ecr.ListImagesInput{
    RepositoryName: aws.String("${repoName.value}"),
})
fmt.Println(listOutput.ImageIds)`
  },
])
</script>

<template>
  <CodeSnippet
    title="ECR Usage Examples"
    :snippets="codeExamples"
    default-tab="aws-cli"
    :disable-highlight="true"
  />
</template>