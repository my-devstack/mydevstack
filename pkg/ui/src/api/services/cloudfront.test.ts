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
  cloudfrontService,
  listDistributions,
  createDistribution,
  getDistribution,
  updateDistribution,
  deleteDistribution,
  listInvalidations,
  createInvalidation,
  listOriginAccessControls,
  createOriginAccessControl,
  deleteOriginAccessControl,
  localViewerUrl,
} from './cloudfront'
import cloudfront from './cloudfront'
import { APIError } from '../client'

describe('CloudFront Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('listDistributions', () => {
    it('GET /cloudfront/distributions returns distributions', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          DistributionList: {
            Items: [{ Id: 'E123', DomainName: 'd123.cloudfront.net' }],
            Quantity: 1,
          },
        }),
      )
      const result = await listDistributions()
      expect(result.DistributionList.Items).toHaveLength(1)
      expect(result.DistributionList.Quantity).toBe(1)
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/cloudfront\/distributions$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })

    it('defaults to empty array when missing', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listDistributions()
      expect(result.DistributionList.Items).toEqual([])
      expect(result.DistributionList.Quantity).toBe(0)
    })
  })

  describe('createDistribution', () => {
    it('POST /cloudfront/distributions with distribution params', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          Distribution: { Id: 'E123', DomainName: 'd123.cloudfront.net' },
          ETag: 'E123ETag',
        }),
      )
      const result = await createDistribution({
        Comment: 'test dist',
        Enabled: true,
        Origins: [{ DomainName: 'mybucket.s3.amazonaws.com' }],
      })
      expect(result.Distribution.Id).toBe('E123')
      expect(result.ETag).toBe('E123ETag')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/cloudfront\/distributions$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Comment).toBe('test dist')
      expect(body.Enabled).toBe(true)
    })
  })

  describe('getDistribution', () => {
    it('GET /cloudfront/distributions/{id} with encoded id', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          Distribution: { Id: 'E123', DomainName: 'd123.cloudfront.net' },
          ETag: 'E123ETag',
        }),
      )
      const result = await getDistribution('E123')
      expect(result.Distribution.Id).toBe('E123')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain(`/cloudfront/distributions/E123`)
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('updateDistribution', () => {
    it('PUT /cloudfront/distributions/{id} with update params', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          Distribution: { Id: 'E123', DomainName: 'd123.cloudfront.net' },
          ETag: 'E123ETag2',
        }),
      )
      const result = await updateDistribution('E123', { Comment: 'updated' })
      expect(result.Distribution.Id).toBe('E123')
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudfront/distributions/E123')
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Comment).toBe('updated')
    })
  })

  describe('deleteDistribution', () => {
    it('DELETE /cloudfront/distributions/{id}', async () => {
      mockFetch.mockResolvedValue(mockResponse({ message: 'Distribution deleted' }))
      const result = await deleteDistribution('E123')
      expect(result.message).toBe('Distribution deleted')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toMatch(/\/cloudfront\/distributions\/E123$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('listInvalidations', () => {
    it('GET /cloudfront/distributions/{id}/invalidations returns invalidations', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          InvalidationList: {
            Items: [{ Id: 'I123', Status: 'Completed', CreateTime: '2024-01-15T10:30:00Z' }],
            Quantity: 1,
          },
        }),
      )
      const result = await listInvalidations('E123')
      expect(result.InvalidationList.Items).toHaveLength(1)
      expect(result.InvalidationList.Quantity).toBe(1)
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/cloudfront\/distributions\/E123\/invalidations$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })

    it('defaults to empty array when missing', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listInvalidations('E123')
      expect(result.InvalidationList.Items).toEqual([])
      expect(result.InvalidationList.Quantity).toBe(0)
    })
  })

  describe('createInvalidation', () => {
    it('POST /cloudfront/distributions/{id}/invalidate with paths', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          Invalidation: { Id: 'I123', Status: 'InProgress', CreateTime: '2024-01-15T10:30:00Z' },
        }),
      )
      const result = await createInvalidation('E123', { Paths: ['/*'] })
      expect(result.Invalidation.Id).toBe('I123')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/cloudfront\/distributions\/E123\/invalidate$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Paths).toEqual(['/*'])
    })
  })

  describe('listOriginAccessControls', () => {
    it('GET /cloudfront/origin-access-controls returns OACs', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          OriginAccessControlList: {
            Items: [{ Id: 'OAC123', Name: 'my-oac', OriginAccessControlOriginType: 's3', SigningBehavior: 'always', SigningProtocol: 'sigv4' }],
            Quantity: 1,
          },
        }),
      )
      const result = await listOriginAccessControls()
      expect(result.OriginAccessControlList.Items).toHaveLength(1)
      expect(result.OriginAccessControlList.Quantity).toBe(1)
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/cloudfront\/origin-access-controls$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })

    it('defaults to empty array when missing', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listOriginAccessControls()
      expect(result.OriginAccessControlList.Items).toEqual([])
      expect(result.OriginAccessControlList.Quantity).toBe(0)
    })
  })

  describe('createOriginAccessControl', () => {
    it('POST /cloudfront/origin-access-controls with OAC params', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          OriginAccessControl: { Id: 'OAC123', Name: 'my-oac', OriginAccessControlOriginType: 's3', SigningBehavior: 'always', SigningProtocol: 'sigv4' },
        }),
      )
      const result = await createOriginAccessControl({
        Name: 'my-oac',
        OriginAccessControlOriginType: 's3',
        SigningBehavior: 'always',
        SigningProtocol: 'sigv4',
      })
      expect(result.OriginAccessControl.Id).toBe('OAC123')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/cloudfront\/origin-access-controls$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Name).toBe('my-oac')
    })
  })

  describe('deleteOriginAccessControl', () => {
    it('DELETE /cloudfront/origin-access-controls/{id}', async () => {
      mockFetch.mockResolvedValue(mockResponse({ message: 'OAC deleted' }))
      const result = await deleteOriginAccessControl('OAC123')
      expect(result.message).toBe('OAC deleted')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toMatch(/\/cloudfront\/origin-access-controls\/OAC123$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('localViewerUrl', () => {
    it('returns local viewer URL for distribution id', () => {
      expect(localViewerUrl('E123ABC')).toBe('http://e123abc.cloudfront.localhost.floci.io:4566')
    })

    it('lowercases the id', () => {
      expect(localViewerUrl('E123')).toBe('http://e123.cloudfront.localhost.floci.io:4566')
    })
  })

  describe('cloudfrontService class instance', () => {
    it('exposes all public methods', () => {
      expect(typeof cloudfrontService.listDistributions).toBe('function')
      expect(typeof cloudfrontService.createDistribution).toBe('function')
      expect(typeof cloudfrontService.getDistribution).toBe('function')
      expect(typeof cloudfrontService.updateDistribution).toBe('function')
      expect(typeof cloudfrontService.deleteDistribution).toBe('function')
      expect(typeof cloudfrontService.listInvalidations).toBe('function')
      expect(typeof cloudfrontService.createInvalidation).toBe('function')
      expect(typeof cloudfrontService.listOriginAccessControls).toBe('function')
      expect(typeof cloudfrontService.createOriginAccessControl).toBe('function')
      expect(typeof cloudfrontService.deleteOriginAccessControl).toBe('function')
    })

    it('delegates through the class instance', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          DistributionList: { Items: [{ Id: 'E123' }], Quantity: 1 },
        }),
      )
      const result = await cloudfrontService.listDistributions()
      expect(result.DistributionList.Items[0].Id).toBe('E123')
    })
  })

  describe('cloudfront default export', () => {
    it('exposes all methods', () => {
      expect(typeof cloudfront.listDistributions).toBe('function')
      expect(typeof cloudfront.createDistribution).toBe('function')
      expect(typeof cloudfront.getDistribution).toBe('function')
      expect(typeof cloudfront.updateDistribution).toBe('function')
      expect(typeof cloudfront.deleteDistribution).toBe('function')
      expect(typeof cloudfront.listInvalidations).toBe('function')
      expect(typeof cloudfront.createInvalidation).toBe('function')
      expect(typeof cloudfront.listOriginAccessControls).toBe('function')
      expect(typeof cloudfront.createOriginAccessControl).toBe('function')
      expect(typeof cloudfront.deleteOriginAccessControl).toBe('function')
    })

    it('delegates listDistributions through aggregate object', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          DistributionList: { Items: [{ Id: 'E123' }], Quantity: 1 },
        }),
      )
      const result = await cloudfront.listDistributions()
      expect(result.DistributionList.Items[0].Id).toBe('E123')
    })

    it('delegates createDistribution through aggregate object', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          Distribution: { Id: 'E123' },
          ETag: 'E123ETag',
        }),
      )
      const result = await cloudfront.createDistribution({
        Comment: 'test',
        Origins: [{ DomainName: 'bucket.s3.amazonaws.com' }],
      })
      expect(result.Distribution.Id).toBe('E123')
    })

    it('delegates getDistribution through aggregate object', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          Distribution: { Id: 'E123' },
          ETag: 'E123ETag',
        }),
      )
      const result = await cloudfront.getDistribution('E123')
      expect(result.Distribution.Id).toBe('E123')
    })

    it('delegates updateDistribution through aggregate object', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          Distribution: { Id: 'E123' },
          ETag: 'E123ETag2',
        }),
      )
      const result = await cloudfront.updateDistribution('E123', { Comment: 'updated' })
      expect(result.Distribution.Id).toBe('E123')
    })

    it('delegates deleteDistribution through aggregate object', async () => {
      mockFetch.mockResolvedValue(mockResponse({ message: 'deleted' }))
      const result = await cloudfront.deleteDistribution('E123')
      expect(result.message).toBe('deleted')
    })

    it('delegates listInvalidations through aggregate object', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          InvalidationList: { Items: [{ Id: 'I123' }], Quantity: 1 },
        }),
      )
      const result = await cloudfront.listInvalidations('E123')
      expect(result.InvalidationList.Items[0].Id).toBe('I123')
    })

    it('delegates createInvalidation through aggregate object', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          Invalidation: { Id: 'I123' },
        }),
      )
      const result = await cloudfront.createInvalidation('E123', { Paths: ['/*'] })
      expect(result.Invalidation.Id).toBe('I123')
    })

    it('delegates listOriginAccessControls through aggregate object', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          OriginAccessControlList: { Items: [{ Id: 'OAC123' }], Quantity: 1 },
        }),
      )
      const result = await cloudfront.listOriginAccessControls()
      expect(result.OriginAccessControlList.Items[0].Id).toBe('OAC123')
    })

    it('delegates createOriginAccessControl through aggregate object', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          OriginAccessControl: { Id: 'OAC123' },
        }),
      )
      const result = await cloudfront.createOriginAccessControl({
        Name: 'my-oac',
        OriginAccessControlOriginType: 's3',
        SigningBehavior: 'always',
        SigningProtocol: 'sigv4',
      })
      expect(result.OriginAccessControl.Id).toBe('OAC123')
    })

    it('delegates deleteOriginAccessControl through aggregate object', async () => {
      mockFetch.mockResolvedValue(mockResponse({ message: 'deleted' }))
      const result = await cloudfront.deleteOriginAccessControl('OAC123')
      expect(result.message).toBe('deleted')
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error with status and service', async () => {
      mockFetch.mockResolvedValue(mockResponse('NoSuchDistribution', 404))
      await expect(getDistribution('E999')).rejects.toThrow(/CloudFront GET \/cloudfront\/distributions\/E999 failed: NoSuchDistribution/)
      await expect(getDistribution('E999')).rejects.toMatchObject({ statusCode: 404, service: 'cloudfront' })
    })

    it('throws APIError with 500 on network error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listDistributions()).rejects.toThrow(/Failed to GET \/cloudfront\/distributions/)
      await expect(listDistributions()).rejects.toMatchObject({ statusCode: 500, service: 'cloudfront' })
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('returns {} when response body is empty', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      const result = await listDistributions()
      expect(result).toEqual({ DistributionList: { Items: [], Quantity: 0 } })
    })

    it('re-throws APIError without wrapping', async () => {
      mockFetch.mockResolvedValue(mockResponse('BadRequest', 400))
      const error = await listDistributions().catch((e) => e)
      expect(error).toBeInstanceOf(APIError)
      expect(error.statusCode).toBe(400)
      expect(error.service).toBe('cloudfront')
    })
  })
})
