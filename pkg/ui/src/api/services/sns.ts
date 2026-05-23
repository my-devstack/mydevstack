/**
 * SNS Service API Client
 * RESTful HTTP client for SNS via Go proxy
 * @module api/services/sns
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

const ENDPOINT = PROXY_BACKEND.replace(/\/$/, '')

export class SNSService {
  async listTopics(): Promise<any[]> {
    try {
      const response = await fetch(`${ENDPOINT}/sns/topics`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new APIError(`SNS listTopics failed: ${errorText}`, response.status, 'sns')
      }
      const data = await response.json()
      return data.Topics || []
    } catch (error) {
      if (error instanceof APIError) throw error
      console.error('SNS listTopics error:', error)
      throw new APIError('Failed to listTopics', 500, 'sns')
    }
  }

  async listSubscriptionsByTopic(topicArn: string): Promise<any[]> {
    const encodedArn = encodeURIComponent(topicArn)
    try {
      const response = await fetch(`${ENDPOINT}/sns/subscriptions/by-topic/${encodedArn}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new APIError(`SNS listSubscriptionsByTopic failed: ${errorText}`, response.status, 'sns')
      }
      const data = await response.json()
      return data.Subscriptions || []
    } catch (error) {
      if (error instanceof APIError) throw error
      console.error('SNS listSubscriptionsByTopic error:', error)
      throw new APIError('Failed to listSubscriptionsByTopic', 500, 'sns')
    }
  }

  async createTopic(name: string, options?: {
    DisplayName?: string
    Attributes?: Record<string, string>
    tags?: Record<string, string>
  }): Promise<{ TopicArn: string }> {
    const body: Record<string, unknown> = { Name: name }
    if (options?.DisplayName) body.DisplayName = options.DisplayName
    if (options?.Attributes) body.Attributes = options.Attributes
    if (options?.tags) body.tags = options.tags
    try {
      const response = await fetch(`${ENDPOINT}/sns/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new APIError(`SNS createTopic failed: ${errorText}`, response.status, 'sns')
      }
      const data = await response.json()
      return { TopicArn: data.TopicArn || '' }
    } catch (error) {
      if (error instanceof APIError) throw error
      console.error('SNS createTopic error:', error)
      throw new APIError('Failed to createTopic', 500, 'sns')
    }
  }

  async deleteTopic(topicArn: string): Promise<void> {
    const encodedArn = encodeURIComponent(topicArn)
    try {
      const response = await fetch(`${ENDPOINT}/sns/topics/${encodedArn}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new APIError(`SNS deleteTopic failed: ${errorText}`, response.status, 'sns')
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      console.error('SNS deleteTopic error:', error)
      throw new APIError('Failed to deleteTopic', 500, 'sns')
    }
  }

  async subscribe(topicArn: string, protocol: string, endpoint: string): Promise<{ SubscriptionArn: string }> {
    try {
      const response = await fetch(`${ENDPOINT}/sns/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ TopicArn: topicArn, Protocol: protocol, Endpoint: endpoint }),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new APIError(`SNS subscribe failed: ${errorText}`, response.status, 'sns')
      }
      const data = await response.json()
      return { SubscriptionArn: data.SubscriptionArn || '' }
    } catch (error) {
      if (error instanceof APIError) throw error
      console.error('SNS subscribe error:', error)
      throw new APIError('Failed to subscribe', 500, 'sns')
    }
  }

  async publish(topicArn: string, message: string, options?: {
    Subject?: string
    MessageStructure?: string
    MessageAttributes?: Record<string, any>
    TargetArn?: string
    PhoneNumber?: string
  }): Promise<{ MessageId: string }> {
    const body: Record<string, unknown> = { TopicArn: topicArn, Message: message }
    if (options?.Subject) body.Subject = options.Subject
    if (options?.MessageStructure) body.MessageStructure = options.MessageStructure
    if (options?.MessageAttributes) body.MessageAttributes = options.MessageAttributes
    if (options?.TargetArn) body.TargetArn = options.TargetArn
    if (options?.PhoneNumber) body.PhoneNumber = options.PhoneNumber
    try {
      const response = await fetch(`${ENDPOINT}/sns/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new APIError(`SNS publish failed: ${errorText}`, response.status, 'sns')
      }
      const data = await response.json()
      return { MessageId: data.MessageId || '' }
    } catch (error) {
      if (error instanceof APIError) throw error
      console.error('SNS publish error:', error)
      throw new APIError('Failed to publish', 500, 'sns')
    }
  }

}

export const snsService = new SNSService()

export const listTopics = () => snsService.listTopics()
export const listSubscriptionsByTopic = (topicArn: string) => snsService.listSubscriptionsByTopic(topicArn)
export const createTopic = (name: string, options?: Parameters<SNSService['createTopic']>[1]) =>
  snsService.createTopic(name, options)
export const deleteTopic = (topicArn: string) => snsService.deleteTopic(topicArn)
export const subscribe = (topicArn: string, protocol: string, endpoint: string) =>
  snsService.subscribe(topicArn, protocol, endpoint)
export const publish = (topicArn: string, message: string, options?: Parameters<SNSService['publish']>[2]) =>
  snsService.publish(topicArn, message, options)

export default snsService
