import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSQS } from './useSQS'

vi.mock('@/api/services/sqs', () => ({
  listQueues: vi.fn(),
  createQueue: vi.fn(),
  deleteQueue: vi.fn(),
  getQueueAttributes: vi.fn(),
  receiveMessage: vi.fn(),
  deleteMessage: vi.fn(),
}))

vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
  })),
}))

import * as sqsApi from '@/api/services/sqs'

describe('useSQS', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const { queues, loading, expandedQueues, messages } = useSQS()
    expect(queues.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(expandedQueues.value).toEqual(new Set())
    expect(messages.value).toEqual([])
  })

  it('loadQueues success', async () => {
    const mockQueues = ['http://localhost:4566/000000000000/test-queue', 'http://localhost:4566/000000000000/another-queue']
    vi.mocked(sqsApi.listQueues).mockResolvedValue(mockQueues)

    const { loadQueues, queues, loading } = useSQS()
    
    await loadQueues()
    
    expect(sqsApi.listQueues).toHaveBeenCalled()
    expect(queues.value).toHaveLength(2)
    expect(queues.value[0].name).toBe('test-queue')
    expect(queues.value[0].url).toBe('http://localhost:4566/000000000000/test-queue')
    expect(loading.value).toBe(false)
  })

  it('loadQueues handles empty result', async () => {
    vi.mocked(sqsApi.listQueues).mockResolvedValue([])

    const { loadQueues, queues } = useSQS()
    
    await loadQueues()
    
    expect(queues.value).toEqual([])
  })

  it('loadQueues handles error', async () => {
    vi.mocked(sqsApi.listQueues).mockRejectedValue(new Error('Network error'))

    const { loadQueues, loading } = useSQS()
    
    await loadQueues()
    
    expect(loading.value).toBe(false)
  })

  it('createQueue calls API and reloads', async () => {
    vi.mocked(sqsApi.createQueue).mockResolvedValue({})
    vi.mocked(sqsApi.listQueues).mockResolvedValue([])

    const { createQueue } = useSQS()
    
    await createQueue('test-queue', false)
    
    expect(sqsApi.createQueue).toHaveBeenCalledWith('test-queue', undefined)
    expect(sqsApi.listQueues).toHaveBeenCalled()
  })

  it('createQueue passes FIFO attribute for FIFO queues', async () => {
    vi.mocked(sqsApi.createQueue).mockResolvedValue({})
    vi.mocked(sqsApi.listQueues).mockResolvedValue([])

    const { createQueue } = useSQS()
    
    await createQueue('test-queue', true)
    
    expect(sqsApi.createQueue).toHaveBeenCalledWith('test-queue.fifo', { Attributes: { QueueFifoQueue: 'true' } })
    expect(sqsApi.listQueues).toHaveBeenCalled()
  })

  it('deleteQueue calls API and reloads', async () => {
    vi.mocked(sqsApi.deleteQueue).mockResolvedValue({})
    vi.mocked(sqsApi.listQueues).mockResolvedValue([])

    const { deleteQueue, expandedQueues } = useSQS()
    expandedQueues.value.add('http://localhost:4566/000000000000/test')
    
    await deleteQueue('http://localhost:4566/000000000000/test')
    
    expect(sqsApi.deleteQueue).toHaveBeenCalledWith('http://localhost:4566/000000000000/test')
    expect(sqsApi.listQueues).toHaveBeenCalled()
  })

  it('deleteQueue removes from expanded', async () => {
    vi.mocked(sqsApi.deleteQueue).mockResolvedValue({})
    vi.mocked(sqsApi.listQueues).mockResolvedValue([])

    const { deleteQueue, expandedQueues } = useSQS()
    expandedQueues.value.add('http://localhost:4566/000000000000/test')
    
    await deleteQueue('http://localhost:4566/000000000000/test')
    
    expect(expandedQueues.value.has('http://localhost:4566/000000000000/test')).toBe(false)
  })

  it('loadQueueAttributes returns parsed attributes', async () => {
    const mockAttributes = {
      QueueArn: 'arn:aws:sqs:us-east-1:000000000000:test-queue',
      ApproximateNumberOfMessages: '5',
      VisibilityTimeout: '30',
    }
    vi.mocked(sqsApi.getQueueAttributes).mockResolvedValue(mockAttributes)

    const { loadQueueAttributes, queueAttributesMap, queueArnMap } = useSQS()
    
    const result = await loadQueueAttributes('http://localhost:4566/000000000000/test-queue')
    
    expect(result).toHaveLength(2)
    expect(queueAttributesMap.value['http://localhost:4566/000000000000/test-queue']).toHaveLength(2)
    expect(queueArnMap.value['http://localhost:4566/000000000000/test-queue']).toBe('arn:aws:sqs:us-east-1:000000000000:test-queue')
  })

  it('loadQueueAttributes handles error gracefully', async () => {
    vi.mocked(sqsApi.getQueueAttributes).mockRejectedValue(new Error('Failed'))

    const { loadQueueAttributes, queueAttributesMap } = useSQS()
    
    const result = await loadQueueAttributes('http://localhost:4566/000000000000/test')
    
    expect(result).toEqual([])
    expect(queueAttributesMap.value['http://localhost:4566/000000000000/test']).toEqual([])
  })

  it('loadMessages fetches and stores messages', async () => {
    const mockMessages = [
      { ReceiptHandle: 'rh1', Body: '{"test": "data"}', MessageId: 'msg1' },
      { ReceiptHandle: 'rh2', Body: 'plain text', MessageId: 'msg2' },
    ]
    vi.mocked(sqsApi.receiveMessage).mockResolvedValue(mockMessages)

    const { loadMessages, messages, loadingMessages } = useSQS()
    
    const result = await loadMessages('http://localhost:4566/000000000000/test')
    
    expect(result).toHaveLength(2)
    expect(messages.value).toHaveLength(2)
    expect(loadingMessages.value).toBe(false)
  })

  it('loadMessages handles empty', async () => {
    vi.mocked(sqsApi.receiveMessage).mockResolvedValue([])

    const { loadMessages, messages } = useSQS()
    
    const result = await loadMessages('http://localhost:4566/000000000000/test')
    
    expect(result).toEqual([])
    expect(messages.value).toEqual([])
  })

  it('deleteMessageFromQueue calls API and reloads', async () => {
    vi.mocked(sqsApi.deleteMessage).mockResolvedValue({})
    vi.mocked(sqsApi.receiveMessage).mockResolvedValue([])

    const { deleteMessageFromQueue } = useSQS()
    
    await deleteMessageFromQueue('http://localhost:4566/000000000000/test', 'receipt-handle')
    
    expect(sqsApi.deleteMessage).toHaveBeenCalledWith('http://localhost:4566/000000000000/test', 'receipt-handle')
    expect(sqsApi.receiveMessage).toHaveBeenCalledWith('http://localhost:4566/000000000000/test')
  })

  it('toggleQueue adds to expanded and loads attributes', async () => {
    vi.mocked(sqsApi.getQueueAttributes).mockResolvedValue({})

    const { toggleQueue, expandedQueues } = useSQS()
    
    toggleQueue('http://localhost:4566/000000000000/test')
    
    expect(expandedQueues.value.has('http://localhost:4566/000000000000/test')).toBe(true)
  })

  it('toggleQueue removes from expanded when already expanded', async () => {
    const { toggleQueue, expandedQueues } = useSQS()
    expandedQueues.value.add('http://localhost:4566/000000000000/test')
    
    toggleQueue('http://localhost:4566/000000000000/test')
    
    expect(expandedQueues.value.has('http://localhost:4566/000000000000/test')).toBe(false)
  })

  it('formatBody parses JSON', () => {
    const { formatBody } = useSQS()
    
    const result = formatBody('{"key": "value"}')
    
    expect(result).toBe('{\n  "key": "value"\n}')
  })

  it('formatBody returns plain text for non-JSON', () => {
    const { formatBody } = useSQS()
    
    const result = formatBody('plain text message')
    
    expect(result).toBe('plain text message')
  })

  it('formatBody handles invalid JSON', () => {
    const { formatBody } = useSQS()
    
    const result = formatBody('{invalid json}')
    
    expect(result).toBe('{invalid json}')
  })
})