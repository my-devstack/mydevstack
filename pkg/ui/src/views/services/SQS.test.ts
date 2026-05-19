import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'

vi.mock('@/composables/useSQS', () => ({
  useSQS: () => ({
    queues: ref([]),
    loading: ref(false),
    expandedQueues: ref({}),
    queueAttributesMap: ref({}),
    queueArnMap: ref({}),
    messages: ref([]),
    loadingMessages: ref(false),
    codeExamples: {},
    loadQueues: vi.fn(),
    createQueue: vi.fn(),
    deleteQueue: vi.fn(),
    loadQueueAttributes: vi.fn(),
    toggleQueue: vi.fn(),
    formatBody: vi.fn(),
  }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

vi.mock('@/composables/useContentReload', () => ({
  useContentReload: () => ({ reloadTrigger: 0 }),
}))

import SQSView from './SQS.vue'

const stubs = {
  QueueListIcon: true,
  ChevronDownIcon: true,
  ChevronRightIcon: true,
  ClipboardDocumentIcon: true,
  ConfirmModal: true,
  SQSCreateQueueModal: true,
  SQSMessagesModal: true,
  CodeSnippet: true,
}

describe('SQS.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(SQSView, { global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders SQS heading', () => {
    const wrapper = shallowMount(SQSView, { global: { stubs } })
    expect(wrapper.text()).toContain('SQS')
  })

  it('renders Create Queue button', () => {
    const wrapper = shallowMount(SQSView, { global: { stubs } })
    expect(wrapper.text()).toContain('Create Queue')
  })

  it('renders CodeSnippet component for examples', () => {
    const wrapper = shallowMount(SQSView, { global: { stubs } })
    expect(wrapper.find('code-snippet-stub').exists()).toBe(true)
  })
})
