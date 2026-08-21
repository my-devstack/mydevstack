import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import { useSettingsStore } from '@/stores/settings'
import type { SQSMessage } from '@/api/types/aws'
import * as sqsApi from '@/api/services/sqs'

export interface Queue {
  url: string
  name: string
}

export interface QueueAttribute {
  name: string
  value: string
}

export function useSQS() {
  const toast = useToast()
  const settingsStore = useSettingsStore()

  const queues = ref<Queue[]>([])
  const loading = ref(false)
  const expandedQueues = ref<Set<string>>(new Set())
  const queueAttributesMap = ref<Record<string, QueueAttribute[]>>({})
  const queueArnMap = ref<Record<string, string>>({})

  const messages = ref<SQSMessage[]>([])
  const loadingMessages = ref(false)
  const messagesByQueue = ref<Record<string, SQSMessage[]>>({})

  async function loadQueues() {
    loading.value = true
    try {
      const queueUrls = await sqsApi.listQueues()
      const queueList: Queue[] = queueUrls.map((url: string) => ({
        url,
        name: url.split('/').pop() || url
      }))
      queues.value = queueList
    } catch (error) {
      toast.error('Failed to load queues: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  async function createQueue(name: string, isFifo: boolean) {
    const queueName = isFifo && !name.endsWith('.fifo') ? `${name}.fifo` : name
    await sqsApi.createQueue(queueName, isFifo ? { Attributes: { QueueFifoQueue: 'true' } } : undefined)
    toast.success(`Queue "${name}" created successfully`)
    await loadQueues()
  }

  async function deleteQueue(url: string) {
    await sqsApi.deleteQueue(url)
    toast.success('Queue deleted successfully')
    expandedQueues.value.delete(url)
    await loadQueues()
  }

  async function loadQueueAttributes(url: string): Promise<QueueAttribute[]> {
    try {
      const attributes = await sqsApi.getQueueAttributes(url, ['All'])
      const parsedAttributes: QueueAttribute[] = []
      for (const [key, value] of Object.entries(attributes)) {
        if (key !== 'QueueUrl' && key !== 'QueueArn' && value !== undefined) {
          parsedAttributes.push({
            name: key,
            value: String(value)
          })
        }
      }
      queueAttributesMap.value[url] = parsedAttributes
      queueArnMap.value[url] = attributes.QueueArn || ''
      return parsedAttributes
    } catch (error) {
      toast.error(`Failed to load queue attributes: ${error}`)
      queueAttributesMap.value[url] = []
      return []
    }
  }

  async function loadMessages(url: string): Promise<SQSMessage[]> {
    loadingMessages.value = true
    try {
      const msgs = await sqsApi.receiveMessage(url)
      messagesByQueue.value[url] = msgs
      messages.value = msgs
      return msgs
    } catch (error) {
      toast.error('Failed to load messages: ' + (error instanceof Error ? error.message : 'Unknown error'))
      return []
    } finally {
      loadingMessages.value = false
    }
  }

  async function deleteMessageFromQueue(url: string, receiptHandle: string) {
    await sqsApi.deleteMessage(url, receiptHandle)
    toast.success('Message deleted successfully')
    await loadMessages(url)
  }

  function toggleQueue(url: string) {
    if (expandedQueues.value.has(url)) {
      expandedQueues.value.delete(url)
    } else {
      expandedQueues.value.add(url)
      if (!queueAttributesMap.value[url]) {
        loadQueueAttributes(url)
      }
    }
    expandedQueues.value = new Set(expandedQueues.value)
  }

  function formatBody(body: string): string {
    try {
      const parsed = JSON.parse(body)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return body
    }
  }

  // Code examples
  const codeExamples = computed(() => [
    {
      language: 'aws-cli',
      label: 'AWS CLI',
      code: `# List queues
aws sqs list-queues --endpoint-url ${settingsStore.publicEndpoint}

# Create standard queue
aws sqs create-queue --queue-name my-queue --endpoint-url ${settingsStore.publicEndpoint}

# Create FIFO queue
aws sqs create-queue --queue-name my-queue.fifo --attributes FIFOQueue=true --endpoint-url ${settingsStore.publicEndpoint}

# Get queue URL
aws sqs get-queue-url --queue-name my-queue --endpoint-url ${settingsStore.publicEndpoint}

# Send message
aws sqs send-message --queue-url ${settingsStore.publicEndpoint}/000000000000/my-queue --message-body "Hello World"

# Receive messages
aws sqs receive-message --queue-url ${settingsStore.publicEndpoint}/000000000000/my-queue --endpoint-url ${settingsStore.publicEndpoint}

# Delete message
aws sqs delete-message --queue-url ${settingsStore.publicEndpoint}/000000000000/my-queue --receipt-handle "<receipt-handle>" --endpoint-url ${settingsStore.publicEndpoint}

# Delete queue
aws sqs delete-queue --queue-url ${settingsStore.publicEndpoint}/000000000000/my-queue --endpoint-url ${settingsStore.publicEndpoint}`
    },
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `// Using AWS SDK v3
import { SQSClient, ListQueuesCommand, CreateQueueCommand, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";

const client = new SQSClient({
  region: '${settingsStore.region}',
  endpoint: '${settingsStore.publicEndpoint}',
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
  QueueUrl: '${settingsStore.publicEndpoint}/000000000000/my-queue',
  MessageBody: 'Hello World',
}));

// Receive messages
const receiveResponse = await client.send(new ReceiveMessageCommand({
  QueueUrl: '${settingsStore.publicEndpoint}/000000000000/my-queue',
  MaxNumberOfMessages: 10,
}));
console.log(receiveResponse.Messages);

// Delete message
if (receiveResponse.Messages?.[0]) {
  await client.send(new DeleteMessageCommand({
    QueueUrl: '${settingsStore.publicEndpoint}/000000000000/my-queue',
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
    endpoint_url='${settingsStore.publicEndpoint}',
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
    o.BaseURL = "${settingsStore.publicEndpoint}"
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
    QueueUrl:    aws.String("${settingsStore.publicEndpoint}/000000000000/my-queue"),
    MessageBody: aws.String("Hello World"),
})

// Receive messages
receiveOutput, _ := client.ReceiveMessage(context.Background(), &sqs.ReceiveMessageInput{
    QueueUrl: aws.String("${settingsStore.publicEndpoint}/000000000000/my-queue"),
})
fmt.Println(receiveOutput.Messages)

// Delete message
if len(receiveOutput.Messages) > 0 {
    _, _ = client.DeleteMessage(context.Background(), &sqs.DeleteMessageInput{
        QueueUrl:    aws.String("${settingsStore.publicEndpoint}/000000000000/my-queue"),
        ReceiptHandle: receiveOutput.Messages[0].ReceiptHandle,
    })
}`
    },
  ])

  return {
    queues,
    loading,
    expandedQueues,
    queueAttributesMap,
    queueArnMap,
    messages,
    loadingMessages,
    messagesByQueue,
    codeExamples,
    loadQueues,
    createQueue,
    deleteQueue,
    loadQueueAttributes,
    loadMessages,
    deleteMessageFromQueue,
    toggleQueue,
    formatBody,
  }
}