import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ECSTaskList } from './index'

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

const sampleTasks = [
  {
    TaskArn: 'arn:aws:ecs:us-east-1:123:task/my-cluster/abc123',
    TaskDefinitionArn: 'arn:aws:ecs:us-east-1:123:task-definition/my-task:1',
    LastStatus: 'RUNNING',
    DesiredStatus: 'RUNNING',
    LaunchType: 'FARGATE',
    CreatedAt: '2024-01-15T10:30:00Z',
    Containers: [{ Name: 'web', Image: 'nginx:latest', LastStatus: 'RUNNING' }],
  },
]

describe('ECSTaskList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders tasks', () => {
    const wrapper = mount(ECSTaskList, {
      props: { tasks: sampleTasks },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('abc123')
    expect(wrapper.text()).toContain('RUNNING')
  })

  it('shows empty state when no tasks', () => {
    const wrapper = mount(ECSTaskList, {
      props: { tasks: [] },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('No tasks')
  })

  it('shows loading spinner when loading with no data', () => {
    const wrapper = mount(ECSTaskList, {
      props: { tasks: [], loading: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.find('.spinner').exists()).toBe(true)
  })

  it('shows error message', () => {
    const wrapper = mount(ECSTaskList, {
      props: { tasks: [], error: 'List tasks failed' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('List tasks failed')
  })

  it('emits create from empty state action', async () => {
    const wrapper = mount(ECSTaskList, {
      props: { tasks: [] },
      global: { stubs: createStubs() },
    })
    await wrapper.find('.empty-state button').trigger('click')
    expect(wrapper.emitted('create')).toBeTruthy()
  })

  it('emits stop with task arn', async () => {
    const wrapper = mount(ECSTaskList, {
      props: { tasks: sampleTasks },
      global: { stubs: createStubs() },
    })
    const stopBtn = wrapper.findAll('button')[0]
    await stopBtn.trigger('click')
    expect(wrapper.emitted('stop')![0]).toEqual(['arn:aws:ecs:us-east-1:123:task/my-cluster/abc123'])
  })

  it('does not show stop button for stopped tasks', () => {
    const wrapper = mount(ECSTaskList, {
      props: { tasks: [{ ...sampleTasks[0], LastStatus: 'STOPPED' }] },
      global: { stubs: createStubs() },
    })
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('expands and collapses on row click', async () => {
    const wrapper = mount(ECSTaskList, {
      props: { tasks: sampleTasks },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).not.toContain('Desired Status')
    const row = wrapper.find('.cursor-pointer')
    await row.trigger('click')
    expect(wrapper.text()).toContain('Desired Status')
    expect(wrapper.text()).toContain('nginx:latest')
    await row.trigger('click')
    expect(wrapper.text()).not.toContain('Desired Status')
  })

  it('shows pagination controls when totalPages > 1', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ TaskArn: `arn:task-${i}`, LastStatus: 'RUNNING' }))
    const wrapper = mount(ECSTaskList, {
      props: { tasks: many },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Previous')
    expect(wrapper.text()).toContain('Next')
  })
})