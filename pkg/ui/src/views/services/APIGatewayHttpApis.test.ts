import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const { toastMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('@/api/services/api-gateway', () => ({
  getHttpApis: vi.fn().mockResolvedValue({ items: [] }),
  getHttpApiStages: vi.fn().mockResolvedValue({ items: [] }),
  getHttpRoutes: vi.fn().mockResolvedValue({ items: [] }),
  getHttpIntegrations: vi.fn().mockResolvedValue({ items: [] }),
  deleteHttpApi: vi.fn().mockResolvedValue({}),
  deleteHttpRoute: vi.fn().mockResolvedValue({}),
  deleteHttpApiIntegration: vi.fn().mockResolvedValue({}),
  deleteHttpApiStage: vi.fn().mockResolvedValue({}),
  createHttpIntegration: vi.fn().mockResolvedValue({}),
  updateHttpIntegration: vi.fn().mockResolvedValue({}),
  createHttpRoute: vi.fn().mockResolvedValue({}),
  updateHttpRoute: vi.fn().mockResolvedValue({}),
  createHttpApiStage: vi.fn().mockResolvedValue({}),
  updateHttpApiStage: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/api/services/lambda', () => ({
  listFunctions: vi.fn().mockResolvedValue({ Functions: [] }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => toastMock,
}))

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

import APIGatewayHttpApis from './APIGatewayHttpApis.vue'
import * as apigatewayApi from '@/api/services/api-gateway'
import * as lambdaApi from '@/api/services/lambda'

// Stub the list so we can drive the delete emits from the child.
// The view handler must use the apiId carried by the emit — NOT `selectedApi`,
// which is only set by the create/edit modal-open handlers (regression for
// the bug where delete buttons silently no-op'd after expanding an API).
const listStub = {
  name: 'APIGatewayHttpApisList',
  props: ['apis', 'loading', 'expandedApis', 'stages', 'routes', 'routeTargets', 'integrations'],
  emits: [
    'toggle-api',
    'view-api',
    'delete-api',
    'get-invoke-url',
    'edit-api',
    'create-integration',
    'edit-integration',
    'delete-integration',
    'create-route',
    'edit-route',
    'delete-route',
    'create-stage',
    'edit-stage',
    'delete-stage',
  ],
  template: `
    <div class="mock-list">
      <button data-testid="delete-route" @click="$emit('delete-route', 'api-1', { routeId: 'route-1', routeKey: 'GET /items' })">Delete Route</button>
      <button data-testid="delete-integration" @click="$emit('delete-integration', 'api-1', { integrationId: 'int-1' })">Delete Integration</button>
      <button data-testid="delete-stage" @click="$emit('delete-stage', 'api-1', { stageName: 'prod' })">Delete Stage</button>
    </div>
  `,
}

function mountView() {
  return shallowMount(APIGatewayHttpApis, {
    global: {
      stubs: {
        APIGatewayHttpApisList: listStub,
        APIGatewayIntegrationModal: true,
        APIGatewayRouteModal: true,
        APIGatewayStageModal: true,
        APIGatewayEditRouteModal: true,
        APIGatewayEditStageModal: true,
        Modal: true,
      },
    },
  })
}

const mockApi = { apiId: 'api-1', name: 'My HTTP API', protocolType: 'HTTP', description: 'HTTP API' }

// Shared setup for the expanded coverage suites. Re-asserts default mock
// implementations so per-test mockResolvedValueOnce overrides don't leak.
beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  vi.mocked(apigatewayApi.getHttpApis).mockResolvedValue({ items: [] })
  vi.mocked(apigatewayApi.getHttpApiStages).mockResolvedValue({ items: [] })
  vi.mocked(apigatewayApi.getHttpRoutes).mockResolvedValue({ items: [] })
  vi.mocked(apigatewayApi.getHttpIntegrations).mockResolvedValue({ items: [] })
  vi.mocked(lambdaApi.listFunctions).mockResolvedValue({ Functions: [] })
})

