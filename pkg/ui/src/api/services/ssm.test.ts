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
  getParameter,
  getParameters,
  getParametersByPath,
  putParameter,
  deleteParameter,
  describeParameters,
  getParameterHistory,
  listTagsForResource,
  addTagsToResource,
  removeTagsFromResource,
} from './ssm'

describe('SSM Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('getParameter', () => {
    it('returns parameter', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Parameter: { Name: 'my-param', Value: 'my-value', Type: 'String' } }))
      const result = await getParameter('my-param')
      expect(result.Parameter.Value).toBe('my-value')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Name).toBe('my-param')
    })

    it('sends WithDecryption option', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Parameter: {} }))
      await getParameter('my-param', { WithDecryption: true })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.WithDecryption).toBe(true)
    })
  })

  describe('getParameters', () => {
    it('sends Names array', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Parameters: [] }))
      await getParameters(['param1', 'param2'])
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Names).toEqual(['param1', 'param2'])
    })
  })

  describe('getParametersByPath', () => {
    it('sends Path and options', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Parameters: [] }))
      await getParametersByPath('/myapp/', { Recursive: true })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Path).toBe('/myapp/')
      expect(body.Recursive).toBe(true)
    })
  })

  describe('putParameter', () => {
    it('sends parameter config', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Version: 1 }))
      const result = await putParameter({ Name: 'my-param', Value: 'my-value', Type: 'String' })
      expect(result.Version).toBe(1)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Type).toBe('String')
    })
  })

  describe('deleteParameter', () => {
    it('sends Name', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteParameter('my-param')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Name).toBe('my-param')
    })
  })

  describe('describeParameters', () => {
    it('returns parameters', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Parameters: [{ Name: 'p1' }] }))
      const result = await describeParameters()
      expect(result.Parameters).toHaveLength(1)
    })

    it('sends options', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Parameters: [] }))
      await describeParameters({ MaxResults: 10 })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.MaxResults).toBe(10)
    })
  })

  describe('getParameterHistory', () => {
    it('returns history', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Parameters: [] }))
      await getParameterHistory('my-param', { MaxResults: 5 })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Name).toBe('my-param')
      expect(body.MaxResults).toBe(5)
    })
  })

  describe('listTagsForResource', () => {
    it('sends resource info', async () => {
      mockFetch.mockResolvedValue(mockResponse({ TagList: [] }))
      await listTagsForResource('Parameter', 'my-param')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ResourceType).toBe('Parameter')
      expect(body.ResourceId).toBe('my-param')
    })
  })

  describe('addTagsToResource', () => {
    it('sends tags as array', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await addTagsToResource('Parameter', 'my-param', { Env: 'dev', Team: 'myteam' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Tags).toHaveLength(2)
      expect(body.Tags[0].Key).toBe('Env')
    })
  })

  describe('removeTagsFromResource', () => {
    it('sends TagKeys array', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await removeTagsFromResource('Parameter', 'my-param', ['Env', 'Team'])
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.TagKeys).toEqual(['Env', 'Team'])
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(getParameter('test')).rejects.toThrow(/SSM GetParameter failed/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(getParameter('test')).rejects.toThrow(/Failed to/)
    })
  })

  describe('X-Amz-Target header', () => {
    it('uses ssm prefix', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Parameter: {} }))
      await getParameter('test')
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('ssm.GetParameter')
    })
  })
})
