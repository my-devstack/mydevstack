<script setup lang="ts">
import { computed } from 'vue'
import CodeSnippet from '@/components/common/CodeSnippet.vue'

const props = defineProps<{
  region: string
  accessKey: string
  secretKey: string
}>()

const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List Lambda functions
aws lambda list-functions --endpoint-url http://127.0.0.1:4566

# Create function
aws lambda create-function \\
  --function-name my-function \\
  --runtime nodejs22.x \\
  --handler index.handler \\
  --role arn:aws:iam::123456789012:role/lambda-role \\
  --zip-file fileb://function.zip \\
  --endpoint-url http://127.0.0.1:4566

# Invoke function
aws lambda invoke \\
  --function-name my-function \\
  --payload '{"key": "value"}' \\
  --endpoint-url http://127.0.0.1:4566

# Delete function
aws lambda delete-function \\
  --function-name my-function \\
  --endpoint-url http://127.0.0.1:4566`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { LambdaClient, ListFunctionsCommand, InvokeCommand } from "@aws-sdk/client-lambda";

const client = new LambdaClient({
  region: '${props.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${props.accessKey}',
    secretAccessKey: '${props.secretKey}',
  },
});

// List functions
const listResponse = await client.send(new ListFunctionsCommand({}));
console.log(listResponse.Functions);

// Invoke function
const invokeResponse = await client.send(new InvokeCommand({
  FunctionName: 'my-function',
  Payload: JSON.stringify({ key: 'value' }),
}));
const responseBody = JSON.parse(invokeResponse.Payload.transformToString());`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3
import json

client = boto3.client(
    'lambda',
    region_name='${props.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${props.accessKey}',
    aws_secret_access_key='${props.secretKey}',
)

# List functions
response = client.list_functions()
for func in response['Functions']:
    print(func['FunctionName'])

# Invoke function
response = client.invoke(
    FunctionName='my-function',
    InvocationType='RequestResponse',
    Payload=json.dumps({'key': 'value'}),
)
result = json.loads(response['Payload'].read())
print(result)`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
import (
    "context"
    "encoding/json"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/lambda"
    "github.com/aws/aws-sdk-go-v2/credentials"
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

client := lambda.NewFromConfig(cfg, func(o *lambda.Options) {
    o.BaseURL = aws.String("http://127.0.0.1:4566")
})

// List functions
listOutput, _ := client.ListFunctions(context.Background(), &lambda.ListFunctionsInput{})
fmt.Println(listOutput.Functions)

// Invoke function
invokeOutput, _ := client.Invoke(context.Background(), &lambda.InvokeInput{
    FunctionName: aws.String("my-function"),
    InvocationType: lambda.InvocationTypeRequestResponse,
    Payload: json.Marshal(map[string]string{"key": "value"}),
})
fmt.Println(invokeOutput.Payload)`
  },
])
</script>

<template>
  <CodeSnippet
    title="Usage Examples"
    :snippets="codeExamples"
    default-tab="aws-cli"
    :disable-highlight="true"
  />
</template>
