<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useContentReload } from '@/composables/useContentReload'
import { CubeIcon } from '@heroicons/vue/24/outline'
import { useCloudFormation } from '@/composables/useCloudFormation'
import {
  StackList,
  CreateStackForm,
} from '@/components/cloudformation'
import CodeSnippet from '@/components/common/CodeSnippet.vue'
import type { CloudFormationStack } from '@/api/types/aws'

interface CreateStackFormRef {
  resetForm: () => void
}

const { reloadTrigger } = useContentReload()
const settingsStore = useSettingsStore()

const {
  stacks,
  loading,
  error,
  fetchStacks,
  createStack,
  deleteStack,
  selectStack,
  clearError,
  selectedStackName,
} = useCloudFormation()

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

const createStackFormRef = ref<CreateStackFormRef | null>(null)

// Modal state
const showCreateModal = ref(false)

// Error handling
const localError = ref<string | null>(null)

// Delete confirmation
const stackToDelete = ref<string | null>(null)
const showDeleteConfirm = ref(false)

// Load stacks on mount
onMounted(() => {
  fetchStacks()
})

// Reload on reload trigger
watch(reloadTrigger, () => {
  fetchStacks()
})

// Create stack
async function handleCreateStack(params: { stackName: string; templateBody: string }) {
  localError.value = null
  try {
    await createStack({
      StackName: params.stackName,
      TemplateBody: params.templateBody,
    })
    createStackFormRef.value?.resetForm()
    showCreateModal.value = false
    // fetchStacks() already called inside createStack() — no reload needed
  } catch (e: any) {
    localError.value = 'Failed to create stack: ' + e.message
  }
}

// Delete stack
function confirmDelete(stackName: string) {
  stackToDelete.value = stackName
  showDeleteConfirm.value = true
}

async function handleDeleteStack() {
  if (!stackToDelete.value) return

  localError.value = null
  try {
    await deleteStack(stackToDelete.value)
    showDeleteConfirm.value = false
    stackToDelete.value = null
  } catch (e: any) {
    localError.value = 'Failed to delete stack: ' + e.message
  }
}

// Select stack (toggle)
function handleSelectStack(stack: CloudFormationStack) {
  selectStack(stack)
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <CubeIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            CloudFormation Stacks
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ stacks.length }} stack(s)
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            @click="showCreateModal = true"
          >
            + Create Stack
          </button>
          <button
            class="p-2 text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border rounded"
            title="Refresh"
            @click="fetchStacks"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div
      v-if="localError || error"
      class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
    >
      {{ localError || error }}
      <button
        class="float-right font-bold"
        @click="localError = null; clearError()"
      >
        ×
      </button>
    </div>

    <!-- Stack List (Accordion) -->
    <div class="flex-1 overflow-auto p-6">
      <StackList
        :stacks="stacks"
        :loading="loading"
        :selected-stack-name="selectedStackName"
        @select-stack="handleSelectStack"
        @delete-stack="confirmDelete"
      />
    </div>

    <!-- Create Stack Modal -->
    <CreateStackForm
      ref="createStackFormRef"
      :open="showCreateModal"
      :loading="loading"
      @update:open="showCreateModal = $event"
      @create="handleCreateStack"
    />

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <div
        class="fixed inset-0 bg-black/50"
        @click="showDeleteConfirm = false"
      />
      <div class="flex min-h-screen items-center justify-center p-4">
        <div
          class="relative w-full max-w-md rounded-lg shadow-xl"
          :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-white'"
        >
          <div class="p-6">
            <h3 class="text-lg font-semibold text-red-600">
              Delete Stack
            </h3>
            <p
              class="mt-2"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-gray-700'"
            >
              Are you sure you want to delete stack "{{ stackToDelete }}"? This action cannot be undone.
            </p>
          </div>
          <div
            class="flex items-center justify-end gap-3 p-6 border-t"
            :class="settingsStore.darkMode ? 'border-dark-border' : 'border-gray-200'"
          >
            <button
              class="px-4 py-2 text-sm font-medium rounded-lg border"
              :class="settingsStore.darkMode ? 'border-dark-border text-dark-text hover:bg-dark-border' : 'border-gray-300 text-gray-700 hover:bg-gray-50'"
              @click="showDeleteConfirm = false"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              :disabled="loading"
              @click="handleDeleteStack"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Usage Examples Section -->
    <div class="mt-8">
      <CodeSnippet
        title="Usage Examples"
        :snippets="codeExamples"
        default-tab="aws-cli"
        :disable-highlight="true"
      />
    </div>
  </div>
</template>
