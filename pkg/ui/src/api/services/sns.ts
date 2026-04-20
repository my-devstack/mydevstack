/**
 * SNS Service API Client
 * Simple HTTP client for SNS via Go proxy
 * @module api/services/sns
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

async function snsRequest(action: string, body: object = {}): Promise<any> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')

  const url = `${endpoint}/sns/`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': `sns.${action}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`SNS ${action} failed: ${errorText}`, response.status, 'sns')
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error(`SNS ${action} error:`, error)
    throw new APIError(`Failed to ${action}`, 500, 'sns')
  }
}

export class SNSService {
  async listTopics(): Promise<any[]> {
    const response = await snsRequest('ListTopics', {})
    return response.Topics || []
  }

  async listSubscriptions(): Promise<any[]> {
    const response = await snsRequest('ListSubscriptions', {})
    return response.Subscriptions || []
  }

  async listSubscriptionsByTopic(topicArn: string): Promise<any[]> {
    const response = await snsRequest('ListSubscriptionsByTopic', { TopicArn: topicArn })
    return response.Subscriptions || []
  }

  async getTopicAttributes(topicArn: string): Promise<Record<string, string>> {
    const response = await snsRequest('GetTopicAttributes', { TopicArn: topicArn })
    const attrs: Record<string, string> = {}
    if (response.Attributes) {
      Object.entries(response.Attributes).forEach(([key, value]) => {
        attrs[key] = String(value)
      })
    }
    return attrs
  }

  async createTopic(name: string, options?: {
    DisplayName?: string
    Attributes?: Record<string, string>
    tags?: Record<string, string>
  }): Promise<{ TopicArn: string }> {
    const response = await snsRequest('CreateTopic', {
      Name: name,
      DisplayName: options?.DisplayName,
      ...options,
    })
    return { TopicArn: response.TopicArn || '' }
  }

  async deleteTopic(topicArn: string): Promise<void> {
    return snsRequest('DeleteTopic', { TopicArn: topicArn })
  }

  async subscribe(topicArn: string, protocol: string, endpoint: string): Promise<{ SubscriptionArn: string }> {
    const response = await snsRequest('Subscribe', {
      TopicArn: topicArn,
      Protocol: protocol,
      Endpoint: endpoint,
    })
    return { SubscriptionArn: response.SubscriptionArn || '' }
  }

  async unsubscribe(subscriptionArn: string): Promise<void> {
    return snsRequest('Unsubscribe', { SubscriptionArn: subscriptionArn })
  }

  async publish(topicArn: string, message: string, options?: {
    Subject?: string
    MessageStructure?: string
    MessageAttributes?: Record<string, any>
    TargetArn?: string
    PhoneNumber?: string
  }): Promise<{ MessageId: string }> {
    const response = await snsRequest('Publish', {
      TopicArn: topicArn,
      Message: message,
      ...options,
    })
    return { MessageId: response.MessageId || '' }
  }

  async confirmSubscription(topicArn: string, token: string): Promise<{ SubscriptionArn: string }> {
    const response = await snsRequest('ConfirmSubscription', {
      TopicArn: topicArn,
      Token: token,
    })
    return { SubscriptionArn: response.SubscriptionArn || '' }
  }

  async getSubscriptionAttributes(subscriptionArn: string): Promise<Record<string, string>> {
    const response = await snsRequest('GetSubscriptionAttributes', { SubscriptionArn: subscriptionArn })
    const attrs: Record<string, string> = {}
    if (response.Attributes) {
      Object.entries(response.Attributes).forEach(([key, value]) => {
        attrs[key] = String(value)
      })
    }
    return attrs
  }

  async setSubscriptionAttributes(subscriptionArn: string, attributeName: string, attributeValue: string): Promise<void> {
    return snsRequest('SetSubscriptionAttributes', {
      SubscriptionArn: subscriptionArn,
      AttributeName: attributeName,
      AttributeValue: attributeValue,
    })
  }

  async listTagsForResource(resourceArn: string): Promise<{ Tags: any[] }> {
    const response = await snsRequest('ListTagsForResource', { ResourceArn: resourceArn })
    return { Tags: response.Tags || [] }
  }
}

export const snsService = new SNSService()

export const listTopics = () => snsService.listTopics()
export const listSubscriptions = () => snsService.listSubscriptions()
export const listSubscriptionsByTopic = (topicArn: string) => snsService.listSubscriptionsByTopic(topicArn)
export const getTopicAttributes = (topicArn: string) => snsService.getTopicAttributes(topicArn)
export const createTopic = (name: string, options?: Parameters<SNSService['createTopic']>[1]) => 
  snsService.createTopic(name, options)
export const deleteTopic = (topicArn: string) => snsService.deleteTopic(topicArn)
export const subscribe = (topicArn: string, protocol: string, endpoint: string) => 
  snsService.subscribe(topicArn, protocol, endpoint)
export const unsubscribe = (subscriptionArn: string) => snsService.unsubscribe(subscriptionArn)
export const publish = (topicArn: string, message: string, options?: Parameters<SNSService['publish']>[2]) => 
  snsService.publish(topicArn, message, options)
export const confirmSubscription = (topicArn: string, token: string) => 
  snsService.confirmSubscription(topicArn, token)
export const getSubscriptionAttributes = (subscriptionArn: string) => 
  snsService.getSubscriptionAttributes(subscriptionArn)
export const setSubscriptionAttributes = (subscriptionArn: string, attributeName: string, attributeValue: string) => 
  snsService.setSubscriptionAttributes(subscriptionArn, attributeName, attributeValue)
export const listTagsForResource = (resourceArn: string) => snsService.listTagsForResource(resourceArn)

export default snsService