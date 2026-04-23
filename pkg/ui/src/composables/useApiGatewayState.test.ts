import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useApiGatewayState } from '@/composables/useApiGatewayState'

vi.mock('@/composables/useApiGateway', () => ({
  useApiGateway: () => ({
    loading: { value: false },
    loadRestApis: vi.fn().mockResolvedValue({ items: [{ id: 'rest-1', name: 'Test REST API' }] }),
    loadHttpApis: vi.fn().mockResolvedValue({ items: [{ apiId: 'http-1', name: 'Test HTTP API' }] }),
    loadResources: vi.fn().mockResolvedValue({ items: [{ id: 'res-1', path: '/test' }] }),
    loadMethods: vi.fn().mockResolvedValue({ httpMethod: 'GET' }),
    loadIntegration: vi.fn().mockResolvedValue({ type: 'MOCK' }),
    loadRoutes: vi.fn().mockResolvedValue({ items: [] }),
    loadIntegrations: vi.fn().mockResolvedValue({ items: [] }),
    loadRestStages: vi.fn().mockResolvedValue({ items: [] }),
    loadHttpStages: vi.fn().mockResolvedValue({ items: [] }),
    createRestApi: vi.fn().mockResolvedValue({}),
    updateRestApi: vi.fn().mockResolvedValue({}),
    deleteRestApi: vi.fn().mockResolvedValue({}),
    createResource: vi.fn().mockResolvedValue({}),
    deleteResource: vi.fn().mockResolvedValue({}),
    createMethod: vi.fn().mockResolvedValue({}),
    deleteMethod: vi.fn().mockResolvedValue({}),
    putIntegration: vi.fn().mockResolvedValue({}),
    createDeployment: vi.fn().mockResolvedValue({}),
    deleteDeployment: vi.fn().mockResolvedValue({}),
    createRestStage: vi.fn().mockResolvedValue({}),
    deleteRestStage: vi.fn().mockResolvedValue({}),
    createHttpApi: vi.fn().mockResolvedValue({}),
    deleteHttpApi: vi.fn().mockResolvedValue({}),
    createHttpRoute: vi.fn().mockResolvedValue({}),
    updateHttpRoute: vi.fn().mockResolvedValue({}),
    deleteHttpRoute: vi.fn().mockResolvedValue({}),
    createHttpIntegration: vi.fn().mockResolvedValue({}),
    updateHttpIntegration: vi.fn().mockResolvedValue({}),
    deleteHttpIntegration: vi.fn().mockResolvedValue({}),
    createHttpStage: vi.fn().mockResolvedValue({}),
    updateHttpStage: vi.fn().mockResolvedValue({}),
    deleteHttpStage: vi.fn().mockResolvedValue({}),
    getRestInvokeUrl: vi.fn().mockResolvedValue('http://localhost:4566/rest'),
    getHttpInvokeUrl: vi.fn().mockResolvedValue('http://localhost:4566/http'),
    getRestApiDetails: vi.fn().mockResolvedValue({ id: 'rest-1', name: 'Test API' }),
    getHttpApiDetails: vi.fn().mockResolvedValue({ apiId: 'http-1', name: 'Test API' }),
  }),
}))

describe('useApiGatewayState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const state = useApiGatewayState()
    expect(state.activeTab.value).toBe('rest')
    expect(state.restApis.value).toEqual([])
    expect(state.httpApis.value).toEqual([])
    expect(state.isLoading.value).toBe(false)
  })

  it('should have empty expanded sets', () => {
    const state = useApiGatewayState()
    expect(state.expandedApis.value.size).toBe(0)
    expect(state.expandedResources.value.size).toBe(0)
    expect(state.expandedHttpApis.value.size).toBe(0)
  })

  it('should have empty loading flags', () => {
    const state = useApiGatewayState()
    expect(state.loadingRestApis.value).toBe(false)
    expect(state.loadingHttpApis.value).toBe(false)
    expect(state.loadingResources.value).toBe(false)
  })

  it('should have selected items as null', () => {
    const state = useApiGatewayState()
    expect(state.selectedRestApi.value).toBeNull()
    expect(state.selectedResource.value).toBeNull()
    expect(state.selectedHttpApi.value).toBeNull()
  })

  it('should have empty resource maps', () => {
    const state = useApiGatewayState()
    expect(state.resourceMethodsMap.value).toEqual({})
    expect(state.resourceMethodsLoading.value).toEqual({})
  })

  it('should return API methods', () => {
    const state = useApiGatewayState()
    expect(typeof state.loadRestApis).toBe('function')
    expect(typeof state.loadHttpApis).toBe('function')
    expect(typeof state.toggleApiExpansion).toBe('function')
    expect(typeof state.toggleResourceExpansion).toBe('function')
    expect(typeof state.toggleHttpApiExpansion).toBe('function')
  })

  it('should have CRUD methods', () => {
    const state = useApiGatewayState()
    expect(typeof state.createRestApi).toBe('function')
    expect(typeof state.deleteRestApi).toBe('function')
    expect(typeof state.createHttpApi).toBe('function')
    expect(typeof state.deleteHttpApi).toBe('function')
  })
})