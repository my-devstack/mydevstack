import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'

vi.mock('@/composables/useSNS', () => ({
  useSNS: () => ({
    topics: ref([]),
    loading: ref(false),
    topicSubscriptions: ref({}),
    loadingTopicSubscriptions: ref(false),
    expandedTopics: ref({}),
    protocolOptions: ref([]),
    loadTopics: vi.fn(),
    createTopic: vi.fn(),
    deleteTopic: vi.fn(),
    loadTopicSubscriptions: vi.fn(),
    subscribe: vi.fn(),
    publish: vi.fn(),
    toggleTopic: vi.fn(),
  }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

vi.mock('@/composables/useContentReload', () => ({
  useContentReload: () => ({ reloadTrigger: 0 }),
}))

import SNSView from './SNS.vue'

const stubs = {
  MegaphoneIcon: true,
  Modal: true,
  Button: { template: '<button><slot /></button>' },
  DataTable: true,
  EmptyState: true,
  LoadingSpinner: true,
  StatusBadge: true,
  SNSCreateTopicModal: true,
  SNSSubscribeModal: true,
  SNSPublishModal: true,
  SNSDeleteModal: true,
  SNSCodeExamples: true,
}

describe('SNS.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(SNSView, { global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders SNS heading', () => {
    const wrapper = shallowMount(SNSView, { global: { stubs } })
    expect(wrapper.text()).toContain('SNS')
  })

  it('renders Create Topic button', () => {
    const wrapper = shallowMount(SNSView, { global: { stubs } })
    expect(wrapper.text()).toContain('Create Topic')
  })

  it('renders empty state when no topics', () => {
    const wrapper = shallowMount(SNSView, { global: { stubs } })
    const emptyState = wrapper.find('empty-state-stub')
    expect(emptyState.exists()).toBe(true)
  })

  it('renders SNSCodeExamples component', () => {
    const wrapper = shallowMount(SNSView, { global: { stubs } })
    expect(wrapper.find('s-n-s-code-examples-stub').exists()).toBe(true)
  })
})