describe('APIGatewayHttpApis.vue delete handlers (regression)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('handleDeleteRoute calls deleteHttpRoute with the emitted apiId when selectedApi is null', async () => {
    const wrapper = mountView()
    await flushPromises()

    // Sanity: no modal was opened, so selectedApi was never assigned.
    expect(toastMock.error).not.toHaveBeenCalled()

    await wrapper.find('[data-testid="delete-route"]').trigger('click')
    await flushPromises()

    expect(apigatewayApi.deleteHttpRoute).toHaveBeenCalledWith('api-1', 'route-1')
    expect(toastMock.success).toHaveBeenCalledWith('Route deleted')
    // Details are reloaded for the same apiId after delete.
    expect(apigatewayApi.getHttpApiStages).toHaveBeenCalledWith('api-1')
    expect(apigatewayApi.getHttpRoutes).toHaveBeenCalledWith('api-1')
    expect(apigatewayApi.getHttpIntegrations).toHaveBeenCalledWith('api-1')
  })

  it('handleDeleteIntegration calls deleteHttpApiIntegration with the emitted apiId when selectedApi is null', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('[data-testid="delete-integration"]').trigger('click')
    await flushPromises()

    expect(apigatewayApi.deleteHttpApiIntegration).toHaveBeenCalledWith('api-1', 'int-1')
    expect(toastMock.success).toHaveBeenCalledWith('Integration deleted')
    expect(apigatewayApi.getHttpApiStages).toHaveBeenCalledWith('api-1')
  })

  it('handleDeleteStage calls deleteHttpApiStage with the emitted apiId when selectedApi is null', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('[data-testid="delete-stage"]').trigger('click')
    await flushPromises()

    expect(apigatewayApi.deleteHttpApiStage).toHaveBeenCalledWith('api-1', 'prod')
    expect(toastMock.success).toHaveBeenCalledWith('Stage deleted')
    expect(apigatewayApi.getHttpApiStages).toHaveBeenCalledWith('api-1')
  })

  it('handleDeleteRoute shows toast.error when the API call fails', async () => {
    vi.mocked(apigatewayApi.deleteHttpRoute).mockRejectedValueOnce(new Error('boom'))

    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('[data-testid="delete-route"]').trigger('click')
    await flushPromises()

    expect(apigatewayApi.deleteHttpRoute).toHaveBeenCalledWith('api-1', 'route-1')
    expect(toastMock.error).toHaveBeenCalledWith('boom')
    expect(toastMock.success).not.toHaveBeenCalled()
  })
})

