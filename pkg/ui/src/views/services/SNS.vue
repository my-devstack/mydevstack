<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { useContentReload } from '@/composables/useContentReload'
import { MegaphoneIcon } from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import DataTable from '@/components/common/DataTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import {
  SNSCreateTopicModal,
  SNSSubscribeModal,
  SNSPublishModal,
  SNSDeleteModal,
} from '@/components/sns'
import * as sns from '@/api/services/sns'
import type { SNSTopic, SNSSubscription } from '@/api/types/aws'

const settingsStore = useSettingsStore()
const toast = useToast()
const { reloadTrigger } = useContentReload()

// State
const topics = ref<SNSTopic[]>([])
const subscriptions = ref<SNSSubscription[]>([])
const loading = ref(false)
const loadingSubscriptions = ref(false)
const selectedTopic = ref<SNSTopic | null>(null)

// Modal state
const showCreateTopicModal = ref(false)
const showSubscribeModal = ref(false)
const showPublishModal = ref(false)
const showSubscriptionsModal = ref(false)
const showDeleteModal = ref(false)
const showExamples = ref(false)
const expandedTopics = ref<Set<string>>(new Set())
const topicSubscriptions = ref<any[]>([])
const loadingTopicSubscriptions = ref(false)

function toggleTopic(arn: string) {
  if (expandedTopics.value.has(arn)) {
    expandedTopics.value.clear()
  } else {
    expandedTopics.value.clear()
    expandedTopics.value.add(arn)
    loadTopicSubscriptions(arn)
  }
  expandedTopics.value = new Set(expandedTopics.value)
}

