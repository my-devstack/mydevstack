import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ECSTaskDefinitionList } from './index'

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

const sampleTaskDefs = [
  {
    TaskDefinitionArn: 'arn:aws:ecs:us-east-1:123:task-definition/my-task:1',
    Family: 'my-task',
    Revision: 1,
    Status: 'ACTIVE',
    Cpu: '256',
    Memory: '512',
    RegisteredAt: '2024-01-15T10:30:00Z',
    ContainerDefinitions: [{ Name: 'web', Image: 'nginx:latest', Cpu: 256, Memory: 512, Essential: true }],
  },
]

describe('ECSTaskDefinitionList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders task definitions', () => {
    const wrapper = mount(ECSTaskDefinitionList, {
      props: { taskDefinitions: sampleTaskDefs },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('my-task:1')
    expect(wrapper.text()).toContain('arn:aws:ecs:us-east-1:123:task-definition/my-task:1')
  })

  it('shows empty state when no task definitions', () => {
    const wrapper = mount(ECSTaskDefinitionList, {
      props: { taskDefinitions: [] },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('No task definitions')
  })

  it('shows loading spinner when loading with no data', () => {
    const wrapper = mount(ECSTaskDefinitionList, {
      props: { taskDefinitions: [], loading: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.find('.spinner').exists()).toBe(true)
  })

  it('shows error message', () => {
    const wrapper = mount(ECSTaskDefinitionList, {
      props: { taskDefinitions: [], error: 'List task definitions failed' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('List task definitions failed')
  })

  it('emits create from empty state action', async () => {
    const wrapper = mount(ECSTaskDefinitionList, {
      props: { taskDefinitions: [] },
      global: { stubs: createStubs() },
    })
    await wrapper.find('.empty-state button').trigger('click')
    expect(wrapper.emitted('create')).toBeTruthy()
  })

  it('emits delete with task definition arn', async () => {
    const wrapper = mount(ECSTaskDefinitionList, {
      props: { taskDefinitions: sampleTaskDefs },
      global: { stubs: createStubs() },
    })
    const deleteBtn = wrapper.findAll('button')[0]
    await deleteBtn.trigger('click')
    expect(wrapper.emitted('delete')![0]).toEqual(['arn:aws:ecs:us-east-1:123:task-definition/my-task:1'])
  })

  it('expands and collapses on row click', async () => {
    const wrapper = mount(ECSTaskDefinitionList, {
      props: { taskDefinitions: sampleTaskDefs },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).not.toContain('Containers')
    const row = wrapper.find('.cursor-pointer')
    await row.trigger('click')
    expect(wrapper.text()).toContain('Containers')
    expect(wrapper.text()).toContain('nginx:latest')
    await row.trigger('click')
    expect(wrapper.text()).not.toContain('Containers')
  })

  it('shows pagination controls when totalPages > 1', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ Family: `task-${i}`, Revision: i, TaskDefinitionArn: `arn:task-${i}` }))
    const wrapper = mount(ECSTaskDefinitionList, {
      props: { taskDefinitions: many },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Previous')
    expect(wrapper.text()).toContain('Next')
  })
})