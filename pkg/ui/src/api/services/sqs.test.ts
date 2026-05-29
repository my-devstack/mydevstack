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

    it('sends prefix as query param', async () => {
      mockFetch.mockResolvedValue(mockResponse({ QueueUrls: [] }))
      await listQueues('my-')
      expect(mockFetch.mock.calls[0][0]).toContain('prefix=my-')
    })

    it('hits GET /sqs/queues endpoint', async () => {
      mockFetch.mockResolvedValue(mockResponse({ QueueUrls: [] }))
      await listQueues()
      expect(mockFetch.mock.calls[0][0]).toContain('/sqs/queues')
      expect(mockFetch.mock.calls[0][1]).toBeUndefined()
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

    it('hits GET /sqs/queues/{queueName}', async () => {
      mockFetch.mockResolvedValue(mockResponse({ QueueUrl: 'https://sqs/q' }))
      await getQueueUrl('test-queue')
      expect(mockFetch.mock.calls[0][0]).toContain('/sqs/queues/test-queue')
    })
  })

  describe('getQueueAttributes', () => {
    it('returns attributes as string map', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Attributes: { QueueArn: 'arn:sqs:q1', VisibilityTimeout: '30' } }))
      const result = await getQueueAttributes('https://sqs/q1')
      expect(result.QueueArn).toBe('arn:sqs:q1')
      expect(result.VisibilityTimeout).toBe('30')
    })

    it('sends GET with AttributeName query params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await getQueueAttributes('https://sqs/q1')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/sqs/queues/q1/attributes')
      expect(url).toContain('AttributeName=All')
      // GET request may omit options param entirely — method defaults to GET
      const opts = mockFetch.mock.calls[0][1]
      if (opts) expect(opts.method || 'GET').toBe('GET')
    })

    it('sends custom AttributeName params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await getQueueAttributes('https://sqs/q1', ['QueueArn'])
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('AttributeName=QueueArn')
    })
  })

  describe('createQueue', () => {
    it('returns QueueUrl', async () => {
      mockFetch.mockResolvedValue(mockResponse({ QueueUrl: 'https://sqs/new-queue' }))
      const result = await createQueue('new-queue')
      expect(result.QueueUrl).toBe('https://sqs/new-queue')
    })

    it('sends QueueName in POST body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ QueueUrl: 'https://sqs/q1' }))
      await createQueue('my-queue')
      expect(mockFetch.mock.calls[0][0]).toContain('/sqs/queues')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
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
    it('hits DELETE /sqs/queues/{queueName}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteQueue('https://sqs/q1')
      expect(mockFetch.mock.calls[0][0]).toContain('/sqs/queues/q1')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
      // No body for delete
      expect(mockFetch.mock.calls[0][1].body).toBeUndefined()
    })
  })

  describe('sendMessage', () => {
    it('returns message ids', async () => {
      mockFetch.mockResolvedValue(mockResponse({ MessageId: 'msg1', MD5OfMessageBody: 'md51' }))
      const result = await sendMessage('https://sqs/q1', 'Hello')
      expect(result.MessageId).toBe('msg1')
      expect(result.MD5OfMessageBody).toBe('md51')
    })

    it('sends MessageBody in POST body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ MessageId: 'msg1', MD5OfMessageBody: 'md5' }))
      await sendMessage('https://sqs/q1', 'Hello')
      expect(mockFetch.mock.calls[0][0]).toContain('/sqs/queues/q1/messages')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
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

    it('hits GET /sqs/queues/{queueName}/messages', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Messages: [] }))
      await receiveMessage('https://sqs/q1')
      expect(mockFetch.mock.calls[0][0]).toContain('/sqs/queues/q1/messages')
      expect(mockFetch.mock.calls[0][1]).toBeUndefined()
    })

    it('sends options as query params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Messages: [] }))
      await receiveMessage('https://sqs/q1', { MaxNumberOfMessages: 5 })
      expect(mockFetch.mock.calls[0][0]).toContain('MaxNumberOfMessages=5')
    })
  })

  describe('deleteMessage', () => {
    it('hits DELETE /sqs/queues/{queueName}/messages/{receiptHandle}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteMessage('https://sqs/q1', 'receipt1')
      expect(mockFetch.mock.calls[0][0]).toContain('/sqs/queues/q1/messages/receipt1')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('purgeQueue', () => {
    it('hits POST /sqs/queues/{queueName}/purge', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await purgeQueue('https://sqs/q1')
      expect(mockFetch.mock.calls[0][0]).toContain('/sqs/queues/q1/purge')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('setQueueAttributes', () => {
    it('sends attributes in PUT body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await setQueueAttributes('https://sqs/q1', { VisibilityTimeout: '60' })
      expect(mockFetch.mock.calls[0][0]).toContain('/sqs/queues/q1/attributes')
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Attributes.VisibilityTimeout).toBe('60')
    })
  })

  describe('changeMessageVisibility', () => {
    it('sends params in POST body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await changeMessageVisibility('https://sqs/q1', 'receipt1', 30)
      expect(mockFetch.mock.calls[0][0]).toContain('/sqs/queues/q1/visibility')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ReceiptHandle).toBe('receipt1')
      expect(body.VisibilityTimeout).toBe(30)
    })
  })

  describe('Error handling', () => {
    const methods: [string, () => Promise<any>][] = [
      ['listQueues', () => listQueues()],
      ['getQueueUrl', () => getQueueUrl('test-queue')],
      ['getQueueAttributes', () => getQueueAttributes('http://localhost/test-queue')],
      ['createQueue', () => createQueue('test-queue')],
      ['deleteQueue', () => deleteQueue('http://localhost/test-queue')],
      ['sendMessage', () => sendMessage('http://localhost/test-queue', 'msg')],
      ['receiveMessage', () => receiveMessage('http://localhost/test-queue')],
      ['deleteMessage', () => deleteMessage('http://localhost/test-queue', 'receipt')],
      ['purgeQueue', () => purgeQueue('http://localhost/test-queue')],
      ['setQueueAttributes', () => setQueueAttributes('http://localhost/test-queue', {})],
      ['changeMessageVisibility', () => changeMessageVisibility('http://localhost/test-queue', 'receipt', 30)],
    ]

    for (const [name, fn] of methods) {
      it(`throws APIError on server error - ${name}`, async () => {
        mockFetch.mockResolvedValue(mockResponse('Error', 500))
        await expect(fn()).rejects.toThrow(/failed/)
      })
    }

    it('throws on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listQueues()).rejects.toThrow('Network error')
    })
  })
})
