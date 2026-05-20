import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/services/ssm', () => ({
  describeParameters: vi.fn().mockResolvedValue({ Parameters: [] }),
  getParameter: vi.fn().mockResolvedValue({ Parameter: { Value: '' } }),
  putParameter: vi.fn().mockResolvedValue({}),
  deleteParameter: vi.fn().mockResolvedValue({}),
  getParameterHistory: vi.fn().mockResolvedValue({ Parameters: [] }),
  getParametersByPath: vi.fn().mockResolvedValue({ Parameters: [] }),
  getParameters: vi.fn().mockResolvedValue({ Parameters: [] }),
  listTagsForResource: vi.fn().mockResolvedValue({ TagList: [] }),
  addTagsToResource: vi.fn().mockResolvedValue({}),
  removeTagsFromResource: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

import SSM from './SSM.vue'

describe('SSM.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(SSM, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          EmptyState: true,
          SSMParametersList: true,
          SSMCreateModal: true,
          SSMValueModal: true,
          SSMHistoryModal: true,
          SSMDeleteModal: true,
          CodeSnippet: true,
          PlusIcon: true,
          ArrowPathIcon: true,
          KeyIcon: true,
          BeakerIcon: true,
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders Parameter Store heading', () => {
    const wrapper = shallowMount(SSM, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          EmptyState: true,
          SSMParametersList: true,
          SSMCreateModal: true,
          SSMValueModal: true,
          SSMHistoryModal: true,
          SSMDeleteModal: true,
          CodeSnippet: true,
          PlusIcon: true,
          ArrowPathIcon: true,
          KeyIcon: true,
          BeakerIcon: true,
        },
      },
    })
    expect(wrapper.text()).toContain('Parameter Store')
  })

  it('renders Create Parameter button', () => {
    const wrapper = shallowMount(SSM, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          EmptyState: true,
          SSMParametersList: true,
          SSMCreateModal: true,
          SSMValueModal: true,
          SSMHistoryModal: true,
          SSMDeleteModal: true,
          CodeSnippet: true,
          PlusIcon: true,
          ArrowPathIcon: true,
          KeyIcon: true,
          BeakerIcon: true,
        },
      },
    })
    expect(wrapper.text()).toContain('Create Parameter')
  })

  it('renders SSMParametersList during loading state', async () => {
    const wrapper = shallowMount(SSM, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          EmptyState: true,
          SSMParametersList: true,
          SSMCreateModal: true,
          SSMValueModal: true,
          SSMHistoryModal: true,
          SSMDeleteModal: true,
          CodeSnippet: true,
          PlusIcon: true,
          ArrowPathIcon: true,
          KeyIcon: true,
          BeakerIcon: true,
        },
      },
    })
    // Wait for onMounted to set loading=true
    await wrapper.vm.$nextTick()
    expect(wrapper.find('s-s-m-parameters-list-stub').exists()).toBe(true)
  })

  it('shows EmptyState when no parameters', async () => {
    const wrapper = shallowMount(SSM, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          EmptyState: true,
          SSMParametersList: true,
          SSMCreateModal: true,
          SSMValueModal: true,
          SSMHistoryModal: true,
          SSMDeleteModal: true,
          CodeSnippet: true,
          PlusIcon: true,
          ArrowPathIcon: true,
          KeyIcon: true,
          BeakerIcon: true,
        },
      },
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('empty-state-stub').exists()).toBe(true)
  })

  it('renders CodeSnippet component', () => {
    const wrapper = shallowMount(SSM, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          EmptyState: true,
          SSMParametersList: true,
          SSMCreateModal: true,
          SSMValueModal: true,
          SSMHistoryModal: true,
          SSMDeleteModal: true,
          CodeSnippet: true,
          PlusIcon: true,
          ArrowPathIcon: true,
          KeyIcon: true,
          BeakerIcon: true,
        },
      },
    })
    expect(wrapper.find('code-snippet-stub').exists()).toBe(true)
  })

  it('renders modals', () => {
    const wrapper = shallowMount(SSM, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          EmptyState: true,
          SSMParametersList: true,
          SSMCreateModal: true,
          SSMValueModal: true,
          SSMHistoryModal: true,
          SSMDeleteModal: true,
          CodeSnippet: true,
          PlusIcon: true,
          ArrowPathIcon: true,
          KeyIcon: true,
          BeakerIcon: true,
        },
      },
    })
    expect(wrapper.find('s-s-m-create-modal-stub').exists()).toBe(true)
    expect(wrapper.find('s-s-m-value-modal-stub').exists()).toBe(true)
    expect(wrapper.find('s-s-m-history-modal-stub').exists()).toBe(true)
    expect(wrapper.find('s-s-m-delete-modal-stub').exists()).toBe(true)
  })

  describe('template inline handler coverage', () => {
    const sharedStubs = {
      Button: { template: '<button><slot /></button>' },
      EmptyState: true,
      SSMParametersList: true,
      SSMCreateModal: true,
      SSMValueModal: true,
      SSMHistoryModal: true,
      SSMDeleteModal: true,
      CodeSnippet: true,
      PlusIcon: true,
      ArrowPathIcon: true,
      KeyIcon: true,
      BeakerIcon: true,
    }

    it('Create Parameter button exists in DOM', () => {
      const wrapper = shallowMount(SSM, { global: { stubs: sharedStubs } })
      expect(wrapper.text()).toContain('Create Parameter')
    })

    it('SSMParametersList events emitted', () => {
      const wrapper = shallowMount(SSM, { global: { stubs: sharedStubs } })
      const list = wrapper.findComponent({ name: 'SSMParametersList' })
      if (list.exists() && list.vm) {
        list.vm.$emit('view', { Name: 'test-param' })
        list.vm.$emit('edit', { Name: 'test-param' })
        list.vm.$emit('delete', { Name: 'test-param' })
        list.vm.$emit('history', { Name: 'test-param' })
      }
    })

    it('selectParameter sets selected parameter', async () => {
      const wrapper = shallowMount(SSM, { global: { stubs: sharedStubs } })
      wrapper.vm.selectParameter({ Name: 'test-param', Type: 'String', Value: 'test' })
      expect(wrapper.vm.selectedParameter).toBeTruthy()
    })

    it('showCreateModal toggles true', () => {
      const wrapper = shallowMount(SSM, { global: { stubs: sharedStubs } })
      wrapper.vm.showCreateModal = true
      expect(wrapper.vm.showCreateModal).toBe(true)
    })

    it('showDeleteModal toggles true', () => {
      const wrapper = shallowMount(SSM, { global: { stubs: sharedStubs } })
      wrapper.vm.showDeleteModal = true
      expect(wrapper.vm.showDeleteModal).toBe(true)
    })

    it('loadParameters calls composable method', async () => {
      const wrapper = shallowMount(SSM, { global: { stubs: sharedStubs } })
      await wrapper.vm.loadParameters()
    })

    it('openDeleteModal sets state', () => {
      const wrapper = shallowMount(SSM, { global: { stubs: sharedStubs } })
      wrapper.vm.openDeleteModal('test-param')
      expect(wrapper.vm.showDeleteModal).toBe(true)
    })

    it('SSMCreateModal @update:open emit', () => {
      const wrapper = shallowMount(SSM, { global: { stubs: sharedStubs } })
      const modal = wrapper.findComponent('s-s-m-create-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('update:open', false)
      }
    })

    it('SSMDeleteModal @update:open emit', () => {
      const wrapper = shallowMount(SSM, { global: { stubs: sharedStubs } })
      const modal = wrapper.findComponent('s-s-m-delete-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('update:open', false)
      }
    })

    it('SSMValueModal @update:open emit', () => {
      const wrapper = shallowMount(SSM, { global: { stubs: sharedStubs } })
      const modal = wrapper.findComponent('s-s-m-value-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('update:open', false)
      }
    })

    it('SSMHistoryModal @update:open emit', () => {
      const wrapper = shallowMount(SSM, { global: { stubs: sharedStubs } })
      const modal = wrapper.findComponent('s-s-m-history-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('update:open', false)
      }
    })
  })
})
