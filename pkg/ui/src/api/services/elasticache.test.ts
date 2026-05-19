import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function mockXmlResponse(xml: string, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    text: () => Promise.resolve(xml),
    json: () => Promise.resolve({}),
    headers: new Headers({ 'content-type': 'text/xml' }),
  }
}

import {
  describeReplicationGroups,
  createReplicationGroup,
  deleteReplicationGroup,
} from './elasticache'

describe('ElastiCache Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('describeReplicationGroups', () => {
    it('returns parsed ReplicationGroups from XML', async () => {
      const xml = `
        <DescribeReplicationGroupsResponse>
          <DescribeReplicationGroupsResult>
            <ReplicationGroups>
              <member>
                <ReplicationGroupId>my-group</ReplicationGroupId>
                <Status>available</Status>
                <CacheNodeType>cache.t3.micro</CacheNodeType>
                <Engine>valkey</Engine>
              </member>
            </ReplicationGroups>
          </DescribeReplicationGroupsResult>
        </DescribeReplicationGroupsResponse>
      `
      mockFetch.mockResolvedValue(mockXmlResponse(xml))
      const result = await describeReplicationGroups()
      expect(result).toHaveLength(1)
      expect(result[0].ReplicationGroupId).toBe('my-group')
      expect(result[0].Status).toBe('available')
      expect(result[0].Engine).toBe('valkey')
    })

    it('returns empty array for empty XML', async () => {
      const xml = `<DescribeReplicationGroupsResponse></DescribeReplicationGroupsResponse>`
      mockFetch.mockResolvedValue(mockXmlResponse(xml))
      const result = await describeReplicationGroups()
      expect(result).toEqual([])
    })
  })

  describe('createReplicationGroup', () => {
    it('returns ReplicationGroup from XML', async () => {
      const xml = `
        <CreateReplicationGroupResponse>
          <CreateReplicationGroupResult>
            <ReplicationGroup>
              <ReplicationGroupId>my-group</ReplicationGroupId>
            </ReplicationGroup>
          </CreateReplicationGroupResult>
        </CreateReplicationGroupResponse>
      `
      mockFetch.mockResolvedValue(mockXmlResponse(xml))
      const result = await createReplicationGroup({
        ReplicationGroupId: 'my-group',
        ReplicationGroupDescription: 'test group',
        Engine: 'valkey',
        CacheNodeType: 'cache.t3.micro',
      })
      expect(result.ReplicationGroupId).toBe('my-group')
    })

    it('sends correct request body', async () => {
      const xml = `<CreateReplicationGroupResponse><CreateReplicationGroupResult><ReplicationGroup><ReplicationGroupId>my-group</ReplicationGroupId></ReplicationGroup></CreateReplicationGroupResult></CreateReplicationGroupResponse>`
      mockFetch.mockResolvedValue(mockXmlResponse(xml))
      await createReplicationGroup({
        ReplicationGroupId: 'my-group',
        Engine: 'valkey',
      })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ReplicationGroupId).toBe('my-group')
      expect(body.Engine).toBe('valkey')
      expect(body.CacheNodeType).toBe('cache.t3.micro')
      expect(body.NumNodeGroups).toBe(1)
      expect(body.Port).toBe(6379)
    })
  })

  describe('deleteReplicationGroup', () => {
    it('sends ReplicationGroupId', async () => {
      mockFetch.mockResolvedValue(mockXmlResponse('', 200))
      await deleteReplicationGroup('my-group')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ReplicationGroupId).toBe('my-group')
    })
  })

  describe('Error handling', () => {
    it('throws APIError on error XML response', async () => {
      const xml = `<ErrorResponse><Error><Code>GroupNotFoundFault</Code><Message>ReplicationGroup not found</Message></Error></ErrorResponse>`
      mockFetch.mockResolvedValue(mockXmlResponse(xml, 404))
      await expect(deleteReplicationGroup('missing')).rejects.toThrow(/ElastiCache/)
    })

    it('throws APIError on error in success response', async () => {
      const xml = `<ErrorResponse><Error><Code>InternalFailure</Code></Error></ErrorResponse>`
      mockFetch.mockResolvedValue(mockXmlResponse(xml, 200))
      await expect(describeReplicationGroups()).rejects.toThrow(/ElastiCache/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'))
      await expect(describeReplicationGroups()).rejects.toThrow(/Failed to/)
    })
  })

  describe('X-Amz-Target header', () => {
    it('sets correct target', async () => {
      mockFetch.mockResolvedValue(mockXmlResponse('<root/>', 200))
      await describeReplicationGroups()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('elasticache.DescribeReplicationGroups')
    })
  })
})
