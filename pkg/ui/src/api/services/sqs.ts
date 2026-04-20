/**
 * SQS Service API Client
 * Simple HTTP client for SQS via Go proxy
 * @module api/services/sqs
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

async function sqsRequest(action: string, body: object = {}): Promise<any> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')

  const url = `${endpoint}/sqs/`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': `sqs.${action}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`SQS ${action} failed: ${errorText}`, response.status, 'sqs')
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error(`SQS ${action} error:`, error)
    throw new APIError(`Failed to ${action}`, 500, 'sqs')
  }
}

export class SQSService {
  async listQueues(prefix?: string): Promise<string[]> {
    const response = await sqsRequest('ListQueues', { QueueNamePrefix: prefix })
    return response.QueueUrls || []
  }

  async getQueueUrl(queueName: string): Promise<string | undefined> {
    const response = await sqsRequest('GetQueueUrl', { QueueName: queueName })
    return response.QueueUrl
  }

  async getQueueAttributes(queueUrl: string, attributeNames: string[] = ['All']): Promise<Record<string, string>> {
    const response = await sqsRequest('GetQueueAttributes', {
      QueueUrl: queueUrl,
      AttributeNames: attributeNames,
    })
    const attributes: Record<string, string> = {}
    if (response.Attributes) {
      Object.entries(response.Attributes).forEach(([key, value]) => {
        attributes[key] = String(value)
      })
    }
    return attributes
  }

  async createQueue(queueName: string, options?: {
    Attributes?: Record<string, string>
    tags?: Record<string, string>
  }): Promise<{ QueueUrl: string }> {
    const response = await sqsRequest('CreateQueue', {
      QueueName: queueName,
      ...options,
    })
    return { QueueUrl: response.QueueUrl || '' }
  }

  async deleteQueue(queueUrl: string): Promise<void> {
    return sqsRequest('DeleteQueue', { QueueUrl: queueUrl })
  }

  async sendMessage(queueUrl: string, messageBody: string, options?: {
    DelaySeconds?: number
    MessageAttributes?: Record<string, any>
    MessageDeduplicationId?: string
    MessageGroupId?: string
  }): Promise<{ MessageId: string; MD5OfMessageBody: string }> {
    const response = await sqsRequest('SendMessage', {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      ...options,
    })
    return {
      MessageId: response.MessageId || '',
      MD5OfMessageBody: response.MD5OfMessageBody || '',
    }
  }

  async receiveMessage(queueUrl: string, options?: {
    MaxNumberOfMessages?: number
    WaitTimeSeconds?: number
    VisibilityTimeout?: number
    AttributeNames?: string[]
    MessageAttributeNames?: string[]
  }): Promise<any[]> {
    const response = await sqsRequest('ReceiveMessage', {
      QueueUrl: queueUrl,
      ...options,
    })
    return response.Messages || []
  }

  async deleteMessage(queueUrl: string, receiptHandle: string): Promise<void> {
    return sqsRequest('DeleteMessage', {
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    })
  }

  async purgeQueue(queueUrl: string): Promise<void> {
    return sqsRequest('PurgeQueue', { QueueUrl: queueUrl })
  }

  async setQueueAttributes(queueUrl: string, attributes: Record<string, string>): Promise<void> {
    return sqsRequest('SetQueueAttributes', {
      QueueUrl: queueUrl,
      Attributes: attributes,
    })
  }

  async changeMessageVisibility(queueUrl: string, receiptHandle: string, visibilityTimeout: number): Promise<void> {
    return sqsRequest('ChangeMessageVisibility', {
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
      VisibilityTimeout: visibilityTimeout,
    })
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