describe('APIGatewayHttpApis.vue — data loaders', () => {
  it('loads apis and lambda functions on mount', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(apigatewayApi.getHttpApis).toHaveBeenCalled()
    expect(lambdaApi.listFunctions).toHaveBeenCalled()
    expect(wrapper.vm.apis).toEqual([])
    expect(wrapper.vm.lambdaFunctions).toEqual([])
  })

  it('loadLambdaFunctions uses the lowercase functions field when Functions is absent', async () => {
    vi.mocked(lambdaApi.listFunctions).mockResolvedValueOnce({ functions: [{ FunctionName: 'f1' }] })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.vm.lambdaFunctions).toEqual([{ FunctionName: 'f1' }])
  })

  it('loadLambdaFunctions logs an error when the API call fails', async () => {
    vi.mocked(lambdaApi.listFunctions).mockRejectedValueOnce(new Error('lambda boom'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mountView()
    await flushPromises()

    expect(console.error).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('loadApis handles the capitalized Items shape', async () => {
    vi.mocked(apigatewayApi.getHttpApis).mockResolvedValueOnce({ Items: [mockApi] })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.vm.apis).toEqual([mockApi])
  })

  it('loadApis shows an error toast when the API call fails', async () => {
    vi.mocked(apigatewayApi.getHttpApis).mockRejectedValueOnce(new Error('apis boom'))

    const wrapper = mountView()
    await flushPromises()

    expect(toastMock.error).toHaveBeenCalledWith('Failed to load APIs')
  })
})

describe('APIGatewayHttpApis.vue — expansion & details', () => {
  it('toggleApiExpansion expands an api and loads its details', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.toggleApiExpansion('api-1')
    await flushPromises()

    expect(wrapper.vm.expandedApis.has('api-1')).toBe(true)
    expect(apigatewayApi.getHttpApiStages).toHaveBeenCalledWith('api-1')
    expect(apigatewayApi.getHttpRoutes).toHaveBeenCalledWith('api-1')
    expect(apigatewayApi.getHttpIntegrations).toHaveBeenCalledWith('api-1')
  })

  it('toggleApiExpansion collapses an expanded api', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.toggleApiExpansion('api-1')
    wrapper.vm.toggleApiExpansion('api-1')
    await flushPromises()

    expect(wrapper.vm.expandedApis.has('api-1')).toBe(false)
  })

  it('toggleApiExpansion collapses other apis when expanding a new one', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.toggleApiExpansion('api-1')
    wrapper.vm.toggleApiExpansion('api-2')
    await flushPromises()

    expect(wrapper.vm.expandedApis.has('api-1')).toBe(false)
    expect(wrapper.vm.expandedApis.has('api-2')).toBe(true)
  })

  it('loadDetailsForApi populates stages, routes, integrations and route targets', async () => {
    vi.mocked(apigatewayApi.getHttpApiStages).mockResolvedValueOnce({ items: [{ stageName: 'prod' }] })
    vi.mocked(apigatewayApi.getHttpRoutes).mockResolvedValueOnce({
      items: [
        { routeId: 'r1', target: 'integration:t1' },
        { routeId: 'r2', Target: 'integration:t2' },
        { routeId: 'r3' },
      ],
    })
    vi.mocked(apigatewayApi.getHttpIntegrations).mockResolvedValueOnce({ items: [{ integrationId: 'i1' }] })

    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.toggleApiExpansion('api-1')
    await flushPromises()

    expect(wrapper.vm.stages['api-1']).toEqual([{ stageName: 'prod' }])
    expect(wrapper.vm.routes['api-1']).toHaveLength(3)
    expect(wrapper.vm.integrations['api-1']).toEqual([{ integrationId: 'i1' }])
    expect(wrapper.vm.routeTargets['api-1']).toEqual({ r1: 'integration:t1', r2: 'integration:t2', r3: '-' })
  })

  it('loadDetailsForApi handles capitalized Items responses', async () => {
    vi.mocked(apigatewayApi.getHttpApiStages).mockResolvedValueOnce({ Items: [{ StageName: 'prod' }] })
    vi.mocked(apigatewayApi.getHttpRoutes).mockResolvedValueOnce({ Items: [{ RouteId: 'r1' }] })
    vi.mocked(apigatewayApi.getHttpIntegrations).mockResolvedValueOnce({ Items: [{ IntegrationId: 'i1' }] })

    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.toggleApiExpansion('api-1')
    await flushPromises()

    expect(wrapper.vm.stages['api-1']).toEqual([{ StageName: 'prod' }])
    expect(wrapper.vm.routes['api-1']).toEqual([{ RouteId: 'r1' }])
    expect(wrapper.vm.integrations['api-1']).toEqual([{ IntegrationId: 'i1' }])
    expect(wrapper.vm.routeTargets['api-1']).toEqual({})
  })

  it('loadDetailsForApi logs an error when a request fails', async () => {
    vi.mocked(apigatewayApi.getHttpRoutes).mockRejectedValueOnce(new Error('details boom'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.toggleApiExpansion('api-1')
    await flushPromises()

    expect(console.error).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})

describe('APIGatewayHttpApis.vue — API-level handlers', () => {
  it('handleDeleteApi opens the delete modal', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleDeleteApi(mockApi)

    expect(wrapper.vm.apiToDelete).toEqual(mockApi)
    expect(wrapper.vm.showDeleteModal).toBe(true)
  })

  it('confirmDeleteApi deletes the api and reloads the list', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleDeleteApi(mockApi)
    wrapper.vm.confirmDeleteApi()
    await flushPromises()

    expect(apigatewayApi.deleteHttpApi).toHaveBeenCalledWith('api-1')
    expect(toastMock.success).toHaveBeenCalledWith('HTTP API deleted')
    expect(wrapper.vm.showDeleteModal).toBe(false)
    // onMounted load + post-delete reload
    expect(apigatewayApi.getHttpApis).toHaveBeenCalledTimes(2)
  })

  it('confirmDeleteApi shows an error toast when the API call fails', async () => {
    vi.mocked(apigatewayApi.deleteHttpApi).mockRejectedValueOnce(new Error('delete boom'))

    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleDeleteApi(mockApi)
    wrapper.vm.confirmDeleteApi()
    await flushPromises()

    expect(apigatewayApi.deleteHttpApi).toHaveBeenCalledWith('api-1')
    expect(toastMock.error).toHaveBeenCalledWith('delete boom')
    expect(toastMock.success).not.toHaveBeenCalled()
  })

  it('handleViewApi expands the api', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleViewApi(mockApi)
    await flushPromises()

    expect(wrapper.vm.expandedApis.has('api-1')).toBe(true)
  })

  it('handleGetInvokeUrl emits get-invoke-url', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleGetInvokeUrl(mockApi)

    expect(wrapper.emitted('get-invoke-url')).toEqual([[mockApi]])
  })

  it('handleEditApi sets selectedApi and opens the edit modal', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleEditApi(mockApi)

    expect(wrapper.vm.selectedApi).toEqual(mockApi)
    expect(wrapper.vm.showEditModal).toBe(true)
  })
})

