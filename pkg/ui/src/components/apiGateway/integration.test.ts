import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useApiGateway } from '@/composables/useApiGateway'

// Mock the API Gateway API module
vi.mock('@/api/services/api-gateway', () => ({
  // REST API operations
  getRestApis: vi.fn(),
  createRestApi: vi.fn(),
  deleteRestApi: vi.fn(),
  getRestApi: vi.fn(),
  updateRestApi: vi.fn(),
  getResources: vi.fn(),
  getResource: vi.fn(),
  createResource: vi.fn(),
  deleteResource: vi.fn(),
  putMethod: vi.fn(),
  getMethod: vi.fn(),
  deleteMethod: vi.fn(),
  putIntegration: vi.fn(),
  getIntegration: vi.fn(),
  deleteIntegration: vi.fn(),
  createDeployment: vi.fn(),
  deleteDeployment: vi.fn(),
  getDeployments: vi.fn(),
  // REST API Stages
  createStage: vi.fn(),
  getStages: vi.fn(),
  updateStage: vi.fn(),
  deleteStage: vi.fn(),
  // HTTP API operations
  getHttpApis: vi.fn(),
  createHttpApi: vi.fn(),
  deleteHttpApi: vi.fn(),
  getHttpApi: vi.fn(),
  // HTTP API Routes
  getRoutes: vi.fn(),
  createRoute: vi.fn(),
  updateRoute: vi.fn(),
  deleteRoute: vi.fn(),
  // HTTP API Integrations
  getIntegrations: vi.fn(),
  createIntegration: vi.fn(),
  updateIntegration: vi.fn(),
  deleteIntegrationV2: vi.fn(),
  // HTTP API Stages
  getStagesV2: vi.fn(),
  getStageV2: vi.fn(),
  createStageV2: vi.fn(),
  updateStageV2: vi.fn(),
  deleteStageV2: vi.fn(),
  // Invoke URLs
  getRestApiInvokeUrl: vi.fn(),
  getHttpApiInvokeUrl: vi.fn(),
  // Aliases
  getHttpRoutes: vi.fn(),
  getHttpIntegrations: vi.fn(),
  createMethod: vi.fn(),
  createRestApiStage: vi.fn(),
  getRestApiStages: vi.fn(),
  updateRestApiStage: vi.fn(),
  deleteRestApiStage: vi.fn(),
  getHttpApiStages: vi.fn(),
  getHttpApiStage: vi.fn(),
  createHttpApiStage: vi.fn(),
  updateHttpApiStage: vi.fn(),
  deleteHttpApiStage: vi.fn(),
}))

// Mock the useToast composable
vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
  })),
}))

// Mock the useUIStore store
vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
    notifyWarning: vi.fn(),
    notifyInfo: vi.fn(),
  })),
}))

// Mock useContentReload
vi.mock('@/composables/useContentReload', () => ({
  useContentReload: vi.fn(() => ({
    reloadTrigger: { value: 0 },
  })),
}))

// Import components after mocks
import APIGatewayCreateModal from './APIGatewayCreateModal.vue'
import APIGatewayDeleteModal from './APIGatewayDeleteModal.vue'
import APIGatewayViewDetailsModal from './APIGatewayViewDetailsModal.vue'

import * as apigatewayApi from '@/api/services/api-gateway'

