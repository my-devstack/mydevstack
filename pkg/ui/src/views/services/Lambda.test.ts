import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/services/lambda', () => ({
  listFunctions: vi.fn().mockResolvedValue([]),
  createFunction: vi.fn().mockResolvedValue({}),
  getFunction: vi.fn().mockResolvedValue(null),
  deleteFunction: vi.fn().mockResolvedValue({}),
  invoke: vi.fn().mockResolvedValue({}),
  invokeFunction: vi.fn().mockResolvedValue({}),
  updateFunctionConfiguration: vi.fn().mockResolvedValue({}),
  updateFunctionCode: vi.fn().mockResolvedValue({}),
  getFunctionConfiguration: vi.fn().mockResolvedValue(null),
  listEventSourceMappings: vi.fn().mockResolvedValue({ EventSourceMappings: [] }),
  createEventSourceMapping: vi.fn().mockResolvedValue({}),
  deleteEventSourceMapping: vi.fn().mockResolvedValue({}),
  getEventSourceMapping: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

import Lambda from './Lambda.vue'

describe('Lambda.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(Lambda, {
      global: {
        stubs: {
          LambdaFunctionsList: true,
          LambdaCreateModal: true,
          LambdaEditModal: true,
          LambdaDeleteModal: true,
          LambdaCodeExamples: true,
          CodeBracketIcon: true,
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders Lambda Functions heading', () => {
    const wrapper = shallowMount(Lambda, {
      global: {
        stubs: {
          LambdaFunctionsList: true,
          LambdaCreateModal: true,
          LambdaEditModal: true,
          LambdaDeleteModal: true,
          LambdaCodeExamples: true,
          CodeBracketIcon: true,
        },
      },
    })
    expect(wrapper.text()).toContain('Lambda Functions')
  })

  it('renders Create Function button', () => {
    const wrapper = shallowMount(Lambda, {
      global: {
        stubs: {
          LambdaFunctionsList: true,
          LambdaCreateModal: true,
          LambdaEditModal: true,
          LambdaDeleteModal: true,
          LambdaCodeExamples: true,
          CodeBracketIcon: true,
        },
      },
    })
    expect(wrapper.text()).toContain('Create Function')
  })

  it('renders LambdaFunctionsList component', () => {
    const wrapper = shallowMount(Lambda, {
      global: {
        stubs: {
          LambdaFunctionsList: true,
          LambdaCreateModal: true,
          LambdaEditModal: true,
          LambdaDeleteModal: true,
          LambdaCodeExamples: true,
          CodeBracketIcon: true,
        },
      },
    })
    expect(wrapper.find('lambda-functions-list-stub').exists()).toBe(true)
  })

  it('renders LambdaCodeExamples component', () => {
    const wrapper = shallowMount(Lambda, {
      global: {
        stubs: {
          LambdaFunctionsList: true,
          LambdaCreateModal: true,
          LambdaEditModal: true,
          LambdaDeleteModal: true,
          LambdaCodeExamples: true,
          CodeBracketIcon: true,
        },
      },
    })
    expect(wrapper.find('lambda-code-examples-stub').exists()).toBe(true)
  })

  it('renders modals', () => {
    const wrapper = shallowMount(Lambda, {
      global: {
        stubs: {
          LambdaFunctionsList: true,
          LambdaCreateModal: true,
          LambdaEditModal: true,
          LambdaDeleteModal: true,
          LambdaCodeExamples: true,
          CodeBracketIcon: true,
        },
      },
    })
    expect(wrapper.find('lambda-create-modal-stub').exists()).toBe(true)
    expect(wrapper.find('lambda-edit-modal-stub').exists()).toBe(true)
    expect(wrapper.find('lambda-delete-modal-stub').exists()).toBe(true)
  })
})
