import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLambdaEventSourceMapping } from './useLambdaEventSourceMapping'
import * as lambdaApi from '@/api/services/lambda'

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

vi.mock('@/api/services/lambda')

describe('useLambdaEventSourceMapping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const { mappings, loading, selectedMapping, creating, deleting } = useLambdaEventSourceMapping()
    expect(mappings.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(selectedMapping.value).toBeNull()
    expect(creating.value).toBe(false)
    expect(deleting.value).toBe(false)
  })

  describe('loadMappings', () => {
    it('loads mappings without function filter', async () => {
      const mockMappings = [{ UUID: 'uuid-1', FunctionArn: 'arn:aws:lambda:func-1' }]
      vi.mocked(lambdaApi.listEventSourceMappings).mockResolvedValue({
        EventSourceMappings: mockMappings,
      } as any)

      const { mappings, loading, loadMappings } = useLambdaEventSourceMapping()
      await loadMappings()

      expect(lambdaApi.listEventSourceMappings).toHaveBeenCalledWith(undefined)
      expect(mappings.value).toEqual(mockMappings)
      expect(loading.value).toBe(false)
    })

    it('loads mappings with function filter', async () => {
      vi.mocked(lambdaApi.listEventSourceMappings).mockResolvedValue({
        EventSourceMappings: [],
      } as any)

      const { loadMappings } = useLambdaEventSourceMapping()
      await loadMappings('my-function')

      expect(lambdaApi.listEventSourceMappings).toHaveBeenCalledWith({
        FunctionName: 'my-function',
      })
    })

    it('handles error', async () => {
      vi.mocked(lambdaApi.listEventSourceMappings).mockRejectedValue(
        new Error('Network error')
      )

      const { mappings, loading, loadMappings } = useLambdaEventSourceMapping()
      await loadMappings()

      expect(mappings.value).toEqual([])
      expect(loading.value).toBe(false)
    })

    it('sets loading state during fetch', async () => {
      vi.mocked(lambdaApi.listEventSourceMappings).mockImplementation(
        async () => {
          // Return after tick to test loading
          await new Promise((r) => setTimeout(r, 10))
          return { EventSourceMappings: [] } as any
        }
      )

      const { loading, loadMappings } = useLambdaEventSourceMapping()
      const promise = loadMappings()
      expect(loading.value).toBe(true)
      await promise
      expect(loading.value).toBe(false)
    })
  })

  describe('createMapping', () => {
    const mockData = {
      functionName: 'my-func',
      eventSourceArn: 'arn:aws:sqs:us-east-1:123:my-queue',
      batchSize: 10,
      maxBatchingWindow: 5,
      parallelizationFactor: 2,
    }

    it('creates mapping with basic params', async () => {
      vi.mocked(lambdaApi.createEventSourceMapping).mockResolvedValue({} as any)
      vi.mocked(lambdaApi.listEventSourceMappings).mockResolvedValue({
        EventSourceMappings: [],
      } as any)

      const { creating, createMapping } = useLambdaEventSourceMapping()
      await createMapping(mockData)

      expect(lambdaApi.createEventSourceMapping).toHaveBeenCalledWith({
        FunctionName: 'my-func',
        EventSourceArn: 'arn:aws:sqs:us-east-1:123:my-queue',
        BatchSize: 10,
        MaximumBatchingWindowInSeconds: 5,
        ParallelizationFactor: 2,
      })
      expect(creating.value).toBe(false)
    })

    it('creates mapping with destinations', async () => {
      vi.mocked(lambdaApi.createEventSourceMapping).mockResolvedValue({} as any)
      vi.mocked(lambdaApi.listEventSourceMappings).mockResolvedValue({
        EventSourceMappings: [],
      } as any)

      const { createMapping } = useLambdaEventSourceMapping()
      await createMapping({
        ...mockData,
        onSuccessDestination: 'arn:aws:sqs:success-queue',
        onFailureDestination: 'arn:aws:sqs:fail-queue',
      })

      expect(lambdaApi.createEventSourceMapping).toHaveBeenCalledWith(
        expect.objectContaining({
          DestinationConfig: {
            OnSuccess: { Destination: 'arn:aws:sqs:success-queue' },
            OnFailure: { Destination: 'arn:aws:sqs:fail-queue' },
          },
        })
      )
    })

    it('creates mapping with only onSuccess destination', async () => {
      vi.mocked(lambdaApi.createEventSourceMapping).mockResolvedValue({} as any)
      vi.mocked(lambdaApi.listEventSourceMappings).mockResolvedValue({
        EventSourceMappings: [],
      } as any)

      const { createMapping } = useLambdaEventSourceMapping()
      await createMapping({
        ...mockData,
        onSuccessDestination: 'arn:aws:sqs:success-queue',
      })

      expect(lambdaApi.createEventSourceMapping).toHaveBeenCalledWith(
        expect.objectContaining({
          DestinationConfig: {
            OnSuccess: { Destination: 'arn:aws:sqs:success-queue' },
          },
        })
      )
      // OnFailure should not be set
      const call = vi.mocked(lambdaApi.createEventSourceMapping).mock.calls[0][0] as any
      expect(call.DestinationConfig.OnFailure).toBeUndefined()
    })

    it('creates mapping with only onFailure destination', async () => {
      vi.mocked(lambdaApi.createEventSourceMapping).mockResolvedValue({} as any)
      vi.mocked(lambdaApi.listEventSourceMappings).mockResolvedValue({
        EventSourceMappings: [],
      } as any)

      const { createMapping } = useLambdaEventSourceMapping()
      await createMapping({
        ...mockData,
        onFailureDestination: 'arn:aws:sqs:fail-queue',
      })

      expect(lambdaApi.createEventSourceMapping).toHaveBeenCalledWith(
        expect.objectContaining({
          DestinationConfig: {
            OnFailure: { Destination: 'arn:aws:sqs:fail-queue' },
          },
        })
      )
      const call = vi.mocked(lambdaApi.createEventSourceMapping).mock.calls[0][0] as any
      expect(call.DestinationConfig.OnSuccess).toBeUndefined()
    })

    it('handles error and throws', async () => {
      vi.mocked(lambdaApi.createEventSourceMapping).mockRejectedValue(
        new Error('Create failed')
      )

      const { creating, createMapping } = useLambdaEventSourceMapping()
      await expect(createMapping(mockData)).rejects.toThrow('Create failed')
      expect(creating.value).toBe(false)
    })
  })

  describe('deleteMapping', () => {
    it('deletes mapping by UUID', async () => {
      vi.mocked(lambdaApi.deleteEventSourceMapping).mockResolvedValue({} as any)
      vi.mocked(lambdaApi.listEventSourceMappings).mockResolvedValue({
        EventSourceMappings: [],
      } as any)

      const { deleting, deleteMapping } = useLambdaEventSourceMapping()
      await deleteMapping('uuid-1')

      expect(lambdaApi.deleteEventSourceMapping).toHaveBeenCalledWith('uuid-1')
      expect(deleting.value).toBe(false)
    })

    it('clears selected mapping if matches', async () => {
      vi.mocked(lambdaApi.deleteEventSourceMapping).mockResolvedValue({} as any)
      vi.mocked(lambdaApi.listEventSourceMappings).mockResolvedValue({
        EventSourceMappings: [],
      } as any)

      const { selectedMapping, deleteMapping } = useLambdaEventSourceMapping()
      selectedMapping.value = { UUID: 'uuid-1' } as any

      await deleteMapping('uuid-1')

      expect(selectedMapping.value).toBeNull()
    })

    it('does not clear selected mapping if different', async () => {
      vi.mocked(lambdaApi.deleteEventSourceMapping).mockResolvedValue({} as any)
      vi.mocked(lambdaApi.listEventSourceMappings).mockResolvedValue({
        EventSourceMappings: [],
      } as any)

      const { selectedMapping, deleteMapping } = useLambdaEventSourceMapping()
      selectedMapping.value = { UUID: 'uuid-2' } as any

      await deleteMapping('uuid-1')

      expect(selectedMapping.value).not.toBeNull()
      expect(selectedMapping.value!.UUID).toBe('uuid-2')
    })

    it('handles error and throws', async () => {
      vi.mocked(lambdaApi.deleteEventSourceMapping).mockRejectedValue(
        new Error('Delete failed')
      )

      const { deleting, deleteMapping } = useLambdaEventSourceMapping()
      await expect(deleteMapping('uuid-1')).rejects.toThrow('Delete failed')
      expect(deleting.value).toBe(false)
    })
  })

  describe('getMapping', () => {
    it('gets mapping by UUID', async () => {
      const mockMapping = {
        UUID: 'uuid-1',
        FunctionArn: 'arn:aws:lambda:func-1',
        EventSourceArn: 'arn:aws:sqs:queue-1',
      }
      vi.mocked(lambdaApi.getEventSourceMapping).mockResolvedValue(
        mockMapping as any
      )

      const { selectedMapping, getMapping } = useLambdaEventSourceMapping()
      const result = await getMapping('uuid-1')

      expect(lambdaApi.getEventSourceMapping).toHaveBeenCalledWith('uuid-1')
      expect(selectedMapping.value).toEqual(mockMapping)
      expect(result).toEqual(mockMapping)
    })

    it('handles error and throws', async () => {
      vi.mocked(lambdaApi.getEventSourceMapping).mockRejectedValue(
        new Error('Not found')
      )

      const { getMapping } = useLambdaEventSourceMapping()
      await expect(getMapping('nonexistent')).rejects.toThrow('Not found')
    })
  })
})
