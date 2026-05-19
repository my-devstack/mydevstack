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
})