describe('APIGatewayHttpApis.vue — create/edit modal openers', () => {
  it('handleCreateIntegration sets selectedApi, clears integrationToEdit and opens the modal', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateIntegration(mockApi)

    expect(wrapper.vm.selectedApi).toEqual(mockApi)
    expect(wrapper.vm.integrationToEdit).toBeNull()
    expect(wrapper.vm.showIntegrationModal).toBe(true)
  })

  it('handleEditIntegration sets integrationToEdit and opens the modal', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleEditIntegration({ integrationId: 'int-1' })

    expect(wrapper.vm.integrationToEdit).toEqual({ integrationId: 'int-1' })
    expect(wrapper.vm.showIntegrationModal).toBe(true)
  })

  it('handleCreateRoute sets selectedApi and opens the route modal', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateRoute(mockApi)

    expect(wrapper.vm.selectedApi).toEqual(mockApi)
    expect(wrapper.vm.showRouteModal).toBe(true)
  })

  it('handleEditRoute sets selectedApi, routeToEdit and opens the edit route modal', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleEditRoute({ routeId: 'route-1' }, 'api-1')

    expect(wrapper.vm.selectedApi).toEqual({ apiId: 'api-1' })
    expect(wrapper.vm.routeToEdit).toEqual({ routeId: 'route-1' })
    expect(wrapper.vm.showEditRouteModal).toBe(true)
  })

  it('handleCreateStage sets selectedApi and opens the stage modal', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateStage(mockApi)

    expect(wrapper.vm.selectedApi).toEqual(mockApi)
    expect(wrapper.vm.showStageModal).toBe(true)
  })

  it('handleEditStage sets selectedApi, stageToEdit and opens the edit stage modal', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleEditStage({ stageName: 'prod' }, 'api-1')

    expect(wrapper.vm.selectedApi).toEqual({ apiId: 'api-1' })
    expect(wrapper.vm.stageToEdit).toEqual({ stageName: 'prod' })
    expect(wrapper.vm.showEditStageModal).toBe(true)
  })
})

