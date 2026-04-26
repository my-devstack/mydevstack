import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSNS } from './useSNS'
import * as snsApi from '@/api/services/sns'

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('@/api/services/sns')

describe('useSNS', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loadTopics success', async () => {
    const mockTopics = [
      { TopicArn: 'arn:aws:sns:us-east-1:123456789:my-topic' },
    ]
    vi.mocked(snsApi.listTopics).mockResolvedValue(mockTopics)

    const { topics, loading, loadTopics } = useSNS()
    expect(topics.value).toEqual([])

    await loadTopics()

    expect(topics.value).toEqual(mockTopics)
    expect(loading.value).toBe(false)
  })

  it('loadTopics error', async () => {
    vi.mocked(snsApi.listTopics).mockRejectedValue(new Error('Network error'))

    const { topics, loadTopics } = useSNS()
    await loadTopics()

    expect(topics.value).toEqual([])
  })

  it('createTopic trims name', async () => {
    vi.mocked(snsApi.createTopic).mockResolvedValue({ TopicArn: 'test' })
    vi.mocked(snsApi.listTopics).mockResolvedValue([])

    const { createTopic } = useSNS()
    await createTopic('  my-topic  ', 'My Topic')

    expect(snsApi.createTopic).toHaveBeenCalledWith('my-topic', { DisplayName: 'My Topic' })
  })

  it('createTopic requires name', async () => {
    const { createTopic } = useSNS()
    await createTopic('', 'My Topic')

    expect(snsApi.createTopic).not.toHaveBeenCalled()
  })

  it('deleteTopic calls API', async () => {
    vi.mocked(snsApi.deleteTopic).mockResolvedValue(undefined)
    vi.mocked(snsApi.listTopics).mockResolvedValue([])

    const { deleteTopic } = useSNS()
    await deleteTopic('arn:aws:sns:us-east-1:123456789:my-topic')

    expect(snsApi.deleteTopic).toHaveBeenCalledWith('arn:aws:sns:us-east-1:123456789:my-topic')
  })

  it('loadTopicSubscriptions caches result', async () => {
    const mockSubs = [
      { SubscriptionArn: 'arn:aws:sns:us-east-1:123:sub1', Protocol: 'https', Endpoint: 'https://example.com' },
    ]
    vi.mocked(snsApi.listSubscriptionsByTopic).mockResolvedValue(mockSubs)

    const { topicSubscriptions, loadTopicSubscriptions } = useSNS()
    await loadTopicSubscriptions('arn:aws:sns:us-east-1:123456789:my-topic')

    expect(topicSubscriptions.value['arn:aws:sns:us-east-1:123456789:my-topic']).toEqual(mockSubs)
  })

  it('subscribe requires endpoint', async () => {
    const { subscribe } = useSNS()
    await subscribe('arn:aws:sns:us-east-1:123:my-topic', 'https', '')

    expect(snsApi.subscribe).not.toHaveBeenCalled()
  })

  it('subscribe calls API', async () => {
    vi.mocked(snsApi.subscribe).mockResolvedValue({ SubscriptionArn: 'test' })
    vi.mocked(snsApi.listSubscriptionsByTopic).mockResolvedValue([])

    const { subscribe } = useSNS()
    await subscribe('arn:aws:sns:us-east-1:123:my-topic', 'https', 'https://example.com')

    expect(snsApi.subscribe).toHaveBeenCalledWith('arn:aws:sns:us-east-1:123:my-topic', 'https', 'https://example.com')
  })

  it('publish requires message', async () => {
    const { publish } = useSNS()
    await publish('arn:aws:sns:us-east-1:123:my-topic', '')

    expect(snsApi.publish).not.toHaveBeenCalled()
  })

  it('publish calls API', async () => {
    vi.mocked(snsApi.publish).mockResolvedValue({ MessageId: 'test' })

    const { publish } = useSNS()
    await publish('arn:aws:sns:us-east-1:123:my-topic', 'Hello World', 'Test Subject')

    expect(snsApi.publish).toHaveBeenCalledWith('arn:aws:sns:us-east-1:123:my-topic', 'Hello World', { Subject: 'Test Subject' })
  })

  it('loadSubscriptions updates ref', async () => {
    const mockSubs = [
      { SubscriptionArn: 'arn:aws:sns:us-east-1:123:sub1', Protocol: 'https', Endpoint: 'https://example.com' },
    ]
    vi.mocked(snsApi.listSubscriptionsByTopic).mockResolvedValue(mockSubs)

    const { subscriptions, loadSubscriptions } = useSNS()
    await loadSubscriptions('arn:aws:sns:us-east-1:123456789:my-topic')

    expect(subscriptions.value).toEqual(mockSubs)
  })

  describe('toggleTopic', () => {
    it('collapses if expanded', async () => {
      const { expandedTopics, toggleTopic } = useSNS()
      expandedTopics.value.add('arn:aws:sns:us-east-1:123:my-topic')

      toggleTopic('arn:aws:sns:us-east-1:123:my-topic')

      expect(expandedTopics.value.has('arn:aws:sns:us-east-1:123:my-topic')).toBe(false)
    })

    it('expands and loads subscriptions if not cached', async () => {
      vi.mocked(snsApi.listSubscriptionsByTopic).mockResolvedValue([])

      const { expandedTopics, topicSubscriptions, toggleTopic } = useSNS()

      toggleTopic('arn:aws:sns:us-east-1:123:my-topic')

      expect(expandedTopics.value.has('arn:aws:sns:us-east-1:123:my-topic')).toBe(true)
      expect(snsApi.listSubscriptionsByTopic).toHaveBeenCalled()
    })

    it('skips load if already cached', async () => {
      vi.mocked(snsApi.listSubscriptionsByTopic).mockResolvedValue([])

      const { expandedTopics, topicSubscriptions, toggleTopic } = useSNS()
      topicSubscriptions.value['arn:aws:sns:us-east-1:123:my-topic'] = []

      toggleTopic('arn:aws:sns:us-east-1:123:my-topic')

      expect(snsApi.listSubscriptionsByTopic).not.toHaveBeenCalled()
    })
  })

  describe('getSubscriptionStatus', () => {
    it('returns pending for PendingConfirmation', () => {
      const { getSubscriptionStatus } = useSNS()
      expect(getSubscriptionStatus('arn:aws:sns:us-east-1:123:sub:PendingConfirmation')).toBe('pending')
    })

    it('returns active for confirmed', () => {
      const { getSubscriptionStatus } = useSNS()
      expect(getSubscriptionStatus('arn:aws:sns:us-east-1:123:sub:confirmed')).toBe('active')
    })

    it('returns inactive otherwise', () => {
      const { getSubscriptionStatus } = useSNS()
      expect(getSubscriptionStatus('arn:aws:sns:us-east-1:123:sub:deleted')).toBe('inactive')
    })

    it('handles undefined arn', () => {
      const { getSubscriptionStatus } = useSNS()
      expect(getSubscriptionStatus('')).toBe('inactive')
    })
  })
})