<script setup lang="ts">
import { ref, computed } from 'vue'
import CodeSnippet from '@/components/common/CodeSnippet.vue'

const props = defineProps<{
  region: string
  accessKey: string
  secretKey: string
}>()

const selectedTab = ref<'rest' | 'http'>('rest')

const restExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List REST APIs
aws apigateway get-rest-apis --endpoint-url http://127.0.0.1:4566

# Get REST API details
aws apigateway get-rest-api --rest-api-id <api-id> --endpoint-url http://127.0.0.1:4566

# Create REST API
aws apigateway create-rest-api --name "my-api" --endpoint-url http://127.0.0.1:4566

# Create Resource
aws apigateway create-resource --rest-api-id <api-id> --parent-id <parent-id> --path-part "items" --endpoint-url http://127.0.0.1:4566

# Create Method (GET)
aws apigateway put-method --rest-api-id <api-id> --resource-id <resource-id> --http-method GET --authorization-type NONE --endpoint-url http://127.0.0.1:4566

# Create Deployment
aws apigateway create-deployment --rest-api-id <api-id> --stage-name prod --endpoint-url http://127.0.0.1:4566

# Delete REST API
aws apigateway delete-rest-api --rest-api-id <api-id> --endpoint-url http://127.0.0.1:4566`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { APIGatewayClient, GetRestApisCommand, CreateRestApiCommand, GetRestApiCommand, DeleteRestApiCommand } from "@aws-sdk/client-api-gateway";

const client = new APIGatewayClient({
  region: '${props.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${props.accessKey}',
    secretAccessKey: '${props.secretKey}',
  },
});

// List REST APIs
const listResponse = await client.send(new GetRestApisCommand({}));
const createResponse = await client.send(new CreateRestApiCommand({
  name: 'my-api',
  description: 'My API',
}));
const getResponse = await client.send(new GetRestApiCommand({
  restApiId: '<api-id>',
}));

// Delete REST API
await client.send(new DeleteRestApiCommand({
  restApiId: '<api-id>',
}));`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3

client = boto3.client(
    'apigateway',
    region_name='${props.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${props.accessKey}',
    aws_secret_access_key='${props.secretKey}',
)

# List REST APIs
response = client.get_rest_apis()
for api in response['items']:
    print(f"  {api['name']} ({api['id']})")

# Create REST API
response = client.create_rest_api(
    name='my-api',
    description='My API'
)
print(f"Created API: {response['id']}")

# Get REST API details
response = client.get_rest_api(rest_api_id='<api-id>')
print(f"API: {response}")

# Delete REST API
client.delete_rest_api(rest_api_id='<api-id>')`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/apigateway"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${props.region}"),
)

