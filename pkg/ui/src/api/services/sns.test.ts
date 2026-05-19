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
  listSubscriptions,
  listSubscriptionsByTopic,
  getTopicAttributes,
  createTopic,
  deleteTopic,
  subscribe,
  unsubscribe,
  publish,
  confirmSubscription,
  getSubscriptionAttributes,
  setSubscriptionAttributes,
  listTagsForResource,
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
    })

    it('handles empty response', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listTopics()
      expect(result).toEqual([])
    })
  })

  describe('listSubscriptions', () => {
    it('returns Subscriptions', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Subscriptions: [{ SubscriptionArn: 'arn:sns:sub1' }] }))
      const result = await listSubscriptions()
      expect(result).toHaveLength(1)
    })
  })

  describe('listSubscriptionsByTopic', () => {
    it('sends TopicArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Subscriptions: [] }))
      await listSubscriptionsByTopic('arn:sns:t1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.TopicArn).toBe('arn:sns:t1')
    })
  })

  describe('getTopicAttributes', () => {
    it('returns attributes as string map', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Attributes: { TopicArn: 'arn:sns:t1', DisplayName: 'test' } }))
      const result = await getTopicAttributes('arn:sns:t1')
      expect(result.TopicArn).toBe('arn:sns:t1')
      expect(result.DisplayName).toBe('test')
    })

    it('handles empty attributes', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await getTopicAttributes('arn:sns:t1')
      expect(result).toEqual({})
    })
  })

  describe('createTopic', () => {
    it('returns TopicArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({ TopicArn: 'arn:sns:new' }))
      const result = await createTopic('my-topic')
      expect(result.TopicArn).toBe('arn:sns:new')
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
    })
  })

  describe('deleteTopic', () => {
    it('sends TopicArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteTopic('arn:sns:t1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.TopicArn).toBe('arn:sns:t1')
    })
  })

  describe('subscribe', () => {
    it('returns SubscriptionArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({ SubscriptionArn: 'arn:sns:sub1' }))
      const result = await subscribe('arn:sns:t1', 'email', 'test@example.com')
      expect(result.SubscriptionArn).toBe('arn:sns:sub1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Protocol).toBe('email')
    })
  })

  describe('unsubscribe', () => {
    it('sends SubscriptionArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await unsubscribe('arn:sns:sub1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.SubscriptionArn).toBe('arn:sns:sub1')
    })
  })

  describe('publish', () => {
    it('returns MessageId', async () => {
      mockFetch.mockResolvedValue(mockResponse({ MessageId: 'msg1' }))
      const result = await publish('arn:sns:t1', 'Hello')
      expect(result.MessageId).toBe('msg1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Message).toBe('Hello')
    })

    it('sends optional Subject', async () => {
      mockFetch.mockResolvedValue(mockResponse({ MessageId: 'msg1' }))
      await publish('arn:sns:t1', 'Hello', { Subject: 'Greeting' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Subject).toBe('Greeting')
    })
  })

  describe('confirmSubscription', () => {
    it('returns SubscriptionArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({ SubscriptionArn: 'arn:sns:sub1' }))
      const result = await confirmSubscription('arn:sns:t1', 'token123')
      expect(result.SubscriptionArn).toBe('arn:sns:sub1')
    })
  })

  describe('getSubscriptionAttributes', () => {
    it('returns attributes', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Attributes: { SubscriptionArn: 'arn:sns:s1' } }))
      const result = await getSubscriptionAttributes('arn:sns:s1')
      expect(result.SubscriptionArn).toBe('arn:sns:s1')
    })
  })

  describe('setSubscriptionAttributes', () => {
    it('sends attributes', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await setSubscriptionAttributes('arn:sns:s1', 'RawMessageDelivery', 'true')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.AttributeName).toBe('RawMessageDelivery')
      expect(body.AttributeValue).toBe('true')
    })
  })

  describe('listTagsForResource', () => {
    it('returns Tags', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Tags: [{ Key: 'Env', Value: 'dev' }] }))
      const result = await listTagsForResource('arn:sns:t1')
      expect(result.Tags).toHaveLength(1)
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(listTopics()).rejects.toThrow(/SNS ListTopics failed/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listTopics()).rejects.toThrow(/Failed to/)
    })
  })

  describe('X-Amz-Target header', () => {
    it('uses sns prefix', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Topics: [] }))
      await listTopics()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('sns.ListTopics')
    })
  })
})
