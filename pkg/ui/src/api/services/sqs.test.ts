import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function mockResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
    headers: new Headers({ 'content-type': 'application/json' }),
  }
}

import {
  listQueues,
  getQueueUrl,
  getQueueAttributes,
  createQueue,
  deleteQueue,
  sendMessage,
  receiveMessage,
  deleteMessage,
  purgeQueue,
  setQueueAttributes,
  changeMessageVisibility,
} from './sqs'

describe('SQS Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('listQueues', () => {
    it('returns QueueUrls', async () => {
      mockFetch.mockResolvedValue(mockResponse({ QueueUrls: ['https://sqs/queue1'] }))
      const result = await listQueues()
      expect(result).toEqual(['https://sqs/queue1'])
    })

    it('sends prefix', async () => {
      mockFetch.mockResolvedValue(mockResponse({ QueueUrls: [] }))
      await listQueues('my-')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.QueueNamePrefix).toBe('my-')
    })
  })

  describe('getQueueUrl', () => {
    it('returns QueueUrl', async () => {
      mockFetch.mockResolvedValue(mockResponse({ QueueUrl: 'https://sqs/queue1' }))
      const result = await getQueueUrl('queue1')
      expect(result).toBe('https://sqs/queue1')
    })

    it('returns undefined when not in response', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await getQueueUrl('queue1')
      expect(result).toBeUndefined()
    })
  })

  describe('getQueueAttributes', () => {
    it('returns attributes as string map', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Attributes: { QueueArn: 'arn:sqs:q1', VisibilityTimeout: '30' } }))
      const result = await getQueueAttributes('https://sqs/q1')
      expect(result.QueueArn).toBe('arn:sqs:q1')
      expect(result.VisibilityTimeout).toBe('30')
    })

    it('sends default AttributeNames', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await getQueueAttributes('https://sqs/q1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.AttributeNames).toEqual(['All'])
    })

    it('sends custom AttributeNames', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await getQueueAttributes('https://sqs/q1', ['QueueArn'])
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.AttributeNames).toEqual(['QueueArn'])
    })
  })

  describe('createQueue', () => {
    it('returns QueueUrl', async () => {
      mockFetch.mockResolvedValue(mockResponse({ QueueUrl: 'https://sqs/new-queue' }))
      const result = await createQueue('new-queue')
      expect(result.QueueUrl).toBe('https://sqs/new-queue')
    })

    it('sends QueueName', async () => {
      mockFetch.mockResolvedValue(mockResponse({ QueueUrl: 'https://sqs/q1' }))
      await createQueue('my-queue')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.QueueName).toBe('my-queue')
    })

    it('passes options', async () => {
      mockFetch.mockResolvedValue(mockResponse({ QueueUrl: 'https://sqs/q1' }))
      await createQueue('my-queue', { Attributes: { DelaySeconds: '5' } })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Attributes.DelaySeconds).toBe('5')
    })
  })

  describe('deleteQueue', () => {
    it('sends QueueUrl', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteQueue('https://sqs/q1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.QueueUrl).toBe('https://sqs/q1')
    })
  })

  describe('sendMessage', () => {
    it('returns message ids', async () => {
      mockFetch.mockResolvedValue(mockResponse({ MessageId: 'msg1', MD5OfMessageBody: 'md51' }))
      const result = await sendMessage('https://sqs/q1', 'Hello')
      expect(result.MessageId).toBe('msg1')
      expect(result.MD5OfMessageBody).toBe('md51')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.MessageBody).toBe('Hello')
    })

    it('sends options', async () => {
      mockFetch.mockResolvedValue(mockResponse({ MessageId: 'msg1', MD5OfMessageBody: 'md5' }))
      await sendMessage('https://sqs/q1', 'Hello', { DelaySeconds: 10 })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.DelaySeconds).toBe(10)
    })
  })

  describe('receiveMessage', () => {
    it('returns Messages array', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Messages: [{ MessageId: 'msg1', Body: 'Hello' }] }))
      const result = await receiveMessage('https://sqs/q1')
      expect(result).toHaveLength(1)
      expect(result[0].Body).toBe('Hello')
    })

    it('sends options', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Messages: [] }))
      await receiveMessage('https://sqs/q1', { MaxNumberOfMessages: 5 })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.MaxNumberOfMessages).toBe(5)
    })
  })

  describe('deleteMessage', () => {
    it('sends QueueUrl and ReceiptHandle', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteMessage('https://sqs/q1', 'receipt1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.QueueUrl).toBe('https://sqs/q1')
      expect(body.ReceiptHandle).toBe('receipt1')
    })
  })

  describe('purgeQueue', () => {
    it('sends QueueUrl', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await purgeQueue('https://sqs/q1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.QueueUrl).toBe('https://sqs/q1')
    })
  })

  describe('setQueueAttributes', () => {
    it('sends attributes', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await setQueueAttributes('https://sqs/q1', { VisibilityTimeout: '60' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Attributes.VisibilityTimeout).toBe('60')
    })
  })

  describe('changeMessageVisibility', () => {
    it('sends params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await changeMessageVisibility('https://sqs/q1', 'receipt1', 30)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.VisibilityTimeout).toBe(30)
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(listQueues()).rejects.toThrow(/SQS ListQueues failed/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listQueues()).rejects.toThrow(/Failed to/)
    })
  })

  describe('X-Amz-Target header', () => {
    it('uses sqs prefix', async () => {
      mockFetch.mockResolvedValue(mockResponse({ QueueUrls: [] }))
      await listQueues()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('sqs.ListQueues')
    })
  })
})