client := apigateway.New(apigateway.Options{
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

// List REST APIs
listOutput, err := client.GetRestApis(context.Background(), &apigateway.GetRestApisInput{})
if err != nil {
    panic(err)
}
for _, api := range listOutput.Items {
    fmt.Printf("API: %s (%s)\\n", aws.StringValue(api.Name), aws.StringValue(api.Id))
}

// Create REST API
createOutput, err := client.CreateRestApi(context.Background(), &apigateway.CreateRestApiInput{
    Name:        aws.String("my-api"),
    Description: aws.String("My API"),
})
if err != nil {
    panic(err)
}
fmt.Printf("Created API ID: %s\\n", aws.StringValue(createOutput.Id))

// Delete REST API
_, err = client.DeleteRestApi(context.Background(), &apigateway.DeleteRestApiInput{
    RestApiId: aws.String("<api-id>"),
})
if err != nil {
    panic(err)
}
fmt.Println("API deleted")`
  },
])

const httpExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List HTTP APIs
aws apigatewayv2 get-apis --endpoint-url http://127.0.0.1:4566

# Get HTTP API details
aws apigatewayv2 get-api --api-id <api-id> --endpoint-url http://127.0.0.1:4566

# Create HTTP API
aws apigatewayv2 create-api --name "my-http-api" --protocol-type HTTP --endpoint-url http://127.0.0.1:4566

# Create Route
aws apigatewayv2 create-route --api-id <api-id> --route-key "GET /items" --endpoint-url http://127.0.0.1:4566

# Create Integration
aws apigatewayv2 create-integration --api-id <api-id> --integration-type HTTP_PROXY --uri "http://localhost:8080" --endpoint-url http://127.0.0.1:4566

# Create Stage
aws apigatewayv2 create-stage --api-id <api-id> --stage-name prod --endpoint-url http://127.0.0.1:4566

# Delete HTTP API
aws apigatewayv2 delete-api --api-id <api-id> --endpoint-url http://127.0.0.1:4566`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3 - ApiGatewayV2
import { ApiGatewayV2Client, GetApisCommand, CreateApiCommand, DeleteApiCommand } from "@aws-sdk/client-apigatewayv2";

const client = new ApiGatewayV2Client({
  region: '${props.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${props.accessKey}',
    secretAccessKey: '${props.secretKey}',
  },
});

// List HTTP APIs
const listResponse = await client.send(new GetApisCommand({}));

// Create HTTP API
const createResponse = await client.send(new CreateApiCommand({
  Name: 'my-http-api',
  ProtocolType: 'HTTP',
}));

// Delete HTTP API
await client.send(new DeleteApiCommand({
  ApiId: '<api-id>',
}));`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3 - apigatewayv2
import boto3

client = boto3.client(
    'apigatewayv2',
    region_name='${props.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${props.accessKey}',
    aws_secret_access_key='${props.secretKey}',
)

# List HTTP APIs
response = client.get_apis()
for api in response['Items']:
    print(f"  {api['Name']} ({api['ApiId']})")

# Create HTTP API
response = client.create_api(
    Name='my-http-api',
    ProtocolType='HTTP'
)
print(f"Created API: {response['ApiId']}")

# Delete HTTP API
client.delete_api(ApiId='<api-id>')`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2 - ApiGatewayV2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/apigatewayv2"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${props.region}"),
)

client := apigatewayv2.New(apigatewayv2.Options{
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

// List HTTP APIs
listOutput, err := client.GetApis(context.Background(), &apigatewayv2.GetApisInput{})
if err != nil {
    panic(err)
}
for _, api := range listOutput.Items {
    fmt.Printf("HTTP API: %s (%s)\\n", aws.StringValue(api.Name), aws.StringValue(api.ApiId))
}

// Create HTTP API
createOutput, err := client.CreateApi(context.Background(), &apigatewayv2.CreateApiInput{
    Name:        aws.String("my-http-api"),
    ProtocolType: aws.String("HTTP"),
})
if err != nil {
    panic(err)
}
fmt.Printf("Created HTTP API ID: %s\\n", aws.StringValue(createOutput.ApiId))

// Delete HTTP API
_, err = client.DeleteApi(context.Background(), &apigatewayv2.DeleteApiInput{
    ApiId: aws.String("<api-id>"),
})
if err != nil {
    panic(err)
}
fmt.Println("HTTP API deleted")`
  },
])

const currentExamples = computed(() => {
  return selectedTab.value === 'rest' ? restExamples.value : httpExamples.value
})
</script>

<template>
  <div class="mt-8">
    <!-- API Type Tabs -->
    <div class="flex gap-4 mb-4">
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
        :class="selectedTab === 'rest'
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'"
        @click="selectedTab = 'rest'"
      >
        REST APIs
      </button>
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
        :class="selectedTab === 'http'
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'"
        @click="selectedTab = 'http'"
      >
        HTTP APIs
      </button>
    </div>

    <CodeSnippet
      title="Usage Examples"
      :snippets="currentExamples"
      default-tab="aws-cli"
      :disable-highlight="true"
    />
  </div>
</template>
