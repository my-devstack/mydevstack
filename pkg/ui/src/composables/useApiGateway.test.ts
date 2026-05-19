import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useApiGateway } from './useApiGateway'
import * as apigw from '@/api/services/api-gateway'

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

vi.mock('@/api/services/api-gateway')

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
      vi.mocked(apigw.getRestApis).mockResolvedValue({ items: [{ id: 'rest-1', name: 'Test REST API' }] } as any)
      const { loadRestApis, loading } = useApiGateway()
      const result = await loadRestApis()
      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Test REST API')
      expect(loading.value).toBe(false)
    })

    it('handles error', async () => {
      vi.mocked(apigw.getRestApis).mockRejectedValue(new Error('API error'))
      const { loadRestApis, loading } = useApiGateway()
      const result = await loadRestApis()
      expect(result).toEqual({ items: [] })
      expect(loading.value).toBe(false)
    })
  })

  describe('loadHttpApis', () => {
    it('should load HTTP APIs', async () => {
      vi.mocked(apigw.getHttpApis).mockResolvedValue({ items: [{ apiId: 'http-1', name: 'Test HTTP API' }] } as any)
      const { loadHttpApis } = useApiGateway()
      const result = await loadHttpApis()
      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Test HTTP API')
    })

    it('handles error', async () => {
      vi.mocked(apigw.getHttpApis).mockRejectedValue(new Error('HTTP error'))
      const { loadHttpApis } = useApiGateway()
      const result = await loadHttpApis()
      expect(result).toEqual({ items: [] })
    })
  })

  describe('loadResources', () => {
    it('should load resources', async () => {
      vi.mocked(apigw.getResources).mockResolvedValue({ items: [{ id: 'res-1', path: '/test' }] } as any)
      const { loadResources } = useApiGateway()
      const result = await loadResources('rest-1')
      expect(result.items).toHaveLength(1)
      expect(result.items[0].path).toBe('/test')
    })

    it('handles error', async () => {
      vi.mocked(apigw.getResources).mockRejectedValue(new Error('Resource error'))
      const { loadResources } = useApiGateway()
      const result = await loadResources('rest-1')
      expect(result).toEqual({ items: [] })
    })
  })

  describe('loadMethods', () => {
    it('should load method details', async () => {
      vi.mocked(apigw.getMethod).mockResolvedValue({ httpMethod: 'GET' } as any)
      const { loadMethods, loading } = useApiGateway()
      const result = await loadMethods('rest-1', 'res-1', 'GET')
      expect(apigw.getMethod).toHaveBeenCalledWith('rest-1', 'res-1', 'GET')
      expect(result).toEqual({ httpMethod: 'GET' })
      expect(loading.value).toBe(false)
    })

    it('returns null on error', async () => {
      vi.mocked(apigw.getMethod).mockRejectedValue(new Error('Not found'))
      const { loadMethods } = useApiGateway()
      const result = await loadMethods('rest-1', 'res-1', 'GET')
      expect(result).toBeNull()
    })
  })

  describe('loadIntegration', () => {
    it('should load integration', async () => {
      vi.mocked(apigw.getIntegration).mockResolvedValue({ type: 'MOCK' } as any)
      const { loadIntegration } = useApiGateway()
      const result = await loadIntegration('rest-1', 'res-1', 'GET')
      expect(result).toBeDefined()
      expect(result?.type).toBe('MOCK')
    })

    it('returns null on error', async () => {
      vi.mocked(apigw.getIntegration).mockRejectedValue(new Error('No integration'))
      const { loadIntegration } = useApiGateway()
      const result = await loadIntegration('rest-1', 'res-1', 'GET')
      expect(result).toBeNull()
    })
  })

  describe('loadRoutes', () => {
    it('should load routes', async () => {
      vi.mocked(apigw.getRoutes).mockResolvedValue({ items: [{ routeKey: 'GET /test' }] } as any)
      const { loadRoutes } = useApiGateway()
      const result = await loadRoutes('http-1')
      expect(apigw.getRoutes).toHaveBeenCalledWith('http-1')
      expect(result.items).toHaveLength(1)
    })

    it('returns empty on error', async () => {
      vi.mocked(apigw.getRoutes).mockRejectedValue(new Error('Routes error'))
      const { loadRoutes } = useApiGateway()
      const result = await loadRoutes('http-1')
      expect(result).toEqual({ items: [] })
    })
  })

  describe('loadIntegrations', () => {
    it('should load integrations', async () => {
      vi.mocked(apigw.getIntegrations).mockResolvedValue({ items: [{ integrationId: 'int-1' }] } as any)
      const { loadIntegrations } = useApiGateway()
      const result = await loadIntegrations('http-1')
      expect(apigw.getIntegrations).toHaveBeenCalledWith('http-1')
      expect(result.items).toHaveLength(1)
    })

    it('returns empty on error', async () => {
      vi.mocked(apigw.getIntegrations).mockRejectedValue(new Error('Integrations error'))
      const { loadIntegrations } = useApiGateway()
      const result = await loadIntegrations('http-1')
      expect(result).toEqual({ items: [] })
    })
  })

  describe('loadRestStages', () => {
    it('should load REST API stages', async () => {
      vi.mocked(apigw.getRestApiStages).mockResolvedValue({ items: [{ stageName: 'prod' }] } as any)
      const { loadRestStages } = useApiGateway()
      const result = await loadRestStages('rest-1')
      expect(apigw.getRestApiStages).toHaveBeenCalledWith('rest-1')
      expect(result.items).toHaveLength(1)
    })

    it('returns empty on error', async () => {
      vi.mocked(apigw.getRestApiStages).mockRejectedValue(new Error('Stages error'))
      const { loadRestStages } = useApiGateway()
      const result = await loadRestStages('rest-1')
      expect(result).toEqual({ items: [] })
    })
  })

  describe('loadHttpStages', () => {
    it('should load HTTP API stages', async () => {
      vi.mocked(apigw.getHttpApiStages).mockResolvedValue({ items: [{ stageName: 'prod' }] } as any)
      const { loadHttpStages } = useApiGateway()
      const result = await loadHttpStages('http-1')
      expect(apigw.getHttpApiStages).toHaveBeenCalledWith('http-1')
      expect(result.items).toHaveLength(1)
    })

    it('returns empty on error', async () => {
      vi.mocked(apigw.getHttpApiStages).mockRejectedValue(new Error('Stages error'))
      const { loadHttpStages } = useApiGateway()
      const result = await loadHttpStages('http-1')
      expect(result).toEqual({ items: [] })
    })
  })

  describe('createRestApi', () => {
    it('should create REST API', async () => {
      vi.mocked(apigw.createRestApi).mockResolvedValue({} as any)
      const { createRestApi } = useApiGateway()
      await createRestApi('New API', 'Description')
      expect(apigw.createRestApi).toHaveBeenCalledWith('New API', { Description: 'Description' })
    })

    it('should handle error', async () => {
      vi.mocked(apigw.createRestApi).mockRejectedValue(new Error('Failed'))
      const { createRestApi } = useApiGateway()
      await expect(createRestApi('New API')).rejects.toThrow('Failed')
    })
  })

  describe('updateRestApi', () => {
    it('should update REST API', async () => {
      vi.mocked(apigw.updateRestApi).mockResolvedValue({} as any)
      const { updateRestApi, loading } = useApiGateway()
      await updateRestApi('rest-1', 'Updated', 'New desc')
      expect(apigw.updateRestApi).toHaveBeenCalledWith('rest-1', { name: 'Updated', description: 'New desc' })
      expect(loading.value).toBe(false)
    })

    it('throws on error', async () => {
      vi.mocked(apigw.updateRestApi).mockRejectedValue(new Error('Update failed'))
      const { updateRestApi } = useApiGateway()
      await expect(updateRestApi('rest-1', 'Updated')).rejects.toThrow('Update failed')
    })
  })

  describe('deleteRestApi', () => {
    it('should delete REST API', async () => {
      vi.mocked(apigw.deleteRestApi).mockResolvedValue({} as any)
      const { deleteRestApi, loading } = useApiGateway()
      await deleteRestApi('rest-1')
      expect(apigw.deleteRestApi).toHaveBeenCalledWith('rest-1')
      expect(loading.value).toBe(false)
    })

    it('throws on error', async () => {
      vi.mocked(apigw.deleteRestApi).mockRejectedValue(new Error('Delete failed'))
      const { deleteRestApi } = useApiGateway()
      await expect(deleteRestApi('rest-1')).rejects.toThrow('Delete failed')
    })
  })

  describe('createResource', () => {
    it('should create resource', async () => {
      vi.mocked(apigw.createResource).mockResolvedValue({} as any)
      const { createResource, loading } = useApiGateway()
      await createResource('rest-1', 'parent-id', 'test')
      expect(apigw.createResource).toHaveBeenCalledWith('rest-1', 'parent-id', 'test')
      expect(loading.value).toBe(false)
    })

    it('throws on error', async () => {
      vi.mocked(apigw.createResource).mockRejectedValue(new Error('Create failed'))
      const { createResource } = useApiGateway()
      await expect(createResource('rest-1', 'parent-id', 'test')).rejects.toThrow('Create failed')
    })
  })

  describe('deleteResource', () => {
    it('should delete resource', async () => {
      vi.mocked(apigw.deleteResource).mockResolvedValue({} as any)
      const { deleteResource } = useApiGateway()
      await deleteResource('rest-1', 'res-1')
      expect(apigw.deleteResource).toHaveBeenCalledWith('rest-1', 'res-1')
    })

    it('throws on error', async () => {
      vi.mocked(apigw.deleteResource).mockRejectedValue(new Error('Delete failed'))
      const { deleteResource } = useApiGateway()
      await expect(deleteResource('rest-1', 'res-1')).rejects.toThrow('Delete failed')
    })
  })

  describe('createMethod', () => {
    it('should create method', async () => {
      vi.mocked(apigw.createMethod).mockResolvedValue({} as any)
      const { createMethod } = useApiGateway()
      await createMethod('rest-1', 'res-1', 'GET', { authorizationType: 'NONE' })
      expect(apigw.createMethod).toHaveBeenCalledWith('rest-1', 'res-1', 'GET', { authorizationType: 'NONE' })
    })

    it('throws on error', async () => {
      vi.mocked(apigw.createMethod).mockRejectedValue(new Error('Method failed'))
      const { createMethod } = useApiGateway()
      await expect(createMethod('rest-1', 'res-1', 'GET')).rejects.toThrow('Method failed')
    })
  })

  describe('deleteMethod', () => {
    it('should delete method', async () => {
      vi.mocked(apigw.deleteMethod).mockResolvedValue({} as any)
      const { deleteMethod } = useApiGateway()
      await deleteMethod('rest-1', 'res-1', 'GET')
      expect(apigw.deleteMethod).toHaveBeenCalledWith('rest-1', 'res-1', 'GET')
    })

    it('throws on error', async () => {
      vi.mocked(apigw.deleteMethod).mockRejectedValue(new Error('Delete failed'))
      const { deleteMethod } = useApiGateway()
      await expect(deleteMethod('rest-1', 'res-1', 'GET')).rejects.toThrow('Delete failed')
    })
  })

  describe('putIntegration', () => {
    it('should save integration', async () => {
      vi.mocked(apigw.putIntegration).mockResolvedValue({} as any)
      const { putIntegration, loading } = useApiGateway()
      await putIntegration('rest-1', 'res-1', 'GET', { type: 'MOCK' })
      expect(apigw.putIntegration).toHaveBeenCalledWith('rest-1', 'res-1', 'GET', { type: 'MOCK' })
      expect(loading.value).toBe(false)
    })

    it('throws on error', async () => {
      vi.mocked(apigw.putIntegration).mockRejectedValue(new Error('Integration failed'))
      const { putIntegration } = useApiGateway()
      await expect(putIntegration('rest-1', 'res-1', 'GET', { type: 'MOCK' })).rejects.toThrow('Integration failed')
    })
  })

  describe('createDeployment', () => {
    it('should create deployment', async () => {
      vi.mocked(apigw.createDeployment).mockResolvedValue({} as any)
      const { createDeployment } = useApiGateway()
      await createDeployment('rest-1', 'prod')
      expect(apigw.createDeployment).toHaveBeenCalledWith('rest-1', { stageName: 'prod', description: undefined })
    })

    it('throws on error', async () => {
      vi.mocked(apigw.createDeployment).mockRejectedValue(new Error('Deploy failed'))
      const { createDeployment } = useApiGateway()
      await expect(createDeployment('rest-1', 'prod')).rejects.toThrow('Deploy failed')
    })
  })

  describe('deleteDeployment', () => {
    it('should delete deployment', async () => {
      vi.mocked(apigw.deleteDeployment).mockResolvedValue({} as any)
      const { deleteDeployment } = useApiGateway()
      await deleteDeployment('rest-1', 'deploy-1')
      expect(apigw.deleteDeployment).toHaveBeenCalledWith('rest-1', 'deploy-1')
    })

    it('throws on error', async () => {
      vi.mocked(apigw.deleteDeployment).mockRejectedValue(new Error('Delete failed'))
      const { deleteDeployment } = useApiGateway()
      await expect(deleteDeployment('rest-1', 'deploy-1')).rejects.toThrow('Delete failed')
    })
  })

  describe('createRestStage', () => {
    it('should create REST API stage', async () => {
      vi.mocked(apigw.createStage).mockResolvedValue({} as any)
      const { createRestStage } = useApiGateway()
      await createRestStage('rest-1', 'deploy-1', 'prod')
      expect(apigw.createStage).toHaveBeenCalledWith('rest-1', 'deploy-1', 'prod')
    })

    it('throws on error', async () => {
      vi.mocked(apigw.createStage).mockRejectedValue(new Error('Stage failed'))
      const { createRestStage } = useApiGateway()
      await expect(createRestStage('rest-1', 'deploy-1', 'prod')).rejects.toThrow('Stage failed')
    })
  })

  describe('deleteRestStage', () => {
    it('should delete REST API stage', async () => {
      vi.mocked(apigw.deleteStage).mockResolvedValue({} as any)
      const { deleteRestStage } = useApiGateway()
      await deleteRestStage('rest-1', 'prod')
      expect(apigw.deleteStage).toHaveBeenCalledWith('rest-1', 'prod')
    })

    it('throws on error', async () => {
      vi.mocked(apigw.deleteStage).mockRejectedValue(new Error('Delete failed'))
      const { deleteRestStage } = useApiGateway()
      await expect(deleteRestStage('rest-1', 'prod')).rejects.toThrow('Delete failed')
    })
  })

  describe('createHttpApi', () => {
    it('should create HTTP API', async () => {
      vi.mocked(apigw.createHttpApi).mockResolvedValue({} as any)
      const { createHttpApi } = useApiGateway()
      await createHttpApi('New HTTP API', 'Description')
      expect(apigw.createHttpApi).toHaveBeenCalledWith({ name: 'New HTTP API', description: 'Description' })
    })

    it('throws on error', async () => {
      vi.mocked(apigw.createHttpApi).mockRejectedValue(new Error('Create failed'))
      const { createHttpApi } = useApiGateway()
      await expect(createHttpApi('New HTTP API')).rejects.toThrow('Create failed')
    })
  })

  describe('deleteHttpApi', () => {
    it('should delete HTTP API', async () => {
      vi.mocked(apigw.deleteHttpApi).mockResolvedValue({} as any)
      const { deleteHttpApi } = useApiGateway()
      await deleteHttpApi('http-1')
      expect(apigw.deleteHttpApi).toHaveBeenCalledWith('http-1')
    })

    it('throws on error', async () => {
      vi.mocked(apigw.deleteHttpApi).mockRejectedValue(new Error('Delete failed'))
      const { deleteHttpApi } = useApiGateway()
      await expect(deleteHttpApi('http-1')).rejects.toThrow('Delete failed')
    })
  })

  describe('createHttpRoute', () => {
    it('should create HTTP API route', async () => {
      vi.mocked(apigw.createHttpRoute).mockResolvedValue({} as any)
      const { createHttpRoute } = useApiGateway()
      await createHttpRoute('http-1', 'GET /test', 'integration-id')
      expect(apigw.createHttpRoute).toHaveBeenCalledWith('http-1', { routeKey: 'GET /test', target: 'integration-id', authorizationType: undefined })
    })

    it('throws on error', async () => {
      vi.mocked(apigw.createHttpRoute).mockRejectedValue(new Error('Route failed'))
      const { createHttpRoute } = useApiGateway()
      await expect(createHttpRoute('http-1', 'GET /test')).rejects.toThrow('Route failed')
    })
  })

  describe('updateHttpRoute', () => {
    it('should update HTTP API route', async () => {
      vi.mocked(apigw.updateHttpRoute).mockResolvedValue({} as any)
      const { updateHttpRoute } = useApiGateway()
      await updateHttpRoute('http-1', 'route-1', { target: 'new-int' })
      expect(apigw.updateHttpRoute).toHaveBeenCalledWith('http-1', 'route-1', { target: 'new-int' })
    })

    it('throws on error', async () => {
      vi.mocked(apigw.updateHttpRoute).mockRejectedValue(new Error('Update failed'))
      const { updateHttpRoute } = useApiGateway()
      await expect(updateHttpRoute('http-1', 'route-1', {})).rejects.toThrow('Update failed')
    })
  })

  describe('deleteHttpRoute', () => {
    it('should delete HTTP API route', async () => {
      vi.mocked(apigw.deleteHttpRoute).mockResolvedValue({} as any)
      const { deleteHttpRoute } = useApiGateway()
      await deleteHttpRoute('http-1', 'route-1')
      expect(apigw.deleteHttpRoute).toHaveBeenCalledWith('http-1', 'route-1')
    })

    it('throws on error', async () => {
      vi.mocked(apigw.deleteHttpRoute).mockRejectedValue(new Error('Delete failed'))
      const { deleteHttpRoute } = useApiGateway()
      await expect(deleteHttpRoute('http-1', 'route-1')).rejects.toThrow('Delete failed')
    })
  })

  describe('createHttpIntegration', () => {
    it('should create HTTP API integration', async () => {
      vi.mocked(apigw.createHttpIntegration).mockResolvedValue({} as any)
      const { createHttpIntegration } = useApiGateway()
      await createHttpIntegration('http-1', { integrationType: 'AWS_PROXY' })
      expect(apigw.createHttpIntegration).toHaveBeenCalledWith('http-1', { integrationType: 'AWS_PROXY' })
    })

    it('throws on error', async () => {
      vi.mocked(apigw.createHttpIntegration).mockRejectedValue(new Error('Create failed'))
      const { createHttpIntegration } = useApiGateway()
      await expect(createHttpIntegration('http-1', {})).rejects.toThrow('Create failed')
    })
  })

  describe('updateHttpIntegration', () => {
    it('should update HTTP API integration', async () => {
      vi.mocked(apigw.updateHttpIntegration).mockResolvedValue({} as any)
      const { updateHttpIntegration } = useApiGateway()
      await updateHttpIntegration('http-1', 'int-1', { integrationType: 'AWS_PROXY' })
      expect(apigw.updateHttpIntegration).toHaveBeenCalledWith('http-1', 'int-1', { integrationType: 'AWS_PROXY' })
    })

    it('throws on error', async () => {
      vi.mocked(apigw.updateHttpIntegration).mockRejectedValue(new Error('Update failed'))
      const { updateHttpIntegration } = useApiGateway()
      await expect(updateHttpIntegration('http-1', 'int-1', {})).rejects.toThrow('Update failed')
    })
  })

  describe('deleteHttpIntegration', () => {
    it('should delete HTTP API integration', async () => {
      vi.mocked(apigw.deleteHttpApiIntegration).mockResolvedValue({} as any)
      const { deleteHttpIntegration } = useApiGateway()
      await deleteHttpIntegration('http-1', 'int-1')
      expect(apigw.deleteHttpApiIntegration).toHaveBeenCalledWith('http-1', 'int-1')
    })

    it('throws on error', async () => {
      vi.mocked(apigw.deleteHttpApiIntegration).mockRejectedValue(new Error('Delete failed'))
      const { deleteHttpIntegration } = useApiGateway()
      await expect(deleteHttpIntegration('http-1', 'int-1')).rejects.toThrow('Delete failed')
    })
  })

  describe('createHttpStage', () => {
    it('should create HTTP API stage', async () => {
      vi.mocked(apigw.createHttpApiStage).mockResolvedValue({} as any)
      const { createHttpStage } = useApiGateway()
      await createHttpStage('http-1', 'prod', { description: 'Prod stage' })
      expect(apigw.createHttpApiStage).toHaveBeenCalledWith('http-1', { stageName: 'prod', description: 'Prod stage' })
    })

    it('should create with autoDeploy', async () => {
      vi.mocked(apigw.createHttpApiStage).mockResolvedValue({} as any)
      const { createHttpStage } = useApiGateway()
      await createHttpStage('http-1', 'prod', { autoDeploy: true })
      expect(apigw.createHttpApiStage).toHaveBeenCalledWith('http-1', { stageName: 'prod', autoDeploy: true })
    })

    it('throws on error', async () => {
      vi.mocked(apigw.createHttpApiStage).mockRejectedValue(new Error('Create failed'))
      const { createHttpStage } = useApiGateway()
      await expect(createHttpStage('http-1', 'prod')).rejects.toThrow('Create failed')
    })
  })

  describe('updateHttpStage', () => {
    it('should update HTTP API stage', async () => {
      vi.mocked(apigw.updateHttpApiStage).mockResolvedValue({} as any)
      const { updateHttpStage } = useApiGateway()
      await updateHttpStage('http-1', 'prod', { description: 'Updated' })
      expect(apigw.updateHttpApiStage).toHaveBeenCalledWith('http-1', 'prod', { description: 'Updated' })
    })

    it('throws on error', async () => {
      vi.mocked(apigw.updateHttpApiStage).mockRejectedValue(new Error('Update failed'))
      const { updateHttpStage } = useApiGateway()
      await expect(updateHttpStage('http-1', 'prod', {})).rejects.toThrow('Update failed')
    })
  })

  describe('deleteHttpStage', () => {
    it('should delete HTTP API stage', async () => {
      vi.mocked(apigw.deleteHttpApiStage).mockResolvedValue({} as any)
      const { deleteHttpStage } = useApiGateway()
      await deleteHttpStage('http-1', 'prod')
      expect(apigw.deleteHttpApiStage).toHaveBeenCalledWith('http-1', 'prod')
    })

    it('throws on error', async () => {
      vi.mocked(apigw.deleteHttpApiStage).mockRejectedValue(new Error('Delete failed'))
      const { deleteHttpStage } = useApiGateway()
      await expect(deleteHttpStage('http-1', 'prod')).rejects.toThrow('Delete failed')
    })
  })

  describe('getRestInvokeUrl', () => {
    it('should get REST API invoke URL', async () => {
      vi.mocked(apigw.getRestApiInvokeUrl).mockResolvedValue({ invokeUrl: 'http://localhost:4566/rest' } as any)
      const { getRestInvokeUrl } = useApiGateway()
      const url = await getRestInvokeUrl('rest-1', 'prod')
      expect(url).toBe('http://localhost:4566/rest')
    })

    it('returns empty on error', async () => {
      vi.mocked(apigw.getRestApiInvokeUrl).mockRejectedValue(new Error('Not found'))
      const { getRestInvokeUrl } = useApiGateway()
      const url = await getRestInvokeUrl('rest-1', 'prod')
      expect(url).toBe('')
    })
  })

  describe('getHttpInvokeUrl', () => {
    it('should get HTTP API invoke URL', async () => {
      vi.mocked(apigw.getHttpApiInvokeUrl).mockResolvedValue({ invokeUrl: 'http://localhost:4566/http' } as any)
      const { getHttpInvokeUrl } = useApiGateway()
      const url = await getHttpInvokeUrl('http-1', 'prod')
      expect(url).toBe('http://localhost:4566/http')
    })

    it('returns empty on error', async () => {
      vi.mocked(apigw.getHttpApiInvokeUrl).mockRejectedValue(new Error('Not found'))
      const { getHttpInvokeUrl } = useApiGateway()
      const url = await getHttpInvokeUrl('http-1', 'prod')
      expect(url).toBe('')
    })
  })

  describe('getRestApiDetails', () => {
    it('should get REST API details', async () => {
      vi.mocked(apigw.getRestApi).mockResolvedValue({ id: 'rest-1', name: 'Test REST API' } as any)
      const { getRestApiDetails } = useApiGateway()
      const result = await getRestApiDetails('rest-1')
      expect(result).toBeDefined()
      expect(result?.name).toBe('Test REST API')
    })

    it('returns null on error', async () => {
      vi.mocked(apigw.getRestApi).mockRejectedValue(new Error('Not found'))
      const { getRestApiDetails, loading } = useApiGateway()
      const result = await getRestApiDetails('rest-1')
      expect(result).toBeNull()
      expect(loading.value).toBe(false)
    })
  })

  describe('getHttpApiDetails', () => {
    it('should get HTTP API details', async () => {
      vi.mocked(apigw.getHttpApi).mockResolvedValue({ apiId: 'http-1', name: 'Test HTTP API' } as any)
      const { getHttpApiDetails } = useApiGateway()
      const result = await getHttpApiDetails('http-1')
      expect(result).toBeDefined()
      expect(result?.name).toBe('Test HTTP API')
    })

    it('returns null on error', async () => {
      vi.mocked(apigw.getHttpApi).mockRejectedValue(new Error('Not found'))
      const { getHttpApiDetails } = useApiGateway()
      const result = await getHttpApiDetails('http-1')
      expect(result).toBeNull()
    })
  })

  describe('loading state', () => {
    it('sets loading during createRestApi and resets after', async () => {
      vi.mocked(apigw.createRestApi).mockImplementation(async () => { /* no-op */ })
      const { createRestApi, loading } = useApiGateway()
      const promise = createRestApi('Test')
      expect(loading.value).toBe(true)
      await promise
      expect(loading.value).toBe(false)
    })

    it('sets loading during loadRestApis and resets after error', async () => {
      vi.mocked(apigw.getRestApis).mockRejectedValue(new Error('Err'))
      const { loadRestApis, loading } = useApiGateway()
      const promise = loadRestApis()
      expect(loading.value).toBe(true)
      await promise
      expect(loading.value).toBe(false)
    })
  })
})