async function loadTopicSubscriptions(arn: string) {
  loadingTopicSubscriptions.value = true
  try {
    topicSubscriptions.value = await sns.listSubscriptionsByTopic(arn)
  } catch (error) {
    console.error('Error loading subscriptions:', error)
  } finally {
    loadingTopicSubscriptions.value = false
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  toast.success('Copied', 'Copied to clipboard')
}

// Form state
const topicForm = ref({
  name: '',
  displayName: '',
})

const subscribeForm = ref({
  protocol: 'https',
  endpoint: '',
})

const publishForm = ref({
  subject: '',
  message: '',
})

const selectedTopicArn = ref('')

// Protocol options
const protocolOptions = [
  { value: 'http', label: 'HTTP' },
  { value: 'https', label: 'HTTPS' },
  { value: 'email', label: 'Email' },
  { value: 'email-json', label: 'Email (JSON)' },
  { value: 'sqs', label: 'SQS Queue' },
  { value: 'lambda', label: 'Lambda Function' },
  { value: 'sms', label: 'SMS' },
]

// Columns
const topicColumns = computed(() => [
  { key: 'TopicArn', label: 'ARN', sortable: false },
])

const subscriptionColumns = computed(() => [
  { key: 'Protocol', label: 'Protocol', sortable: true },
  { key: 'Endpoint', label: 'Endpoint', sortable: false },
  { key: 'SubscriptionArn', label: 'Status', sortable: false },
])

// Code examples
const selectedExample = ref(0)
const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List SNS topics
aws sns list-topics --endpoint-url http://127.0.0.1:4566

# Create topic
aws sns create-topic \\
  --name my-topic \\
  --display-name "My Topic" \\
  --endpoint-url http://127.0.0.1:4566

# Create FIFO topic
aws sns create-topic \\
  --name my-topic.fifo \\
  --attributes "FifoTopic=true,ContentBasedDeduplication=true" \\
  --endpoint-url http://127.0.0.1:4566

# Subscribe to topic (HTTPS)
aws sns subscribe \\
  --topic-arn arn:aws:sns:us-east-1:000000000000:my-topic \\
  --protocol https \\
  --notification-endpoint https://my-app.com/webhook \\
  --endpoint-url http://127.0.0.1:4566

# Subscribe to topic (Email)
aws sns subscribe \\
  --topic-arn arn:aws:sns:us-east-1:000000000000:my-topic \\
  --protocol email \\
  --notification-endpoint your@email.com \\
  --endpoint-url http://127.0.0.1:4566

# List subscriptions by topic
aws sns list-subscriptions-by-topic \\
  --topic-arn arn:aws:sns:us-east-1:000000000000:my-topic \\
  --endpoint-url http://127.0.0.1:4566

# Publish message
aws sns publish \\
  --topic-arn arn:aws:sns:us-east-1:000000000000:my-topic \\
  --message "Hello World" \\
  --subject "Notification" \\
  --endpoint-url http://127.0.0.1:4566

# Publish JSON message
aws sns publish \\
  --topic-arn arn:aws:sns:us-east-1:000000000000:my-topic \\
  --message '{"default": "Hello via SNS"}' \\
  --message-structure json \\
  --endpoint-url http://127.0.0.1:4566

# Delete topic
aws sns delete-topic \\
  --topic-arn arn:aws:sns:us-east-1:000000000000:my-topic \\
  --endpoint-url http://127.0.0.1:4566`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { SNSClient, ListTopicsCommand, CreateTopicCommand, SubscribeCommand, PublishCommand, DeleteTopicCommand, ListSubscriptionsByTopicCommand } from "@aws-sdk/client-sns";

const client = new SNSClient({
  region: '${settingsStore.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List topics
const topics = await client.send(new ListTopicsCommand({}));
console.log(topics.Topics);

// Create topic
const createResponse = await client.send(new CreateTopicCommand({
  Name: 'my-topic',
  DisplayName: 'My Topic',
}));
console.log(createResponse.TopicArn);

// Subscribe to topic
await client.send(new SubscribeCommand({
  TopicArn: 'arn:aws:sns:us-east-1:000000000000:my-topic',
  Protocol: 'https',
  Endpoint: 'https://my-app.com/webhook',
}));

// List subscriptions by topic
const subsResponse = await client.send(new ListSubscriptionsByTopicCommand({
  TopicArn: 'arn:aws:sns:us-east-1:000000000000:my-topic',
}));
console.log(subsResponse.Subscriptions);

// Publish message
await client.send(new PublishCommand({
  TopicArn: 'arn:aws:sns:us-east-1:000000000000:my-topic',
  Message: 'Hello World',
  Subject: 'Notification',
}));

// Publish JSON message
await client.send(new PublishCommand({
  TopicArn: 'arn:aws:sns:us-east-1:000000000000:my-topic',
  Message: JSON.stringify({ default: 'Hello via SNS!' }),
  MessageStructure: 'json',
}));

// Delete topic
await client.send(new DeleteTopicCommand({
  TopicArn: 'arn:aws:sns:us-east-1:000000000000:my-topic',
}));`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3
import json

client = boto3.client(
    'sns',
    region_name='${settingsStore.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List topics
response = client.list_topics()
for topic in response['Topics']:
    print(topic['TopicArn'])

# Create topic
response = client.create_topic(
    Name='my-topic',
    DisplayName='My Topic'
)
topic_arn = response['TopicArn']
print(topic_arn)

# Subscribe to topic
client.subscribe(
    TopicArn=topic_arn,
    Protocol='https',
    Endpoint='https://my-app.com/webhook',
)

# List subscriptions by topic
response = client.list_subscriptions_by_topic(TopicArn=topic_arn)
for sub in response['Subscriptions']:
    print(sub['Endpoint'])

# Publish message
client.publish(
    TopicArn=topic_arn,
    Message='Hello World',
    Subject='Notification',
)

# Publish JSON message
client.publish(
    TopicArn=topic_arn,
    Message=json.dumps({'default': 'Hello via SNS!'}),
    MessageStructure='json',
)

# Delete topic
client.delete_topic(TopicArn=topic_arn)`
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
    "github.com/aws/aws-sdk-go-v2/service/sns"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

client := sns.NewFromConfig(cfg, func(o *sns.Options) {
    o.BaseURL = aws.String("http://127.0.0.1:4566")
})

// List topics
topics, _ := client.ListTopics(context.Background(), &sns.ListTopicsInput{})
fmt.Println(topics.Topics)

// Create topic
createOutput, _ := client.CreateTopic(context.Background(), &sns.CreateTopicInput{
    Name:        aws.String("my-topic"),
    DisplayName: aws.String("My Topic"),
})
fmt.Println(createOutput.TopicArn)

// Subscribe to topic
_, _ = client.Subscribe(context.Background(), &sns.SubscribeInput{
    TopicArn: aws.String("arn:aws:sns:us-east-1:000000000000:my-topic"),
    Protocol:  aws.String("https"),
    Endpoint:  aws.String("https://my-app.com/webhook"),
})

// Publish message
_, _ = client.Publish(context.Background(), &sns.PublishInput{
    TopicArn: aws.String("arn:aws:sns:us-east-1:000000000000:my-topic"),
    Message:   aws.String("Hello World"),
    Subject:   aws.String("Notification"),
})

// Publish JSON message
message, _ := json.Marshal(map[string]string{"default": "Hello via SNS!"})
_, _ = client.Publish(context.Background(), &sns.PublishInput{
    TopicArn:       aws.String("arn:aws:sns:us-east-1:000000000000:my-topic"),
    Message:        aws.String(string(message)),
    MessageStructure: aws.String("json"),
})

// Delete topic
_, _ = client.DeleteTopic(context.Background(), &sns.DeleteTopicInput{
    TopicArn: aws.String("arn:aws:sns:us-east-1:000000000000:my-topic"),
})`
  },
])

async function loadTopics() {
  loading.value = true
  try {
    topics.value = await sns.listTopics()
  } catch (error) {
    console.error('Error loading topics:', error)
    toast.error('Failed to load SNS topics')
  } finally {
    loading.value = false
  }
}

async function createTopic(name: string, displayName: string) {
  if (!name.trim()) {
    toast.error('Topic name is required')
    return
  }

  try {
    await sns.createTopic(name, {
      DisplayName: displayName,
    })
    toast.success('Topic created successfully')
    showCreateTopicModal.value = false
    topicForm.value = { name: '', displayName: '' }
    loadTopics()
  } catch (error) {
    console.error('Error creating topic:', error)
    toast.error('Failed to create topic')
  }
}

async function loadSubscriptions(topicArn: string) {
  selectedTopicArn.value = topicArn
  loadingSubscriptions.value = true
  showSubscriptionsModal.value = true
  try {
    subscriptions.value = await sns.listSubscriptionsByTopic(topicArn)
  } catch (error) {
    console.error('Error loading subscriptions:', error)
    toast.error('Failed to load subscriptions')
  } finally {
    loadingSubscriptions.value = false
  }
}

async function subscribe(protocol: string, endpoint: string) {
  if (!selectedTopic.value || !endpoint.trim()) {
    toast.error('Endpoint is required')
    return
  }

  try {
    await sns.subscribe(
      selectedTopic.value.TopicArn,
      protocol,
      endpoint
    )
    toast.success('Subscription created successfully')
    showSubscribeModal.value = false
    subscribeForm.value = { protocol: 'https', endpoint: '' }
  } catch (error) {
    console.error('Error subscribing:', error)
    toast.error('Failed to create subscription')
  }
}

async function publishMessage(subject: string, message: string) {
  if (!selectedTopic.value || !message.trim()) {
    toast.error('Message is required')
    return
  }

  try {
    await sns.publish(
      selectedTopic.value.TopicArn,
      message,
      { Subject: subject || undefined }
    )
    toast.success('Message published successfully')
    showPublishModal.value = false
    publishForm.value = { subject: '', message: '' }
  } catch (error) {
    console.error('Error publishing message:', error)
    toast.error('Failed to publish message')
  }
}

async function deleteTopic() {
  if (!selectedTopic.value) return

  try {
    await sns.deleteTopic(selectedTopic.value.TopicArn)
    toast.success('Topic deleted successfully')
    showDeleteModal.value = false
    selectedTopic.value = null
    loadTopics()
  } catch (error) {
    console.error('Error deleting topic:', error)
    toast.error('Failed to delete topic')
  }
}

function openSubscribeModal(topic: SNSTopic) {
  selectedTopic.value = topic
  subscribeForm.value = { protocol: 'https', endpoint: '' }
  showSubscribeModal.value = true
}

function openPublishModal(topic: SNSTopic) {
  selectedTopic.value = topic
  publishForm.value = { subject: '', message: '' }
  showPublishModal.value = true
}

function openDeleteModal(topic: SNSTopic) {
  selectedTopic.value = topic
  showDeleteModal.value = true
}

function getSubscriptionStatus(arn: string): 'active' | 'pending' | 'inactive' {
  if (!arn || arn.includes('PendingConfirmation')) return 'pending'
  if (arn.includes(':confirmed')) return 'active'
  return 'inactive'
}

onMounted(() => {
  loadTopics()
})

watch(reloadTrigger, () => {
  loadTopics()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <MegaphoneIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            SNS Topics
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ topics.length }} topic{{ topics.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="primary"
            @click="showCreateTopicModal = true"
          >
            <template #icon>
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </template>
            Create Topic
          </Button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6">
      <!-- Loading State -->
      <div
        v-if="loading"
        class="flex items-center justify-center py-12"
      >
        <LoadingSpinner size="lg" />
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else-if="topics.length === 0"
        icon="megaphone"
        title="No SNS Topics"
        description="Create your first SNS topic to get started."
        action-label="Create Topic"
        @action="showCreateTopicModal = true"
      />

      <!-- Topics List -->
      <div
        v-if="topics.length > 0"
        class="space-y-4"
      >
        <div
          v-for="topic in topics"
          :key="topic.TopicArn"
          class="border rounded-lg overflow-hidden"
          :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
        >
          <!-- Accordion Header -->
          <div 
            class="grid grid-cols-12 gap-4 px-4 py-4 items-center cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg"
            :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-light-surface'"
            @click="toggleTopic(topic.TopicArn)"
          >
            <div class="col-span-10 flex items-center gap-2">
              <svg
                class="w-5 h-5 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H5a4 4 0 110-6z"
                />
              </svg>
              <code class="text-xs text-light-text dark:text-dark-text truncate">{{ topic.TopicArn }}</code>
            </div>
            <div class="col-span-2 flex items-center justify-end gap-2">
              <button
                class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                title="Delete"
                @click.stop="selectedTopic = topic; showDeleteModal = true"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
              <svg
                class="w-5 h-5 text-light-muted dark:text-dark-muted transition-transform"
                :class="expandedTopics.has(topic.TopicArn) ? 'rotate-90' : ''"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
          
          <!-- Accordion Content -->
          <div
            v-if="expandedTopics.has(topic.TopicArn)"
            class="px-4 pb-4 border-t"
            :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
          >
            <div class="mt-4 space-y-4">
              <!-- Topic ARN -->
              <div>
                <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Topic ARN</label>
                <div class="flex items-center gap-2">
                  <code class="text-xs text-light-muted dark:text-dark-muted bg-light-border dark:bg-dark-border px-2 py-1 rounded flex-1 break-all">{{ topic.TopicArn }}</code>
                  <button
                    class="p-2 rounded hover:bg-light-border dark:hover:bg-dark-border"
                    title="Copy ARN"
                    @click="copyToClipboard(topic.TopicArn)"
                  >
                    <svg
                      class="w-4 h-4 text-light-muted dark:text-dark-muted"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Subscribe & Publish Buttons -->
              <div class="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  @click="selectedTopic = topic; showSubscribeModal = true"
                >
                  Subscribe
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  @click="selectedTopic = topic; showPublishModal = true"
                >
                  Publish
                </Button>
              </div>

              <!-- Subscriptions -->
              <div>
                <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Subscriptions</label>
                <div
                  v-if="loadingTopicSubscriptions"
                  class="flex justify-center py-4"
                >
                  <LoadingSpinner size="sm" />
                </div>
                <div
                  v-else-if="topicSubscriptions.length === 0"
                  class="text-sm text-light-muted dark:text-dark-muted py-2"
                >
                  No subscriptions
                </div>
                <div
                  v-else
                  class="divide-y divide-light-border dark:divide-dark-border"
                >
                  <div
                    v-for="(sub, idx) in topicSubscriptions"
                    :key="idx"
                    class="py-2 flex items-center justify-between"
                  >
                    <div>
                      <span class="text-xs text-light-text dark:text-dark-text">{{ sub.Protocol }}</span>
                      <span class="text-xs text-light-muted dark:text-dark-muted ml-2">{{ sub.Endpoint }}</span>
                    </div>
                    <span
                      class="text-xs px-2 py-0.5 rounded"
                      :class="sub.SubscriptionArn?.includes('Pending') ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'"
                    >
                      {{ sub.SubscriptionArn?.includes('Pending') ? 'Pending' : 'Confirmed' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Topic Modal -->
    <SNSCreateTopicModal
      v-model:open="showCreateTopicModal"
      v-model:form="topicForm"
      @create="createTopic"
    />

    <!-- Subscribe Modal -->
    <SNSSubscribeModal
      v-model:open="showSubscribeModal"
      v-model:form="subscribeForm"
      :topic="selectedTopic"
      :protocol-options="protocolOptions"
      @subscribe="subscribe"
    />

    <!-- Publish Message Modal -->
    <SNSPublishModal
      v-model:open="showPublishModal"
      v-model:form="publishForm"
      :topic="selectedTopic"
      @publish="publishMessage"
    />

    <!-- Subscriptions Modal -->
    <Modal
      v-model:open="showSubscriptionsModal"
      title="Topic Subscriptions"
      size="lg"
    >
      <div
        v-if="loadingSubscriptions"
        class="flex justify-center py-8"
      >
        <LoadingSpinner />
      </div>
      <EmptyState
        v-else-if="subscriptions.length === 0"
        icon="user"
        title="No Subscriptions"
        description="No subscriptions found for this topic."
      />
      <DataTable
        v-else
        :columns="subscriptionColumns"
        :data="subscriptions"
        empty-title="No Subscriptions"
        empty-text="No subscriptions found."
      >
        <template #cell-Protocol="{ value }">
          <StatusBadge
            status="active"
            :label="value"
          />
        </template>
        <template #cell-Endpoint="{ value }">
          <span class="text-light-text dark:text-dark-text truncate">{{ value }}</span>
        </template>
        <template #cell-SubscriptionArn="{ value }">
          <StatusBadge 
            :status="getSubscriptionStatus(value)" 
            :label="value?.includes('PendingConfirmation') ? 'Pending' : value?.includes(':confirmed') ? 'Confirmed' : 'Unknown'" 
          />
        </template>
      </DataTable>
      <template #footer>
        <Button
          variant="secondary"
          @click="showSubscriptionsModal = false"
        >
          Close
        </Button>
      </template>
    </Modal>

    <!-- Delete Topic Modal -->
    <SNSDeleteModal
      v-model:open="showDeleteModal"
      :topic="selectedTopic"
      @delete="deleteTopic"
    />

    <!-- Usage Examples Section -->
    <div
      v-if="!loading"
      class="mt-8"
    >
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
  </div>
</template>