describe('APIGatewayHttpApis.vue — integration create/update', () => {
  it('confirmCreateIntegration creates an AWS integration with a mapping template', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateIntegration(mockApi)
    await wrapper.vm.confirmCreateIntegration('AWS', 'POST', 'http://uri', '{"a":1}')
    await flushPromises()

    expect(apigatewayApi.createHttpIntegration).toHaveBeenCalledWith('api-1', {
      integrationType: 'AWS',
      integrationMethod: 'POST',
      integrationUri: 'http://uri',
      requestTemplates: { 'application/json': '{"a":1}' },
    })
    expect(toastMock.success).toHaveBeenCalledWith('Integration created successfully')
    expect(wrapper.vm.showIntegrationModal).toBe(false)
    // Details are reloaded for the api after creation.
    expect(apigatewayApi.getHttpApiStages).toHaveBeenCalledWith('api-1')
  })

  it('confirmCreateIntegration adds a request template for HTTP type too', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateIntegration(mockApi)
    await wrapper.vm.confirmCreateIntegration('HTTP', 'GET', 'http://uri', 'tmpl')
    await flushPromises()

    expect(apigatewayApi.createHttpIntegration).toHaveBeenCalledWith('api-1', {
      integrationType: 'HTTP',
      integrationMethod: 'GET',
      integrationUri: 'http://uri',
      requestTemplates: { 'application/json': 'tmpl' },
    })
  })

  it('confirmCreateIntegration skips the request template for non AWS/HTTP types', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateIntegration(mockApi)
    await wrapper.vm.confirmCreateIntegration('VPC_LINK', 'GET', 'http://uri', 'tmpl')
    await flushPromises()

    expect(apigatewayApi.createHttpIntegration).toHaveBeenCalledWith('api-1', {
      integrationType: 'VPC_LINK',
      integrationMethod: 'GET',
      integrationUri: 'http://uri',
    })
  })

  it('confirmCreateIntegration without a mapping template omits requestTemplates', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateIntegration(mockApi)
    await wrapper.vm.confirmCreateIntegration('HTTP', 'GET', 'http://uri')
    await flushPromises()

    expect(apigatewayApi.createHttpIntegration).toHaveBeenCalledWith('api-1', {
      integrationType: 'HTTP',
      integrationMethod: 'GET',
      integrationUri: 'http://uri',
    })
  })

  it('confirmCreateIntegration early-returns without a selectedApi', async () => {
    const wrapper = mountView()
    await flushPromises()

    // handleEditIntegration opens the modal without assigning selectedApi.
    wrapper.vm.handleEditIntegration({ integrationId: 'int-1' })
    await wrapper.vm.confirmCreateIntegration('HTTP', 'GET', 'http://uri')
    await flushPromises()

    expect(apigatewayApi.createHttpIntegration).not.toHaveBeenCalled()
    expect(wrapper.vm.showIntegrationModal).toBe(true)
  })

  it('confirmCreateIntegration shows an error toast when the API call fails', async () => {
    vi.mocked(apigatewayApi.createHttpIntegration).mockRejectedValueOnce(new Error('create boom'))

    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateIntegration(mockApi)
    await wrapper.vm.confirmCreateIntegration('HTTP', 'GET', 'http://uri')
    await flushPromises()

    expect(toastMock.error).toHaveBeenCalledWith('create boom')
    expect(toastMock.success).not.toHaveBeenCalled()
  })

  it('confirmUpdateIntegration updates an existing integration', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateIntegration(mockApi)
    wrapper.vm.handleEditIntegration({ integrationId: 'int-1' })
    await wrapper.vm.confirmUpdateIntegration('HTTP', 'GET', 'http://uri', '1.0', 'tmpl')
    await flushPromises()

    expect(apigatewayApi.updateHttpIntegration).toHaveBeenCalledWith('api-1', 'int-1', {
      integrationType: 'HTTP',
      integrationUri: 'http://uri',
      requestTemplates: { 'application/json': 'tmpl' },
    })
    expect(toastMock.success).toHaveBeenCalledWith('Integration updated successfully')
    expect(wrapper.vm.showIntegrationModal).toBe(false)
  })

  it('confirmUpdateIntegration early-returns without a selectedApi or integrationToEdit', async () => {
    const wrapper = mountView()
    await flushPromises()

    // No selectedApi (fresh mount).
    await wrapper.vm.confirmUpdateIntegration('HTTP', 'GET', 'http://uri', '1.0')
    await flushPromises()
    expect(apigatewayApi.updateHttpIntegration).not.toHaveBeenCalled()

    // selectedApi set by handleCreateIntegration, but integrationToEdit is null.
    wrapper.vm.handleCreateIntegration(mockApi)
    await wrapper.vm.confirmUpdateIntegration('HTTP', 'GET', 'http://uri', '1.0')
    await flushPromises()
    expect(apigatewayApi.updateHttpIntegration).not.toHaveBeenCalled()
  })

  it('confirmUpdateIntegration shows an error toast when the API call fails', async () => {
    vi.mocked(apigatewayApi.updateHttpIntegration).mockRejectedValueOnce(new Error('update boom'))

    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateIntegration(mockApi)
    wrapper.vm.handleEditIntegration({ integrationId: 'int-1' })
    await wrapper.vm.confirmUpdateIntegration('HTTP', 'GET', 'http://uri', '1.0')
    await flushPromises()

    expect(toastMock.error).toHaveBeenCalledWith('update boom')
    expect(toastMock.success).not.toHaveBeenCalled()
  })
})

