<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { useContentReload } from '@/composables/useContentReload'
import { useSQS } from '@/composables/useSQS'
import { QueueListIcon, ChevronDownIcon, ChevronRightIcon, ClipboardDocumentIcon } from '@heroicons/vue/24/outline'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { SQSCreateQueueModal, SQSMessagesModal } from '@/components/sqs'

const settingsStore = useSettingsStore()
const toast = useToast()
const { reloadTrigger } = useContentReload()

// Pagination
const queuePage = ref(1)
const queuesPerPage = 15
const totalQueuePages = computed(() => Math.ceil(queues.value.length / queuesPerPage))
const paginatedQueues = computed(() => {
  const start = (queuePage.value - 1) * queuesPerPage
  return queues.value.slice(start, start + queuesPerPage)
})

const {
  queues,
  loading,
  expandedQueues,
  queueAttributesMap,
  queueArnMap,
  messages,
  loadingMessages,
  loadQueues,
  createQueue: createQueueFromComposable,
  deleteQueue: deleteQueueFromComposable,
  loadQueueAttributes,
  toggleQueue,
  formatBody,
} = useSQS()

// Reset to page 1 when queues data changes (create/delete/reload)
watch(queues, () => {
  queuePage.value = 1
})

const showCreateModal = ref(false)
const newQueue = ref({ name: '', isFifo: false })

const showDeleteModal = ref(false)
const queueToDelete = ref('')

const showMessagesModal = ref(false)
const selectedQueueUrl = ref('')
const selectedQueueName = ref('')

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success('Copied', 'Copied to clipboard')
  }).catch(() => {
    toast.error('Failed to copy', 'Could not copy to clipboard')
  })
}

function openMessagesModal(queueUrl: string, queueName: string) {
  selectedQueueUrl.value = queueUrl
  selectedQueueName.value = queueName
  showMessagesModal.value = true
  loadMessages()
}

async function loadMessages() {
  if (!selectedQueueUrl.value) return
  loadingMessages.value = true
  try {
    const result = await receiveMessage(selectedQueueUrl.value, {
      MaxNumberOfMessages: 10,
      VisibilityTimeout: 30,
      WaitTimeSeconds: 0,
    })
    messages.value = result || []
  } catch (e: any) {
    console.error('Failed to receive messages:', e)
    toast.error('Failed to load messages', e.message || 'Unknown error')
    messages.value = []
  } finally {
    loadingMessages.value = false
  }
}

async function handleDeleteMessage(receiptHandle: string) {
  if (!selectedQueueUrl.value || !receiptHandle) return
  try {
    await deleteMessage(selectedQueueUrl.value, receiptHandle)
    toast.success('Message deleted')
    await loadMessages()
  } catch (e: any) {
    console.error('Failed to delete message:', e)
    toast.error('Failed to delete message', e.message || 'Unknown error')
  }
}

import * as sqsApi from '@/api/services/sqs'
const { receiveMessage, deleteMessage } = sqsApi

const selectedExample = ref(0)

// Code examples
const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List queues
aws sqs list-queues --endpoint-url http://127.0.0.1:4566

# Create standard queue
aws sqs create-queue --queue-name my-queue --endpoint-url http://127.0.0.1:4566

# Create FIFO queue
aws sqs create-queue --queue-name my-queue.fifo --attributes FIFOQueue=true --endpoint-url http://127.0.0.1:4566

# Get queue URL
aws sqs get-queue-url --queue-name my-queue --endpoint-url http://127.0.0.1:4566

# Send message
aws sqs send-message --queue-url http://127.0.0.1:4566/000000000000/my-queue --message-body "Hello World"

# Receive messages
aws sqs receive-message --queue-url http://127.0.0.1:4566/000000000000/my-queue --endpoint-url http://127.0.0.1:4566

# Delete message
aws sqs delete-message --queue-url http://127.0.0.1:4566/000000000000/my-queue --receipt-handle "<receipt-handle>" --endpoint-url http://127.0.0.1:4566

