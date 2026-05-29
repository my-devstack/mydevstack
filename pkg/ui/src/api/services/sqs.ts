/**
 * SQS Service API Client
 * REST HTTP client for SQS via Go proxy
 * @module api/services/sqs
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

const api = PROXY_BACKEND.replace(/\/$/, '')

/**
 * Extract queue name from a queue URL.
 * Queue URL format: https://sqs.region.amazonaws.com/account-id/QueueName
 */
function extractQueueName(queueUrl: string): string {
  return queueUrl.split('/').filter(Boolean).pop() || queueUrl
}

export class SQSService {
  async listQueues(prefix?: string): Promise<string[]> {
    const url = prefix
      ? `${api}/sqs/queues?prefix=${encodeURIComponent(prefix)}`
      : `${api}/sqs/queues`
    const res = await fetch(url)
    if (!res.ok) {
      const errorText = await res.text()
      throw new APIError(`List queues failed: ${errorText}`, res.status, 'sqs')
    }
    const data = await res.json()
    return data.QueueUrls || []
  }

  async getQueueUrl(queueName: string): Promise<string | undefined> {
    const res = await fetch(`${api}/sqs/queues/${encodeURIComponent(queueName)}`)
    if (!res.ok) {
      const errorText = await res.text()
      throw new APIError(`Get queue URL failed: ${errorText}`, res.status, 'sqs')
    }
    const data = await res.json()
    return data.QueueUrl
  }

  async getQueueAttributes(queueUrl: string, attributeNames: string[] = ['All']): Promise<Record<string, string>> {
    const queueName = extractQueueName(queueUrl)
    const query = new URLSearchParams()
    attributeNames.forEach(n => query.append('AttributeName', n))
    const res = await fetch(`${api}/sqs/queues/${encodeURIComponent(queueName)}/attributes?${query.toString()}`)
    if (!res.ok) {
      const errorText = await res.text()
      throw new APIError(`Get queue attributes failed: ${errorText}`, res.status, 'sqs')
    }
    const data = await res.json()
    const attributes: Record<string, string> = {}
    if (data.Attributes) {
      Object.entries(data.Attributes).forEach(([key, value]) => {
        attributes[key] = String(value)
      })
    }
    return attributes
  }

