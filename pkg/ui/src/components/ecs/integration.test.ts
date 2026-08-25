import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import {
  ECSClusterList,
  ECSTaskDefinitionList,
  ECSTaskList,
  ECSServiceList,
  ECSModal,
  ECSCodeExamples,
} from './index'
import ECSView from '@/views/services/ECS.vue'

// ---------------------------------------------------------------------------
// View-level mocks (ECSView tab switch + cluster selection)
// ---------------------------------------------------------------------------
const mockClusters = [
  { ClusterArn: 'arn:aws:ecs:us-east-1:123:cluster/my-cluster', ClusterName: 'my-cluster', Status: 'ACTIVE' },
  { ClusterArn: 'arn:aws:ecs:us-east-1:123:cluster/other-cluster', ClusterName: 'other-cluster', Status: 'ACTIVE' },
]

const mockLoadClusters = vi.fn()
const mockLoadTaskDefinitions = vi.fn()
const mockLoadTasks = vi.fn()
const mockLoadServices = vi.fn()
const mockCreateCluster = vi.fn()
const mockDeleteCluster = vi.fn()
const mockCreateTaskDefinition = vi.fn()
const mockDeleteTaskDefinition = vi.fn()
const mockRunTask = vi.fn()
const mockStopTask = vi.fn()
const mockCreateService = vi.fn()
const mockDeleteService = vi.fn()

