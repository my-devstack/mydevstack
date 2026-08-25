import { ref } from 'vue'
import { useToast } from '@/composables/useToast'
import * as ecsApi from '@/api/services/ecs'
import type { ECSCluster, ECSTaskDefinition, ECSTask, ECSService } from '@/api/services/ecs'

export function useECS() {
  const toast = useToast()

  // State
  const clusters = ref<ECSCluster[]>([])
  const taskDefinitions = ref<ECSTaskDefinition[]>([])
  const tasks = ref<ECSTask[]>([])
  const services = ref<ECSService[]>([])
  const loading = ref(false)
  const creating = ref(false)
  const selectedCluster = ref<ECSCluster | null>(null)

  // ---------------------------------------------------------------------------
  // Clusters
  // ---------------------------------------------------------------------------

  async function loadClusters() {
    loading.value = true
    try {
      const result = await ecsApi.listClusters()
      const arns = result.ClusterArns || []
      const detailed: ECSCluster[] = []
      for (const arn of arns) {
        try {
          const desc = await ecsApi.describeClusters(arn)
          const cluster = desc.Clusters?.[0]
          if (cluster) detailed.push(cluster)
        } catch {
          // Fall back to ARN-only entry if describe fails
          detailed.push({ ClusterArn: arn, ClusterName: arn.split('/').pop() })
        }
      }
      clusters.value = detailed
    } catch (error) {
      toast.error('Failed to load clusters: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  async function createCluster(data: { ClusterName: string }) {
    creating.value = true
    try {
      await ecsApi.createCluster({ ClusterName: data.ClusterName })
      toast.success(`Cluster "${data.ClusterName}" created successfully`)
      await loadClusters()
    } catch (error) {
      toast.error('Failed to create cluster: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      creating.value = false
    }
  }

  async function deleteCluster(clusterName: string) {
    loading.value = true
    try {
      await ecsApi.deleteCluster(clusterName)
      toast.success(`Cluster "${clusterName}" deleted successfully`)
      if (selectedCluster.value?.ClusterName === clusterName) {
        selectedCluster.value = null
      }
      await loadClusters()
    } catch (error) {
      toast.error('Failed to delete cluster: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      loading.value = false
    }
  }

  // ---------------------------------------------------------------------------
  // Task definitions
  // ---------------------------------------------------------------------------

  async function loadTaskDefinitions() {
    loading.value = true
    try {
      const result = await ecsApi.listTaskDefinitions()
      const arns = result.TaskDefinitionArns || []
      const detailed: ECSTaskDefinition[] = []
      for (const arn of arns) {
        try {
          const desc = await ecsApi.describeTaskDefinition(arn)
          const td = desc.TaskDefinition
          if (td) detailed.push(td)
        } catch {
          const parts = arn.split('/')
          const familyRev = parts[1] || arn
          const [family, revision] = familyRev.split(':')
          detailed.push({
            TaskDefinitionArn: arn,
            Family: family || arn,
            Revision: revision ? Number(revision) : undefined,
          })
        }
      }
      taskDefinitions.value = detailed
    } catch (error) {
      toast.error('Failed to load task definitions: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  async function createTaskDefinition(data: {
    family: string
    containerName: string
    image: string
    cpu?: number
    memory?: number
  }) {
    creating.value = true
    try {
      await ecsApi.registerTaskDefinition({
        Family: data.family,
        ContainerDefinitions: [
          {
            Name: data.containerName,
            Image: data.image,
            Cpu: data.cpu,
            Memory: data.memory,
            Essential: true,
          },
        ],
      })
      toast.success(`Task definition "${data.family}" registered successfully`)
      await loadTaskDefinitions()
    } catch (error) {
      toast.error('Failed to register task definition: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      creating.value = false
    }
  }

  async function deleteTaskDefinition(taskDefinitionArn: string) {
    loading.value = true
    try {
      await ecsApi.deregisterTaskDefinition(taskDefinitionArn)
      toast.success('Task definition deregistered successfully')
      await loadTaskDefinitions()
    } catch (error) {
      toast.error('Failed to deregister task definition: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      loading.value = false
    }
  }

  // ---------------------------------------------------------------------------
  // Tasks
  // ---------------------------------------------------------------------------

  async function loadTasks(cluster?: string) {
    loading.value = true
    try {
      const result = await ecsApi.listTasks({ Cluster: cluster })
      const arns = result.TaskArns || []
      const detailed: ECSTask[] = []
      for (const arn of arns) {
        try {
          const desc = await ecsApi.describeTasks(arn, cluster)
          const task = desc.Tasks?.[0]
          if (task) detailed.push(task)
        } catch {
          detailed.push({ TaskArn: arn, LastStatus: 'UNKNOWN' })
        }
      }
      tasks.value = detailed
    } catch (error) {
      toast.error('Failed to load tasks: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  async function runTask(data: {
    cluster?: string
    taskDefinition: string
    count?: number
    launchType?: string
  }) {
    creating.value = true
    try {
      await ecsApi.runTask({
        Cluster: data.cluster,
        TaskDefinition: data.taskDefinition,
        Count: data.count,
        LaunchType: data.launchType,
      })
      toast.success('Task started successfully')
      await loadTasks(data.cluster)
    } catch (error) {
      toast.error('Failed to run task: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      creating.value = false
    }
  }

  async function stopTask(taskArn: string, cluster?: string) {
    loading.value = true
    try {
      await ecsApi.stopTask(taskArn, cluster)
      toast.success('Task stopped successfully')
      await loadTasks(cluster)
    } catch (error) {
      toast.error('Failed to stop task: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      loading.value = false
    }
  }

  // ---------------------------------------------------------------------------
  // Services
  // ---------------------------------------------------------------------------

  async function loadServices(cluster?: string) {
    loading.value = true
    try {
      const result = await ecsApi.listServices({ Cluster: cluster })
      const arns = result.ServiceArns || []
      const detailed: ECSService[] = []
      for (const arn of arns) {
        try {
          const desc = await ecsApi.describeServices(arn, cluster)
          const service = desc.Services?.[0]
          if (service) detailed.push(service)
        } catch {
          detailed.push({ ServiceArn: arn, ServiceName: arn.split('/').pop() })
        }
      }
      services.value = detailed
    } catch (error) {
      toast.error('Failed to load services: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  async function createService(data: {
    cluster?: string
    serviceName: string
    taskDefinition: string
    desiredCount?: number
    launchType?: string
  }) {
    creating.value = true
    try {
      await ecsApi.createService({
        Cluster: data.cluster,
        ServiceName: data.serviceName,
        TaskDefinition: data.taskDefinition,
        DesiredCount: data.desiredCount,
        LaunchType: data.launchType,
      })
      toast.success(`Service "${data.serviceName}" created successfully`)
      await loadServices(data.cluster)
    } catch (error) {
      toast.error('Failed to create service: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      creating.value = false
    }
  }

  async function deleteService(serviceName: string, cluster?: string) {
    loading.value = true
    try {
      await ecsApi.deleteService(serviceName, cluster)
      toast.success(`Service "${serviceName}" deleted successfully`)
      await loadServices(cluster)
    } catch (error) {
      toast.error('Failed to delete service: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    clusters,
    taskDefinitions,
    tasks,
    services,
    loading,
    creating,
    selectedCluster,
    loadClusters,
    createCluster,
    deleteCluster,
    loadTaskDefinitions,
    createTaskDefinition,
    deleteTaskDefinition,
    loadTasks,
    runTask,
    stopTask,
    loadServices,
    createService,
    deleteService,
  }
}