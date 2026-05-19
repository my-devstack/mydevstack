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

    it('sends params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await listClustersV2({ MaxResults: 10 })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.MaxResults).toBe(10)
    })
  })

  describe('describeClusterV2', () => {
    it('sends ClusterArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ClusterInfo: { ClusterArn: 'arn:msk:c1' } }))
      const result = await describeClusterV2('arn:msk:c1')
      expect(result.ClusterInfo.ClusterArn).toBe('arn:msk:c1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ClusterArn).toBe('arn:msk:c1')
    })
  })

  describe('createClusterV2', () => {
    it('sends params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ClusterArn: 'arn:msk:new' }))
      const result = await createClusterV2({ ClusterName: 'my-cluster' })
      expect(result.ClusterArn).toBe('arn:msk:new')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ClusterName).toBe('my-cluster')
    })
  })

  describe('deleteCluster', () => {
    it('sends ClusterArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteCluster('arn:msk:c1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ClusterArn).toBe('arn:msk:c1')
    })
  })

  describe('getBootstrapBrokers', () => {
    it('returns broker info', async () => {
      mockFetch.mockResolvedValue(mockResponse({ BootstrapBrokerString: 'broker1:9092' }))
      const result = await getBootstrapBrokers('arn:msk:c1')
      expect(result.BootstrapBrokerString).toBe('broker1:9092')
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(listClustersV2()).rejects.toThrow(/MSK ListClustersV2 failed/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listClustersV2()).rejects.toThrow(/Failed to/)
    })
  })

  describe('Headers', () => {
    it('uses Kafka target and x-amz-json-1.1 content type', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await listClustersV2()
      expect(mockFetch.mock.calls[0][1].headers['Content-Type']).toBe('application/x-amz-json-1.1')
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('Kafka.ListClustersV2')
    })
  })
})
