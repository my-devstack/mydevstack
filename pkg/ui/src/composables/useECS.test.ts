import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useECS } from './useECS'

vi.mock('@/api/services/ecs', () => ({
  listClusters: vi.fn(),
  createCluster: vi.fn(),
  describeClusters: vi.fn(),
  deleteCluster: vi.fn(),
  listTaskDefinitions: vi.fn(),
  registerTaskDefinition: vi.fn(),
  describeTaskDefinition: vi.fn(),
  deregisterTaskDefinition: vi.fn(),
  listTaskDefinitionFamilies: vi.fn(),
  runTask: vi.fn(),
  listTasks: vi.fn(),
  describeTasks: vi.fn(),
  stopTask: vi.fn(),
  listServices: vi.fn(),
  createService: vi.fn(),
  describeServices: vi.fn(),
  deleteService: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}))

import * as ecsApi from '@/api/services/ecs'

describe('useECS', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const { clusters, taskDefinitions, tasks, services, loading, creating, selectedCluster } = useECS()
    expect(clusters.value).toEqual([])
    expect(taskDefinitions.value).toEqual([])
    expect(tasks.value).toEqual([])
    expect(services.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(creating.value).toBe(false)
    expect(selectedCluster.value).toBeNull()
  })

  // -------------------------------------------------------------------------
  // Clusters
  // -------------------------------------------------------------------------

  it('loadClusters describes each ARN', async () => {
    vi.mocked(ecsApi.listClusters).mockResolvedValue({ ClusterArns: ['arn:aws:ecs:us-east-1:123:cluster/my-cluster'] })
    vi.mocked(ecsApi.describeClusters).mockResolvedValue({
      Clusters: [{ ClusterArn: 'arn:aws:ecs:us-east-1:123:cluster/my-cluster', ClusterName: 'my-cluster', Status: 'ACTIVE' }],
    })

    const { loadClusters, clusters, loading } = useECS()
    await loadClusters()

    expect(ecsApi.listClusters).toHaveBeenCalled()
    expect(ecsApi.describeClusters).toHaveBeenCalledWith('arn:aws:ecs:us-east-1:123:cluster/my-cluster')
    expect(clusters.value).toHaveLength(1)
    expect(clusters.value[0].ClusterName).toBe('my-cluster')
    expect(loading.value).toBe(false)
  })

  it('loadClusters falls back to ARN-only entry when describe fails', async () => {
    vi.mocked(ecsApi.listClusters).mockResolvedValue({ ClusterArns: ['arn:aws:ecs:us-east-1:123:cluster/fallback'] })
    vi.mocked(ecsApi.describeClusters).mockRejectedValue(new Error('Not found'))

    const { loadClusters, clusters } = useECS()
    await loadClusters()

    expect(clusters.value).toHaveLength(1)
    expect(clusters.value[0].ClusterName).toBe('fallback')
  })

  it('loadClusters handles empty result', async () => {
    vi.mocked(ecsApi.listClusters).mockResolvedValue({})

    const { loadClusters, clusters } = useECS()
    await loadClusters()

    expect(clusters.value).toEqual([])
  })

  it('loadClusters handles error', async () => {
    vi.mocked(ecsApi.listClusters).mockRejectedValue(new Error('Network error'))

    const { loadClusters, loading } = useECS()
    await loadClusters()

    expect(loading.value).toBe(false)
  })

  it('createCluster calls API and reloads', async () => {
    vi.mocked(ecsApi.createCluster).mockResolvedValue({ Cluster: { ClusterName: 'new-cluster' } })
    vi.mocked(ecsApi.listClusters).mockResolvedValue({ ClusterArns: [] })

    const { createCluster, creating } = useECS()
    await createCluster({ ClusterName: 'new-cluster' })

    expect(ecsApi.createCluster).toHaveBeenCalledWith({ ClusterName: 'new-cluster' })
    expect(ecsApi.listClusters).toHaveBeenCalled()
    expect(creating.value).toBe(false)
  })

  it('createCluster throws on error', async () => {
    vi.mocked(ecsApi.createCluster).mockRejectedValue(new Error('Failed'))

    const { createCluster, creating } = useECS()
    await expect(createCluster({ ClusterName: 'new-cluster' })).rejects.toThrow()
    expect(creating.value).toBe(false)
  })

  it('deleteCluster calls API and reloads', async () => {
    vi.mocked(ecsApi.deleteCluster).mockResolvedValue({ Cluster: {} })
    vi.mocked(ecsApi.listClusters).mockResolvedValue({ ClusterArns: [] })

    const { deleteCluster, selectedCluster, loading } = useECS()
    selectedCluster.value = { ClusterName: 'my-cluster' }
    await deleteCluster('my-cluster')

    expect(ecsApi.deleteCluster).toHaveBeenCalledWith('my-cluster')
    expect(ecsApi.listClusters).toHaveBeenCalled()
    expect(selectedCluster.value).toBeNull()
    expect(loading.value).toBe(false)
  })

  it('deleteCluster does not clear selected if different', async () => {
    vi.mocked(ecsApi.deleteCluster).mockResolvedValue({ Cluster: {} })
    vi.mocked(ecsApi.listClusters).mockResolvedValue({ ClusterArns: [] })

    const { deleteCluster, selectedCluster } = useECS()
    selectedCluster.value = { ClusterName: 'other-cluster' }
    await deleteCluster('my-cluster')

    expect(selectedCluster.value).not.toBeNull()
  })

  // -------------------------------------------------------------------------
  // Task definitions
  // -------------------------------------------------------------------------

  it('loadTaskDefinitions describes each ARN', async () => {
    vi.mocked(ecsApi.listTaskDefinitions).mockResolvedValue({
      TaskDefinitionArns: ['arn:aws:ecs:us-east-1:123:task-definition/my-task:1'],
    })
    vi.mocked(ecsApi.describeTaskDefinition).mockResolvedValue({
      TaskDefinition: {
        TaskDefinitionArn: 'arn:aws:ecs:us-east-1:123:task-definition/my-task:1',
        Family: 'my-task',
        Revision: 1,
        Status: 'ACTIVE',
      },
    })

    const { loadTaskDefinitions, taskDefinitions } = useECS()
    await loadTaskDefinitions()

    expect(ecsApi.describeTaskDefinition).toHaveBeenCalledWith('arn:aws:ecs:us-east-1:123:task-definition/my-task:1')
    expect(taskDefinitions.value).toHaveLength(1)
    expect(taskDefinitions.value[0].Family).toBe('my-task')
  })

  it('loadTaskDefinitions falls back to ARN parsing when describe fails', async () => {
    vi.mocked(ecsApi.listTaskDefinitions).mockResolvedValue({
      TaskDefinitionArns: ['arn:aws:ecs:us-east-1:123:task-definition/fallback:3'],
    })
    vi.mocked(ecsApi.describeTaskDefinition).mockRejectedValue(new Error('Not found'))

    const { loadTaskDefinitions, taskDefinitions } = useECS()
    await loadTaskDefinitions()

    expect(taskDefinitions.value).toHaveLength(1)
    expect(taskDefinitions.value[0].Family).toBe('fallback')
    expect(taskDefinitions.value[0].Revision).toBe(3)
  })

  it('createTaskDefinition registers and reloads', async () => {
    vi.mocked(ecsApi.registerTaskDefinition).mockResolvedValue({ TaskDefinition: {} })
    vi.mocked(ecsApi.listTaskDefinitions).mockResolvedValue({ TaskDefinitionArns: [] })

    const { createTaskDefinition, creating } = useECS()
    await createTaskDefinition({ family: 'my-task', containerName: 'web', image: 'nginx:latest', cpu: 256, memory: 512 })

    expect(ecsApi.registerTaskDefinition).toHaveBeenCalledWith({
      Family: 'my-task',
      ContainerDefinitions: [
        { Name: 'web', Image: 'nginx:latest', Cpu: 256, Memory: 512, Essential: true },
      ],
    })
    expect(creating.value).toBe(false)
  })

  it('deleteTaskDefinition deregisters and reloads', async () => {
    vi.mocked(ecsApi.deregisterTaskDefinition).mockResolvedValue({ TaskDefinition: {} })
    vi.mocked(ecsApi.listTaskDefinitions).mockResolvedValue({ TaskDefinitionArns: [] })

    const { deleteTaskDefinition, loading } = useECS()
    await deleteTaskDefinition('arn:aws:ecs:us-east-1:123:task-definition/my-task:1')

    expect(ecsApi.deregisterTaskDefinition).toHaveBeenCalledWith('arn:aws:ecs:us-east-1:123:task-definition/my-task:1')
    expect(loading.value).toBe(false)
  })

  // -------------------------------------------------------------------------
  // Tasks
  // -------------------------------------------------------------------------

  it('loadTasks describes each ARN with cluster', async () => {
    vi.mocked(ecsApi.listTasks).mockResolvedValue({ TaskArns: ['arn:aws:ecs:us-east-1:123:task/abc123'] })
    vi.mocked(ecsApi.describeTasks).mockResolvedValue({
      Tasks: [{ TaskArn: 'arn:aws:ecs:us-east-1:123:task/abc123', LastStatus: 'RUNNING' }],
    })

    const { loadTasks, tasks } = useECS()
    await loadTasks('my-cluster')

    expect(ecsApi.listTasks).toHaveBeenCalledWith({ Cluster: 'my-cluster' })
    expect(ecsApi.describeTasks).toHaveBeenCalledWith('arn:aws:ecs:us-east-1:123:task/abc123', 'my-cluster')
    expect(tasks.value).toHaveLength(1)
    expect(tasks.value[0].LastStatus).toBe('RUNNING')
  })

  it('selecting a cluster calls loadTasks with that cluster name', async () => {
    vi.mocked(ecsApi.listTasks).mockResolvedValue({ TaskArns: ['arn:aws:ecs:us-east-1:123:task/abc123'] })
    vi.mocked(ecsApi.describeTasks).mockResolvedValue({
      Tasks: [{ TaskArn: 'arn:aws:ecs:us-east-1:123:task/abc123', LastStatus: 'RUNNING' }],
    })

    // Mirrors the view flow: user picks a cluster in the dropdown, then
    // loadTasks(selectedCluster.value) is called.
    const { loadTasks, selectedCluster, tasks } = useECS()
    selectedCluster.value = { ClusterName: 'prod-cluster' }
    await loadTasks(selectedCluster.value.ClusterName)

    expect(ecsApi.listTasks).toHaveBeenCalledWith({ Cluster: 'prod-cluster' })
    expect(ecsApi.describeTasks).toHaveBeenCalledWith('arn:aws:ecs:us-east-1:123:task/abc123', 'prod-cluster')
    expect(tasks.value).toHaveLength(1)
  })

  it('runTask calls API and reloads', async () => {
    vi.mocked(ecsApi.runTask).mockResolvedValue({ Tasks: [] })
    vi.mocked(ecsApi.listTasks).mockResolvedValue({ TaskArns: [] })

    const { runTask, creating } = useECS()
    await runTask({ cluster: 'my-cluster', taskDefinition: 'my-task:1', count: 1, launchType: 'FARGATE' })

    expect(ecsApi.runTask).toHaveBeenCalledWith({
      Cluster: 'my-cluster',
      TaskDefinition: 'my-task:1',
      Count: 1,
      LaunchType: 'FARGATE',
    })
    expect(creating.value).toBe(false)
  })

  it('stopTask calls API and reloads', async () => {
    vi.mocked(ecsApi.stopTask).mockResolvedValue({ Task: {} })
    vi.mocked(ecsApi.listTasks).mockResolvedValue({ TaskArns: [] })

    const { stopTask, loading } = useECS()
    await stopTask('arn:aws:ecs:us-east-1:123:task/abc123', 'my-cluster')

    expect(ecsApi.stopTask).toHaveBeenCalledWith('arn:aws:ecs:us-east-1:123:task/abc123', 'my-cluster')
    expect(loading.value).toBe(false)
  })

  // -------------------------------------------------------------------------
  // Services
  // -------------------------------------------------------------------------

  it('loadServices describes each ARN with cluster', async () => {
    vi.mocked(ecsApi.listServices).mockResolvedValue({ ServiceArns: ['arn:aws:ecs:us-east-1:123:service/my-svc'] })
    vi.mocked(ecsApi.describeServices).mockResolvedValue({
      Services: [{ ServiceArn: 'arn:aws:ecs:us-east-1:123:service/my-svc', ServiceName: 'my-svc', Status: 'ACTIVE' }],
    })

    const { loadServices, services } = useECS()
    await loadServices('my-cluster')

    expect(ecsApi.listServices).toHaveBeenCalledWith({ Cluster: 'my-cluster' })
    expect(ecsApi.describeServices).toHaveBeenCalledWith('arn:aws:ecs:us-east-1:123:service/my-svc', 'my-cluster')
    expect(services.value).toHaveLength(1)
    expect(services.value[0].ServiceName).toBe('my-svc')
  })

  it('createService calls API and reloads', async () => {
    vi.mocked(ecsApi.createService).mockResolvedValue({ Service: {} })
    vi.mocked(ecsApi.listServices).mockResolvedValue({ ServiceArns: [] })

    const { createService, creating } = useECS()
    await createService({ cluster: 'my-cluster', serviceName: 'my-svc', taskDefinition: 'my-task:1', desiredCount: 1 })

    expect(ecsApi.createService).toHaveBeenCalledWith({
      Cluster: 'my-cluster',
      ServiceName: 'my-svc',
      TaskDefinition: 'my-task:1',
      DesiredCount: 1,
      LaunchType: undefined,
    })
    expect(creating.value).toBe(false)
  })

  it('deleteService calls API and reloads', async () => {
    vi.mocked(ecsApi.deleteService).mockResolvedValue({ Service: {} })
    vi.mocked(ecsApi.listServices).mockResolvedValue({ ServiceArns: [] })

    const { deleteService, loading } = useECS()
    await deleteService('my-svc', 'my-cluster')

    expect(ecsApi.deleteService).toHaveBeenCalledWith('my-svc', 'my-cluster')
    expect(loading.value).toBe(false)
  })
})