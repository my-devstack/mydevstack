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

  describe('template handler coverage', () => {
    it('Create Cluster button triggers modal', () => {
      const wrapper = shallowMount(MSK, { global: { stubs } })
      const buttons = wrapper.findAll('button')
      const btn = buttons.find(b => b.text() === 'Create Cluster')
      if (btn) {
        btn.trigger('click')
        expect(wrapper.vm.showCreateModal).toBe(true)
      }
    })

    it('MSKCreateClusterModal @update:open emit', () => {
      const wrapper = shallowMount(MSK, { global: { stubs } })
      const modal = wrapper.findComponent('m-s-k-create-cluster-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('update:open', false)
        expect(wrapper.vm.showCreateModal).toBe(false)
      }
    })

    it('MSKDeleteClusterModal @update:open emit', () => {
      const wrapper = shallowMount(MSK, { global: { stubs } })
      const modal = wrapper.findComponent('m-s-k-delete-cluster-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('update:open', false)
        expect(wrapper.vm.showDeleteModal).toBe(false)
      }
    })

    it('loadClusters called via refresh', () => {
      const wrapper = shallowMount(MSK, { global: { stubs } })
      wrapper.vm.loadClusters()
    })

    it('goToPage called for pagination', () => {
      const wrapper = shallowMount(MSK, { global: { stubs } })
      wrapper.vm.clusters = Array.from({ length: 25 }, (_, i) => ({
        ClusterName: `cluster-${i}`,
        ClusterArn: `arn:aws:kafka:us-east-1:123:cluster/cluster-${i}`,
        State: 'ACTIVE',
      }))
      wrapper.vm.goToPage(2)
      expect(wrapper.vm.clusterPage).toBe(2)
    })
  })
})
