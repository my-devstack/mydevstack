import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const { toastMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('@/api/services/api-gateway', () => ({
  getHttpApis: vi.fn(),
  getHttpApiStages: vi.fn(),
  getHttpRoutes: vi.fn(),
  getHttpIntegrations: vi.fn(),
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

const mockApi = { apiId: 'api-1', name: 'My HTTP API', protocolType: 'HTTP', description: 'HTTP API' }

function mountView() {
  return mount(APIGatewayHttpApis, {
    global: {
      stubs: {
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

async function mountExpanded() {
  vi.mocked(apigatewayApi.getHttpApis).mockResolvedValue({ items: [mockApi] })
  vi.mocked(apigatewayApi.getHttpApiStages).mockResolvedValue({ items: [{ stageName: 'prod', autoDeploy: true }] })
  vi.mocked(apigatewayApi.getHttpRoutes).mockResolvedValue({
    items: [{ routeId: 'route-1', routeKey: 'GET /items', target: 'integration:int-1' }],
  })
  vi.mocked(apigatewayApi.getHttpIntegrations).mockResolvedValue({
    items: [{ integrationId: 'int-1', integrationType: 'HTTP', integrationUri: 'http://localhost:8080' }],
  })

  const wrapper = mountView()
  await flushPromises()

  // Expand the API card → loadDetailsForApi populates stages/routes/integrations.
  const header = wrapper.findAll('.cursor-pointer').at(0)
  expect(header).toBeDefined()
  await header!.trigger('click')
  await flushPromises()
  await wrapper.vm.$nextTick()

  return wrapper
}

describe('APIGatewayHttpApis.vue integration — HTTP API sub-resource delete', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('deletes a route from the expanded API list', async () => {
    const wrapper = await mountExpanded()

    const deleteBtns = wrapper.findAll('button[title="Delete"]')
    // Order inside the expanded card: [0] API-level, [1] route, [2] integration, [3] stage.
    expect(deleteBtns.length).toBeGreaterThanOrEqual(2)
    await deleteBtns[1].trigger('click')
    await flushPromises()

    expect(apigatewayApi.deleteHttpRoute).toHaveBeenCalledWith('api-1', 'route-1')
    expect(toastMock.success).toHaveBeenCalledWith('Route deleted')
    // Reload of details for the same apiId.
    expect(apigatewayApi.getHttpApiStages).toHaveBeenCalledWith('api-1')
  })

  it('deletes an integration from the expanded API list', async () => {
    const wrapper = await mountExpanded()

    const deleteBtns = wrapper.findAll('button[title="Delete"]')
    expect(deleteBtns.length).toBeGreaterThanOrEqual(3)
    await deleteBtns[2].trigger('click')
    await flushPromises()

    expect(apigatewayApi.deleteHttpApiIntegration).toHaveBeenCalledWith('api-1', 'int-1')
    expect(toastMock.success).toHaveBeenCalledWith('Integration deleted')
    expect(apigatewayApi.getHttpApiStages).toHaveBeenCalledWith('api-1')
  })

  it('deletes a stage from the expanded API list', async () => {
    const wrapper = await mountExpanded()

    const deleteBtns = wrapper.findAll('button[title="Delete"]')
    expect(deleteBtns.length).toBeGreaterThanOrEqual(4)
    await deleteBtns[3].trigger('click')
    await flushPromises()

    expect(apigatewayApi.deleteHttpApiStage).toHaveBeenCalledWith('api-1', 'prod')
    expect(toastMock.success).toHaveBeenCalledWith('Stage deleted')
    expect(apigatewayApi.getHttpApiStages).toHaveBeenCalledWith('api-1')
  })

  it('shows an error toast when route delete fails', async () => {
    vi.mocked(apigatewayApi.deleteHttpRoute).mockRejectedValueOnce(new Error('route boom'))

    const wrapper = await mountExpanded()

    const deleteBtns = wrapper.findAll('button[title="Delete"]')
    await deleteBtns[1].trigger('click')
    await flushPromises()

    expect(apigatewayApi.deleteHttpRoute).toHaveBeenCalledWith('api-1', 'route-1')
    expect(toastMock.error).toHaveBeenCalledWith('route boom')
    expect(toastMock.success).not.toHaveBeenCalled()
  })
})