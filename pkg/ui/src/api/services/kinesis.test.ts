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
  deleteStream,
  listStreams,
  getShardIterator,
  getRecords,
  putRecord,
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

  describe('getRecords', () => {
    it('GET /kinesis/streams/{streamName}/shards/{shardId}/records with ShardIterator', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Records: [] }))
      const result = await getRecords('test-stream', 'shard-1', 'iter1')
      expect(result.Records).toEqual([])
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/kinesis\/streams\/test-stream\/shards\/shard-1\/records$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ShardIterator).toBe('iter1')
    })
  })

  describe('getShardIterator', () => {
    it('POST /kinesis/streams/{streamName}/shards/{shardId}/iterator with default type', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ShardIterator: 'iter1' }))
      const result = await getShardIterator('my-stream', 'shard-1')
      expect(result.ShardIterator).toBe('iter1')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/kinesis\/streams\/my-stream\/shards\/shard-1\/iterator$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ShardIteratorType).toBe('LATEST')
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
