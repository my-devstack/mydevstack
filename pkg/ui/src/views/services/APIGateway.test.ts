import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/services/api-gateway', () => ({
  getRestApis: vi.fn().mockResolvedValue({ items: [] }),
  getHttpApis: vi.fn().mockResolvedValue({ items: [] }),
  getRestApiStages: vi.fn().mockResolvedValue({ items: [] }),
  getHttpApiStages: vi.fn().mockResolvedValue({ items: [] }),
  getRestApiInvokeUrl: vi.fn().mockResolvedValue(''),
  getHttpApiInvokeUrl: vi.fn().mockResolvedValue(''),
  createRestApi: vi.fn().mockResolvedValue({}),
  createHttpApi: vi.fn().mockResolvedValue({}),
  getRestApi: vi.fn().mockResolvedValue(null),
  getHttpApi: vi.fn().mockResolvedValue(null),
  getResources: vi.fn().mockResolvedValue({ items: [] }),
  getMethod: vi.fn().mockResolvedValue(null),
  getIntegration: vi.fn().mockResolvedValue(null),
  getRoutes: vi.fn().mockResolvedValue({ items: [] }),
  getIntegrations: vi.fn().mockResolvedValue({ items: [] }),
  deleteRestApi: vi.fn().mockResolvedValue({}),
  deleteHttpApi: vi.fn().mockResolvedValue({}),
  createMethod: vi.fn().mockResolvedValue({}),
  putIntegration: vi.fn().mockResolvedValue({}),
  createDeployment: vi.fn().mockResolvedValue({}),
  deleteDeployment: vi.fn().mockResolvedValue({}),
  createStage: vi.fn().mockResolvedValue({}),
  deleteStage: vi.fn().mockResolvedValue({}),
  updateRestApi: vi.fn().mockResolvedValue({}),
  createResource: vi.fn().mockResolvedValue({}),
  deleteResource: vi.fn().mockResolvedValue({}),
  deleteMethod: vi.fn().mockResolvedValue({}),
  deleteIntegration: vi.fn().mockResolvedValue({}),
  deleteRestApiStage: vi.fn().mockResolvedValue({}),
  createRestApiStage: vi.fn().mockResolvedValue({}),
  updateRestApiStage: vi.fn().mockResolvedValue({}),
  createHttpApiStage: vi.fn().mockResolvedValue({}),
  deleteHttpApiStage: vi.fn().mockResolvedValue({}),
  updateHttpApiStage: vi.fn().mockResolvedValue({}),
  createHttpRoute: vi.fn().mockResolvedValue({}),
  updateHttpRoute: vi.fn().mockResolvedValue({}),
  deleteHttpRoute: vi.fn().mockResolvedValue({}),
  createHttpIntegration: vi.fn().mockResolvedValue({}),
  updateHttpIntegration: vi.fn().mockResolvedValue({}),
  deleteHttpIntegration: vi.fn().mockResolvedValue({}),
  createHttpStage: vi.fn().mockResolvedValue({}),
  updateHttpStage: vi.fn().mockResolvedValue({}),
  deleteHttpStage: vi.fn().mockResolvedValue({}),
  getApi: vi.fn().mockResolvedValue(null),
  deleteApi: vi.fn().mockResolvedValue({}),
  createApi: vi.fn().mockResolvedValue({}),
  getApis: vi.fn().mockResolvedValue({ items: [] }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

import APIGateway from './APIGateway.vue'

const stubs = {
  Tabs: true,
  APIGatewayRestApis: true,
  APIGatewayHttpApis: true,
  APIGatewayCreateModal: true,
  APIGatewayInvokeUrlModal: true,
  APIGatewayCodeExamples: true,
  CodeBracketSquareIcon: true,
}

describe('APIGateway.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(APIGateway, { global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders API Gateway heading', () => {
    const wrapper = shallowMount(APIGateway, { global: { stubs } })
    expect(wrapper.text()).toContain('API Gateway')
  })

  it('renders Create button', () => {
    const wrapper = shallowMount(APIGateway, { global: { stubs } })
    expect(wrapper.text()).toContain('Create')
  })

  it('renders Tabs component', () => {
    const wrapper = shallowMount(APIGateway, { global: { stubs } })
    const tabs = wrapper.findComponent({ name: 'Tabs' })
    expect(tabs.exists()).toBe(true)
  })

  it('renders APIGatewayRestApis by default', () => {
    const wrapper = shallowMount(APIGateway, { global: { stubs } })
    const restApis = wrapper.findComponent({ name: 'APIGatewayRestApis' })
    expect(restApis.exists()).toBe(true)
  })

  it('renders APIGatewayCodeExamples', () => {
    const wrapper = shallowMount(APIGateway, { global: { stubs } })
    const codeExamples = wrapper.findComponent({ name: 'APIGatewayCodeExamples' })
    expect(codeExamples.exists()).toBe(true)
  })
})
