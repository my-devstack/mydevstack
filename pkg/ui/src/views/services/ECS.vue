<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useContentReload } from '@/composables/useContentReload'
import { useToast } from '@/composables/useToast'
import Button from '@/components/common/Button.vue'
import Tabs from '@/components/common/Tabs.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import {
  ServerIcon,
  DocumentTextIcon,
  PlayIcon,
  CogIcon,
  PlusIcon,
} from '@heroicons/vue/24/outline'
import {
  ECSClusterList,
  ECSTaskDefinitionList,
  ECSTaskList,
  ECSServiceList,
  ECSModal,
  ECSCodeExamples,
  type ECSEntityType,
} from '@/components/ecs'
import { useECS } from '@/composables/useECS'

const settingsStore = useSettingsStore()
const toast = useToast()
const { reloadTrigger } = useContentReload()

const {
  clusters,
  taskDefinitions,
  tasks,
  services,
  loading,
  creating,
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
} = useECS()

// State
const activeTab = ref('clusters')
const showModal = ref(false)
const modalEntity = ref<ECSEntityType>('cluster')
const selectedCluster = ref('')
const clustersError = ref('')
const taskDefinitionsError = ref('')
const tasksError = ref('')
const servicesError = ref('')

// Tabs
const tabs = [
  { id: 'clusters', label: 'Clusters', icon: ServerIcon },
  { id: 'task-definitions', label: 'Task Definitions', icon: DocumentTextIcon },
  { id: 'tasks', label: 'Tasks', icon: PlayIcon },
  { id: 'services', label: 'Services', icon: CogIcon },
]

// Computed
const clusterCount = computed(() => clusters.value.length)
const taskDefinitionCount = computed(() => taskDefinitions.value.length)
const taskCount = computed(() => tasks.value.length)
const serviceCount = computed(() => services.value.length)

const createButtonLabel = computed(() => {
  switch (activeTab.value) {
    case 'clusters': return 'Create Cluster'
    case 'task-definitions': return 'Register Task Definition'
    case 'tasks': return 'Run Task'
    case 'services': return 'Create Service'
    default: return 'Create'
  }
})

// Loaders
async function loadClustersWithError() {
  clustersError.value = ''
  try {
    await loadClusters()
  } catch (error) {
    clustersError.value = error instanceof Error ? error.message : 'Unknown error'
  }
}

async function loadTaskDefinitionsWithError() {
  taskDefinitionsError.value = ''
  try {
    await loadTaskDefinitions()
  } catch (error) {
    taskDefinitionsError.value = error instanceof Error ? error.message : 'Unknown error'
  }
}

async function loadTasksWithError() {
  tasksError.value = ''
  try {
    await loadTasks(selectedCluster.value || undefined)
  } catch (error) {
    tasksError.value = error instanceof Error ? error.message : 'Unknown error'
  }
}

async function loadServicesWithError() {
  servicesError.value = ''
  try {
    await loadServices(selectedCluster.value || undefined)
  } catch (error) {
    servicesError.value = error instanceof Error ? error.message : 'Unknown error'
  }
}

// Tab switching
function handleTabChange(tabId: string) {
  activeTab.value = tabId
  if (tabId === 'tasks') {
    if (!selectedCluster.value && clusters.value.length > 0) {
      selectedCluster.value = clusters.value[0].ClusterName || ''
    } else {
      loadTasksWithError()
    }
  } else if (tabId === 'services') {
    if (!selectedCluster.value && clusters.value.length > 0) {
      selectedCluster.value = clusters.value[0].ClusterName || ''
    } else {
      loadServicesWithError()
    }
  }
}

// Reload tasks/services when the selected cluster changes (dropdown selection).
// Using a watcher (instead of @change) guarantees the reload reads the NEW
// cluster value, since @change fires before v-model updates selectedCluster.
watch(selectedCluster, () => {
  if (activeTab.value === 'tasks') loadTasksWithError()
  else if (activeTab.value === 'services') loadServicesWithError()
})

// Create button per tab
function openCreateModal() {
  if (activeTab.value === 'clusters') modalEntity.value = 'cluster'
  else if (activeTab.value === 'task-definitions') modalEntity.value = 'task-definition'
  else if (activeTab.value === 'tasks') modalEntity.value = 'task'
  else if (activeTab.value === 'services') modalEntity.value = 'service'
  else return
  showModal.value = true
}

// Submit handler
async function handleSubmit(data: Record<string, any>) {
  try {
    if (modalEntity.value === 'cluster') {
      await createCluster({ ClusterName: data.ClusterName })
    } else if (modalEntity.value === 'task-definition') {
      await createTaskDefinition({
        family: data.Family,
        containerName: data.ContainerDefinitions?.[0]?.Name || '',
        image: data.ContainerDefinitions?.[0]?.Image || '',
        cpu: data.ContainerDefinitions?.[0]?.Cpu,
        memory: data.ContainerDefinitions?.[0]?.Memory,
      })
    } else if (modalEntity.value === 'task') {
      await runTask({
        cluster: data.Cluster,
        taskDefinition: data.TaskDefinition,
        count: data.Count,
        launchType: data.LaunchType,
      })
    } else if (modalEntity.value === 'service') {
      await createService({
        cluster: data.Cluster,
        serviceName: data.ServiceName,
        taskDefinition: data.TaskDefinition,
        desiredCount: data.DesiredCount,
        launchType: data.LaunchType,
      })
    }
    showModal.value = false
  } catch (error) {
    // Error handling is done in composable
  }
}