vi.mock('@/composables/useECS', () => ({
  useECS: () => ({
    clusters: ref(mockClusters),
    taskDefinitions: ref([]),
    tasks: ref([]),
    services: ref([]),
    loading: ref(false),
    creating: ref(false),
    selectedCluster: ref<{ ClusterName?: string } | null>(null),
    loadClusters: mockLoadClusters,
    createCluster: mockCreateCluster,
    deleteCluster: mockDeleteCluster,
    loadTaskDefinitions: mockLoadTaskDefinitions,
    createTaskDefinition: mockCreateTaskDefinition,
    deleteTaskDefinition: mockDeleteTaskDefinition,
    loadTasks: mockLoadTasks,
    runTask: mockRunTask,
    stopTask: mockStopTask,
    loadServices: mockLoadServices,
    createService: mockCreateService,
    deleteService: mockDeleteService,
  }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}))

vi.mock('@/composables/useContentReload', () => ({
  useContentReload: () => ({ reloadTrigger: 0 }),
}))

const createStubs = () => ({
  Modal: {
    template: `
      <div v-if="open" class="modal">
        <div class="modal-title">{{ title }}</div>
        <div class="modal-body"><slot /></div>
        <div class="modal-footer"><slot name="footer" /></div>
      </div>
    `,
    props: ['open', 'title', 'size'],
    emits: ['update:open'],
  },
  Button: {
    template: '<button @click="$emit(\'click\', $event)" :loading="loading"><slot /></button>',
    props: ['loading', 'variant', 'size'],
  },
  FormInput: {
    template: '<input :type="type" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'label', 'type', 'placeholder', 'required', 'helpText'],
    emits: ['update:modelValue'],
  },
  LoadingSpinner: {
    template: '<div class="spinner" />',
    props: ['size'],
  },
  EmptyState: {
    template: '<div class="empty-state"><h3>{{ title }}</h3><p>{{ description }}</p><slot /><button v-if="actionLabel" @click="$emit(\'action\')">{{ actionLabel }}</button></div>',
    props: ['icon', 'title', 'description', 'actionLabel', 'compact'],
    emits: ['action'],
  },
  StatusBadge: {
    template: '<span class="status-badge">{{ label }}</span>',
    props: ['status', 'label', 'size'],
  },
  CodeSnippet: {
    template: '<div class="code-snippet"><h3>{{ title }}</h3></div>',
    props: ['title', 'snippets', 'defaultTab', 'disableHighlight'],
  },
})

// Stubs for mounting the full ECSView (tab switch + cluster selection flow).
const viewStubs = {
  Button: { template: '<button type="button"><slot /></button>' },
  Tabs: {
    props: ['activeTab', 'tabs'],
    emits: ['update:activeTab'],
    template: `
      <div class="tabs-stub">
        <button v-for="tab in tabs" :key="tab.id" type="button" role="tab" @click="$emit('update:activeTab', tab.id)">{{ tab.label }}</button>
      </div>
    `,
  },
  EmptyState: { template: '<div class="empty-state" />' },
  ECSClusterList: { template: '<div class="ecs-cluster-list" />' },
  ECSTaskDefinitionList: { template: '<div class="ecs-task-definition-list" />' },
  ECSTaskList: { template: '<div class="ecs-task-list" />' },
  ECSServiceList: { template: '<div class="ecs-service-list" />' },
  ECSModal: { template: '<div class="ecs-modal" />' },
  ECSCodeExamples: { template: '<div class="ecs-code-examples" />' },
}

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

describe('ECS Components Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('ECSClusterList', () => {
    it('renders clusters', () => {
      const wrapper = mount(ECSClusterList, {
        props: { clusters: sampleClusters },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('my-cluster')
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
      const empty = wrapper.find('.empty-state')
      const actionBtn = empty.find('button')
      await actionBtn.trigger('click')
      expect(wrapper.emitted('create')).toBeTruthy()
    })

    it('emits delete when delete button clicked', async () => {
      const wrapper = mount(ECSClusterList, {
        props: { clusters: sampleClusters },
        global: { stubs: createStubs() },
      })
      const deleteBtn = wrapper.findAll('button')[0]
      await deleteBtn.trigger('click')
      expect(wrapper.emitted('delete')).toBeTruthy()
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
  })

  describe('ECSTaskDefinitionList', () => {
    it('renders task definitions', () => {
      const wrapper = mount(ECSTaskDefinitionList, {
        props: { taskDefinitions: sampleTaskDefs },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('my-task:1')
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

    it('emits delete when delete button clicked', async () => {
      const wrapper = mount(ECSTaskDefinitionList, {
        props: { taskDefinitions: sampleTaskDefs },
        global: { stubs: createStubs() },
      })
      const deleteBtn = wrapper.findAll('button')[0]
      await deleteBtn.trigger('click')
      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('delete')![0]).toEqual(['arn:aws:ecs:us-east-1:123:task-definition/my-task:1'])
    })

    it('expands to show containers', async () => {
      const wrapper = mount(ECSTaskDefinitionList, {
        props: { taskDefinitions: sampleTaskDefs },
        global: { stubs: createStubs() },
      })
      const row = wrapper.find('.cursor-pointer')
      await row.trigger('click')
      expect(wrapper.text()).toContain('nginx:latest')
    })
  })

  describe('ECSTaskList', () => {
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

    it('emits stop when stop button clicked', async () => {
      const wrapper = mount(ECSTaskList, {
        props: { tasks: sampleTasks },
        global: { stubs: createStubs() },
      })
      const stopBtn = wrapper.findAll('button')[0]
      await stopBtn.trigger('click')
      expect(wrapper.emitted('stop')).toBeTruthy()
      expect(wrapper.emitted('stop')![0]).toEqual(['arn:aws:ecs:us-east-1:123:task/my-cluster/abc123'])
    })

    it('hides stop button for stopped tasks', () => {
      const wrapper = mount(ECSTaskList, {
        props: { tasks: [{ ...sampleTasks[0], LastStatus: 'STOPPED' }] },
        global: { stubs: createStubs() },
      })
      expect(wrapper.findAll('button')).toHaveLength(0)
    })
  })

  describe('ECSServiceList', () => {
    it('renders services', () => {
      const wrapper = mount(ECSServiceList, {
        props: { services: sampleServices },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('my-svc')
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

    it('emits delete when delete button clicked', async () => {
      const wrapper = mount(ECSServiceList, {
        props: { services: sampleServices },
        global: { stubs: createStubs() },
      })
      const deleteBtn = wrapper.findAll('button')[0]
      await deleteBtn.trigger('click')
      expect(wrapper.emitted('delete')).toBeTruthy()
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
    })
  })

  describe('ECSModal', () => {
    it('renders cluster form when open', () => {
      const wrapper = mount(ECSModal, {
        props: { open: true, entity: 'cluster' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create Cluster')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(ECSModal, {
        props: { open: false, entity: 'cluster' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('Create Cluster')
    })

    it('emits update:open on cancel', async () => {
      const wrapper = mount(ECSModal, {
        props: { open: true, entity: 'cluster' },
        global: { stubs: createStubs() },
      })
      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
      expect(cancelBtn).toBeTruthy()
      if (cancelBtn) {
        await cancelBtn.trigger('click')
        expect(wrapper.emitted('update:open')).toBeTruthy()
      }
    })

    it('emits submit on create click', async () => {
      const wrapper = mount(ECSModal, {
        props: { open: true, entity: 'cluster' },
        global: { stubs: createStubs() },
      })
      const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
      if (createBtn) {
        await createBtn.trigger('click')
        expect(wrapper.emitted('submit')).toBeTruthy()
      }
    })
  })

  describe('ECSCodeExamples', () => {
    it('renders code snippet with title', () => {
      const wrapper = mount(ECSCodeExamples, {
        props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('Usage Examples')
    })

    it('includes AWS CLI commands', () => {
      const wrapper = mount(ECSCodeExamples, {
        props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
        global: { stubs: createStubs() },
      })
      const snippets = (wrapper.vm as any).codeExamples
      const cli = snippets.find((s: any) => s.language === 'aws-cli')
      expect(cli.code).toContain('aws ecs create-cluster')
      expect(cli.code).toContain('aws ecs run-task')
    })
  })
})

describe('ECSView - tab switch with cluster selection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockLoadTasks.mockResolvedValue(undefined)
    mockLoadServices.mockResolvedValue(undefined)
    mockLoadClusters.mockResolvedValue(undefined)
    mockLoadTaskDefinitions.mockResolvedValue(undefined)
  })

  it('switching to Tasks tab auto-selects first cluster and loads tasks with it', async () => {
    const wrapper = mount(ECSView, { global: { stubs: viewStubs } })
    await flushPromises()

    const tasksTab = wrapper.findAll('.tabs-stub button').find(b => b.text().includes('Tasks'))
    expect(tasksTab).toBeTruthy()
    await tasksTab!.trigger('click')
    await flushPromises()

    expect(mockLoadTasks).toHaveBeenCalledWith('my-cluster')
  })

  it('switching to Services tab auto-selects first cluster and loads services with it', async () => {
    const wrapper = mount(ECSView, { global: { stubs: viewStubs } })
    await flushPromises()

    const servicesTab = wrapper.findAll('.tabs-stub button').find(b => b.text().includes('Services'))
    expect(servicesTab).toBeTruthy()
    await servicesTab!.trigger('click')
    await flushPromises()

    expect(mockLoadServices).toHaveBeenCalledWith('my-cluster')
  })

  it('changing the cluster select reloads tasks with the selected cluster name', async () => {
    const wrapper = mount(ECSView, { global: { stubs: viewStubs } })
    await flushPromises()

    const tasksTab = wrapper.findAll('.tabs-stub button').find(b => b.text().includes('Tasks'))
    await tasksTab!.trigger('click')
    await flushPromises()

    const select = wrapper.find('select')
    expect(select.exists()).toBe(true)
    await select.setValue('other-cluster')
    await flushPromises()

    expect(mockLoadTasks).toHaveBeenLastCalledWith('other-cluster')
  })
})