describe('APIGatewayHttpApis.vue — route create/update', () => {
  it('confirmCreateRoute creates a route', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateRoute(mockApi)
    await wrapper.vm.confirmCreateRoute('GET /items', 'integration:int-1')
    await flushPromises()

    expect(apigatewayApi.createHttpRoute).toHaveBeenCalledWith('api-1', {
      routeKey: 'GET /items',
      target: 'integration:int-1',
    })
    expect(toastMock.success).toHaveBeenCalledWith('Route created successfully')
    expect(wrapper.vm.showRouteModal).toBe(false)
    expect(apigatewayApi.getHttpApiStages).toHaveBeenCalledWith('api-1')
  })

  it('confirmCreateRoute early-returns without a selectedApi', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.vm.confirmCreateRoute('GET /items', 'integration:int-1')
    await flushPromises()

    expect(apigatewayApi.createHttpRoute).not.toHaveBeenCalled()
  })

  it('confirmCreateRoute shows an error toast when the API call fails', async () => {
    vi.mocked(apigatewayApi.createHttpRoute).mockRejectedValueOnce(new Error('route create boom'))

    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateRoute(mockApi)
    await wrapper.vm.confirmCreateRoute('GET /items', 'integration:int-1')
    await flushPromises()

    expect(toastMock.error).toHaveBeenCalledWith('route create boom')
    expect(toastMock.success).not.toHaveBeenCalled()
  })

  it('confirmUpdateRoute updates an existing route', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateRoute(mockApi)
    wrapper.vm.handleEditRoute({ routeId: 'route-1', routeKey: 'GET /items' }, 'api-1')
    await wrapper.vm.confirmUpdateRoute('GET /items', 'NONE', '')
    await flushPromises()

    expect(apigatewayApi.updateHttpRoute).toHaveBeenCalledWith('api-1', 'route-1', {
      routeKey: 'GET /items',
      authorizationType: 'NONE',
      authorizerId: '',
    })
    expect(toastMock.success).toHaveBeenCalledWith('Route updated successfully')
    expect(wrapper.vm.showEditRouteModal).toBe(false)
  })

  it('confirmUpdateRoute early-returns without a selectedApi or routeToEdit', async () => {
    const wrapper = mountView()
    await flushPromises()

    // No selectedApi (fresh mount).
    await wrapper.vm.confirmUpdateRoute('GET /items', 'NONE', '')
    await flushPromises()
    expect(apigatewayApi.updateHttpRoute).not.toHaveBeenCalled()

    // selectedApi set by handleCreateRoute, but routeToEdit is null.
    wrapper.vm.handleCreateRoute(mockApi)
    await wrapper.vm.confirmUpdateRoute('GET /items', 'NONE', '')
    await flushPromises()
    expect(apigatewayApi.updateHttpRoute).not.toHaveBeenCalled()
  })

  it('confirmUpdateRoute shows an error toast when the API call fails', async () => {
    vi.mocked(apigatewayApi.updateHttpRoute).mockRejectedValueOnce(new Error('route update boom'))

    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateRoute(mockApi)
    wrapper.vm.handleEditRoute({ routeId: 'route-1' }, 'api-1')
    await wrapper.vm.confirmUpdateRoute('GET /items', 'NONE', '')
    await flushPromises()

    expect(toastMock.error).toHaveBeenCalledWith('route update boom')
    expect(toastMock.success).not.toHaveBeenCalled()
  })
})