describe('API Gateway Components Integration Tests', () => {
  let wrapper: VueWrapper<any>
  let composableReturn: ReturnType<typeof useApiGateway>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    composableReturn = useApiGateway()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('APIGatewayCreateModal', () => {
    it('can be mounted with open prop', () => {
      wrapper = mount(APIGatewayCreateModal, {
        props: {
          open: true,
          type: 'rest',
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.props('type')).toBe('rest')
    })

    it('can be mounted for HTTP API type', () => {
      wrapper = mount(APIGatewayCreateModal, {
        props: {
          open: true,
          type: 'http',
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.props('type')).toBe('http')
    })

    it('accepts api prop for editing', () => {
      wrapper = mount(APIGatewayCreateModal, {
        props: {
          open: true,
          type: 'rest',
          api: { name: 'test-api', description: 'test desc' },
        },
      })

      expect(wrapper.props('api')).toEqual({ name: 'test-api', description: 'test desc' })
    })
  })

  describe('APIGatewayDeleteModal', () => {
    it('can be mounted with open prop', () => {
      wrapper = mount(APIGatewayDeleteModal, {
        props: {
          open: true,
          name: 'Test API',
          type: 'rest',
        },
      })

      expect(wrapper.exists()).toBe(true)
      // Check props were passed correctly
      expect(wrapper.props('name')).toBe('Test API')
      expect(wrapper.props('type')).toBe('rest')
    })
  })

  describe('APIGatewayViewDetailsModal', () => {
    it('can be mounted with open prop', () => {
      wrapper = mount(APIGatewayViewDetailsModal, {
        props: {
          open: true,
          title: 'API Details',
          details: {},
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('shows title from props', () => {
      wrapper = mount(APIGatewayViewDetailsModal, {
        props: {
          open: true,
          title: 'My API Details',
          details: {},
        },
      })

      // Component exists and has title prop
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.props('title')).toBe('My API Details')
    })
  })

  describe('useApiGateway Composable - REST API Operations', () => {
    it('loadRestApis returns items from API', async () => {
      const { loadRestApis } = composableReturn

      vi.mocked(apigatewayApi.getRestApis).mockResolvedValue({
        items: [
          { id: 'api-1', name: 'API One' },
          { id: 'api-2', name: 'API Two' },
        ],
      })

      const result = await loadRestApis()

      expect(apigatewayApi.getRestApis).toHaveBeenCalled()
      expect(result.items).toHaveLength(2)
      expect(result.items[0].name).toBe('API One')
    })

    it('loadRestApis returns empty on error', async () => {
      const { loadRestApis } = composableReturn

      vi.mocked(apigatewayApi.getRestApis).mockRejectedValue(new Error('API error'))

      const result = await loadRestApis()

      expect(result.items).toEqual([])
    })

    it('createRestApi calls API and returns success', async () => {
      const { createRestApi } = composableReturn

      vi.mocked(apigatewayApi.createRestApi).mockResolvedValue({
        id: 'new-api-id',
        name: 'new-api',
      })

      await createRestApi('new-api', 'New API description')
      await flushPromises()

      expect(apigatewayApi.createRestApi).toHaveBeenCalledWith('new-api', {
        Description: 'New API description',
      })
    })

    it('deleteRestApi calls API correctly', async () => {
      const { deleteRestApi } = composableReturn

      vi.mocked(apigatewayApi.deleteRestApi).mockResolvedValue({})

      await deleteRestApi('api-123')
      await flushPromises()

      expect(apigatewayApi.deleteRestApi).toHaveBeenCalledWith('api-123')
    })

    it('getRestApiDetails returns API details', async () => {
      const { getRestApiDetails } = composableReturn

      vi.mocked(apigatewayApi.getRestApi).mockResolvedValue({
        id: 'api-123',
        name: 'test-api',
        description: 'Test API',
        createdDate: '2024-01-01',
      })

      const result = await getRestApiDetails('api-123')

      expect(apigatewayApi.getRestApi).toHaveBeenCalledWith('api-123')
      expect(result?.name).toBe('test-api')
    })

    it('getRestApiDetails returns null on error', async () => {
      const { getRestApiDetails } = composableReturn

      vi.mocked(apigatewayApi.getRestApi).mockRejectedValue(new Error('Not found'))

      const result = await getRestApiDetails('invalid-api')

      expect(result).toBeNull()
    })
  })

  describe('useApiGateway Composable - HTTP API Operations', () => {
    it('loadHttpApis returns items from API', async () => {
      const { loadHttpApis } = composableReturn

      vi.mocked(apigatewayApi.getHttpApis).mockResolvedValue({
        items: [
          { apiId: 'http-1', name: 'HTTP API One' },
        ],
      })

      const result = await loadHttpApis()

      expect(apigatewayApi.getHttpApis).toHaveBeenCalled()
      expect(result.items).toHaveLength(1)
    })

    it('createHttpApi calls API correctly', async () => {
      const { createHttpApi } = composableReturn

      vi.mocked(apigatewayApi.createHttpApi).mockResolvedValue({
        apiId: 'new-http-api-id',
        name: 'new-http-api',
      })

      await createHttpApi('new-http-api', 'HTTP API description')
      await flushPromises()

      expect(apigatewayApi.createHttpApi).toHaveBeenCalledWith({
        name: 'new-http-api',
        description: 'HTTP API description',
      })
    })

    it('deleteHttpApi calls API correctly', async () => {
      const { deleteHttpApi } = composableReturn

      vi.mocked(apigatewayApi.deleteHttpApi).mockResolvedValue({})

      await deleteHttpApi('http-api-123')
      await flushPromises()

      expect(apigatewayApi.deleteHttpApi).toHaveBeenCalledWith('http-api-123')
    })

    it('getHttpApiDetails returns HTTP API details', async () => {
      const { getHttpApiDetails } = composableReturn

      vi.mocked(apigatewayApi.getHttpApi).mockResolvedValue({
        apiId: 'http-123',
        name: 'test-http-api',
        description: 'Test HTTP API',
      })

      const result = await getHttpApiDetails('http-123')

      expect(apigatewayApi.getHttpApi).toHaveBeenCalledWith('http-123')
      expect(result?.name).toBe('test-http-api')
    })
  })

  describe('useApiGateway Composable - Stage Operations', () => {
    it('loadRestStages returns stages', async () => {
      const { loadRestStages } = composableReturn

      vi.mocked(apigatewayApi.getRestApiStages).mockResolvedValue({
        items: [
          { stageName: 'prod', deploymentId: 'deploy-1' },
          { stageName: 'dev', deploymentId: 'deploy-2' },
        ],
      })

      const result = await loadRestStages('api-123')

      expect(apigatewayApi.getRestApiStages).toHaveBeenCalledWith('api-123')
      expect(result.items).toHaveLength(2)
    })

    it('loadHttpStages returns HTTP stages', async () => {
      const { loadHttpStages } = composableReturn

      vi.mocked(apigatewayApi.getHttpApiStages).mockResolvedValue({
        items: [{ stageName: 'default' }],
      })

      const result = await loadHttpStages('http-api-123')

      expect(apigatewayApi.getHttpApiStages).toHaveBeenCalledWith('http-api-123')
      expect(result.items).toHaveLength(1)
    })

    it('getRestInvokeUrl returns invoke URL', async () => {
      const { getRestInvokeUrl } = composableReturn

      vi.mocked(apigatewayApi.getRestApiInvokeUrl).mockResolvedValue({
        invokeUrl: 'https://api-id.execute-api.us-east-1.amazonaws.com/prod',
      })

      const url = await getRestInvokeUrl('api-123', 'prod')

      expect(apigatewayApi.getRestApiInvokeUrl).toHaveBeenCalledWith('api-123', 'prod')
      expect(url).toContain('execute-api')
    })

    it('getRestInvokeUrl returns empty string on error', async () => {
      const { getRestInvokeUrl } = composableReturn

      vi.mocked(apigatewayApi.getRestApiInvokeUrl).mockRejectedValue(new Error('Not found'))

      const url = await getRestInvokeUrl('invalid', 'prod')

      expect(url).toBe('')
    })

    it('getHttpInvokeUrl returns invoke URL', async () => {
      const { getHttpInvokeUrl } = composableReturn

      vi.mocked(apigatewayApi.getHttpApiInvokeUrl).mockResolvedValue({
        invokeUrl: 'https://http-api-id.execute-api.us-east-1.amazonaws.com/default',
      })

      const url = await getHttpInvokeUrl('http-api-123', 'default')

      expect(apigatewayApi.getHttpApiInvokeUrl).toHaveBeenCalledWith('http-api-123', 'default')
      expect(url).toContain('execute-api')
    })
  })

  describe('End-to-End Flow Tests', () => {
    it('Create REST API Flow: creates API and refreshes list', async () => {
      const { createRestApi, loadRestApis } = composableReturn

      // Mock API responses
      vi.mocked(apigatewayApi.createRestApi).mockResolvedValue({
        id: 'new-api-id',
        name: 'test-api',
      })
      vi.mocked(apigatewayApi.getRestApis).mockResolvedValue({
        items: [{ id: 'new-api-id', name: 'test-api' }],
      })

      // Create API
      await createRestApi('test-api', 'Test description')
      await flushPromises()

      // Verify create was called
      expect(apigatewayApi.createRestApi).toHaveBeenCalledWith('test-api', {
        Description: 'Test description',
      })

      // Load list to verify refresh
      const list = await loadRestApis()
      expect(list.items).toHaveLength(1)
    })

    it('Delete REST API Flow: deletes API', async () => {
      const { deleteRestApi } = composableReturn

      // Mock delete
      vi.mocked(apigatewayApi.deleteRestApi).mockResolvedValue({})

      // Delete API
      await deleteRestApi('api-123')
      await flushPromises()

      // Verify delete was called
      expect(apigatewayApi.deleteRestApi).toHaveBeenCalledWith('api-123')
    })

    it('Create HTTP API Flow: creates HTTP API correctly', async () => {
      const { createHttpApi, loadHttpApis } = composableReturn

      // Mock API responses
      vi.mocked(apigatewayApi.createHttpApi).mockResolvedValue({
        apiId: 'new-http-api-id',
        name: 'test-http-api',
      })
      vi.mocked(apigatewayApi.getHttpApis).mockResolvedValue({
        items: [{ apiId: 'new-http-api-id', name: 'test-http-api' }],
      })

      // Create HTTP API
      await createHttpApi('test-http-api', 'Test HTTP description')
      await flushPromises()

      // Verify create was called with correct params
      expect(apigatewayApi.createHttpApi).toHaveBeenCalledWith({
        name: 'test-http-api',
        description: 'Test HTTP description',
      })

      // Load list
      const list = await loadHttpApis()
      expect(list.items).toHaveLength(1)
    })

    it('View API Details Flow: loads REST API details', async () => {
      const { getRestApiDetails } = composableReturn

      // Mock API response
      vi.mocked(apigatewayApi.getRestApi).mockResolvedValue({
        id: 'api-123',
        name: 'my-rest-api',
        description: 'My REST API Description',
        createdDate: '2024-01-15T10:30:00Z',
        apiKeySource: 'HEADER',
        endpointConfiguration: { types: ['REGIONAL'] },
      })

      // Get details
      const details = await getRestApiDetails('api-123')
      await flushPromises()

      // Verify
      expect(apigatewayApi.getRestApi).toHaveBeenCalledWith('api-123')
      expect(details?.name).toBe('my-rest-api')
      expect(details?.description).toBe('My REST API Description')
    })

    it('View HTTP API Details Flow: loads HTTP API details', async () => {
      const { getHttpApiDetails } = composableReturn

      // Mock API response
      vi.mocked(apigatewayApi.getHttpApi).mockResolvedValue({
        apiId: 'http-api-123',
        name: 'my-http-api',
        description: 'My HTTP API Description',
        createdTime: '2024-01-15T10:30:00Z',
        protocolType: 'HTTP',
      })

      // Get details
      const details = await getHttpApiDetails('http-api-123')
      await flushPromises()

      // Verify
      expect(apigatewayApi.getHttpApi).toHaveBeenCalledWith('http-api-123')
      expect(details?.name).toBe('my-http-api')
      expect(details?.protocolType).toBe('HTTP')
    })

    it('Stage Operations Flow: load and get invoke URL', async () => {
      const { loadRestStages, getRestInvokeUrl } = composableReturn

      // Mock stages
      vi.mocked(apigatewayApi.getRestApiStages).mockResolvedValue({
        items: [{ stageName: 'prod', deploymentId: 'deploy-1' }],
      })

      // Mock invoke URL
      vi.mocked(apigatewayApi.getRestApiInvokeUrl).mockResolvedValue({
        invokeUrl: 'https://api-id.execute-api.us-east-1.amazonaws.com/prod',
      })

      // Load stages
      const stages = await loadRestStages('api-123')
      expect(stages.items).toHaveLength(1)
      expect(stages.items[0].stageName).toBe('prod')

      // Get invoke URL
      const url = await getRestInvokeUrl('api-123', 'prod')
      expect(url).toBe('https://api-id.execute-api.us-east-1.amazonaws.com/prod')
    })
  })
})