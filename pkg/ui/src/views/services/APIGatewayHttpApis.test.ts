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