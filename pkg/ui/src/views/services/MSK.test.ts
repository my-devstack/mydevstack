import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

const { mockListClustersV2, mockDescribeClusterV2, mockCreateClusterV2, mockDeleteCluster, mockGetBootstrapBrokers } = vi.hoisted(() => ({
  mockListClustersV2: vi.fn().mockResolvedValue({ ClusterInfoList: [] }),
  mockDescribeClusterV2: vi.fn().mockResolvedValue(null),
  mockCreateClusterV2: vi.fn().mockResolvedValue({}),
  mockDeleteCluster: vi.fn().mockResolvedValue({}),
  mockGetBootstrapBrokers: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/api/services/msk', () => ({
  listClustersV2: mockListClustersV2,
  describeClusterV2: mockDescribeClusterV2,
  createClusterV2: mockCreateClusterV2,
  deleteCluster: mockDeleteCluster,
  getBootstrapBrokers: mockGetBootstrapBrokers,
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }),
}))

vi.mock('@/composables/useContentReload', () => ({
  useContentReload: () => ({ reloadTrigger: 0 }),
}))

import MSK from './MSK.vue'

const stubs = {
  Button: { template: '<button><slot /></button>' },
  MSKList: true,
  MSKCreateClusterModal: true,
  MSKDeleteClusterModal: true,
  CodeSnippet: true,
  ArrowPathIcon: true,
  PlusIcon: true,
  LoadingSpinner: true,
  EmptyState: true,
}

describe('MSK.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockListClustersV2.mockResolvedValue({ ClusterInfoList: [] })
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(MSK, { global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders MSK heading', () => {
    const wrapper = shallowMount(MSK, { global: { stubs } })
    expect(wrapper.text()).toContain('MSK')
  })

  it('renders Amazon Managed Streaming description', () => {
    const wrapper = shallowMount(MSK, { global: { stubs } })
    expect(wrapper.text()).toContain('Amazon Managed Streaming for Apache Kafka')
  })

  it('renders Create Cluster button', () => {
    const wrapper = shallowMount(MSK, { global: { stubs } })
    const createBtn = wrapper.findAll('button').find(b => b.text() === 'Create Cluster')
    expect(createBtn).toBeDefined()
  })

  it('renders MSKList component', () => {
    const wrapper = shallowMount(MSK, { global: { stubs } })
    const mskList = wrapper.find('m-s-k-list-stub')
    expect(mskList.exists()).toBe(true)
  })

  it('renders CodeSnippet component', () => {
    const wrapper = shallowMount(MSK, { global: { stubs } })
    const codeSnippet = wrapper.find('code-snippet-stub')
    expect(codeSnippet.exists()).toBe(true)
  })

  it('renders modals', () => {
    const wrapper = shallowMount(MSK, { global: { stubs } })
    expect(wrapper.find('m-s-k-create-cluster-modal-stub').exists()).toBe(true)
    expect(wrapper.find('m-s-k-delete-cluster-modal-stub').exists()).toBe(true)
  })

  it('calls listClustersV2 on mount', () => {
    shallowMount(MSK, { global: { stubs } })
    expect(mockListClustersV2).toHaveBeenCalledTimes(1)
  })
})