// Delete handlers
async function handleDeleteCluster(clusterName: string) {
  try {
    await deleteCluster(clusterName)
    if (selectedCluster.value === clusterName) {
      selectedCluster.value = ''
    }
  } catch (error) {
    // Error handling is done in composable
  }
}

async function handleDeleteTaskDefinition(taskDefinitionArn: string) {
  try {
    await deleteTaskDefinition(taskDefinitionArn)
  } catch (error) {
    // Error handling is done in composable
  }
}

async function handleStopTask(taskArn: string) {
  try {
    await stopTask(taskArn, selectedCluster.value || undefined)
  } catch (error) {
    // Error handling is done in composable
  }
}

async function handleDeleteService(serviceName: string) {
  try {
    await deleteService(serviceName, selectedCluster.value || undefined)
  } catch (error) {
    // Error handling is done in composable
  }
}

// Lifecycle
onMounted(() => {
  loadClustersWithError()
  loadTaskDefinitionsWithError()
})

watch(reloadTrigger, () => {
  loadClustersWithError()
  loadTaskDefinitionsWithError()
  if (activeTab.value === 'tasks') loadTasksWithError()
  else if (activeTab.value === 'services') loadServicesWithError()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            ECS Management
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ clusterCount }} cluster(s) · {{ taskDefinitionCount }} task definition(s) · {{ taskCount }} task(s) · {{ serviceCount }} service(s)
          </span>
        </div>

        <Button
          variant="primary"
          @click="openCreateModal"
        >
          <template #icon-left>
            <PlusIcon class="h-4 w-4" />
          </template>
          {{ createButtonLabel }}
        </Button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6">
      <Tabs
        v-model:active-tab="activeTab"
        :tabs="tabs"
        variant="underline"
        @update:active-tab="handleTabChange"
      />
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6">
      <!-- Clusters Tab -->
      <template v-if="activeTab === 'clusters'">
        <ECSClusterList
          :clusters="clusters"
          :loading="loading"
          :error="clustersError"
          @create="openCreateModal"
          @delete="handleDeleteCluster"
        />
      </template>

      <!-- Task Definitions Tab -->
      <template v-else-if="activeTab === 'task-definitions'">
        <ECSTaskDefinitionList
          :task-definitions="taskDefinitions"
          :loading="loading"
          :error="taskDefinitionsError"
          @create="openCreateModal"
          @delete="handleDeleteTaskDefinition"
        />
      </template>

      <!-- Tasks Tab -->
      <template v-else-if="activeTab === 'tasks'">
        <div
          v-if="clusters.length === 0"
          class="py-8"
        >
          <EmptyState
            icon="server"
            title="No clusters"
            description="Create a cluster first to run tasks"
            action-label="Create Cluster"
            @action="openCreateModal"
          />
        </div>
        <template v-else>
          <div class="mb-4 flex items-center gap-3">
            <label class="text-sm font-medium text-light-text dark:text-dark-text">Cluster:</label>
            <select
              v-model="selectedCluster"
              class="text-sm border rounded px-3 py-1.5"
              :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
            >
              <option
                v-for="cluster in clusters"
                :key="cluster.ClusterArn || cluster.ClusterName"
                :value="cluster.ClusterName || cluster.ClusterArn"
              >
                {{ cluster.ClusterName || cluster.ClusterArn }}
              </option>
            </select>
          </div>
          <ECSTaskList
            :tasks="tasks"
            :loading="loading"
            :error="tasksError"
            @create="openCreateModal"
            @stop="handleStopTask"
          />
        </template>
      </template>

      <!-- Services Tab -->
      <template v-else-if="activeTab === 'services'">
        <div
          v-if="clusters.length === 0"
          class="py-8"
        >
          <EmptyState
            icon="server"
            title="No clusters"
            description="Create a cluster first to create services"
            action-label="Create Cluster"
            @action="openCreateModal"
          />
        </div>
        <template v-else>
          <div class="mb-4 flex items-center gap-3">
            <label class="text-sm font-medium text-light-text dark:text-dark-text">Cluster:</label>
            <select
              v-model="selectedCluster"
              class="text-sm border rounded px-3 py-1.5"
              :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
            >
              <option
                v-for="cluster in clusters"
                :key="cluster.ClusterArn || cluster.ClusterName"
                :value="cluster.ClusterName || cluster.ClusterArn"
              >
                {{ cluster.ClusterName || cluster.ClusterArn }}
              </option>
            </select>
          </div>
          <ECSServiceList
            :services="services"
            :loading="loading"
            :error="servicesError"
            @create="openCreateModal"
            @delete="handleDeleteService"
          />
        </template>
      </template>
    </div>

    <!-- Code Examples -->
    <div class="flex-shrink-0 border-t border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-6">
      <ECSCodeExamples
        :region="settingsStore.region"
        :access-key="settingsStore.accessKey"
        :secret-key="settingsStore.secretKey"
      />
    </div>

    <!-- Create/Run Modal -->
    <ECSModal
      :open="showModal"
      :entity="modalEntity"
      :loading="creating"
      @update:open="showModal = $event"
      @submit="handleSubmit"
    />
  </div>
</template>