describe('APIGatewayHttpApis.vue — stage create/update', () => {
  it('confirmCreateStage creates a stage', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateStage(mockApi)
    await wrapper.vm.confirmCreateStage('prod', { autoDeploy: true })
    await flushPromises()

    expect(apigatewayApi.createHttpApiStage).toHaveBeenCalledWith('api-1', {
      stageName: 'prod',
      autoDeploy: true,
    })
    expect(toastMock.success).toHaveBeenCalledWith('Stage created successfully')
    expect(wrapper.vm.showStageModal).toBe(false)
    expect(apigatewayApi.getHttpApiStages).toHaveBeenCalledWith('api-1')
  })

  it('confirmCreateStage early-returns without a selectedApi', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.vm.confirmCreateStage('prod', {})
    await flushPromises()

    expect(apigatewayApi.createHttpApiStage).not.toHaveBeenCalled()
  })

  it('confirmCreateStage shows an error toast when the API call fails', async () => {
    vi.mocked(apigatewayApi.createHttpApiStage).mockRejectedValueOnce(new Error('stage create boom'))

    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateStage(mockApi)
    await wrapper.vm.confirmCreateStage('prod', {})
    await flushPromises()

    expect(toastMock.error).toHaveBeenCalledWith('stage create boom')
    expect(toastMock.success).not.toHaveBeenCalled()
  })

  it('confirmUpdateStage updates an existing stage', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateStage(mockApi)
    wrapper.vm.handleEditStage({ stageName: 'prod', description: 'old', autoDeploy: true }, 'api-1')
    await wrapper.vm.confirmUpdateStage('new desc', false)
    await flushPromises()

    expect(apigatewayApi.updateHttpApiStage).toHaveBeenCalledWith('api-1', 'prod', {
      description: 'new desc',
      autoDeploy: false,
    })
    expect(toastMock.success).toHaveBeenCalledWith('Stage updated successfully')
    expect(wrapper.vm.showEditStageModal).toBe(false)
  })

  it('confirmUpdateStage early-returns without a selectedApi or stageToEdit', async () => {
    const wrapper = mountView()
    await flushPromises()

    // No selectedApi (fresh mount).
    await wrapper.vm.confirmUpdateStage('desc', true)
    await flushPromises()
    expect(apigatewayApi.updateHttpApiStage).not.toHaveBeenCalled()

    // selectedApi set by handleCreateStage, but stageToEdit is null.
    wrapper.vm.handleCreateStage(mockApi)
    await wrapper.vm.confirmUpdateStage('desc', true)
    await flushPromises()
    expect(apigatewayApi.updateHttpApiStage).not.toHaveBeenCalled()
  })

  it('confirmUpdateStage shows an error toast when the API call fails', async () => {
    vi.mocked(apigatewayApi.updateHttpApiStage).mockRejectedValueOnce(new Error('stage update boom'))

    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateStage(mockApi)
    wrapper.vm.handleEditStage({ stageName: 'prod' }, 'api-1')
    await wrapper.vm.confirmUpdateStage('desc', true)
    await flushPromises()

    expect(toastMock.error).toHaveBeenCalledWith('stage update boom')
    expect(toastMock.success).not.toHaveBeenCalled()
  })
})

