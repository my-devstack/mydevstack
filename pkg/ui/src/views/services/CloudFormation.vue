<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUIStore } from '@/stores/ui'
import { useContentReload } from '@/composables/useContentReload'
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  FolderIcon,
  EyeIcon,
  BeakerIcon,
} from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import JsonViewer from '@/components/common/JsonViewer.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import * as cloudformation from '@/api/services/cloudformation'

// Stores
const settingsStore = useSettingsStore()
const uiStore = useUIStore()
const { reloadTrigger } = useContentReload()

// Types
interface CloudFormationStackSummary {
  StackId: string
  StackName: string
  StackStatus: string
  StackStatusReason?: string
  Description?: string
  CreationTime: string
  LastUpdatedTime?: string
  DeletionTime?: string
  Tags?: Array<{ Key: string; Value: string }>
}

interface CloudFormationStack {
  StackId: string
  StackName: string
  StackStatus: string
  StackStatusReason?: string
  Description?: string
  CreationTime: string
  LastUpdatedTime?: string
  RollbackConfiguration?: Record<string, unknown>
  DisableRollback?: boolean
  NotificationARNs?: string[]
  TimeoutInMinutes?: number
  Capabilities?: string[]
  Outputs?: Array<{ OutputKey: string; OutputValue: string; Description?: string }>
  Tags?: Array<{ Key: string; Value: string }>
}

interface CloudFormationStackResource {
  StackName: string
  StackId: string
  LogicalResourceId: string
  PhysicalResourceId?: string
  ResourceType: string
  Timestamp: string
  ResourceStatus: string
  ResourceStatusReason?: string
}

interface CloudFormationStackEvent {
  StackId: string
  EventId: string
  StackName: string
  LogicalResourceId: string
  PhysicalResourceId?: string
  ResourceType: string
  Timestamp: string
  ResourceStatus: string
  ResourceStatusReason?: string
  ResourceProperties?: string
}

// Delete confirmation state
const showDeleteModal = ref(false)
const stackToDelete = ref<CloudFormationStackSummary | null>(null)

// State
const loading = ref(false)
const stacks = ref<CloudFormationStackSummary[]>([])
const selectedStack = ref<CloudFormationStackSummary | null>(null)
const stackDetails = ref<CloudFormationStack | null>(null)
const stackResources = ref<CloudFormationStackResource[]>([])
const stackEvents = ref<CloudFormationStackEvent[]>([])
const resourcesLoading = ref(false)
const eventsLoading = ref(false)

// Modals
const showCreateModal = ref(false)
const showResourcesModal = ref(false)
const showEventsModal = ref(false)

// Form state
const newStackName = ref('')
const newTemplateBody = ref(`AWSTemplateFormatVersion: '2010-09-09'
Description: My CloudFormation Stack
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: \${newStackName.value || 'my-bucket'}
`)

// Stack columns
const stackColumns = computed(() => [
  { key: 'StackName', label: 'Stack Name', sortable: true },
  { key: 'StackStatus', label: 'Status', sortable: true },
  { key: 'CreationTime', label: 'Created', sortable: true },
  { key: 'Description', label: 'Description', sortable: false },
])

// Resource columns
const resourceColumns = computed(() => [
  { key: 'LogicalResourceId', label: 'Logical ID', sortable: true },
  { key: 'PhysicalResourceId', label: 'Physical ID', sortable: false },
  { key: 'ResourceType', label: 'Type', sortable: true },
  { key: 'ResourceStatus', label: 'Status', sortable: true },
])

// Event columns
const eventColumns = computed(() => [
  { key: 'Timestamp', label: 'Time', sortable: true },
  { key: 'LogicalResourceId', label: 'Logical ID', sortable: true },
  { key: 'ResourceType', label: 'Type', sortable: true },
  { key: 'ResourceStatus', label: 'Status', sortable: true },
  { key: 'ResourceStatusReason', label: 'Reason', sortable: false },
])

