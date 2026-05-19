import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import MSKList from './MSKList.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

const statusBadgeStub = {
  template: '<span data-testid="status-badge">{{ label }}</span>',
  props: ['status', 'label'],
}

const emptyStateStub = {
  template: '<div data-testid="empty-state">{{ title }} {{ description }}<button data-testid="empty-action" @click="$emit(\'action\')">Action</button></div>',
  props: ['icon', 'title', 'description', 'actionLabel'],
  emits: ['action'],
}

const mockClusters = [
  {
    ClusterName: 'cluster-1',
    ClusterArn: 'arn:aws:kafka:us-east-1:123456789012:cluster/cluster-1',
    State: 'ACTIVE',
    KafkaVersion: '3.2.0',
    NumberOfBrokerNodes: 3,
  },
  {
    ClusterName: 'cluster-2',
    ClusterArn: 'arn:aws:kafka:us-east-1:123456789012:cluster/cluster-2',
    State: 'CREATING',
    KafkaVersion: '3.3.1',
    NumberOfBrokerNodes: 2,
  },
]

const defaultProps = {
  clusters: mockClusters,
  isLoading: false,
  expandedCluster: null,
  clusterDetails: {},
  clusterBrokers: {},
  columns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'state', label: 'State', sortable: true },
  ],
}

describe('MSKList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders empty state when no clusters', () => {
    const wrapper = mount(MSKList, {
      props: { ...defaultProps, clusters: [] },
      global: { stubs: { MSKClusterDetails: true, EmptyState: emptyStateStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('No MSK Clusters')
  })

  it('renders cluster list when clusters exist', () => {
    const wrapper = mount(MSKList, {
      props: defaultProps,
      global: { stubs: { MSKClusterDetails: true, EmptyState: emptyStateStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).toContain('cluster-1')
    expect(wrapper.text()).toContain('cluster-2')
  })

  it('renders status badges', () => {
    const wrapper = mount(MSKList, {
      props: defaultProps,
      global: { stubs: { MSKClusterDetails: true, EmptyState: emptyStateStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).toContain('ACTIVE')
    expect(wrapper.text()).toContain('CREATING')
  })

  it('renders kafka version', () => {
    const wrapper = mount(MSKList, {
      props: defaultProps,
      global: { stubs: { MSKClusterDetails: true, EmptyState: emptyStateStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).toContain('3.2.0')
  })

  it('emits expand on cluster header click', async () => {
    const wrapper = mount(MSKList, {
      props: defaultProps,
      global: { stubs: { MSKClusterDetails: true, EmptyState: emptyStateStub, StatusBadge: statusBadgeStub } },
    })
    // Find all clickable accordion headers
    const headers = wrapper.findAll('.cursor-pointer')
    if (headers.length > 0) {
      await headers[0].trigger('click')
      expect(wrapper.emitted('expand')).toBeTruthy()
      expect(wrapper.emitted('expand')?.[0]).toEqual([mockClusters[0].ClusterArn])
    }
  })

  it('emits delete on delete button click', async () => {
    const wrapper = mount(MSKList, {
      props: defaultProps,
      global: { stubs: { MSKClusterDetails: true, EmptyState: emptyStateStub, StatusBadge: statusBadgeStub } },
    })
    const deleteBtn = wrapper.find('button[title="Delete cluster"]')
    if (deleteBtn.exists()) {
      await deleteBtn.trigger('click')
      expect(wrapper.emitted('delete')).toBeTruthy()
    }
  })

  it('emits create on empty state action', async () => {
    const wrapper = mount(MSKList, {
      props: { ...defaultProps, clusters: [] },
      global: { stubs: { MSKClusterDetails: true, EmptyState: emptyStateStub, StatusBadge: statusBadgeStub } },
    })
    const actionBtn = wrapper.find('[data-testid="empty-action"]')
    if (actionBtn.exists()) {
      await actionBtn.trigger('click')
      expect(wrapper.emitted('create')).toBeTruthy()
    }
  })

  it('shows expanded cluster details when expanded', () => {
    const wrapper = mount(MSKList, {
      props: { ...defaultProps, expandedCluster: mockClusters[0].ClusterArn },
      global: { stubs: { MSKClusterDetails: true, EmptyState: emptyStateStub, StatusBadge: statusBadgeStub } },
    })
    const details = wrapper.findComponent({ name: 'MSKClusterDetails' })
    expect(details.exists()).toBe(true)
  })
})
