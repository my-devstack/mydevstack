<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{
  region: string
  accessKey: string
  secretKey: string
}>()

const settingsStore = useSettingsStore()
const selectedExample = ref(0)

const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List buckets
aws s3 ls --endpoint-url http://127.0.0.1:4566

# Create bucket
aws s3 mb s3://my-bucket --endpoint-url http://127.0.0.1:4566

# List objects in bucket
aws s3 ls s3://my-bucket/ --endpoint-url http://127.0.0.1:4566

# Upload file
aws s3 cp my-file.txt s3://my-bucket/ --endpoint-url http://127.0.0.1:4566

# Download file
aws s3 cp s3://my-bucket/my-file.txt ./my-file.txt --endpoint-url http://127.0.0.1:4566

# Delete object
aws s3 rm s3://my-bucket/my-file.txt --endpoint-url http://127.0.0.1:4566

# Delete bucket
aws s3 rb s3://my-bucket --endpoint-url http://127.0.0.1:4566`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { S3Client, ListBucketsCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: '${props.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${props.accessKey}',
    secretAccessKey: '${props.secretKey}',
  },
  forcePathStyle: true,
});

// List buckets
const buckets = await client.send(new ListBucketsCommand({}));
console.log(buckets.Buckets);

// Upload file
await client.send(new PutObjectCommand({
  Bucket: 'my-bucket',
  Key: 'my-file.txt',
  Body: 'Hello World',
  ContentType: 'text/plain',
}));

// Download file
const response = await client.send(new GetObjectCommand({
  Bucket: 'my-bucket',
  Key: 'my-file.txt',
}));
const body = await response.Body.transformToString();
console.log(body);

// Delete file
await client.send(new DeleteObjectCommand({
  Bucket: 'my-bucket',
  Key: 'my-file.txt',
}));`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3

client = boto3.client(
    's3',
    region_name='${props.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${props.accessKey}',
    aws_secret_access_key='${props.secretKey}',
)

# List buckets
response = client.list_buckets()
for bucket in response['Buckets']:
    print(f"  {bucket['Name']}")

# Upload file
client.put_object(
    Bucket='my-bucket',
    Key='my-file.txt',
    Body='Hello World',
    ContentType='text/plain',
)

# Download file
response = client.get_object(Bucket='my-bucket', Key='my-file.txt')
print(response['Body'].read().decode('utf-8'))

# Delete file
client.delete_object(Bucket='my-bucket', Key='my-file.txt')`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/s3"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${props.region}"),
)

client := s3.New(s3.Options{
    Region: "${props.region}",
    BaseURL: aws.String("http://127.0.0.1:4566"),
    Credentials: aws.CredentialsProviderFunc(
        func(ctx context.Context) (aws.Credentials, error) {
            return aws.Credentials{
                AccessKeyID:     "${props.accessKey}",
                SecretAccessKey: "${props.secretKey}",
            }, nil
        },
    ),
})

// List buckets
buckets, _ := client.ListBuckets(context.Background(), &s3.ListBucketsInput{})
fmt.Println(buckets.Buckets)

// Upload file
client.PutObject(context.Background(), &s3.PutObjectInput{
    Bucket:      aws.String("my-bucket"),
    Key:         aws.String("my-file.txt"),
    Body:        strings.NewReader("Hello World"),
    ContentType: aws.String("text/plain"),
})

// Download file
output, _ := client.GetObject(context.Background(), &s3.GetObjectInput{
    Bucket: aws.String("my-bucket"),
    Key:    aws.String("my-file.txt"),
})
body, _ := io.ReadAll(output.Body)
fmt.Println(string(body))`
  },
])
</script>

<template>
  <div class="mt-8">
    <h2
      class="text-lg font-semibold mb-4"
      :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
    >
      Usage Examples
    </h2>
    <div
      class="rounded-lg border overflow-hidden"
      :class="settingsStore.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
    >
      <div
        class="flex border-b"
        :class="settingsStore.darkMode ? 'border-gray-700' : 'border-gray-200'"
      >
        <button
          v-for="(example, index) in codeExamples"
          :key="example.language"
          class="px-4 py-2 text-sm font-medium transition-colors"
          :class="[
            selectedExample === index
              ? settingsStore.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
              : settingsStore.darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          ]"
          @click="selectedExample = index"
        >
          {{ example.label }}
        </button>
      </div>
      <div class="p-4 overflow-x-auto">
        <pre
          class="text-sm font-mono"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >{{ codeExamples[selectedExample].code }}</pre>
      </div>
    </div>
  </div>
</template>