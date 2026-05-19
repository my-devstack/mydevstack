import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/services/cloudformation', () => ({
  listStacks: vi.fn().mockResolvedValue({ StackSummaries: [] }),
  createStack: vi.fn().mockResolvedValue({}),
  deleteStack: vi.fn().mockResolvedValue({}),
  getStackDetails: vi.fn().mockResolvedValue(null),
  getStackTemplate: vi.fn().mockResolvedValue(''),
  listStackResources: vi.fn().mockResolvedValue({ StackResourceSummaries: [] }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

import CloudFormation from './CloudFormation.vue'

describe('CloudFormation.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(CloudFormation, {
      global: {
        stubs: {
          StackList: true,
          CreateStackForm: true,
          CodeSnippet: true,
          CubeIcon: true,
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders CloudFormation Stacks heading', () => {
    const wrapper = shallowMount(CloudFormation, {
      global: {
        stubs: {
          StackList: true,
          CreateStackForm: true,
          CodeSnippet: true,
          CubeIcon: true,
        },
      },
    })
    expect(wrapper.text()).toContain('CloudFormation Stacks')
  })

  it('renders Create Stack button', () => {
    const wrapper = shallowMount(CloudFormation, {
      global: {
        stubs: {
          StackList: true,
          CreateStackForm: true,
          CodeSnippet: true,
          CubeIcon: true,
        },
      },
    })
    expect(wrapper.text()).toContain('Create Stack')
  })

  it('renders StackList component', () => {
    const wrapper = shallowMount(CloudFormation, {
      global: {
        stubs: {
          StackList: true,
          CreateStackForm: true,
          CodeSnippet: true,
          CubeIcon: true,
        },
      },
    })
    expect(wrapper.find('stack-list-stub').exists()).toBe(true)
  })

  it('renders CreateStackForm component', () => {
    const wrapper = shallowMount(CloudFormation, {
      global: {
        stubs: {
          StackList: true,
          CreateStackForm: true,
          CodeSnippet: true,
          CubeIcon: true,
        },
      },
    })
    expect(wrapper.find('create-stack-form-stub').exists()).toBe(true)
  })

  it('renders CodeSnippet component', () => {
    const wrapper = shallowMount(CloudFormation, {
      global: {
        stubs: {
          StackList: true,
          CreateStackForm: true,
          CodeSnippet: true,
          CubeIcon: true,
        },
      },
    })
    expect(wrapper.find('code-snippet-stub').exists()).toBe(true)
  })
})
