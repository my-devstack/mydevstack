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

    it('correctly uses GET /opensearch/domains', async () => {
      mockFetch.mockResolvedValue(mockResponse({ DomainNames: [] }))
      await listDomainNames()
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/opensearch/domains')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('describeDomain', () => {
    it('returns domain details', async () => {
      mockFetch.mockResolvedValue(mockResponse({ DomainStatus: { DomainName: 'my-domain', Created: true } }))
      const result = await describeDomain('my-domain')
      expect(result.DomainStatus.Created).toBe(true)
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/opensearch/domains/my-domain')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('createDomain', () => {
    it('sends domain config as POST body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ DomainStatus: { DomainName: 'new-domain' } }))
      const result = await createDomain({ DomainName: 'new-domain', EngineVersion: 'OpenSearch_2.3' })
      expect(result.DomainStatus.DomainName).toBe('new-domain')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/opensearch/domains')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.DomainName).toBe('new-domain')
    })
  })

  describe('deleteDomain', () => {
    it('uses domain name in URL', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteDomain('my-domain')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/opensearch/domains/my-domain')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('getCompatibleVersions', () => {
    it('returns compatible versions', async () => {
      mockFetch.mockResolvedValue(mockResponse({ CompatibleVersions: [] }))
      const result = await getCompatibleVersions()
      expect(result.CompatibleVersions).toEqual([])
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/opensearch/compatible-versions')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('listTags', () => {
    it('encodes ARN in URL', async () => {
      mockFetch.mockResolvedValue(mockResponse({ TagList: [] }))
      await listTags('arn:aws:es:domain/my-domain')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain(encodeURIComponent('arn:aws:es:domain/my-domain'))
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('tagResource', () => {
    it('sends tag info as POST body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await tagResource('arn:aws:es:domain/my-domain', 'Env', 'dev')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain(encodeURIComponent('arn:aws:es:domain/my-domain'))
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Key).toBe('Env')
      expect(body.Value).toBe('dev')
    })
  })

  describe('untagResource', () => {
    it('sends tag key as DELETE body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await untagResource('arn:aws:es:domain/my-domain', 'Env')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain(encodeURIComponent('arn:aws:es:domain/my-domain'))
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Key).toBe('Env')
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(listDomainNames()).rejects.toThrow(/OpenSearch request failed/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listDomainNames()).rejects.toThrow(/Failed to call OpenSearch service/)
    })
  })

  describe('Headers', () => {
    it('uses application/json content type', async () => {
      mockFetch.mockResolvedValue(mockResponse({ DomainNames: [] }))
      await listDomainNames()
      expect(mockFetch.mock.calls[0][1].headers['Content-Type']).toBe('application/json')
    })

    it('does not send X-Amz-Target', async () => {
      mockFetch.mockResolvedValue(mockResponse({ DomainNames: [] }))
      await listDomainNames()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBeUndefined()
    })
  })
})
