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

    it('sends GET to /cloudwatch-logs/log-groups', async () => {
      mockFetch.mockResolvedValue(mockResponse({ LogGroups: [] }))
      await describeLogGroups()
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch-logs/log-groups')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
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

    it('sends POST to /cloudwatch-logs/log-groups', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await createLogGroup({ logGroupName: '/aws/lambda/test' })
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch-logs/log-groups')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('deleteLogGroup', () => {
    it('sends DELETE to /cloudwatch-logs/log-groups/{logGroupName}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteLogGroup('/aws/lambda/test')
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch-logs/log-groups/%2Faws%2Flambda%2Ftest')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
      expect(mockFetch.mock.calls[0][1].body).toBeUndefined()
    })

    it('encodes log group name in URL', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteLogGroup('my group')
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch-logs/log-groups/my%20group')
    })
  })

  describe('describeLogStreams', () => {
    it('returns LogStreams', async () => {
      mockFetch.mockResolvedValue(mockResponse({ LogStreams: [{ logStreamName: 'stream1' }] }))
      const result = await describeLogStreams('/aws/lambda/test')
      expect(result.LogStreams).toHaveLength(1)
    })

    it('sends GET to /cloudwatch-logs/log-groups/{logGroupName}/log-streams', async () => {
      mockFetch.mockResolvedValue(mockResponse({ LogStreams: [] }))
      await describeLogStreams('/aws/lambda/test')
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch-logs/log-groups/%2Faws%2Flambda%2Ftest/log-streams')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('createLogStream', () => {
    it('sends logStreamName', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await createLogStream('/aws/lambda/test', 'stream1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.logStreamName).toBe('stream1')
      expect(body.logGroupName).toBeUndefined()
    })

    it('sends POST to /cloudwatch-logs/log-groups/{logGroupName}/log-streams', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await createLogStream('/aws/lambda/test', 'stream1')
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch-logs/log-groups/%2Faws%2Flambda%2Ftest/log-streams')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('putLogEvents', () => {
    it('sends log events', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const events = [{ timestamp: Date.now(), message: 'test log' }]
      await putLogEvents('/aws/lambda/test', 'stream1', events)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.logEvents).toHaveLength(1)
      expect(body.logEvents[0].message).toBe('test log')
    })

    it('sends POST to /cloudwatch-logs/log-groups/{logGroupName}/log-streams/{logStreamName}/events', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putLogEvents('/aws/lambda/test', 'stream1', [{ timestamp: 1, message: 'test' }])
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch-logs/log-groups/%2Faws%2Flambda%2Ftest/log-streams/stream1/events')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('getLogEvents', () => {
    it('returns Events', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Events: [{ message: 'test' }] }))
      const result = await getLogEvents('/aws/lambda/test', 'stream1')
      expect(result.Events).toHaveLength(1)
    })

    it('sends GET to /cloudwatch-logs/log-groups/{logGroupName}/log-streams/{logStreamName}/events', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Events: [] }))
      await getLogEvents('/aws/lambda/test', 'stream1')
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch-logs/log-groups/%2Faws%2Flambda%2Ftest/log-streams/stream1/events')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('putRetentionPolicy', () => {
    it('sends retentionInDays in body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putRetentionPolicy('/aws/lambda/test', 30)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.retentionInDays).toBe(30)
      expect(body.logGroupName).toBeUndefined()
    })

    it('sends PUT to /cloudwatch-logs/log-groups/{logGroupName}/retention', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putRetentionPolicy('/aws/lambda/test', 30)
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch-logs/log-groups/%2Faws%2Flambda%2Ftest/retention')
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
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

  describe('encodeURIComponent for path params', () => {
    it('encodes log group names with special characters', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteLogGroup('test/group')
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch-logs/log-groups/test%2Fgroup')
    })

    it('encodes log stream names in putLogEvents', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putLogEvents('group', 'my stream', [{ timestamp: 1, message: 'test' }])
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch-logs/log-groups/group/log-streams/my%20stream/events')
    })

    it('encodes log group name in describeLogStreams', async () => {
      mockFetch.mockResolvedValue(mockResponse({ LogStreams: [] }))
      await describeLogStreams('my group')
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch-logs/log-groups/my%20group/log-streams')
    })
  })
})
