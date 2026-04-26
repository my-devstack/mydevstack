import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

describe('API Client', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('DOMParser', vi.fn().mockImplementation(() => ({
      parseFromString: vi.fn().mockReturnValue({
        querySelector: vi.fn().mockReturnValue(null),
        documentElement: {}
      })
    })))
  })

  describe('APIError', () => {
    it('should import APIError class', async () => {
      const { APIError } = await import('@/api/client')
      expect(APIError).toBeDefined()
    })

    it('should create APIError with message, statusCode, and service', async () => {
      const { APIError } = await import('@/api/client')
      const error = new APIError('Test error', 500, 's3')
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.service).toBe('s3')
      expect(error.name).toBe('APIError')
    })

    it('should allow optional errorCode and details', async () => {
      const { APIError } = await import('@/api/client')
      const error = new APIError('Test error', 400, 's3', 'ResourceNotFound', { resourceId: 'abc' })
      expect(error.errorCode).toBe('ResourceNotFound')
      expect(error.details).toEqual({ resourceId: 'abc' })
    })

    it('should be instance of Error', async () => {
      const { APIError } = await import('@/api/client')
      const error = new APIError('Test error', 500, 's3')
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('parseXML', () => {
    it('should import parseXML function', async () => {
      const { parseXML } = await import('@/api/client')
      expect(parseXML).toBeDefined()
      expect(typeof parseXML).toBe('function')
    })

    it('should call DOMParser to parse XML', async () => {
      const { parseXML } = await import('@/api/client')
      const result = parseXML('<test></test>')
      expect(DOMParser).toHaveBeenCalled()
    })
  })
})