// Helper functions
function getStatus(status: string): 'active' | 'pending' | 'inactive' | 'error' {
  const statusMap: Record<string, 'active' | 'pending' | 'inactive' | 'error'> = {
    CREATE_COMPLETE: 'active',
    UPDATE_COMPLETE: 'active',
    DELETE_COMPLETE: 'inactive',
    CREATE_IN_PROGRESS: 'pending',
    UPDATE_IN_PROGRESS: 'pending',
    DELETE_IN_PROGRESS: 'pending',
    CREATE_FAILED: 'error',
    UPDATE_FAILED: 'error',
    DELETE_FAILED: 'error',
    ROLLBACK_IN_PROGRESS: 'pending',
    ROLLBACK_COMPLETE: 'error',
  }
  return statusMap[status] || 'inactive'
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString()
}

// API calls
async function loadStacks() {
  loading.value = true
  try {
    const result = await cloudformation.listStacks()
    stacks.value = result.StackSummaries || []
    
    if (stacks.value.length > 0 && !selectedStack.value) {
      await selectStack(stacks.value[0])
    }
  } catch (error) {
    uiStore.notifyError('Error', `Failed to load stacks: ${error}`)
  } finally {
    loading.value = false
  }
}

async function selectStack(stack: CloudFormationStackSummary) {
  selectedStack.value = stack
  stackDetails.value = null
  stackResources.value = []
  stackEvents.value = []
  
  try {
    const result = await cloudformation.describeStacks(stack.StackName)
    stackDetails.value = result.Stacks?.[0] || null
  } catch (error) {
    uiStore.notifyError('Error', `Failed to describe stack: ${error}`)
  }
}

async function createStack() {
  if (!newStackName.value) {
    uiStore.notifyWarning('Validation', 'Stack name is required')
    return
  }

  loading.value = true
  try {
    await cloudformation.createStack({
      StackName: newStackName.value,
      TemplateBody: newTemplateBody.value,
    })
    
    uiStore.notifySuccess('Success', `Stack ${newStackName.value} is being created`)
    showCreateModal.value = false
    newStackName.value = ''
    newTemplateBody.value = `AWSTemplateFormatVersion: '2010-09-09'
Description: My CloudFormation Stack
Resources: {}`
    await loadStacks()
  } catch (error) {
    uiStore.notifyError('Error', `Failed to create stack: ${error}`)
  } finally {
    loading.value = false
  }
}

function openDeleteModal(stack: CloudFormationStackSummary) {
  stackToDelete.value = stack
  showDeleteModal.value = true
}

async function confirmDeleteStack() {
  if (!stackToDelete.value) return
  
  loading.value = true
  try {
    await cloudformation.deleteStack(stackToDelete.value.StackName)
    uiStore.notifySuccess('Success', `Stack ${stackToDelete.value.StackName} is being deleted`)
    
    if (selectedStack.value?.StackName === stackToDelete.value.StackName) {
      selectedStack.value = null
      stackDetails.value = null
      stackResources.value = []
    }
    
    showDeleteModal.value = false
    stackToDelete.value = null
    await loadStacks()
  } catch (error) {
    uiStore.notifyError('Error', `Failed to delete stack: ${error}`)
  } finally {
    loading.value = false
  }
}

async function loadStackResources() {
  if (!selectedStack.value) return
  
  resourcesLoading.value = true
  showResourcesModal.value = true
  try {
    const result = await cloudformation.describeStackResources(selectedStack.value.StackName)
    stackResources.value = result.StackResources || []
  } catch (error) {
    uiStore.notifyError('Error', `Failed to load stack resources: ${error}`)
  } finally {
    resourcesLoading.value = false
  }
}

async function loadStackEvents() {
  if (!selectedStack.value) return
  
  eventsLoading.value = true
  showEventsModal.value = true
  try {
    const result = await cloudformation.describeStackEvents(selectedStack.value.StackName)
    stackEvents.value = result.StackEvents || []
  } catch (error) {
    uiStore.notifyError('Error', `Failed to load stack events: ${error}`)
  } finally {
    eventsLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadStacks()
})

