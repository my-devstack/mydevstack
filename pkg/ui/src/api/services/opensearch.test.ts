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
  listDomainNames,
  describeDomain,
  createDomain,
  deleteDomain,
  getCompatibleVersions,
  listTags,
  tagResource,
  untagResource,
} from './opensearch'

describe('OpenSearch Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('listDomainNames', () => {
    it('returns mapped domains', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        DomainNames: [{ DomainName: 'my-domain', EngineType: 'OpenSearch' }],
      }))
      const result = await listDomainNames()
      expect(result).toHaveLength(1)
      expect(result[0].DomainName).toBe('my-domain')
      expect(result[0].EngineVersion).toBe('OpenSearch')
    })

    it('handles EngineVersion field', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        DomainNames: [{ DomainName: 'my-domain', EngineVersion: 'OpenSearch_2.3' }],
      }))
      const result = await listDomainNames()
      expect(result[0].EngineVersion).toBe('OpenSearch_2.3')
    })

    it('handles empty response', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listDomainNames()
      expect(result).toEqual([])
    })
  })

  describe('describeDomain', () => {
    it('returns domain details', async () => {
      mockFetch.mockResolvedValue(mockResponse({ DomainStatus: { DomainName: 'my-domain', Created: true } }))
      const result = await describeDomain('my-domain')
      expect(result.DomainStatus.Created).toBe(true)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.DomainName).toBe('my-domain')
    })
  })

  describe('createDomain', () => {
    it('sends domain config', async () => {
      mockFetch.mockResolvedValue(mockResponse({ DomainStatus: { DomainName: 'new-domain' } }))
      const result = await createDomain({ DomainName: 'new-domain', EngineVersion: 'OpenSearch_2.3' })
      expect(result.DomainStatus.DomainName).toBe('new-domain')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.DomainName).toBe('new-domain')
    })
  })

  describe('deleteDomain', () => {
    it('sends DomainName', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteDomain('my-domain')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.DomainName).toBe('my-domain')
    })
  })

  describe('getCompatibleVersions', () => {
    it('returns compatible versions', async () => {
      mockFetch.mockResolvedValue(mockResponse({ CompatibleVersions: [] }))
      const result = await getCompatibleVersions()
      expect(result.CompatibleVersions).toEqual([])
    })
  })

  describe('listTags', () => {
    it('sends ARN', async () => {
      mockFetch.mockResolvedValue(mockResponse({ TagList: [] }))
      await listTags('arn:aws:es:domain/my-domain')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ARN).toBe('arn:aws:es:domain/my-domain')
    })
  })

  describe('tagResource', () => {
    it('sends tag info', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await tagResource('arn:aws:es:domain/my-domain', 'Env', 'dev')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ARN).toBe('arn:aws:es:domain/my-domain')
      expect(body.TagList[0].Key).toBe('Env')
    })
  })

  describe('untagResource', () => {
    it('sends tag keys', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await untagResource('arn:aws:es:domain/my-domain', 'Env')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.TagKeys).toEqual(['Env'])
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(listDomainNames()).rejects.toThrow(/OpenSearch ListDomainNames failed/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listDomainNames()).rejects.toThrow(/Failed to/)
    })
  })

  describe('X-Amz-Target header', () => {
    it('uses opensearch prefix', async () => {
      mockFetch.mockResolvedValue(mockResponse({ DomainNames: [] }))
      await listDomainNames()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('opensearch.ListDomainNames')
    })
  })
})