# Delete queue
aws sqs delete-queue --queue-url http://127.0.0.1:4566/000000000000/my-queue --endpoint-url http://127.0.0.1:4566`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { SQSClient, ListQueuesCommand, CreateQueueCommand, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";

const client = new SQSClient({
  region: '${settingsStore.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List queues
const listResponse = await client.send(new ListQueuesCommand({}));
console.log(listResponse.QueueUrls);

// Create queue
const createResponse = await client.send(new CreateQueueCommand({
  QueueName: 'my-queue',
}));
console.log(createResponse.QueueUrl);

// Send message
await client.send(new SendMessageCommand({
  QueueUrl: 'http://127.0.0.1:4566/000000000000/my-queue',
  MessageBody: 'Hello World',
}));

// Receive messages
const receiveResponse = await client.send(new ReceiveMessageCommand({
  QueueUrl: 'http://127.0.0.1:4566/000000000000/my-queue',
  MaxNumberOfMessages: 10,
}));
console.log(receiveResponse.Messages);

// Delete message
if (receiveResponse.Messages?.[0]) {
  await client.send(new DeleteMessageCommand({
    QueueUrl: 'http://127.0.0.1:4566/000000000000/my-queue',
    ReceiptHandle: receiveResponse.Messages[0].ReceiptHandle,
  }));
}`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3
import json

client = boto3.client(
    'sqs',
    region_name='${settingsStore.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List queues
response = client.list_queues()
print(response.get('QueueUrls', []))

# Create queue
response = client.create_queue(QueueName='my-queue')
queue_url = response['QueueUrl']

# Send message
client.send_message(
    QueueUrl=queue_url,
    MessageBody=json.dumps({'key': 'value', 'message': 'Hello World'})
)

# Receive messages
response = client.receive_message(QueueUrl=queue_url, MaxNumberOfMessages=10)
for message in response.get('Messages', []):
    print(message['Body'])
    # Delete message
    client.delete_message(QueueUrl=queue_url, ReceiptHandle=message['ReceiptHandle'])`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/sqs"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

client := sqs.NewFromConfig(cfg, func(o *sqs.Options) {
    o.BaseURL = "http://127.0.0.1:4566"
})

// List queues
listOutput, _ := client.ListQueues(context.Background(), &sqs.ListQueuesInput{})
fmt.Println(listOutput.QueueUrls)

// Create queue
createOutput, _ := client.CreateQueue(context.Background(), &sqs.CreateQueueInput{
    QueueName: aws.String("my-queue"),
})
fmt.Println(createOutput.QueueUrl)

// Send message
_, _ = client.SendMessage(context.Background(), &sqs.SendMessageInput{
    QueueUrl:    aws.String("http://127.0.0.1:4566/000000000000/my-queue"),
    MessageBody: aws.String("Hello World"),
})

// Receive messages
receiveOutput, _ := client.ReceiveMessage(context.Background(), &sqs.ReceiveMessageInput{
    QueueUrl: aws.String("http://127.0.0.1:4566/000000000000/my-queue"),
})
fmt.Println(receiveOutput.Messages)

// Delete message
if len(receiveOutput.Messages) > 0 {
    _, _ = client.DeleteMessage(context.Background(), &sqs.DeleteMessageInput{
        QueueUrl:    aws.String("http://127.0.0.1:4566/000000000000/my-queue"),
        ReceiptHandle: receiveOutput.Messages[0].ReceiptHandle,
    })
}`
  },
])

function toggleQueueExpansion(url: string) {
  toggleQueue(url)
}

function openDeleteModal(url: string) {
  queueToDelete.value = url
  showDeleteModal.value = true
}

async function confirmDeleteQueue() {
  if (!queueToDelete.value) return
  try {
    await deleteQueueFromComposable(queueToDelete.value)
    showDeleteModal.value = false
    queueToDelete.value = ''
  } catch (e: any) {
    toast.error('Failed to delete queue', e.message || 'Unknown error')
  }
}

async function createQueue() {
  if (!newQueue.value.name?.trim()) {
    toast.error('Queue name is required')
    return
  }
  try {
    await createQueueFromComposable(newQueue.value.name.trim(), newQueue.value.isFifo)
    showCreateModal.value = false
    newQueue.value = { name: '', isFifo: false }
    queuePage.value = 1
  } catch (e: any) {
    toast.error('Failed to create queue', e.message || 'Unknown error')
  }
}

interface QueueAttribute {
  name: string
  value: string
  label: string
}

// Human-readable labels for SQS attributes
const attributeLabels: Record<string, string> = {
  QueueArn: 'Queue ARN',
  ApproximateNumberOfMessages: 'Approximate Number of Messages',
  ApproximateNumberOfMessagesNotVisible: 'Approximate Number of Messages (Not Visible)',
  ApproximateNumberOfMessagesDelayed: 'Approximate Number of Messages (Delayed)',
  CreatedTimestamp: 'Created Timestamp',
  LastModifiedTimestamp: 'Last Modified Timestamp',
  VisibilityTimeout: 'Visibility Timeout (seconds)',
  ReceiveMessageWaitTimeSeconds: 'Receive Message Wait Time (seconds)',
  DelaySeconds: 'Delay Seconds',
  MaximumMessageSize: 'Maximum Message Size (bytes)',
  MessageRetentionPeriod: 'Message Retention Period (seconds)',
  MinimumDelaySeconds: 'Minimum Delay Seconds',
  MaximumDelaySeconds: 'Maximum Delay Seconds',
  DeduplicationScope: 'Deduplication Scope',
  FifoQueue: 'FIFO Queue',
  ContentBasedDeduplication: 'Content-Based Deduplication',
  KmsMasterKeyId: 'KMS Master Key ID',
  KmsDataKeyReusePeriodSeconds: 'KMS Data Key Reuse Period (seconds)',
}

onMounted(() => {
  loadQueues()
})

watch(reloadTrigger, () => {
  loadQueues()
})
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4 -mx-6 -mt-6 mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <QueueListIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            SQS Queues
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ queues.length }} queue{{ queues.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            @click="showCreateModal = true"
          >
            + Create Queue
          </button>
          <button
            class="p-2 text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border rounded"
            title="Refresh"
            @click="loadQueues"
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

    <div
      v-if="loading"
      class="text-center py-12"
    >
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      <p
        class="mt-2"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
      >
        Loading...
      </p>
    </div>

    <div v-if="!loading">
      <div
        v-if="queues.length === 0"
        class="text-center py-12"
      >
        <p
          class="text-lg"
          :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        >
          No queues found. Create one to get started!
        </p>
      </div>
      
      <div
        v-else
        class="space-y-4"
      >
        <div
          v-for="queue in paginatedQueues"
          :key="queue.url"
          class="border rounded-lg overflow-hidden"
          :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
        >
          <!-- Accordion Header -->
          <div 
            class="grid grid-cols-12 gap-4 px-4 py-4 items-center cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg"
            :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-light-surface'"
            @click="toggleQueueExpansion(queue.url)"
          >
            <div class="col-span-10 flex items-center gap-2">
              <QueueListIcon class="h-5 w-5 text-primary-500" />
              <span class="font-medium text-light-text dark:text-dark-text">{{ queue.name }}</span>
            </div>
            <div class="col-span-2 flex items-center justify-end gap-2">
              <button
                class="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                title="View Messages"
                @click.stop="openMessagesModal(queue.url, queue.name)"
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
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8-1.173 0-2.656-.304-3.667-.867C14.758 18.542 13 17 13 17s-1.758-1.542-3.333-2.867C9.626 13.304 8.173 13 7 13c-4.97 0-9 3.582-9 8z"
                  />
                </svg>
              </button>
              <button
                class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                title="Delete"
                @click.stop="openDeleteModal(queue.url)"
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
              <ChevronRightIcon
                class="h-5 w-5 transition-transform"
                :class="expandedQueues.has(queue.url) ? 'rotate-90' : ''"
              />
            </div>
          </div>
          
          <!-- Accordion Content -->
          <div
            v-if="expandedQueues.has(queue.url)"
            class="px-4 pb-4 border-t"
            :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
          >
            <div class="mt-4 space-y-4">
              <!-- Queue URL -->
              <div>
                <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Queue URL</label>
                <div class="flex items-center gap-2">
                  <code class="text-xs text-light-muted dark:text-dark-muted bg-light-border dark:bg-dark-border px-2 py-1 rounded flex-1 break-all">{{ queue.url }}</code>
                  <button
                    class="p-2 rounded hover:bg-light-border dark:hover:bg-dark-border"
                    title="Copy Queue URL"
                    @click="copyToClipboard(queue.url)"
                  >
                    <ClipboardDocumentIcon class="w-4 h-4 text-light-muted dark:text-dark-muted" />
                  </button>
                </div>
              </div>

              <!-- Queue ARN -->
              <div v-if="queueArnMap[queue.url]">
                <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Queue ARN</label>
                <div class="flex items-center gap-2">
                  <code class="text-xs text-light-muted dark:text-dark-muted bg-light-border dark:bg-dark-border px-2 py-1 rounded flex-1 break-all">{{ queueArnMap[queue.url] }}</code>
                  <button
                    class="p-2 rounded hover:bg-light-border dark:hover:bg-dark-border"
                    title="Copy ARN"
                    @click="copyToClipboard(queueArnMap[queue.url])"
                  >
                    <ClipboardDocumentIcon class="w-4 h-4 text-light-muted dark:text-dark-muted" />
                  </button>
                </div>
              </div>

              <!-- Attributes Table -->
              <div v-if="queueAttributesMap[queue.url]?.length > 0">
                <h3
                  class="text-sm font-medium mb-3"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-gray-900'"
                >
                  Queue Attributes
                </h3>
                <div
                  class="rounded-lg border overflow-hidden"
                  :class="settingsStore.darkMode ? 'border-dark-border' : 'border-gray-200'"
                >
                  <table class="w-full text-sm">
                    <thead :class="settingsStore.darkMode ? 'bg-dark-bg' : 'bg-gray-50'">
                      <tr>
                        <th
                          class="px-4 py-3 text-left font-medium"
                          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-gray-700'"
                        >
                          Attribute
                        </th>
                        <th
                          class="px-4 py-3 text-left font-medium"
                          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-gray-700'"
                        >
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-white'">
                      <tr
                        v-for="attr in queueAttributesMap[queue.url]"
                        :key="attr.name"
                        class="border-t"
                        :class="settingsStore.darkMode ? 'border-dark-border' : 'border-gray-200'"
                      >
                        <td
                          class="px-4 py-2"
                          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-gray-500'"
                        >
                          {{ attr.name }}
                        </td>
                        <td
                          class="px-4 py-2 font-mono text-xs"
                          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-gray-900'"
                        >
                          {{ attr.value }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalQueuePages > 1"
        class="flex justify-center items-center gap-2 py-4"
      >
        <button
          class="px-3 py-1 rounded border disabled:opacity-50"
          :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
          :disabled="queuePage === 1"
          @click="queuePage--"
        >
          Previous
        </button>
        <span
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Page {{ queuePage }} of {{ totalQueuePages }}
        </span>
        <button
          class="px-3 py-1 rounded border disabled:opacity-50"
          :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
          :disabled="queuePage === totalQueuePages"
          @click="queuePage++"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model:open="showDeleteModal"
      title="Delete Queue"
      message="Are you sure you want to delete this queue? This action cannot be undone."
      confirm-text="Delete"
      @confirm="confirmDeleteQueue"
    />

    <!-- Messages Modal -->
    <SQSMessagesModal
      :open="showMessagesModal"
      :queue-name="selectedQueueName"
      :messages="messages"
      :loading="loadingMessages"
      @update:open="showMessagesModal = $event"
      @refresh="loadMessages"
      @delete="handleDeleteMessage"
    />

    <!-- Usage Examples Section -->
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
  </div>

  <!-- Create Queue Modal -->
  <SQSCreateQueueModal
    :open="showCreateModal"
    :loading="loading"
    @update:open="showCreateModal = $event"
    @create="(name: string, isFifo: boolean) => { newQueue.name = name; newQueue.isFifo = isFifo; createQueue() }"
  />
</template>
