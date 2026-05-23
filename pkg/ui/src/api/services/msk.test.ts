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
  listClustersV2,
  describeClusterV2,
  createClusterV2,
  deleteCluster,
  getBootstrapBrokers,
} from './msk'

describe('MSK Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('listClustersV2', () => {
    it('returns clusters list', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ClusterInfoList: [{ ClusterArn: 'arn:msk:cluster1' }] }))
      const result = await listClustersV2()
      expect(result.ClusterInfoList).toHaveLength(1)
    })

    it('passes params as query string', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await listClustersV2({ MaxResults: 10 })
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/msk/clusters?MaxResults=10')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })

    it('omits query when no params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await listClustersV2()
      const url = mockFetch.mock.calls[0][0]
      expect(url).toMatch(/\/msk\/clusters$/)
    })
  })

  describe('describeClusterV2', () => {
    it('encodes ARN in URL', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ClusterInfo: { ClusterArn: 'arn:msk:c1' } }))
      const result = await describeClusterV2('arn:msk:c1')
      expect(result.ClusterInfo.ClusterArn).toBe('arn:msk:c1')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain(encodeURIComponent('arn:msk:c1'))
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('createClusterV2', () => {
    it('sends params as POST body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ClusterArn: 'arn:msk:new' }))
      const result = await createClusterV2({ ClusterName: 'my-cluster' })
      expect(result.ClusterArn).toBe('arn:msk:new')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/msk/clusters')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ClusterName).toBe('my-cluster')
    })
  })

  describe('deleteCluster', () => {
    it('uses ARN in URL', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteCluster('arn:msk:c1')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain(encodeURIComponent('arn:msk:c1'))
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('getBootstrapBrokers', () => {
    it('returns broker info', async () => {
      mockFetch.mockResolvedValue(mockResponse({ BootstrapBrokerString: 'broker1:9092' }))
      const result = await getBootstrapBrokers('arn:msk:c1')
      expect(result.BootstrapBrokerString).toBe('broker1:9092')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain(encodeURIComponent('arn:msk:c1'))
      expect(url).toContain('/bootstrap-brokers')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(listClustersV2()).rejects.toThrow(/MSK request failed/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listClustersV2()).rejects.toThrow(/Failed to call MSK service/)
    })
  })

  describe('Headers', () => {
    it('uses application/json content type', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await listClustersV2()
      expect(mockFetch.mock.calls[0][1].headers['Content-Type']).toBe('application/json')
    })

    it('does not send X-Amz-Target', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await listClustersV2()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBeUndefined()
    })
  })
})
