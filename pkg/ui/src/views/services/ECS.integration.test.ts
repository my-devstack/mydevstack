import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Mock API layer — composables run real code against mocked API
vi.mock('@/api/services/ecs', () => ({
  listClusters: vi.fn().mockResolvedValue({
    ClusterArns: ['arn:aws:ecs:us-east-1:123:cluster/my-cluster'],
  }),
  describeClusters: vi.fn().mockResolvedValue({
    Clusters: [
      {
        ClusterArn: 'arn:aws:ecs:us-east-1:123:cluster/my-cluster',
        ClusterName: 'my-cluster',
        Status: 'ACTIVE',
        RunningTasksCount: 2,
        PendingTasksCount: 0,
        ActiveServicesCount: 1,
        CreatedAt: '2024-01-15T10:30:00Z',
      },
    ],
  }),
  createCluster: vi.fn().mockResolvedValue({}),
  deleteCluster: vi.fn().mockResolvedValue({}),
  listTaskDefinitions: vi.fn().mockResolvedValue({
    TaskDefinitionArns: ['arn:aws:ecs:us-east-1:123:task-definition/my-task:1'],
  }),
  describeTaskDefinition: vi.fn().mockResolvedValue({
    TaskDefinition: {
      TaskDefinitionArn: 'arn:aws:ecs:us-east-1:123:task-definition/my-task:1',
      Family: 'my-task',
      Revision: 1,
      Status: 'ACTIVE',
      Cpu: '256',
      Memory: '512',
      RegisteredAt: '2024-01-15T10:30:00Z',
      ContainerDefinitions: [{ Name: 'web', Image: 'nginx:latest', Cpu: 256, Memory: 512, Essential: true }],
    },
  }),
  registerTaskDefinition: vi.fn().mockResolvedValue({}),
  deregisterTaskDefinition: vi.fn().mockResolvedValue({}),
  listTaskDefinitionFamilies: vi.fn().mockResolvedValue({ Families: [] }),
  runTask: vi.fn().mockResolvedValue({ Tasks: [] }),
  listTasks: vi.fn().mockResolvedValue({ TaskArns: [] }),
  describeTasks: vi.fn().mockResolvedValue({ Tasks: [] }),
  stopTask: vi.fn().mockResolvedValue({}),
  listServices: vi.fn().mockResolvedValue({ ServiceArns: [] }),
  createService: vi.fn().mockResolvedValue({}),
  describeServices: vi.fn().mockResolvedValue({ Services: [] }),
  deleteService: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}))

// Mock stores
vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
    region: 'us-east-1',
    accessKey: 'test-key',
    secretKey: 'test-secret',
  })),
}))

// Mock heroicons
vi.mock('@heroicons/vue/24/outline', () => {
  const mock = { template: '<span class="mock-icon" />' }
  return {
    ServerIcon: mock,
    DocumentTextIcon: mock,
    PlayIcon: mock,
    CogIcon: mock,
    CodeBracketIcon: mock,
    PlusIcon: mock,
  }
})

import ECSView from './ECS.vue'
import * as ecsApi from '@/api/services/ecs'

// Helper: shared stubs config
function makeStubs() {
  return {
    Tabs: {
      name: 'Tabs',
      props: ['tabs', 'activeTab'],
      emits: ['update:activeTab'],
      template: `
        <div class="tabs-stub">
          <button
            v-for="t in tabs"
            :key="t.id"
            :data-testid="'tab-' + t.id"
            @click="$emit('update:activeTab', t.id)"
          >
            {{ t.label }}
          </button>
        </div>
      `,
    },
    Button: { template: '<button class="mock-btn"><slot /></button>' },
    EmptyState: { template: '<div class="mock-empty-state"><slot /></div>' },
    ECSClusterList: {
      name: 'ECSClusterList',
      props: ['clusters', 'loading', 'error'],
      emits: ['create', 'delete'],
      template: `
        <div class="mock-cluster-list">
          <div v-if="clusters.length === 0" class="mock-empty">No clusters</div>
          <div v-for="c in clusters" :key="c.ClusterArn" class="mock-cluster-row">{{ c.ClusterName }}</div>
          <div v-if="clusters.length > 10" class="mock-pagination">
            <button class="mock-prev">Previous</button>
            <span>Page 1 of 2</span>
            <button class="mock-next">Next</button>
          </div>
        </div>
      `,
    },
    ECSTaskDefinitionList: {
      name: 'ECSTaskDefinitionList',
      props: ['taskDefinitions', 'loading', 'error'],
      emits: ['create', 'delete'],
      template: '<div class="mock-task-def-list"><div v-for="t in taskDefinitions" :key="t.TaskDefinitionArn">{{ t.Family }}</div></div>',
    },
    ECSTaskList: {
      name: 'ECSTaskList',
      props: ['tasks', 'loading', 'error'],
      emits: ['create', 'stop'],
      template: '<div class="mock-task-list"><div v-for="t in tasks" :key="t.TaskArn">{{ t.TaskArn }}</div></div>',
    },
    ECSServiceList: {
      name: 'ECSServiceList',
      props: ['services', 'loading', 'error'],
      emits: ['create', 'delete'],
      template: '<div class="mock-service-list"><div v-for="s in services" :key="s.ServiceArn">{{ s.ServiceName }}</div></div>',
    },
    ECSCodeExamples: {
      name: 'ECSCodeExamples',
      props: ['region', 'accessKey', 'secretKey'],
      template: '<div class="mock-code-examples">Code Examples</div>',
    },
    ECSModal: {
      name: 'ECSModal',
      props: ['open', 'entity', 'loading'],
      emits: ['update:open', 'submit'],
      template: '<div v-if="open" class="mock-modal">Modal</div>',
    },
  }
}

