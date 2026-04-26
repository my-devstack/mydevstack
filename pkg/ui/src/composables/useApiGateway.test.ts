import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useApiGateway } from '@/composables/useApiGateway'

vi.mock('@/api/services/api-gateway', () => ({
  getRestApis: vi.fn().mockResolvedValue({ items: [{ id: 'rest-1', name: 'Test REST API' }] }),
  getHttpApis: vi.fn().mockResolvedValue({ items: [{ apiId: 'http-1', name: 'Test HTTP API' }] }),
  getResources: vi.fn().mockResolvedValue({ items: [{ id: 'res-1', path: '/test' }] }),
  createRestApi: vi.fn().mockResolvedValue({}),
  updateRestApi: vi.fn().mockResolvedValue({}),
  deleteRestApi: vi.fn().mockResolvedValue({}),
  createResource: vi.fn().mockResolvedValue({}),
  deleteResource: vi.fn().mockResolvedValue({}),
  createMethod: vi.fn().mockResolvedValue({}),
  deleteMethod: vi.fn().mockResolvedValue({}),
  putIntegration: vi.fn().mockResolvedValue({}),
  getIntegration: vi.fn().mockResolvedValue({ type: 'MOCK' }),
  getMethod: vi.fn().mockResolvedValue({ httpMethod: 'GET' }),
  createDeployment: vi.fn().mockResolvedValue({}),
  deleteDeployment: vi.fn().mockResolvedValue({}),
  createStage: vi.fn().mockResolvedValue({}),
  deleteStage: vi.fn().mockResolvedValue({}),
  createHttpApi: vi.fn().mockResolvedValue({}),
  deleteHttpApi: vi.fn().mockResolvedValue({}),
  getRoutes: vi.fn().mockResolvedValue({ items: [] }),
  createHttpRoute: vi.fn().mockResolvedValue({}),
  updateHttpRoute: vi.fn().mockResolvedValue({}),
  deleteHttpRoute: vi.fn().mockResolvedValue({}),
  getIntegrations: vi.fn().mockResolvedValue({ items: [] }),
  createHttpIntegration: vi.fn().mockResolvedValue({}),
  updateHttpIntegration: vi.fn().mockResolvedValue({}),
  deleteHttpApiIntegration: vi.fn().mockResolvedValue({}),
  getRestApiStages: vi.fn().mockResolvedValue({ items: [] }),
  getHttpApiStages: vi.fn().mockResolvedValue({ items: [] }),
  createHttpApiStage: vi.fn().mockResolvedValue({}),
  updateHttpApiStage: vi.fn().mockResolvedValue({}),
  deleteHttpApiStage: vi.fn().mockResolvedValue({}),
  getRestApiInvokeUrl: vi.fn().mockResolvedValue({ invokeUrl: 'http://localhost:4566/rest' }),
  getHttpApiInvokeUrl: vi.fn().mockResolvedValue({ invokeUrl: 'http://localhost:4566/http' }),
  getRestApi: vi.fn().mockResolvedValue({ id: 'rest-1', name: 'Test REST API' }),
  getHttpApi: vi.fn().mockResolvedValue({ apiId: 'http-1', name: 'Test HTTP API' }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

describe('useApiGateway', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return loading ref', () => {
    const { loading } = useApiGateway()
    expect(loading.value).toBe(false)
  })

  describe('loadRestApis', () => {
    it('should load REST APIs', async () => {
      const { loadRestApis } = useApiGateway()
      const result = await loadRestApis()
      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Test REST API')
    })
  })

  describe('loadHttpApis', () => {
    it('should load HTTP APIs', async () => {
      const { loadHttpApis } = useApiGateway()
      const result = await loadHttpApis()
      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Test HTTP API')
    })
  })

  describe('loadResources', () => {
    it('should load resources', async () => {
      const { loadResources } = useApiGateway()
      const result = await loadResources('rest-1')
      expect(result.items).toHaveLength(1)
      expect(result.items[0].path).toBe('/test')
    })
  })

  describe('createRestApi', () => {
    it('should create REST API', async () => {
      const { createRestApi } = useApiGateway()
      await createRestApi('New API', 'Description')
      const { createRestApi: mockCreate } = await import('@/api/services/api-gateway')
      expect(mockCreate).toHaveBeenCalledWith('New API', { Description: 'Description' })
    })

    it('should handle error', async () => {
      const { createRestApi } = useApiGateway()
      const { createRestApi: mockCreate } = await import('@/api/services/api-gateway')
      mockCreate.mockRejectedValueOnce(new Error('Failed'))
      await expect(createRestApi('New API')).rejects.toThrow()
    })
  })

  describe('deleteRestApi', () => {
    it('should delete REST API', async () => {
      const { deleteRestApi } = useApiGateway()
      await deleteRestApi('rest-1')
      const { deleteRestApi: mockDelete } = await import('@/api/services/api-gateway')
      expect(mockDelete).toHaveBeenCalledWith('rest-1')
    })
  })

  describe('createResource', () => {
    it('should create resource', async () => {
      const { createResource } = useApiGateway()
      await createResource('rest-1', 'parent-id', 'test')
      const { createResource: mockCreate } = await import('@/api/services/api-gateway')
      expect(mockCreate).toHaveBeenCalledWith('rest-1', 'parent-id', 'test')
    })
  })

  describe('createMethod', () => {
    it('should create method', async () => {
      const { createMethod } = useApiGateway()
      await createMethod('rest-1', 'res-1', 'GET', { authorizationType: 'NONE' })
      const { createMethod: mockCreate } = await import('@/api/services/api-gateway')
      expect(mockCreate).toHaveBeenCalledWith('rest-1', 'res-1', 'GET', { authorizationType: 'NONE' })
    })
  })

  describe('deleteMethod', () => {
    it('should delete method', async () => {
      const { deleteMethod } = useApiGateway()
      await deleteMethod('rest-1', 'res-1', 'GET')
      const { deleteMethod: mockDelete } = await import('@/api/services/api-gateway')
      expect(mockDelete).toHaveBeenCalledWith('rest-1', 'res-1', 'GET')
    })
  })

  describe('putIntegration', () => {
    it('should save integration', async () => {
      const { putIntegration } = useApiGateway()
      await putIntegration('rest-1', 'res-1', 'GET', { type: 'MOCK' })
      const { putIntegration: mockPut } = await import('@/api/services/api-gateway')
      expect(mockPut).toHaveBeenCalledWith('rest-1', 'res-1', 'GET', { type: 'MOCK' })
    })
  })

  describe('loadIntegration', () => {
    it('should load integration', async () => {
      const { loadIntegration } = useApiGateway()
      const result = await loadIntegration('rest-1', 'res-1', 'GET')
      expect(result).toBeDefined()
      expect(result?.type).toBe('MOCK')
    })
  })

  describe('createDeployment', () => {
    it('should create deployment', async () => {
      const { createDeployment } = useApiGateway()
      await createDeployment('rest-1', 'prod')
      const { createDeployment: mockCreate } = await import('@/api/services/api-gateway')
      expect(mockCreate).toHaveBeenCalledWith('rest-1', { stageName: 'prod', description: undefined })
    })
  })

  describe('createHttpApi', () => {
    it('should create HTTP API', async () => {
      const { createHttpApi } = useApiGateway()
      await createHttpApi('New HTTP API', 'Description')
      const { createHttpApi: mockCreate } = await import('@/api/services/api-gateway')
      expect(mockCreate).toHaveBeenCalledWith({ name: 'New HTTP API', description: 'Description' })
    })
  })

  describe('deleteHttpApi', () => {
    it('should delete HTTP API', async () => {
      const { deleteHttpApi } = useApiGateway()
      await deleteHttpApi('http-1')
      const { deleteHttpApi: mockDelete } = await import('@/api/services/api-gateway')
      expect(mockDelete).toHaveBeenCalledWith('http-1')
    })
  })

  describe('createHttpRoute', () => {
    it('should create HTTP API route', async () => {
      const { createHttpRoute } = useApiGateway()
      await createHttpRoute('http-1', 'GET /test', 'integration-id')
      const { createHttpRoute: mockCreate } = await import('@/api/services/api-gateway')
      expect(mockCreate).toHaveBeenCalledWith('http-1', { routeKey: 'GET /test', target: 'integration-id', authorizationType: undefined })
    })
  })

  describe('createHttpIntegration', () => {
    it('should create HTTP API integration', async () => {
      const { createHttpIntegration } = useApiGateway()
      await createHttpIntegration('http-1', { integrationType: 'AWS_PROXY' })
      const { createHttpIntegration: mockCreate } = await import('@/api/services/api-gateway')
      expect(mockCreate).toHaveBeenCalledWith('http-1', { integrationType: 'AWS_PROXY' })
    })
  })

  describe('getRestInvokeUrl', () => {
    it('should get REST API invoke URL', async () => {
      const { getRestInvokeUrl } = useApiGateway()
      const url = await getRestInvokeUrl('rest-1', 'prod')
      expect(url).toBe('http://localhost:4566/rest')
    })
  })

  describe('getHttpInvokeUrl', () => {
    it('should get HTTP API invoke URL', async () => {
      const { getHttpInvokeUrl } = useApiGateway()
      const url = await getHttpInvokeUrl('http-1', 'prod')
      expect(url).toBe('http://localhost:4566/http')
    })
  })

  describe('getRestApiDetails', () => {
    it('should get REST API details', async () => {
      const { getRestApiDetails } = useApiGateway()
      const result = await getRestApiDetails('rest-1')
      expect(result).toBeDefined()
      expect(result?.name).toBe('Test REST API')
    })
  })

  describe('getHttpApiDetails', () => {
    it('should get HTTP API details', async () => {
      const { getHttpApiDetails } = useApiGateway()
      const result = await getHttpApiDetails('http-1')
      expect(result).toBeDefined()
      expect(result?.name).toBe('Test HTTP API')
    })
  })
})