import { ref } from 'vue'
import { useUIStore } from '@/stores/ui'
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
  const uiStore = useUIStore()

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
      const result = await sqsApi.listQueues()
      const queueList: Queue[] = (result.QueueUrls || []).map((url: string) => ({
        url,
        name: url.split('/').pop() || url
      }))
      queues.value = queueList
    } catch (error) {
      uiStore.notifyError('Failed to load queues', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      loading.value = false
    }
  }

  async function createQueue(name: string, isFifo: boolean) {
    await sqsApi.createQueue(name, isFifo)
    uiStore.notifySuccess('Queue created', `Queue "${name}" created successfully`)
    await loadQueues()
  }

  async function deleteQueue(url: string) {
    await sqsApi.deleteQueue(url)
    uiStore.notifySuccess('Queue deleted', 'Queue deleted successfully')
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
      console.error('Failed to load queue attributes:', error)
      queueAttributesMap.value[url] = []
      return []
    }
  }

  async function loadMessages(url: string): Promise<SQSMessage[]> {
    loadingMessages.value = true
    try {
      const result = await sqsApi.receiveMessage(url)
      const msgs = result.Messages || []
      messagesByQueue.value[url] = msgs
      messages.value = msgs
      return msgs
    } catch (error) {
      uiStore.notifyError('Failed to load messages', error instanceof Error ? error.message : 'Unknown error')
      return []
    } finally {
      loadingMessages.value = false
    }
  }

  async function deleteMessageFromQueue(url: string, receiptHandle: string) {
    await sqsApi.deleteMessage(url, receiptHandle)
    uiStore.notifySuccess('Message deleted', 'Message deleted successfully')
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

  return {
    queues,
    loading,
    expandedQueues,
    queueAttributesMap,
    queueArnMap,
    messages,
    loadingMessages,
    messagesByQueue,
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