  async createQueue(queueName: string, options?: {
    Attributes?: Record<string, string>
    tags?: Record<string, string>
  }): Promise<{ QueueUrl: string }> {
    const res = await fetch(`${api}/sqs/queues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ QueueName: queueName, ...options }),
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new APIError(`Create queue failed: ${errorText}`, res.status, 'sqs')
    }
    const data = await res.json()
    return { QueueUrl: data.QueueUrl || '' }
  }

  async deleteQueue(queueUrl: string): Promise<void> {
    const queueName = extractQueueName(queueUrl)
    const res = await fetch(`${api}/sqs/queues/${encodeURIComponent(queueName)}`, { method: 'DELETE' })
    if (!res.ok) {
      const errorText = await res.text()
      throw new APIError(`Delete queue failed: ${errorText}`, res.status, 'sqs')
    }
  }

  async sendMessage(queueUrl: string, messageBody: string, options?: {
    DelaySeconds?: number
    MessageAttributes?: Record<string, any>
    MessageDeduplicationId?: string
    MessageGroupId?: string
  }): Promise<{ MessageId: string; MD5OfMessageBody: string }> {
    const queueName = extractQueueName(queueUrl)
    const res = await fetch(`${api}/sqs/queues/${encodeURIComponent(queueName)}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ MessageBody: messageBody, ...options }),
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new APIError(`Send message failed: ${errorText}`, res.status, 'sqs')
    }
    const data = await res.json()
    return {
      MessageId: data.MessageId || '',
      MD5OfMessageBody: data.MD5OfMessageBody || '',
    }
  }

  async receiveMessage(queueUrl: string, options?: {
    MaxNumberOfMessages?: number
    WaitTimeSeconds?: number
    VisibilityTimeout?: number
    AttributeNames?: string[]
    MessageAttributeNames?: string[]
  }): Promise<any[]> {
    const queueName = extractQueueName(queueUrl)
    const params = new URLSearchParams()
    if (options?.MaxNumberOfMessages !== undefined) params.set('MaxNumberOfMessages', String(options.MaxNumberOfMessages))
    if (options?.WaitTimeSeconds !== undefined) params.set('WaitTimeSeconds', String(options.WaitTimeSeconds))
    if (options?.VisibilityTimeout !== undefined) params.set('VisibilityTimeout', String(options.VisibilityTimeout))
    if (options?.AttributeNames) params.set('AttributeNames', options.AttributeNames.join(','))
    if (options?.MessageAttributeNames) params.set('MessageAttributeNames', options.MessageAttributeNames.join(','))
    const qs = params.toString()
    const url = qs
      ? `${api}/sqs/queues/${encodeURIComponent(queueName)}/messages?${qs}`
      : `${api}/sqs/queues/${encodeURIComponent(queueName)}/messages`
    const res = await fetch(url)
    if (!res.ok) {
      const errorText = await res.text()
      throw new APIError(`Receive message failed: ${errorText}`, res.status, 'sqs')
    }
    const data = await res.json()
    return data.Messages || []
  }

  async deleteMessage(queueUrl: string, receiptHandle: string): Promise<void> {
    const queueName = extractQueueName(queueUrl)
    const res = await fetch(
      `${api}/sqs/queues/${encodeURIComponent(queueName)}/messages/${encodeURIComponent(receiptHandle)}`,
      { method: 'DELETE' }
    )
    if (!res.ok) {
      const errorText = await res.text()
      throw new APIError(`Delete message failed: ${errorText}`, res.status, 'sqs')
    }
  }

  async purgeQueue(queueUrl: string): Promise<void> {
    const queueName = extractQueueName(queueUrl)
    const res = await fetch(`${api}/sqs/queues/${encodeURIComponent(queueName)}/purge`, { method: 'POST' })
    if (!res.ok) {
      const errorText = await res.text()
      throw new APIError(`Purge queue failed: ${errorText}`, res.status, 'sqs')
    }
  }

  async setQueueAttributes(queueUrl: string, attributes: Record<string, string>): Promise<void> {
    const queueName = extractQueueName(queueUrl)
    const res = await fetch(`${api}/sqs/queues/${encodeURIComponent(queueName)}/attributes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Attributes: attributes }),
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new APIError(`Set queue attributes failed: ${errorText}`, res.status, 'sqs')
    }
  }

  async changeMessageVisibility(queueUrl: string, receiptHandle: string, visibilityTimeout: number): Promise<void> {
    const queueName = extractQueueName(queueUrl)
    const res = await fetch(`${api}/sqs/queues/${encodeURIComponent(queueName)}/visibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ReceiptHandle: receiptHandle, VisibilityTimeout: visibilityTimeout }),
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new APIError(`Change message visibility failed: ${errorText}`, res.status, 'sqs')
    }
  }
}

export const sqsService = new SQSService()

export const listQueues = (prefix?: string) => sqsService.listQueues(prefix)
export const getQueueUrl = (queueName: string) => sqsService.getQueueUrl(queueName)
export const getQueueAttributes = (queueUrl: string, attributeNames?: string[]) =>
  sqsService.getQueueAttributes(queueUrl, attributeNames)
export const createQueue = (queueName: string, options?: Parameters<SQSService['createQueue']>[1]) =>
  sqsService.createQueue(queueName, options)
export const deleteQueue = (queueUrl: string) => sqsService.deleteQueue(queueUrl)
export const sendMessage = (queueUrl: string, messageBody: string, options?: Parameters<SQSService['sendMessage']>[2]) =>
  sqsService.sendMessage(queueUrl, messageBody, options)
export const receiveMessage = (queueUrl: string, options?: Parameters<SQSService['receiveMessage']>[1]) =>
  sqsService.receiveMessage(queueUrl, options)
export const deleteMessage = (queueUrl: string, receiptHandle: string) =>
  sqsService.deleteMessage(queueUrl, receiptHandle)
export const purgeQueue = (queueUrl: string) => sqsService.purgeQueue(queueUrl)
export const setQueueAttributes = (queueUrl: string, attributes: Record<string, string>) =>
  sqsService.setQueueAttributes(queueUrl, attributes)
export const changeMessageVisibility = (queueUrl: string, receiptHandle: string, visibilityTimeout: number) =>
  sqsService.changeMessageVisibility(queueUrl, receiptHandle, visibilityTimeout)

export default sqsService
