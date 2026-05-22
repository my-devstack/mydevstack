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
  increaseStreamRetentionPeriod,
  decreaseStreamRetentionPeriod,
  enableEnhancedMonitoring,
  disableEnhancedMonitoring,
} from './kinesis'

describe('Kinesis Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('createStream', () => {
    it('POST /kinesis/streams with StreamName and options', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await createStream('my-stream', { ShardCount: 2 })
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/kinesis\/streams$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.StreamName).toBe('my-stream')
      expect(body.ShardCount).toBe(2)
    })
  })

  describe('listStreams', () => {
    it('GET /kinesis/streams returns stream list', async () => {
      mockFetch.mockResolvedValue(mockResponse({ StreamNames: ['stream1', 'stream2'] }))
      const result = await listStreams()
      expect(result.StreamNames).toHaveLength(2)
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/kinesis\/streams$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })

    it('passes ExclusiveStartStreamName and Limit as query params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ StreamNames: ['stream1'] }))
      await listStreams({ ExclusiveStartStreamName: 'stream0', Limit: 10 })
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('ExclusiveStartStreamName=stream0')
      expect(url).toContain('Limit=10')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('describeStream', () => {
    it('GET /kinesis/streams/{streamName} returns description', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ StreamDescription: { StreamName: 'my-stream', StreamStatus: 'ACTIVE' } }),
      )
      const result = await describeStream('my-stream')
      expect(result.StreamDescription.StreamStatus).toBe('ACTIVE')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/kinesis\/streams\/my-stream$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('describeStreamSummary', () => {
    it('GET /kinesis/streams/{streamName}/summary', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ StreamDescriptionSummary: { StreamName: 'my-stream' } }),
      )
      const result = await describeStreamSummary('my-stream')
      expect(result.StreamDescriptionSummary.StreamName).toBe('my-stream')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/kinesis\/streams\/my-stream\/summary$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('deleteStream', () => {
    it('DELETE /kinesis/streams/{streamName}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteStream('my-stream')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/kinesis\/streams\/my-stream$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('putRecord', () => {
    it('POST /kinesis/streams/{streamName}/records with base64 Data', async () => {
      mockFetch.mockResolvedValue(mockResponse({ SequenceNumber: 'seq1' }))
      const result = await putRecord('my-stream', 'hello', 'pk1')
      expect(result.SequenceNumber).toBe('seq1')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/kinesis\/streams\/my-stream\/records$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Data).toBe(btoa('hello'))
      expect(body.PartitionKey).toBe('pk1')
    })
  })

  describe('putRecords', () => {
    it('POST /kinesis/streams/{streamName}/records/batch with base64 records', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Records: [{ SequenceNumber: 's1' }] }))
      const result = await putRecords('my-stream', [{ Data: 'msg1', PartitionKey: 'pk1' }])
      expect(result.Records[0].SequenceNumber).toBe('s1')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/kinesis\/streams\/my-stream\/records\/batch$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Records[0].Data).toBe(btoa('msg1'))
    })
  })

  describe('getRecords', () => {
    it('POST /kinesis/records with ShardIterator', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Records: [] }))
      const result = await getRecords('iter1')
      expect(result.Records).toEqual([])
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/kinesis\/records$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ShardIterator).toBe('iter1')
    })
  })

  describe('getShardIterator', () => {
    it('POST /kinesis/streams/{streamName}/shard-iterator with default type', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ShardIterator: 'iter1' }))
      const result = await getShardIterator('my-stream', 'shard-1')
      expect(result.ShardIterator).toBe('iter1')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/kinesis\/streams\/my-stream\/shard-iterator$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ShardIteratorType).toBe('LATEST')
      expect(body.ShardId).toBe('shard-1')
    })
  })

  describe('listShards', () => {
    it('GET /kinesis/streams/{streamName}/shards', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Shards: [] }))
      await listShards('my-stream')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/kinesis\/streams\/my-stream\/shards$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })

    it('passes ExclusiveStartShardId and MaxResults as query params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Shards: [] }))
      await listShards('my-stream', { ExclusiveStartShardId: 'shard-0', MaxResults: 5 })
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('ExclusiveStartShardId=shard-0')
      expect(url).toContain('MaxResults=5')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('splitShard', () => {
    it('POST /kinesis/streams/{streamName}/shards/split', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await splitShard('my-stream', 'shard-1', '100')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/kinesis\/streams\/my-stream\/shards\/split$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.NewStartingHashKey).toBe('100')
    })
  })

  describe('mergeShards', () => {
    it('POST /kinesis/streams/{streamName}/shards/merge', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await mergeShards('my-stream', 'shard-1', 'shard-2')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/kinesis\/streams\/my-stream\/shards\/merge$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ShardToMerge).toBe('shard-1')
      expect(body.AdjacentShardToMerge).toBe('shard-2')
    })
  })

  describe('updateShardCount', () => {
    it('POST /kinesis/streams/{streamName}/shards/count', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateShardCount('my-stream', 3)
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/kinesis\/streams\/my-stream\/shards\/count$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.TargetShardCount).toBe(3)
      expect(body.ScalingType).toBe('UNIFORM_SCALING')
    })
  })

  describe('increaseStreamRetentionPeriod', () => {
    it('POST /kinesis/streams/{streamName}/retention/increase', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await increaseStreamRetentionPeriod('my-stream', 48)
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/kinesis\/streams\/my-stream\/retention\/increase$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.RetentionPeriodHours).toBe(48)
    })
  })

  describe('decreaseStreamRetentionPeriod', () => {
    it('POST /kinesis/streams/{streamName}/retention/decrease', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await decreaseStreamRetentionPeriod('my-stream', 24)
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/kinesis\/streams\/my-stream\/retention\/decrease$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.RetentionPeriodHours).toBe(24)
    })
  })

  describe('enableEnhancedMonitoring', () => {
    it('POST /kinesis/streams/{streamName}/enhanced-monitoring', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await enableEnhancedMonitoring('my-stream', ['IncomingBytes'])
      expect(mockFetch.mock.calls[0][0]).toMatch(
        /\/kinesis\/streams\/my-stream\/enhanced-monitoring$/,
      )
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ShardLevelMetrics).toEqual(['IncomingBytes'])
    })
  })

  describe('disableEnhancedMonitoring', () => {
    it('DELETE /kinesis/streams/{streamName}/enhanced-monitoring', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await disableEnhancedMonitoring('my-stream', ['IncomingBytes'])
      expect(mockFetch.mock.calls[0][0]).toMatch(
        /\/kinesis\/streams\/my-stream\/enhanced-monitoring$/,
      )
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ShardLevelMetrics).toEqual(['IncomingBytes'])
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(listStreams()).rejects.toThrow(/Kinesis GET \/kinesis\/streams failed/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listStreams()).rejects.toThrow(/Failed to GET \/kinesis\/streams/)
    })
  })
})
