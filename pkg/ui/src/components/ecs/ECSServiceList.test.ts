import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ECSServiceList } from './index'

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

const sampleServices = [
  {
    ServiceArn: 'arn:aws:ecs:us-east-1:123:service/my-cluster/my-svc',
    ServiceName: 'my-svc',
    Status: 'ACTIVE',
    DesiredCount: 2,
    RunningCount: 2,
    PendingCount: 0,
    LaunchType: 'FARGATE',
    TaskDefinition: 'arn:aws:ecs:us-east-1:123:task-definition/my-task:1',
    SchedulingStrategy: 'REPLICA',
    CreatedAt: '2024-01-15T10:30:00Z',
  },
]

describe('ECSServiceList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders services', () => {
    const wrapper = mount(ECSServiceList, {
      props: { services: sampleServices },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('my-svc')
    expect(wrapper.text()).toContain('arn:aws:ecs:us-east-1:123:service/my-cluster/my-svc')
  })

  it('shows empty state when no services', () => {
    const wrapper = mount(ECSServiceList, {
      props: { services: [] },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('No services')
  })

  it('shows loading spinner when loading with no data', () => {
    const wrapper = mount(ECSServiceList, {
      props: { services: [], loading: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.find('.spinner').exists()).toBe(true)
  })

  it('shows error message', () => {
    const wrapper = mount(ECSServiceList, {
      props: { services: [], error: 'List services failed' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('List services failed')
  })

  it('emits create from empty state action', async () => {
    const wrapper = mount(ECSServiceList, {
      props: { services: [] },
      global: { stubs: createStubs() },
    })
    await wrapper.find('.empty-state button').trigger('click')
    expect(wrapper.emitted('create')).toBeTruthy()
  })

  it('emits delete with service name', async () => {
    const wrapper = mount(ECSServiceList, {
      props: { services: sampleServices },
      global: { stubs: createStubs() },
    })
    const deleteBtn = wrapper.findAll('button')[0]
    await deleteBtn.trigger('click')
    expect(wrapper.emitted('delete')![0]).toEqual(['my-svc'])
  })

  it('expands and collapses on row click', async () => {
    const wrapper = mount(ECSServiceList, {
      props: { services: sampleServices },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).not.toContain('Desired Count')
    const row = wrapper.find('.cursor-pointer')
    await row.trigger('click')
    expect(wrapper.text()).toContain('Desired Count')
    await row.trigger('click')
    expect(wrapper.text()).not.toContain('Desired Count')
  })

  it('shows pagination controls when totalPages > 1', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ ServiceName: `svc-${i}`, ServiceArn: `arn:svc-${i}` }))
    const wrapper = mount(ECSServiceList, {
      props: { services: many },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Previous')
    expect(wrapper.text()).toContain('Next')
  })
})