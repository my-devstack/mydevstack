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
  listTopics,
  listSubscriptionsByTopic,
  createTopic,
  deleteTopic,
  subscribe,
  publish,
} from './sns'

describe('SNS Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('listTopics', () => {
    it('returns Topics array', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Topics: [{ TopicArn: 'arn:sns:t1' }] }))
      const result = await listTopics()
      expect(result).toHaveLength(1)
      expect(mockFetch.mock.calls[0][0]).toContain('/sns/topics')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })

    it('handles empty response', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listTopics()
      expect(result).toEqual([])
    })
  })

  describe('listSubscriptionsByTopic', () => {
    it('sends TopicArn in URL path', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Subscriptions: [] }))
      await listSubscriptionsByTopic('arn:sns:t1')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/sns/subscriptions/by-topic/')
      expect(url).toContain(encodeURIComponent('arn:sns:t1'))
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('createTopic', () => {
    it('returns TopicArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({ TopicArn: 'arn:sns:new' }))
      const result = await createTopic('my-topic')
      expect(result.TopicArn).toBe('arn:sns:new')
      expect(mockFetch.mock.calls[0][0]).toContain('/sns/topics')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })

    it('handles empty TopicArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await createTopic('my-topic')
      expect(result.TopicArn).toBe('')
    })

    it('sends Name', async () => {
      mockFetch.mockResolvedValue(mockResponse({ TopicArn: 'arn:sns:new' }))
      await createTopic('my-topic', { DisplayName: 'My Topic' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Name).toBe('my-topic')
      expect(mockFetch.mock.calls[0][0]).toContain('/sns/topics')
    })
  })

  describe('deleteTopic', () => {
    it('sends TopicArn in URL path', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteTopic('arn:sns:t1')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/sns/topics/')
      expect(url).toContain(encodeURIComponent('arn:sns:t1'))
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('subscribe', () => {
    it('returns SubscriptionArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({ SubscriptionArn: 'arn:sns:sub1' }))
      const result = await subscribe('arn:sns:t1', 'email', 'test@example.com')
      expect(result.SubscriptionArn).toBe('arn:sns:sub1')
      expect(mockFetch.mock.calls[0][0]).toContain('/sns/subscriptions')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Protocol).toBe('email')
    })
  })

  describe('publish', () => {
    it('returns MessageId', async () => {
      mockFetch.mockResolvedValue(mockResponse({ MessageId: 'msg1' }))
      const result = await publish('arn:sns:t1', 'Hello')
      expect(result.MessageId).toBe('msg1')
      expect(mockFetch.mock.calls[0][0]).toContain('/sns/publish')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Message).toBe('Hello')
    })

    it('sends optional Subject', async () => {
      mockFetch.mockResolvedValue(mockResponse({ MessageId: 'msg1' }))
      await publish('arn:sns:t1', 'Hello', { Subject: 'Greeting' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Subject).toBe('Greeting')
      expect(mockFetch.mock.calls[0][0]).toContain('/sns/publish')
    })
  })

  describe('Error handling', () => {
    const errorMethods = [
      ['listTopics', () => listTopics()],
      ['listSubscriptionsByTopic', () => listSubscriptionsByTopic('arn:aws:sns:t1')],
      ['createTopic', () => createTopic('test')],
      ['deleteTopic', () => deleteTopic('arn:aws:sns:t1')],
      ['subscribe', () => subscribe('arn:aws:sns:t1', 'email', 'a@b.com')],
      ['publish', () => publish('arn:aws:sns:t1', 'hello')],
    ]
    for (const [name, fn] of errorMethods) {
      it(`throws APIError on server error - ${name}`, async () => {
        mockFetch.mockResolvedValue(mockResponse('Error', 500))
        await expect(fn()).rejects.toThrow(/SNS .* failed/)
      })
    }

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listTopics()).rejects.toThrow(/Failed to listTopics/)
    })

    it('subscribe catches non-APIError and rethrows as APIError', async () => {
      mockFetch.mockResolvedValue(mockResponse({ SubscriptionArn: 'arn:sns:sub1' }))
      // The function has a catch block that rethrows non-APIError
      // This test verifies the catch path when error is not APIError
      mockFetch.mockRejectedValueOnce(new Error('Unexpected error'))
      await expect(subscribe('arn:aws:sns:t1', 'email', 'a@b.com')).rejects.toThrow(/Failed to subscribe/)
    })

    it('publish catches non-APIError and rethrows as APIError', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Unexpected error'))
      await expect(publish('arn:aws:sns:t1', 'hello')).rejects.toThrow(/Failed to publish/)
    })
  })
})
