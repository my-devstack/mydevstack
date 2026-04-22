<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

interface Deployment {
  id: string
  createdDate?: string
  description?: string
}

interface Stage {
  stageName: string
  deploymentId?: string
  description?: string
  status?: string
}

const props = defineProps<{
  open: boolean
  apiName?: string
  apiId?: string
  deployments?: Deployment[]
  stages?: Stage[]
  loadingDeployments?: boolean
  loadingStages?: boolean
  type?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'close': []
  'create-deployment': [stageName: string, description: string]
  'delete-deployment': [deploymentId: string]
  'create-stage': [stageName: string, description: string]
  'delete-stage': [stageName: string]
}>()

const settingsStore = useSettingsStore()

const activeTab = ref<'deployments' | 'stages'>('deployments')
const newStageName = ref('')
const newStageDescription = ref('')
const newDeploymentStageName = ref('')
const newDeploymentDescription = ref('')

const hasDeployments = computed(() => props.deployments?.length > 0)
const hasStages = computed(() => props.stages?.length > 0)

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

function handleCreateDeployment() {
  if (!newDeploymentStageName.value.trim()) return
  emit('create-deployment', newDeploymentStageName.value.trim(), newDeploymentDescription.value.trim())
  newDeploymentStageName.value = ''
  newDeploymentDescription.value = ''
}

function handleCreateStage() {
  if (!newStageName.value.trim()) return
  emit('create-stage', newStageName.value.trim(), newStageDescription.value.trim())
  newStageName.value = ''
  newStageDescription.value = ''
}

function handleDeleteDeployment(deploymentId: string) {
  emit('delete-deployment', deploymentId)
}

function handleDeleteStage(stageName: string) {
  emit('delete-stage', stageName)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    :title="`Deployments - ${apiName}`"
    size="lg"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <!-- Tabs -->
    <div
      class="flex gap-4 mb-4 border-b"
      :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
    >
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium border-b-2"
        :class="activeTab === 'deployments' 
          ? 'border-blue-600 text-blue-600' 
          : 'border-transparent text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'"
        @click="activeTab = 'deployments'"
      >
        Deployments ({{ deployments?.length || 0 }})
      </button>
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium border-b-2"
        :class="activeTab === 'stages' 
          ? 'border-blue-600 text-blue-600' 
          : 'border-transparent text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'"
        @click="activeTab = 'stages'"
      >
        Stages ({{ stages?.length || 0 }})
      </button>
    </div>

    <!-- Deployments Tab -->
    <div
      v-if="activeTab === 'deployments'"
      class="space-y-4"
    >
      <!-- Create Deployment Form -->
      <div
        class="p-4 rounded-lg"
        :class="settingsStore.darkMode ? 'bg-gray-700' : 'bg-gray-50'"
      >
        <h4
          class="text-sm font-medium mb-3"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Create New Deployment
        </h4>
        <div class="grid grid-cols-2 gap-3">
          <FormInput
            v-model="newDeploymentStageName"
            label="Stage Name"
            placeholder="prod"
            required
          />
          <FormInput
            v-model="newDeploymentDescription"
            label="Description"
            placeholder="Production deployment"
          />
        </div>
        <div class="mt-3">
          <Button
            size="sm"
            :disabled="!newDeploymentStageName.trim()"
            @click="handleCreateDeployment"
          >
            Create Deployment
          </Button>
        </div>
      </div>

      <!-- Loading -->
      <div
        v-if="loadingDeployments"
        class="flex justify-center py-4"
      >
        <LoadingSpinner />
      </div>

      <!-- Empty -->
      <EmptyState
        v-else-if="!hasDeployments"
        icon="server"
        title="No Deployments"
        description="Create your first deployment."
      />

      <!-- Deployments List -->
      <div
        v-else
        class="space-y-2"
      >
        <div
          v-for="deployment in deployments"
          :key="deployment.id"
          class="flex items-center justify-between p-3 rounded-lg"
          :class="settingsStore.darkMode ? 'bg-gray-700' : 'bg-gray-50'"
        >
          <div>
            <span class="font-medium">{{ deployment.id }}</span>
            <span class="text-sm text-light-muted dark:text-dark-muted ml-2">
              {{ formatDate(deployment.createdDate) }}
            </span>
            <p
              v-if="deployment.description"
              class="text-sm text-light-muted dark:text-dark-muted"
            >
              {{ deployment.description }}
            </p>
          </div>
          <button
            type="button"
            class="p-2 text-red-500 hover:text-red-700 rounded"
            title="Delete"
            @click="handleDeleteDeployment(deployment.id)"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Stages Tab -->
    <div
      v-else
      class="space-y-4"
    >
      <!-- Create Stage Form -->
      <div
        class="p-4 rounded-lg"
        :class="settingsStore.darkMode ? 'bg-gray-700' : 'bg-gray-50'"
      >
        <h4
          class="text-sm font-medium mb-3"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Create New Stage
        </h4>
        <div class="grid grid-cols-2 gap-3">
          <FormInput
            v-model="newStageName"
            label="Stage Name"
            placeholder="prod"
            required
          />
          <FormInput
            v-model="newStageDescription"
            label="Description"
            placeholder="Production stage"
          />
        </div>
        <div class="mt-3">
          <Button
            size="sm"
            :disabled="!newStageName.trim()"
            @click="handleCreateStage"
          >
            Create Stage
          </Button>
        </div>
      </div>

      <!-- Loading -->
      <div
        v-if="loadingStages"
        class="flex justify-center py-4"
      >
        <LoadingSpinner />
      </div>

      <!-- Empty -->
      <EmptyState
        v-else-if="!hasStages"
        icon="server"
        title="No Stages"
        description="Create your first stage."
      />

      <!-- Stages List -->
      <div
        v-else
        class="space-y-2"
      >
        <div
          v-for="stage in stages"
          :key="stage.stageName"
          class="flex items-center justify-between p-3 rounded-lg"
          :class="settingsStore.darkMode ? 'bg-gray-700' : 'bg-gray-50'"
        >
          <div>
            <span class="font-medium">{{ stage.stageName }}</span>
            <span
              v-if="stage.status"
              class="text-xs px-2 py-0.5 rounded ml-2 bg-green-100 text-green-800"
            >
              {{ stage.status }}
            </span>
            <p
              v-if="stage.description"
              class="text-sm text-light-muted dark:text-dark-muted"
            >
              {{ stage.description }}
            </p>
          </div>
          <button
            type="button"
            class="p-2 text-red-500 hover:text-red-700 rounded"
            title="Delete"
            @click="handleDeleteStage(stage.stageName)"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        variant="secondary"
        @click="handleClose"
      >
        Close
      </Button>
    </template>
  </Modal>
</template>