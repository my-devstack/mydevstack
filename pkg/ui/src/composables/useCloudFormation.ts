import { ref, shallowRef, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import { useSettingsStore } from '@/stores/settings'
import * as cfApi from '@/api/services/cloudformation'
import type { CloudFormationStack } from '@/api/types/aws'

export function useCloudFormation() {
  const toast = useToast()
  const settingsStore = useSettingsStore()

  const stacks = ref<CloudFormationStack[]>([])
  const loading = shallowRef(false)
  const error = shallowRef<string | null>(null)
  const selectedStackName = ref<string | null>(null)

  async function fetchStacks() {
    loading.value = true
    error.value = null
    try {
      const result = await cfApi.listStacks()
      stacks.value = result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load stacks'
      toast.error('Failed to load stacks: ' + error.value)
    } finally {
      loading.value = false
    }
  }

  async function createStack(params: cfApi.CreateStackRequest) {
    loading.value = true
    error.value = null
    try {
      await cfApi.createStack(params)
      toast.success(`Stack "${params.StackName}" created successfully`)
      await fetchStacks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create stack'
      toast.error('Failed to create stack: ' + error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteStack(stackName: string) {
    loading.value = true
    error.value = null
    try {
      await cfApi.deleteStack({ StackName: stackName })
      toast.success(`Stack "${stackName}" deleted successfully`)
      if (selectedStackName.value === stackName) {
        selectedStackName.value = null
      }
      await fetchStacks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete stack'
      toast.error('Failed to delete stack: ' + error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  function selectStack(stack: CloudFormationStack | null) {
    if (stack === null) {
      selectedStackName.value = null
    } else {
      // Toggle: if same stack selected, deselect; else select
      selectedStackName.value = selectedStackName.value === stack.StackName ? null : stack.StackName
    }
  }

  function clearError() {
    error.value = null
  }

  async function getStackDetails(stackName: string) {
    return cfApi.getStackDetails({ StackName: stackName })
  }

  async function getStackTemplate(stackName: string) {
    return cfApi.getStackTemplate(stackName)
  }

  // Code examples
  const codeExamples = computed(() => [
    {
      language: 'aws-cli',
      label: 'AWS CLI',
      code: `# List CloudFormation stacks
aws cloudformation list-stacks --endpoint-url http://127.0.0.1:4566

# Create CloudFormation stack
aws cloudformation create-stack \\
  --stack-name my-stack \\
  --template-body '{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Resources": {
    "MyBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": "my-example-bucket"
      }
    }
  }
}' \\
  --endpoint-url http://127.0.0.1:4566

# Describe stack
aws cloudformation describe-stacks \\
  --stack-name my-stack \\
  --endpoint-url http://127.0.0.1:4566

# Describe stack events
aws cloudformation describe-stack-events \\
  --stack-name my-stack \\
  --endpoint-url http://127.0.0.1:4566

# List stack resources
aws cloudformation list-stack-resources \\
  --stack-name my-stack \\
  --endpoint-url http://127.0.0.1:4566

# Delete CloudFormation stack
aws cloudformation delete-stack \\
  --stack-name my-stack \\
  --endpoint-url http://127.0.0.1:4566`
    },
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `// Using AWS SDK v3
import { CloudFormationClient, ListStacksCommand, CreateStackCommand, DescribeStacksCommand, DescribeStackEventsCommand, ListStackResourcesCommand, DeleteStackCommand } from "@aws-sdk/client-cloudformation";

const client = new CloudFormationClient({
  region: '${settingsStore.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List stacks
const stacks = await client.send(new ListStacksCommand({}));
console.log(stacks.StackSummaries);

// Create stack
await client.send(new CreateStackCommand({
  StackName: 'my-stack',
  TemplateBody: JSON.stringify({
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: {
      MyBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: 'my-example-bucket',
        },
      },
    },
  }),
}));

// Describe stack
const desc = await client.send(new DescribeStacksCommand({
  StackName: 'my-stack',
}));
console.log(desc.Stacks[0]);

// Describe stack events
const events = await client.send(new DescribeStackEventsCommand({
  StackName: 'my-stack',
}));
console.log(events.StackEvents);

// List stack resources
const resources = await client.send(new ListStackResourcesCommand({
  StackName: 'my-stack',
}));
console.log(resources.StackResourceSummaries);

// Delete stack
await client.send(new DeleteStackCommand({
  StackName: 'my-stack',
}));`
    },
    {
      language: 'python',
      label: 'Python',
      code: `# Using boto3
import boto3
import json

client = boto3.client(
    'cloudformation',
    region_name='${settingsStore.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List stacks
response = client.list_stacks()
for stack in response['StackSummaries']:
    print(stack['StackName'])

# Create stack
client.create_stack(
    StackName='my-stack',
    TemplateBody=json.dumps({
        'AWSTemplateFormatVersion': '2010-09-09',
        'Resources': {
            'MyBucket': {
                'Type': 'AWS::S3::Bucket',
                'Properties': {
                    'BucketName': 'my-example-bucket'
                }
            }
        }
    })
)

# Describe stack
response = client.describe_stacks(StackName='my-stack')
print(response['Stacks'][0])

# Describe stack events
response = client.describe_stack_events(StackName='my-stack')
for event in response['StackEvents']:
    print(event['LogicalResourceId'], event['ResourceStatus'])

# List stack resources
response = client.list_stack_resources(StackName='my-stack')
for resource in response['StackResourceSummaries']:
    print(resource['LogicalResourceId'], resource['ResourceType'])

# Delete stack
client.delete_stack(StackName='my-stack')`
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
    "github.com/aws/aws-sdk-go-v2/service/cloudformation"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

client := cloudformation.NewFromConfig(cfg, func(o *cloudformation.Options) {
    o.BaseEndpoint = "http://127.0.0.1:4566"
})

ctx := context.Background()

// List stacks
stacks, _ := client.ListStacks(ctx, &cloudformation.ListStacksInput{})
for _, s := range stacks.StackSummaries {
    fmt.Println(*s.StackName)
}

// Create stack
template, _ := json.Marshal(map[string]interface{}{
    "AWSTemplateFormatVersion": "2010-09-09",
    "Resources": map[string]interface{}{
        "MyBucket": map[string]interface{}{
            "Type": "AWS::S3::Bucket",
            "Properties": map[string]string{
                "BucketName": "my-example-bucket",
            },
        },
    },
})
client.CreateStack(ctx, &cloudformation.CreateStackInput{
    StackName:    aws.String("my-stack"),
    TemplateBody: aws.String(string(template)),
})

// Describe stack
desc, _ := client.DescribeStacks(ctx, &cloudformation.DescribeStacksInput{
    StackName: aws.String("my-stack"),
})
fmt.Println(desc.Stacks[0])

// Describe stack events
events, _ := client.DescribeStackEvents(ctx, &cloudformation.DescribeStackEventsInput{
    StackName: aws.String("my-stack"),
})
for _, e := range events.StackEvents {
    fmt.Println(*e.LogicalResourceId, e.ResourceStatus)
}

// List stack resources
resources, _ := client.ListStackResources(ctx, &cloudformation.ListStackResourcesInput{
    StackName: aws.String("my-stack"),
})
for _, r := range resources.StackResourceSummaries {
    fmt.Println(*r.LogicalResourceId, *r.ResourceType)
}

// Delete stack
client.DeleteStack(ctx, &cloudformation.DeleteStackInput{
    StackName: aws.String("my-stack"),
})`
    },
  ])

  return {
    stacks,
    loading,
    error,
    selectedStackName,
    codeExamples,
    fetchStacks,
    createStack,
    deleteStack,
    selectStack,
    clearError,
    getStackDetails,
    getStackTemplate,
  }
}
