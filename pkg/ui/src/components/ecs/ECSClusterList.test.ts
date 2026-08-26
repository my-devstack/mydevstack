import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ECSClusterList } from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
  })),
}))

const createStubs = () => ({
  Button: {
    template: '<button @click="$emit(\'click\', $event)"><slot /></button>',
    props: ['variant', 'size'],
  },
  LoadingSpinner: {
    template: '<div class="spinner" />',
    props: ['size'],
  },
  EmptyState: {
    template: '<div class="empty-state"><h3>{{ title }}</h3><p>{{ description }}</p><button v-if="actionLabel" @click="$emit(\'action\')">{{ actionLabel }}</button></div>',
    props: ['icon', 'title', 'description', 'actionLabel'],
    emits: ['action'],
  },
  StatusBadge: {
    template: '<span class="status-badge">{{ label }}</span>',
    props: ['status', 'label', 'size'],
  },
})

const sampleClusters = [
  {
    ClusterArn: 'arn:aws:ecs:us-east-1:123:cluster/my-cluster',
    ClusterName: 'my-cluster',
    Status: 'ACTIVE',
    RunningTasksCount: 2,
    PendingTasksCount: 0,
    ActiveServicesCount: 1,
    CreatedAt: '2024-01-15T10:30:00Z',
  },
]

describe('ECSClusterList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders clusters', () => {
    const wrapper = mount(ECSClusterList, {
      props: { clusters: sampleClusters },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('my-cluster')
    expect(wrapper.text()).toContain('arn:aws:ecs:us-east-1:123:cluster/my-cluster')
  })

  it('shows empty state when no clusters', () => {
    const wrapper = mount(ECSClusterList, {
      props: { clusters: [] },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('No clusters')
  })

  it('shows loading spinner when loading with no data', () => {
    const wrapper = mount(ECSClusterList, {
      props: { clusters: [], loading: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.find('.spinner').exists()).toBe(true)
  })

  it('shows error message', () => {
    const wrapper = mount(ECSClusterList, {
      props: { clusters: [], error: 'List clusters failed' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('List clusters failed')
  })

  it('emits create from empty state action', async () => {
    const wrapper = mount(ECSClusterList, {
      props: { clusters: [] },
      global: { stubs: createStubs() },
    })
    await wrapper.find('.empty-state button').trigger('click')
    expect(wrapper.emitted('create')).toBeTruthy()
  })

  it('emits delete with cluster name', async () => {
    const wrapper = mount(ECSClusterList, {
      props: { clusters: sampleClusters },
      global: { stubs: createStubs() },
    })
    const deleteBtn = wrapper.findAll('button')[0]
    await deleteBtn.trigger('click')
    expect(wrapper.emitted('delete')![0]).toEqual(['my-cluster'])
  })

  it('expands and collapses on row click', async () => {
    const wrapper = mount(ECSClusterList, {
      props: { clusters: sampleClusters },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).not.toContain('Running Tasks')
    const row = wrapper.find('.cursor-pointer')
    await row.trigger('click')
    expect(wrapper.text()).toContain('Running Tasks')
    await row.trigger('click')
    expect(wrapper.text()).not.toContain('Running Tasks')
  })

  it('formats date as - when missing', async () => {
    const wrapper = mount(ECSClusterList, {
      props: { clusters: [{ ...sampleClusters[0], CreatedAt: undefined }] },
      global: { stubs: createStubs() },
    })
    await wrapper.find('.cursor-pointer').trigger('click')
    expect(wrapper.text()).toContain('-')
  })

  it('shows pagination controls when totalPages > 1', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ ClusterName: `cluster-${i}`, ClusterArn: `arn:cluster-${i}` }))
    const wrapper = mount(ECSClusterList, {
      props: { clusters: many },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Previous')
    expect(wrapper.text()).toContain('Next')
  })
})