describe('ECS View Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders the view with all tabs', async () => {
    const wrapper = mount(ECSView, {
      global: { stubs: makeStubs() },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('ECS Management')

    const expectedTabs = ['Clusters', 'Task Definitions', 'Tasks', 'Services']
    for (const label of expectedTabs) {
      expect(wrapper.text()).toContain(label)
    }
  })

  it('loads clusters and task definitions on mount', async () => {
    const wrapper = mount(ECSView, {
      global: { stubs: makeStubs() },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    // Initial load: clusters + task definitions
    expect(ecsApi.listClusters).toHaveBeenCalled()
    expect(ecsApi.describeClusters).toHaveBeenCalled()
    expect(ecsApi.listTaskDefinitions).toHaveBeenCalled()
    expect(ecsApi.describeTaskDefinition).toHaveBeenCalled()

    // Clusters tab is active by default and shows loaded cluster
    expect(wrapper.find('.mock-cluster-list').exists()).toBe(true)
    expect(wrapper.text()).toContain('my-cluster')
    expect(wrapper.vm.loading).toBe(false)
  })

  it('switches tabs and loads tasks/services when selected', async () => {
    const wrapper = mount(ECSView, {
      global: { stubs: makeStubs() },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    // Switch to Tasks tab
    const tasksTab = wrapper.find('[data-testid="tab-tasks"]')
    expect(tasksTab.exists()).toBe(true)
    await tasksTab.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(ecsApi.listTasks).toHaveBeenCalled()
    expect(wrapper.find('.mock-task-list').exists()).toBe(true)

    // Switch to Services tab
    const servicesTab = wrapper.find('[data-testid="tab-services"]')
    await servicesTab.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(ecsApi.listServices).toHaveBeenCalled()
    expect(wrapper.find('.mock-service-list').exists()).toBe(true)
  })

  it('reloads tasks when the cluster dropdown changes', async () => {
    // Two clusters so the dropdown has options to switch between
    vi.mocked(ecsApi.listClusters).mockResolvedValueOnce({
      ClusterArns: [
        'arn:aws:ecs:us-east-1:123:cluster/cluster-a',
        'arn:aws:ecs:us-east-1:123:cluster/cluster-b',
      ],
    })
    vi.mocked(ecsApi.describeClusters).mockImplementation(async (arn) => {
      if (arn.includes('cluster-b')) {
        return { Clusters: [{ ClusterArn: 'arn:aws:ecs:us-east-1:123:cluster/cluster-b', ClusterName: 'cluster-b', Status: 'ACTIVE' }] }
      }
      return { Clusters: [{ ClusterArn: 'arn:aws:ecs:us-east-1:123:cluster/cluster-a', ClusterName: 'cluster-a', Status: 'ACTIVE' }] }
    })
    // Each cluster returns a distinct task so we can tell which one loaded
    vi.mocked(ecsApi.listTasks).mockImplementation(async (params) => {
      if (params?.Cluster === 'cluster-b') {
        return { TaskArns: ['arn:aws:ecs:us-east-1:123:task/task-b'] }
      }
      return { TaskArns: ['arn:aws:ecs:us-east-1:123:task/task-a'] }
    })
    vi.mocked(ecsApi.describeTasks).mockImplementation(async (arn) => {
      if (arn.includes('task-b')) {
        return { Tasks: [{ TaskArn: arn, LastStatus: 'STOPPED' }] }
      }
      return { Tasks: [{ TaskArn: arn, LastStatus: 'RUNNING' }] }
    })

    const wrapper = mount(ECSView, {
      global: { stubs: makeStubs() },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    // Switch to Tasks tab — defaults to first cluster (cluster-a)
    await wrapper.find('[data-testid="tab-tasks"]').trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(ecsApi.listTasks).toHaveBeenCalledWith({ Cluster: 'cluster-a' })
    expect(wrapper.text()).toContain('task-a')

    // Change the dropdown to the second cluster
    const select = wrapper.find('select')
    await select.setValue('cluster-b')
    await flushPromises()
    await wrapper.vm.$nextTick()

    // Tasks must reload with the newly selected cluster
    expect(ecsApi.listTasks).toHaveBeenCalledWith({ Cluster: 'cluster-b' })
    expect(wrapper.text()).toContain('task-b')
  })

  it('shows pagination controls when there are many clusters', async () => {
    // Override API mock to return many clusters (> 10 → pagination)
    const manyClusters = Array.from({ length: 15 }, (_, i) => ({
      ClusterArn: `arn:aws:ecs:us-east-1:123:cluster/cluster-${i}`,
      ClusterName: `cluster-${i}`,
      Status: 'ACTIVE',
    }))
    vi.mocked(ecsApi.listClusters).mockResolvedValueOnce({
      ClusterArns: manyClusters.map((c) => c.ClusterArn),
    })
    vi.mocked(ecsApi.describeClusters).mockResolvedValueOnce({ Clusters: manyClusters })

    const wrapper = mount(ECSView, {
      global: { stubs: makeStubs() },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    // Pagination controls should be present
    expect(wrapper.find('.mock-pagination').exists()).toBe(true)
    expect(wrapper.text()).toContain('Previous')
    expect(wrapper.text()).toContain('Next')
  })
})
