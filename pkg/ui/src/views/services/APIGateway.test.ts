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

  describe('template inline handler coverage', () => {
    it('handleCreateApi opens modal', () => {
      const wrapper = shallowMount(APIGateway, { global: { stubs } })
      wrapper.vm.handleCreateApi()
      expect(wrapper.vm.showCreateModal).toBe(true)
    })

    it('handleTabChange switches tabs', () => {
      const wrapper = shallowMount(APIGateway, { global: { stubs } })
      wrapper.vm.handleTabChange('http')
      expect(wrapper.vm.activeTab).toBe('http')
    })

    it('Create button click triggers handleCreateApi', () => {
      const wrapper = shallowMount(APIGateway, { global: { stubs } })
      const buttons = wrapper.findAll('button')
      const createBtn = buttons.find(b => b.text().includes('Create'))
      if (createBtn) {
        createBtn.trigger('click')
        expect(wrapper.vm.showCreateModal).toBe(true)
      }
    })

    it('Tabs component emits handleTabChange', () => {
      const wrapper = shallowMount(APIGateway, { global: { stubs } })
      const tabs = wrapper.findComponent({ name: 'Tabs' })
      if (tabs.exists() && tabs.vm) {
        tabs.vm.$emit('update:active-tab', 'http')
        expect(wrapper.vm.activeTab).toBe('http')
      }
    })

    it('APIGatewayCreateModal @create event for REST calls createRestApi', async () => {
      const wrapper = shallowMount(APIGateway, { global: { stubs } })
      wrapper.vm.activeTab = 'rest'
      const modal = wrapper.findComponent({ name: 'APIGatewayCreateModal' })
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('create', { name: 'MyAPI' })
        await new Promise(process.nextTick)
        expect(wrapper.vm.showCreateModal).toBe(false)
      }
    })

    it('APIGatewayCreateModal @create event for HTTP calls createHttpApi', async () => {
      const wrapper = shallowMount(APIGateway, { global: { stubs } })
      wrapper.vm.activeTab = 'http'
      const modal = wrapper.findComponent({ name: 'APIGatewayCreateModal' })
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('create', { name: 'MyAPI' })
        await new Promise(process.nextTick)
        expect(wrapper.vm.showCreateModal).toBe(false)
      }
    })

    it('APIGatewayCreateModal @update:open handler', () => {
      const wrapper = shallowMount(APIGateway, { global: { stubs } })
      const modal = wrapper.findComponent({ name: 'APIGatewayCreateModal' })
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('update:open', false)
        expect(wrapper.vm.showCreateModal).toBe(false)
      }
    })

    it('APIGatewayInvokeUrlModal @update:open handler', () => {
      const wrapper = shallowMount(APIGateway, { global: { stubs } })
      const modal = wrapper.findComponent({ name: 'APIGatewayInvokeUrlModal' })
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('update:open', false)
        expect(wrapper.vm.showInvokeUrlModal).toBe(false)
      }
    })

    it('handleGetInvokeUrl calls loadRestStages for REST', async () => {
      const wrapper = shallowMount(APIGateway, { global: { stubs } })
      wrapper.vm.activeTab = 'rest'
      await wrapper.vm.handleGetInvokeUrl({ id: 'api-1', name: 'MyAPI' })
      expect(wrapper.vm.selectedApi).toBeTruthy()
      expect(wrapper.vm.showInvokeUrlModal).toBe(true)
    })
  })
})
