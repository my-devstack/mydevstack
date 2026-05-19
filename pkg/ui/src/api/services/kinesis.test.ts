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
  createStream,
  describeStream,
  describeStreamSummary,
  deleteStream,
  listStreams,
  listShards,
  getShardIterator,
  getRecords,
  putRecord,
  putRecords,
  mergeShards,
  splitShard,
  updateShardCount,
  enableEnhancedMonitoring,
  disableEnhancedMonitoring,
} from './kinesis'

describe('Kinesis Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('createStream', () => {
    it('sends StreamName and options', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await createStream('my-stream', { ShardCount: 2 })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.StreamName).toBe('my-stream')
      expect(body.ShardCount).toBe(2)
    })
  })

  describe('describeStream', () => {
    it('returns stream description', async () => {
      mockFetch.mockResolvedValue(mockResponse({ StreamDescription: { StreamName: 'my-stream', StreamStatus: 'ACTIVE' } }))
      const result = await describeStream('my-stream')
      expect(result.StreamDescription.StreamStatus).toBe('ACTIVE')
    })
  })

  describe('describeStreamSummary', () => {
    it('returns stream summary', async () => {
      mockFetch.mockResolvedValue(mockResponse({ StreamDescriptionSummary: { StreamName: 'my-stream' } }))
      const result = await describeStreamSummary('my-stream')
      expect(result.StreamDescriptionSummary.StreamName).toBe('my-stream')
    })
  })

  describe('deleteStream', () => {
    it('sends StreamName', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteStream('my-stream')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.StreamName).toBe('my-stream')
    })
  })

  describe('listStreams', () => {
    it('returns stream list', async () => {
      mockFetch.mockResolvedValue(mockResponse({ StreamNames: ['stream1', 'stream2'] }))
      const result = await listStreams()
      expect(result.StreamNames).toHaveLength(2)
    })
  })

  describe('listShards', () => {
    it('sends StreamName', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Shards: [] }))
      await listShards('my-stream')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.StreamName).toBe('my-stream')
    })
  })

  describe('getShardIterator', () => {
    it('sends required params with default type', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ShardIterator: 'iter1' }))
      const result = await getShardIterator('my-stream', 'shard-1')
      expect(result.ShardIterator).toBe('iter1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ShardIteratorType).toBe('LATEST')
    })
  })

  describe('getRecords', () => {
    it('sends ShardIterator', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Records: [] }))
      const result = await getRecords('iter1')
      expect(result.Records).toEqual([])
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ShardIterator).toBe('iter1')
    })
  })

  describe('putRecord', () => {
    it('sends base64-encoded Data', async () => {
      mockFetch.mockResolvedValue(mockResponse({ SequenceNumber: 'seq1' }))
      const result = await putRecord('my-stream', 'hello', 'pk1')
      expect(result.SequenceNumber).toBe('seq1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Data).toBe(btoa('hello'))
      expect(body.PartitionKey).toBe('pk1')
    })
  })

  describe('putRecords', () => {
    it('sends base64-encoded records', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Records: [{ SequenceNumber: 's1' }] }))
      const result = await putRecords('my-stream', [{ Data: 'msg1', PartitionKey: 'pk1' }])
      expect(result.Records[0].SequenceNumber).toBe('s1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Records[0].Data).toBe(btoa('msg1'))
    })
  })

  describe('mergeShards', () => {
    it('sends merge params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await mergeShards('my-stream', 'shard-1', 'shard-2')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ShardToMerge).toBe('shard-1')
      expect(body.AdjacentShardToMerge).toBe('shard-2')
    })
  })

  describe('splitShard', () => {
    it('sends split params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await splitShard('my-stream', 'shard-1', '100')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.NewStartingHashKey).toBe('100')
    })
  })

  describe('updateShardCount', () => {
    it('sends scaling params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateShardCount('my-stream', 3)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.TargetShardCount).toBe(3)
      expect(body.ScalingType).toBe('UNIFORM_SCALING')
    })
  })

  describe('enableEnhancedMonitoring', () => {
    it('sends ShardLevelMetrics', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await enableEnhancedMonitoring('my-stream', ['IncomingBytes'])
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ShardLevelMetrics).toEqual(['IncomingBytes'])
    })
  })

  describe('disableEnhancedMonitoring', () => {
    it('sends ShardLevelMetrics', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await disableEnhancedMonitoring('my-stream', ['IncomingBytes'])
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ShardLevelMetrics).toEqual(['IncomingBytes'])
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(listStreams()).rejects.toThrow(/Kinesis ListStreams failed/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listStreams()).rejects.toThrow(/Failed to ListStreams/)
    })
  })

  describe('X-Amz-Target header', () => {
    it('uses action as target (no prefix)', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await listStreams()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('ListStreams')
    })
  })
})
