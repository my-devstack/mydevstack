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

import { PROXY_BACKEND } from '@/config'
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

const base = PROXY_BACKEND.replace(/\/$/, '')

describe('SSM Service (REST)', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('getParameter', () => {
    it('GET /ssm/parameters/{name}', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Parameter: { Name: 'my-param', Value: 'my-value', Type: 'String' } }))
      const result = await getParameter('my-param')
      expect(result.Parameter.Value).toBe('my-value')
      expect(mockFetch.mock.calls[0][0]).toBe(`${base}/ssm/parameters/my-param`)
      expect(mockFetch.mock.calls[0][1]?.method).toBeUndefined() // GET
    })

    it('adds WithDecryption query param', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Parameter: {} }))
      await getParameter('my-param', { WithDecryption: true })
      expect(mockFetch.mock.calls[0][0]).toBe(`${base}/ssm/parameters/my-param?WithDecryption=true`)
    })
  })

  describe('getParameters', () => {
    it('GET /ssm/parameters with names CSV and withDecryption', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Parameters: [] }))
      await getParameters(['param1', 'param2'], { WithDecryption: true })
      const url = new URL(mockFetch.mock.calls[0][0])
      expect(url.pathname).toBe(`/ssm/parameters`)
      expect(mockFetch.mock.calls[0][1]?.method).toBeUndefined() // GET default
      expect(url.searchParams.get('names')).toBe('param1,param2')
      expect(url.searchParams.get('withDecryption')).toBe('true')
    })

    it('omits withDecryption when not set', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Parameters: [] }))
      await getParameters(['p1'])
      const url = new URL(mockFetch.mock.calls[0][0])
      expect(url.searchParams.has('withDecryption')).toBe(false)
      expect(url.searchParams.get('names')).toBe('p1')
    })
  })

  describe('getParametersByPath', () => {
    it('GET /ssm/parameters-by-path/{path} with query params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Parameters: [] }))
      await getParametersByPath('/myapp/', { Recursive: true })
      expect(mockFetch.mock.calls[0][0]).toBe(`${base}/ssm/parameters-by-path/%2Fmyapp%2F?Recursive=true`)
    })

    it('handles path without options', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Parameters: [] }))
      await getParametersByPath('/myapp/')
      expect(mockFetch.mock.calls[0][0]).toBe(`${base}/ssm/parameters-by-path/%2Fmyapp%2F`)
    })
  })

  describe('putParameter', () => {
    it('POST /ssm/parameters with config', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Version: 1 }))
      const result = await putParameter({ Name: 'my-param', Value: 'my-value', Type: 'String' })
      expect(result.Version).toBe(1)
      expect(mockFetch.mock.calls[0][0]).toBe(`${base}/ssm/parameters`)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Type).toBe('String')
    })
  })

  describe('deleteParameter', () => {
    it('DELETE /ssm/parameters/{name}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteParameter('my-param')
      expect(mockFetch.mock.calls[0][0]).toBe(`${base}/ssm/parameters/my-param`)
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('describeParameters', () => {
    it('GET /ssm/parameters', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Parameters: [{ Name: 'p1' }] }))
      const result = await describeParameters()
      expect(result.Parameters).toHaveLength(1)
      expect(mockFetch.mock.calls[0][0]).toBe(`${base}/ssm/parameters`)
      expect(mockFetch.mock.calls[0][1]?.method).toBeUndefined() // GET
    })
  })

  describe('getParameterHistory', () => {
    it('GET /ssm/parameters/{name}/history', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Parameters: [] }))
      await getParameterHistory('my-param', { MaxResults: 5 })
      expect(mockFetch.mock.calls[0][0]).toBe(`${base}/ssm/parameters/my-param/history?MaxResults=5`)
    })

    it('handles name without options', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Parameters: [] }))
      await getParameterHistory('my-param')
      expect(mockFetch.mock.calls[0][0]).toBe(`${base}/ssm/parameters/my-param/history`)
    })
  })

  describe('listTagsForResource', () => {
    it('GET /ssm/tags with resourceId and resourceType query params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ TagList: [] }))
      await listTagsForResource('Parameter', 'my-param')
      const url = new URL(mockFetch.mock.calls[0][0])
      expect(url.pathname).toBe(`/ssm/tags`)
      expect(mockFetch.mock.calls[0][1]?.method).toBeUndefined() // GET default
      expect(url.searchParams.get('resourceId')).toBe('my-param')
      expect(url.searchParams.get('resourceType')).toBe('Parameter')
    })
  })

  describe('addTagsToResource', () => {
    it('POST /ssm/tags', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await addTagsToResource('Parameter', 'my-param', { Env: 'dev', Team: 'myteam' })
      expect(mockFetch.mock.calls[0][0]).toBe(`${base}/ssm/tags`)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Tags).toHaveLength(2)
      expect(body.Tags[0].Key).toBe('Env')
    })
  })

  describe('removeTagsFromResource', () => {
    it('POST /ssm/tags/delete', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await removeTagsFromResource('Parameter', 'my-param', ['Env', 'Team'])
      expect(mockFetch.mock.calls[0][0]).toBe(`${base}/ssm/tags/delete`)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.TagKeys).toEqual(['Env', 'Team'])
    })
  })

  describe('Error handling', () => {
    const methods: [string, () => Promise<any>][] = [
      ['getParameter', () => getParameter('test-param')],
      ['getParameters', () => getParameters(['p1'])],
      ['getParametersByPath', () => getParametersByPath('/test')],
      ['putParameter', () => putParameter({ Name: 't', Value: 'v', Type: 'String' })],
      ['deleteParameter', () => deleteParameter('test-param')],
      ['describeParameters', () => describeParameters()],
      ['getParameterHistory', () => getParameterHistory('test-param')],
      ['listTagsForResource', () => listTagsForResource('Parameter', 'my-param')],
      ['addTagsToResource', () => addTagsToResource('Parameter', 'my-param', { Env: 'dev' })],
      ['removeTagsFromResource', () => removeTagsFromResource('Parameter', 'my-param', ['Env'])],
    ]

    for (const [name, fn] of methods) {
      it(`throws APIError on server error - ${name}`, async () => {
        mockFetch.mockResolvedValue(mockResponse('Error', 500))
        await expect(fn()).rejects.toThrow(/failed/)
      })
    }

    it('propagates network error as-is', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(getParameter('test')).rejects.toThrow('Network error')
    })
  })
})
