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
  listFunctions,
  createFunction,
  getFunction,
  deleteFunction,
  invoke,
  invokeFunction,
  updateFunctionConfiguration,
  updateFunctionCode,
  getFunctionConfiguration,
  listEventSourceMappings,
  createEventSourceMapping,
  getEventSourceMapping,
  deleteEventSourceMapping,
  lambda,
} from './lambda'

describe('Lambda Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('listFunctions', () => {
    it('returns functions list', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Functions: [{ FunctionName: 'my-func' }] }))
      const result = await listFunctions()
      expect(result.functions).toHaveLength(1)
      expect(result.functions[0].FunctionName).toBe('my-func')
    })

    it('handles empty response', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listFunctions()
      expect(result.functions).toEqual([])
    })
  })

  describe('createFunction', () => {
    it('sends params with string ZipFile', async () => {
      mockFetch.mockResolvedValue(mockResponse({ FunctionName: 'new-func' }))
      const params = {
        FunctionName: 'new-func',
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Role: 'arn:aws:iam::role/test',
      }
      const result = await createFunction(params)
      expect(result.FunctionName).toBe('new-func')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.FunctionName).toBe('new-func')
    })

    it('converts Uint8Array ZipFile to base64', async () => {
      mockFetch.mockResolvedValue(mockResponse({ FunctionName: 'new-func' }))
      const code = new Uint8Array([104, 101, 108, 108, 111]) // 'hello'
      await createFunction({
        FunctionName: 'new-func',
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Role: 'arn:aws:iam::role/test',
        Code: { ZipFile: code },
      })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Code.ZipFile).toBe(btoa('hello'))
    })
  })

  describe('getFunction', () => {
    it('sends FunctionName', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Configuration: { FunctionName: 'my-func' } }))
      const result = await getFunction('my-func')
      expect(result.Configuration.FunctionName).toBe('my-func')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.FunctionName).toBe('my-func')
    })
  })

  describe('deleteFunction', () => {
    it('sends FunctionName', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteFunction('my-func')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.FunctionName).toBe('my-func')
    })
  })

  describe('invoke', () => {
    it('returns statusCode and decoded payload', async () => {
      const payloadStr = JSON.stringify({ result: 'ok' })
      const payloadObj = { Payload: btoa(payloadStr) }
      mockFetch.mockResolvedValue(mockResponse(payloadObj))
      const result = await invoke('my-func', '{}')
      expect(result.statusCode).toBe(200)
      expect(result.payload).toBe(payloadStr)
    })

    it('invoke returns raw text when not valid JSON response', async () => {
      mockFetch.mockResolvedValue(mockResponse('raw response', 200))
      const result = await invoke('my-func', '{}')
      expect(result.payload).toBe('raw response')
    })

    it('invoke handles Payload not valid base64', async () => {
      const payloadObj = { Payload: 'not-base64-json' }
      mockFetch.mockResolvedValue(mockResponse(payloadObj))
      const result = await invoke('my-func', '{}')
      expect(result.payload).toBe('not-base64-json')
    })

    it('invoke handles FunctionError in response data', async () => {
      const payloadObj = { Payload: btoa('error'), FunctionError: 'Handled' }
      mockFetch.mockResolvedValue(mockResponse(payloadObj))
      const result = await invoke('my-func', '{}')
      expect(result.statusCode).toBe(200)
      expect(result.payload).toBeDefined()
    })

    it('invoke without payload', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await invoke('my-func')
      expect(result.statusCode).toBe(200)
    })

    it('invoke sends InvocationType when provided', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await invoke('my-func', '{}', { invocationType: 'Event' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.InvocationType).toBe('Event')
    })

    it('throws APIError on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(invoke('my-func', '{}')).rejects.toThrow(/Failed to invoke/)
    })
  })

  describe('invokeFunction', () => {
    it('invokes without invocationType option', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await invokeFunction('my-func', '{}')
      expect(result.statusCode).toBe(200)
    })
  })

  describe('updateFunctionConfiguration', () => {
    it('sends params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateFunctionConfiguration({ FunctionName: 'my-func', Description: 'updated' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Description).toBe('updated')
    })
  })

  describe('updateFunctionCode', () => {
    it('sends params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateFunctionCode({ FunctionName: 'my-func', ZipFile: 'base64' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ZipFile).toBe('base64')
    })
  })

  describe('getFunctionConfiguration', () => {
    it('sends FunctionName', async () => {
      mockFetch.mockResolvedValue(mockResponse({ FunctionName: 'my-func' }))
      const result = await getFunctionConfiguration('my-func')
      expect(result.FunctionName).toBe('my-func')
    })
  })

  describe('Event Source Mapping', () => {
    it('listEventSourceMappings sends params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ EventSourceMappings: [] }))
      await listEventSourceMappings({ FunctionName: 'my-func' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.FunctionName).toBe('my-func')
    })

    it('createEventSourceMapping sends params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ UUID: 'uuid1' }))
      await createEventSourceMapping({ FunctionName: 'my-func', EventSourceArn: 'arn:sqs:queue' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.EventSourceArn).toBe('arn:sqs:queue')
    })

    it('getEventSourceMapping sends UUID', async () => {
      mockFetch.mockResolvedValue(mockResponse({ UUID: 'uuid1' }))
      const result = await getEventSourceMapping('uuid1')
      expect(result.UUID).toBe('uuid1')
    })

    it('deleteEventSourceMapping sends UUID', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteEventSourceMapping('uuid1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.UUID).toBe('uuid1')
    })
  })

  describe('lambda namespace object', () => {
    it('lists functions via lambda object', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Functions: [{ FunctionName: 'fn1' }] }))
      const result = await lambda.listFunctions()
      expect(result.functions).toHaveLength(1)
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(listFunctions()).rejects.toThrow(/Lambda/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listFunctions()).rejects.toThrow(/Failed to/)
    })
  })

  describe('X-Amz-Target header', () => {
    it('uses full action name', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Functions: [] }))
      await listFunctions()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('AWSLambda20140331.ListFunctions')
    })
  })
})