describe('APIGatewayHttpApis.vue — template inline handlers', () => {
  it('pagination Previous and Next buttons call goToHttpApiPage', async () => {
    const manyApis = Array.from({ length: 15 }, (_, i) => ({ apiId: `api-${i}`, name: `API ${i}` }))
    vi.mocked(apigatewayApi.getHttpApis).mockResolvedValueOnce({ items: manyApis })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.vm.totalHttpApiPages).toBe(2)
    expect(wrapper.vm.httpApiPage).toBe(1)

    const nextBtn = wrapper.findAll('button').find(b => b.text() === 'Next')
    expect(nextBtn).toBeDefined()
    await nextBtn!.trigger('click')
    await flushPromises()
    expect(wrapper.vm.httpApiPage).toBe(2)

    const prevBtn = wrapper.findAll('button').find(b => b.text() === 'Previous')
    expect(prevBtn).toBeDefined()
    await prevBtn!.trigger('click')
    await flushPromises()
    expect(wrapper.vm.httpApiPage).toBe(1)
  })

  it('integration modal close and update:open handlers', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateIntegration(mockApi)
    await wrapper.vm.$nextTick()
    const modal = wrapper.findComponent({ name: 'APIGatewayIntegrationModal' })
    expect(modal.exists()).toBe(true)

    await modal.vm.$emit('close')
    expect(wrapper.vm.showIntegrationModal).toBe(false)

    wrapper.vm.handleCreateIntegration(mockApi)
    await wrapper.vm.$nextTick()
    const modal2 = wrapper.findComponent({ name: 'APIGatewayIntegrationModal' })
    await modal2.vm.$emit('update:open', false)
    expect(wrapper.vm.showIntegrationModal).toBe(false)
  })

  it('route modal close and update:open handlers', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateRoute(mockApi)
    await wrapper.vm.$nextTick()
    const modal = wrapper.findComponent({ name: 'APIGatewayRouteModal' })
    expect(modal.exists()).toBe(true)

    await modal.vm.$emit('close')
    expect(wrapper.vm.showRouteModal).toBe(false)

    wrapper.vm.handleCreateRoute(mockApi)
    await wrapper.vm.$nextTick()
    const modal2 = wrapper.findComponent({ name: 'APIGatewayRouteModal' })
    await modal2.vm.$emit('update:open', false)
    expect(wrapper.vm.showRouteModal).toBe(false)
  })

  it('stage modal close, update:open and create-http handlers', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleCreateStage(mockApi)
    await wrapper.vm.$nextTick()
    const modal = wrapper.findComponent({ name: 'APIGatewayStageModal' })
    expect(modal.exists()).toBe(true)

    await modal.vm.$emit('close')
    expect(wrapper.vm.showStageModal).toBe(false)

    wrapper.vm.handleCreateStage(mockApi)
    await wrapper.vm.$nextTick()
    const modal2 = wrapper.findComponent({ name: 'APIGatewayStageModal' })
    await modal2.vm.$emit('update:open', false)
    expect(wrapper.vm.showStageModal).toBe(false)

    wrapper.vm.handleCreateStage(mockApi)
    await wrapper.vm.$nextTick()
    const modal3 = wrapper.findComponent({ name: 'APIGatewayStageModal' })
    await modal3.vm.$emit('create-http', 'prod', { autoDeploy: true })
    await flushPromises()
    expect(apigatewayApi.createHttpApiStage).toHaveBeenCalledWith('api-1', {
      stageName: 'prod',
      autoDeploy: true,
    })
    expect(wrapper.vm.showStageModal).toBe(false)
  })

  it('edit route modal close and update:open handlers', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleEditRoute({ routeId: 'route-1' }, 'api-1')
    await wrapper.vm.$nextTick()
    const modal = wrapper.findComponent({ name: 'APIGatewayEditRouteModal' })
    expect(modal.exists()).toBe(true)

    await modal.vm.$emit('close')
    expect(wrapper.vm.showEditRouteModal).toBe(false)

    wrapper.vm.handleEditRoute({ routeId: 'route-1' }, 'api-1')
    await wrapper.vm.$nextTick()
    const modal2 = wrapper.findComponent({ name: 'APIGatewayEditRouteModal' })
    await modal2.vm.$emit('update:open', false)
    expect(wrapper.vm.showEditRouteModal).toBe(false)
  })

  it('edit stage modal close and update:open handlers', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleEditStage({ stageName: 'prod' }, 'api-1')
    await wrapper.vm.$nextTick()
    const modal = wrapper.findComponent({ name: 'APIGatewayEditStageModal' })
    expect(modal.exists()).toBe(true)

    await modal.vm.$emit('close')
    expect(wrapper.vm.showEditStageModal).toBe(false)

    wrapper.vm.handleEditStage({ stageName: 'prod' }, 'api-1')
    await wrapper.vm.$nextTick()
    const modal2 = wrapper.findComponent({ name: 'APIGatewayEditStageModal' })
    await modal2.vm.$emit('update:open', false)
    expect(wrapper.vm.showEditStageModal).toBe(false)
  })

  it('delete modal close and update:open handlers', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.vm.handleDeleteApi(mockApi)
    await wrapper.vm.$nextTick()
    const modal = wrapper.findComponent({ name: 'Modal' })
    expect(modal.exists()).toBe(true)

    await modal.vm.$emit('close')
    expect(wrapper.vm.showDeleteModal).toBe(false)

    wrapper.vm.handleDeleteApi(mockApi)
    await wrapper.vm.$nextTick()
    const modal2 = wrapper.findComponent({ name: 'Modal' })
    await modal2.vm.$emit('update:open', false)
    expect(wrapper.vm.showDeleteModal).toBe(false)
  })
})

describe('APIGatewayHttpApis.vue — delete error paths', () => {
  it('handleDeleteIntegration shows toast.error when the API call fails', async () => {
    vi.mocked(apigatewayApi.deleteHttpApiIntegration).mockRejectedValueOnce(new Error('int boom'))

    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('[data-testid="delete-integration"]').trigger('click')
    await flushPromises()

    expect(apigatewayApi.deleteHttpApiIntegration).toHaveBeenCalledWith('api-1', 'int-1')
    expect(toastMock.error).toHaveBeenCalledWith('int boom')
    expect(toastMock.success).not.toHaveBeenCalled()
  })

  it('handleDeleteStage shows toast.error when the API call fails', async () => {
    vi.mocked(apigatewayApi.deleteHttpApiStage).mockRejectedValueOnce(new Error('stage boom'))

    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('[data-testid="delete-stage"]').trigger('click')
    await flushPromises()

    expect(apigatewayApi.deleteHttpApiStage).toHaveBeenCalledWith('api-1', 'prod')
    expect(toastMock.error).toHaveBeenCalledWith('stage boom')
    expect(toastMock.success).not.toHaveBeenCalled()
  })
})