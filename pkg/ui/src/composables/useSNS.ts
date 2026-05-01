import { ref } from 'vue'
import { useToast } from '@/composables/useToast'
import * as snsApi from '@/api/services/sns'
import type { SNSTopic, SNSSubscription } from '@/api/types/aws'

export interface TopicForm {
  name: string
  displayName: string
}

export interface SubscribeForm {
  protocol: string
  endpoint: string
}

export interface PublishForm {
  subject: string
  message: string
}

export function useSNS() {
  const toast = useToast()

  const topics = ref<SNSTopic[]>([])
  const subscriptions = ref<SNSSubscription[]>([])
  const loading = ref(false)
  const topicSubscriptions = ref<Record<string, SNSSubscription[]>>({})
  const loadingTopicSubscriptions = ref(false)
  const expandedTopics = ref<Set<string>>(new Set())

  const protocolOptions = [
    { value: 'http', label: 'HTTP' },
    { value: 'https', label: 'HTTPS' },
    { value: 'email', label: 'Email' },
    { value: 'email-json', label: 'Email (JSON)' },
    { value: 'sqs', label: 'SQS Queue' },
    { value: 'lambda', label: 'Lambda Function' },
    { value: 'sms', label: 'SMS' },
  ]

  async function loadTopics() {
    loading.value = true
    try {
      topics.value = await snsApi.listTopics()
    } catch (error) {

      toast.error('Failed to load SNS topics')
    } finally {
      loading.value = false
    }
  }

  async function createTopic(name: string, displayName?: string) {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Topic name is required')
      return
    }
    await snsApi.createTopic(trimmedName, { DisplayName: displayName })
    toast.success('Topic created successfully')
    await loadTopics()
  }

  async function deleteTopic(topicArn: string) {
    await snsApi.deleteTopic(topicArn)
    toast.success('Topic deleted successfully')
    await loadTopics()
  }

  async function loadTopicSubscriptions(topicArn: string) {
    loadingTopicSubscriptions.value = true
    try {
      const subs = await snsApi.listSubscriptionsByTopic(topicArn)
      topicSubscriptions.value[topicArn] = subs
    } catch (error) {
      toast.error('Failed to load subscriptions')
    } finally {
      loadingTopicSubscriptions.value = false
    }
  }

  async function subscribe(topicArn: string, protocol: string, endpoint: string) {
    if (!endpoint.trim()) {
      toast.error('Endpoint is required')
      return
    }
    await snsApi.subscribe(topicArn, protocol, endpoint)
    toast.success('Subscription created successfully')
    await loadTopicSubscriptions(topicArn)
  }

  async function publish(topicArn: string, message: string, subject?: string) {
    if (!message.trim()) {
      toast.error('Message is required')
      return
    }
    await snsApi.publish(topicArn, message, { Subject: subject || undefined })
    toast.success('Message published successfully')
  }

  async function loadSubscriptions(topicArn: string): Promise<SNSSubscription[]> {
    try {
      subscriptions.value = await snsApi.listSubscriptionsByTopic(topicArn)
      return subscriptions.value
    } catch (error) {
      toast.error('Failed to load subscriptions')
      return []
    }
  }

  function toggleTopic(topicArn: string) {
    if (expandedTopics.value.has(topicArn)) {
      expandedTopics.value.delete(topicArn)
    } else {
      expandedTopics.value.add(topicArn)
      if (!topicSubscriptions.value[topicArn]) {
        loadTopicSubscriptions(topicArn)
      }
    }
    expandedTopics.value = new Set(expandedTopics.value)
  }

  function getSubscriptionStatus(arn: string): 'active' | 'pending' | 'inactive' {
    if (!arn) return 'inactive'
    if (arn.includes('PendingConfirmation')) return 'pending'
    if (arn.includes(':confirmed')) return 'active'
    return 'inactive'
  }

  return {
    topics,
    subscriptions,
    loading,
    topicSubscriptions,
    loadingTopicSubscriptions,
    expandedTopics,
    protocolOptions,
    loadTopics,
    createTopic,
    deleteTopic,
    loadTopicSubscriptions,
    subscribe,
    publish,
    loadSubscriptions,
    toggleTopic,
    getSubscriptionStatus,
  }
}