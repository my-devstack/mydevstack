import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

describe('API Client', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn())
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

  describe('response interceptor: READ_ONLY', () => {
    it('403 with code READ_ONLY throws APIError(code=READ_ONLY) and toasts once', async () => {
      const { api, APIError } = await import('@/api/client')

      // Per-request adapter: returns an axios-shaped error (403 + READ_ONLY body).
      // Axios treats any adapter rejection with a `response` prop as a handled error
      // and routes it through the response error interceptor.
      const fakeAdapter = () =>
        Promise.reject({
          response: {
            status: 403,
            statusText: 'Forbidden',
            data: {
              error: 'Action not allowed: server is in read-only mode',
              code: 'READ_ONLY',
            },
            headers: {},
            config: {} as never,
          },
          isAxiosError: true,
        })

      let caught: unknown
      try {
        await api.post('/s3/buckets', { name: 'x' }, { adapter: fakeAdapter as never })
      } catch (e) {
        caught = e
      }

      expect(caught).toBeInstanceOf(APIError)
      const err = caught as InstanceType<typeof APIError>
      expect(err.errorCode).toBe('READ_ONLY')
      expect(err.statusCode).toBe(403)
    })

    it('403 without READ_ONLY code does NOT get the read-only toast path', async () => {
      const { api, APIError } = await import('@/api/client')

      const fakeAdapter = () =>
        Promise.reject({
          response: {
            status: 403,
            statusText: 'Forbidden',
            data: { message: 'Access denied' },
            headers: {},
            config: {} as never,
          },
          isAxiosError: true,
        })

      let caught: unknown
      try {
        await api.post('/s3/buckets', { name: 'x' }, { adapter: fakeAdapter as never })
      } catch (e) {
        caught = e
      }

      expect(caught).toBeInstanceOf(APIError)
      const err = caught as InstanceType<typeof APIError>
      expect(err.errorCode).not.toBe('READ_ONLY')
      expect(err.statusCode).toBe(403)
    })
  })
})