watch(reloadTrigger, () => {
  loadStacks()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div 
      class="p-4 border-b flex items-center justify-between"
      :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
    >
      <div class="flex items-center gap-3">
        <FolderIcon
          class="h-6 w-6"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        />
        <h1
          class="text-xl font-semibold"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          CloudFormation
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          :loading="loading"
          @click="loadStacks"
        >
          <ArrowPathIcon class="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          @click="showCreateModal = true"
        >
          <PlusIcon class="h-4 w-4 mr-1" />
          Create Stack
        </Button>
      </div>
    </div>
    
    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Empty State -->
      <EmptyState
        v-if="!loading && stacks.length === 0"
        icon="folder"
        title="No CloudFormation Stacks"
        description="Create your first CloudFormation stack to manage your AWS resources."
        @action="showCreateModal = true"
      />
      
      <template v-else>
        <!-- Stack List -->
        <div class="mb-6">
          <h2
            class="text-lg font-medium mb-4"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Stacks
          </h2>
          
          <DataTable
            :columns="stackColumns"
            :data="stacks"
            :loading="loading"
            empty-title="No Stacks"
            empty-text="No CloudFormation stacks found"
            @row-click="selectStack"
          >
            <template #cell-StackName="{ value, row }">
              <div class="flex items-center gap-2">
                <FolderIcon class="h-4 w-4 text-primary-500" />
                <span class="font-medium">{{ value }}</span>
              </div>
            </template>
            
            <template #cell-StackStatus="{ value }">
              <StatusBadge
                :status="getStatus(value)"
                :label="value"
              />
            </template>
            
            <template #cell-CreationTime="{ value }">
              <span
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                {{ formatDate(value) }}
              </span>
            </template>
            
            <template #cell-Description="{ value }">
              <span
                class="text-sm truncate max-w-xs"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                {{ value || '-' }}
              </span>
            </template>
            
            <template #row-actions="{ row }">
              <div class="flex items-center gap-2">
                <Button 
                  v-if="selectedStack?.StackName !== row.StackName" 
                  variant="secondary" 
                  size="sm"
                  @click.stop="selectStack(row)"
                >
                  View Details
                </Button>
                <button
                  type="button"
                  class="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                  title="Delete"
                  @click.stop="openDeleteModal(row)"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </template>
          </DataTable>
        </div>
        
        <!-- Stack Details -->
        <div
          v-if="selectedStack"
          class="space-y-6"
        >
          <!-- Stack Info -->
          <div
            class="p-6 rounded-lg border"
            :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
          >
            <div class="flex items-center justify-between mb-4">
              <h3
                class="text-lg font-semibold"
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
              >
                Stack: {{ selectedStack.StackName }}
              </h3>
              <div class="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  @click="loadStackResources"
                >
                  <EyeIcon class="h-4 w-4 mr-1" />
                  Resources
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  @click="loadStackEvents"
                >
                  Events
                </Button>
              </div>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p
                  class="text-sm"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  Status
                </p>
                <StatusBadge
                  :status="getStatus(selectedStack.StackStatus)"
                  class="mt-1"
                />
              </div>
              <div>
                <p
                  class="text-sm"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  Created
                </p>
                <p
                  class="mt-1 text-sm"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                >
                  {{ formatDate(selectedStack.CreationTime) }}
                </p>
              </div>
              <div v-if="selectedStack.LastUpdatedTime">
                <p
                  class="text-sm"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  Last Updated
                </p>
                <p
                  class="mt-1 text-sm"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                >
                  {{ formatDate(selectedStack.LastUpdatedTime) }}
                </p>
              </div>
              <div>
                <p
                  class="text-sm"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  Stack ID
                </p>
                <code
                  class="mt-1 text-xs block truncate"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                >
                  {{ selectedStack.StackId }}
                </code>
              </div>
            </div>
            
            <div
              v-if="selectedStack.Description"
              class="mt-4"
            >
              <p
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Description
              </p>
              <p
                class="mt-1 text-sm"
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
              >
                {{ selectedStack.Description }}
              </p>
            </div>
          </div>
          
          <!-- Stack Outputs -->
          <div
            v-if="stackDetails?.Outputs && stackDetails.Outputs.length > 0"
            class="p-6 rounded-lg border"
            :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
          >
            <h3
              class="text-lg font-semibold mb-4"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Outputs
            </h3>
            
            <div class="space-y-3">
              <div 
                v-for="output in stackDetails.Outputs" 
                :key="output.OutputKey"
                class="p-3 rounded border"
                :class="settingsStore.darkMode ? 'border-dark-border bg-dark-bg' : 'border-light-border bg-light-bg'"
              >
                <p
                  class="text-sm font-medium"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                >
                  {{ output.OutputKey }}
                </p>
                <code
                  class="text-xs block mt-1"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  {{ output.OutputValue }}
                </code>
                <p
                  v-if="output.Description"
                  class="text-xs mt-1"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  {{ output.Description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
    
    <!-- Create Stack Modal -->
    <Modal
      v-model:open="showCreateModal"
      title="Create CloudFormation Stack"
      size="lg"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newStackName"
          label="Stack Name"
          placeholder="my-stack"
          required
        />
        <div>
          <label
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Template Body (YAML)
          </label>
          <textarea
            v-model="newTemplateBody"
            class="w-full h-64 px-3 py-2 rounded-lg border bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            placeholder="AWSTemplateFormatVersion: '2010-09-09'"
          />
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="loading"
            @click="createStack"
          >
            Create Stack
          </Button>
        </div>
      </template>
    </Modal>
    
    <!-- Stack Resources Modal -->
    <Modal
      v-model:open="showResourcesModal"
      :title="`Resources: ${selectedStack?.StackName || ''}`"
      size="lg"
    >
      <LoadingSpinner v-if="resourcesLoading" />
      
      <EmptyState
        v-else-if="stackResources.length === 0"
        icon="folder"
        title="No Resources"
        description="This stack has no resources"
      />
      
      <DataTable
        v-else
        :columns="resourceColumns"
        :data="stackResources"
        empty-title="No Resources"
        empty-text="No resources found"
      >
        <template #cell-LogicalResourceId="{ value }">
          <span class="font-medium">{{ value }}</span>
        </template>
        
        <template #cell-PhysicalResourceId="{ value }">
          <code class="text-xs truncate max-w-xs">{{ value || '-' }}</code>
        </template>
        
        <template #cell-ResourceType="{ value }">
          <span class="text-sm">{{ value }}</span>
        </template>
        
        <template #cell-ResourceStatus="{ value }">
          <StatusBadge
            :status="getStatus(value)"
            :label="value"
            size="sm"
          />
        </template>
      </DataTable>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showResourcesModal = false"
          >
            Close
          </Button>
        </div>
      </template>
    </Modal>
    
    <!-- Stack Events Modal -->
    <Modal
      v-model:open="showEventsModal"
      :title="`Events: ${selectedStack?.StackName || ''}`"
      size="lg"
    >
      <LoadingSpinner v-if="eventsLoading" />
      
      <EmptyState
        v-else-if="stackEvents.length === 0"
        icon="folder"
        title="No Events"
        description="No events for this stack"
      />
      
      <DataTable
        v-else
        :columns="eventColumns"
        :data="stackEvents"
        empty-title="No Events"
        empty-text="No events found"
      >
        <template #cell-Timestamp="{ value }">
          <span class="text-xs">{{ formatDate(value) }}</span>
        </template>
        
        <template #cell-LogicalResourceId="{ value }">
          <span class="font-medium text-sm">{{ value }}</span>
        </template>
        
        <template #cell-ResourceType="{ value }">
          <span class="text-sm">{{ value }}</span>
        </template>
        
        <template #cell-ResourceStatus="{ value }">
          <StatusBadge
            :status="getStatus(value)"
            :label="value"
            size="sm"
          />
        </template>
        
        <template #cell-ResourceStatusReason="{ value }">
          <span class="text-xs truncate max-w-xs">{{ value || '-' }}</span>
        </template>
      </DataTable>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showEventsModal = false"
          >
            Close
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model:open="showDeleteModal"
      title="Delete Stack"
      :message="`Are you sure you want to delete stack ${stackToDelete?.StackName}? This action cannot be undone.`"
      confirm-text="Delete"
      @confirm="confirmDeleteStack"
    />
  </div>
</template>
