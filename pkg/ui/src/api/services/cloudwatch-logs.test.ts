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
  describeLogGroups,
  createLogGroup,
  deleteLogGroup,
  describeLogStreams,
  createLogStream,
  putLogEvents,
  getLogEvents,
  putRetentionPolicy,
} from './cloudwatch-logs'

describe('CloudWatch Logs Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('describeLogGroups', () => {
    it('returns LogGroups', async () => {
      mockFetch.mockResolvedValue(mockResponse({ LogGroups: [{ logGroupName: '/aws/lambda/test' }] }))
      const result = await describeLogGroups()
      expect(result.LogGroups).toHaveLength(1)
    })
  })

  describe('createLogGroup', () => {
    it('sends logGroupName and tags', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await createLogGroup({ logGroupName: '/aws/lambda/test', tags: { Env: 'dev' } })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.logGroupName).toBe('/aws/lambda/test')
      expect(body.tags.Env).toBe('dev')
    })
  })

  describe('deleteLogGroup', () => {
    it('sends logGroupName', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteLogGroup('/aws/lambda/test')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.logGroupName).toBe('/aws/lambda/test')
    })
  })

  describe('describeLogStreams', () => {
    it('returns LogStreams', async () => {
      mockFetch.mockResolvedValue(mockResponse({ LogStreams: [{ logStreamName: 'stream1' }] }))
      const result = await describeLogStreams({ logGroupName: '/aws/lambda/test' })
      expect(result.LogStreams).toHaveLength(1)
    })
  })

  describe('createLogStream', () => {
    it('sends logGroupName and logStreamName', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await createLogStream({ logGroupName: '/aws/lambda/test', logStreamName: 'stream1' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.logGroupName).toBe('/aws/lambda/test')
      expect(body.logStreamName).toBe('stream1')
    })
  })

  describe('putLogEvents', () => {
    it('sends log events', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const events = [{ timestamp: Date.now(), message: 'test log' }]
      await putLogEvents({ logGroupName: '/aws/lambda/test', logStreamName: 'stream1', logEvents: events })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.logEvents).toHaveLength(1)
      expect(body.logEvents[0].message).toBe('test log')
    })
  })

  describe('getLogEvents', () => {
    it('returns Events', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Events: [{ message: 'test' }] }))
      const result = await getLogEvents({ logGroupName: '/aws/lambda/test', logStreamName: 'stream1' })
      expect(result.Events).toHaveLength(1)
    })
  })

  describe('putRetentionPolicy', () => {
    it('sends retention policy', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putRetentionPolicy({ logGroupName: '/aws/lambda/test', retentionInDays: 30 })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.retentionInDays).toBe(30)
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(describeLogGroups()).rejects.toThrow(/CloudWatch Logs DescribeLogGroups failed/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'))
      await expect(describeLogGroups()).rejects.toThrow(/Failed to DescribeLogGroups/)
    })
  })

  describe('X-Amz-Target header', () => {
    it('uses CloudWatchLogs prefix', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await describeLogGroups()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('CloudWatchLogs.DescribeLogGroups')
    })
  })
})
