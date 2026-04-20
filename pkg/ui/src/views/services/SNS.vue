<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { useContentReload } from '@/composables/useContentReload'
import { MegaphoneIcon } from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import DataTable from '@/components/common/DataTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
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
  { key: 'TopicName', label: 'Topic Name', sortable: true },
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

async function createTopic() {
  if (!topicForm.value.name.trim()) {
    toast.error('Topic name is required')
    return
  }

  try {
    await sns.createTopic(topicForm.value.name, {
      DisplayName: topicForm.value.displayName,
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

async function subscribe() {
  if (!selectedTopic.value || !subscribeForm.value.endpoint.trim()) {
    toast.error('Endpoint is required')
    return
  }

  try {
    await sns.subscribe(
      selectedTopic.value.TopicArn,
      subscribeForm.value.protocol,
      subscribeForm.value.endpoint
    )
    toast.success('Subscription created successfully')
    showSubscribeModal.value = false
    subscribeForm.value = { protocol: 'https', endpoint: '' }
  } catch (error) {
    console.error('Error subscribing:', error)
    toast.error('Failed to create subscription')
  }
}

async function publishMessage() {
  if (!selectedTopic.value || !publishForm.value.message.trim()) {
    toast.error('Message is required')
    return
  }

  try {
    await sns.publish({
      TopicArn: selectedTopic.value.TopicArn,
      Message: publishForm.value.message,
      Subject: publishForm.value.subject || undefined,
    })
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
        icon="topic"
        title="No SNS Topics"
        description="Create your first SNS topic to get started."
        action-label="Create Topic"
        @action="showCreateTopicModal = true"
      />

      <!-- Topics Table -->
      <DataTable
        v-else
        :columns="topicColumns"
        :data="topics"
        :loading="loading"
        empty-title="No SNS Topics"
        empty-text="No topics found."
      >
        <template #cell-TopicName="{ value, row }">
          <div class="flex items-center gap-2">
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
            <span class="font-medium text-light-text dark:text-dark-text">{{ value }}</span>
          </div>
        </template>

        <template #cell-TopicArn="{ value }">
          <div class="flex items-center gap-2">
            <code class="text-xs text-light-muted dark:text-dark-muted bg-light-border dark:bg-dark-border px-2 py-1 rounded truncate max-w-xs">{{ value }}</code>
          </div>
        </template>

        <template #row-actions="{ row }">
          <div class="flex items-center gap-1">
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="loadSubscriptions(row.TopicArn)"
            >
              Subscriptions
            </button>
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="openSubscribeModal(row)"
            >
              Subscribe
            </button>
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="openPublishModal(row)"
            >
              Publish
            </button>
            <button
              class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
              title="Delete"
              @click="openDeleteModal(row)"
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
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Create Topic Modal -->
    <Modal
      v-model:open="showCreateTopicModal"
      title="Create SNS Topic"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="topicForm.name"
          label="Topic Name"
          placeholder="my-topic"
          required
        />
        <FormInput
          v-model="topicForm.displayName"
          label="Display Name"
          placeholder="My Topic (optional)"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateTopicModal = false"
          >
            Cancel
          </Button>
          <Button @click="createTopic">
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Subscribe Modal -->
    <Modal
      v-model:open="showSubscribeModal"
      :title="`Subscribe to: ${selectedTopic?.TopicName || ''}`"
      size="md"
    >
      <div class="space-y-4">
        <FormSelect
          v-model="subscribeForm.protocol"
          label="Protocol"
          :options="protocolOptions"
        />
        <FormInput
          v-model="subscribeForm.endpoint"
          label="Endpoint"
          :placeholder="subscribeForm.protocol === 'http' || subscribeForm.protocol === 'https' ? 'https://your-endpoint.com/webhook' : subscribeForm.protocol === 'email' ? 'your@email.com' : 'ARN or endpoint'"
          required
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showSubscribeModal = false"
          >
            Cancel
          </Button>
          <Button @click="subscribe">
            Subscribe
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Publish Message Modal -->
    <Modal
      v-model:open="showPublishModal"
      :title="`Publish to: ${selectedTopic?.TopicName || ''}`"
      size="lg"
    >
      <div class="space-y-4">
        <FormInput
          v-model="publishForm.subject"
          label="Subject (optional)"
          placeholder="Notification Subject"
        />
        <div>
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Message *
          </label>
          <textarea
            v-model="publishForm.message"
            rows="6"
            class="w-full px-3 py-2 rounded-lg border bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-text dark:text-dark-text font-mono text-sm"
            placeholder="Enter your message..."
            required
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showPublishModal = false"
          >
            Cancel
          </Button>
          <Button @click="publishMessage">
            Publish
          </Button>
        </div>
      </template>
    </Modal>

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
    <Modal
      v-model:open="showDeleteModal"
      title="Delete SNS Topic"
      size="md"
    >
      <div class="space-y-4">
        <div class="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
          <svg
            class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p class="text-sm text-red-800 dark:text-red-200">
              Are you sure you want to delete the topic "{{ selectedTopic?.TopicName }}"?
            </p>
            <p class="text-xs text-red-700 dark:text-red-300 mt-1">
              This will delete the topic and all its subscriptions. This action cannot be undone.
            </p>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showDeleteModal = false"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            @click="deleteTopic"
          >
            Delete
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Usage Examples Section -->
    <div
      v-if="!loading && topics.length > 0"
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
