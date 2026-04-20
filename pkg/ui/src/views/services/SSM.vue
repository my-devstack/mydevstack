<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUIStore } from '@/stores/ui'
import { useContentReload } from '@/composables/useContentReload'
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  EyeIcon,
  KeyIcon,
  BeakerIcon,
} from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import JsonViewer from '@/components/common/JsonViewer.vue'
import * as ssm from '@/api/services/ssm'

// Stores
const settingsStore = useSettingsStore()
const uiStore = useUIStore()
const { reloadTrigger } = useContentReload()

// Types
interface SSMParameterItem {
  Name: string
  Type: 'String' | 'StringList' | 'SecureString'
  Value?: string
  Version?: number
  Tier?: string
  DataType?: string
  Description?: string
  LastModifiedDate?: string
}

interface SSMParameterHistoryItem {
  Name: string
  Type: string
  Value: string
  Version: number
  LastModifiedDate: string
  LastModifiedUser?: string
}

// State
const loading = ref(false)
const parameters = ref<SSMParameterItem[]>([])
const selectedParameter = ref<SSMParameterItem | null>(null)
const parameterHistory = ref<SSMParameterHistoryItem[]>([])
const historyLoading = ref(false)

// Modals
const showCreateModal = ref(false)
const showValueModal = ref(false)
const showHistoryModal = ref(false)
const showDeleteModal = ref(false)

// Form state
const newParamName = ref('')
const newParamValue = ref('')
const newParamType = ref<'String' | 'StringList' | 'SecureString'>('String')
const newParamDescription = ref('')
const getWithDecryption = ref(false)
const parameterToDelete = ref<SSMParameterItem | null>(null)

// Parameter columns
const paramColumns = computed(() => [
  { key: 'Name', label: 'Name', sortable: true },
  { key: 'Type', label: 'Type', sortable: true },
  { key: 'Version', label: 'Version', sortable: true },
  { key: 'Tier', label: 'Tier', sortable: true },
  { key: 'LastModifiedDate', label: 'Modified', sortable: true },
])

// History columns
const historyColumns = computed(() => [
  { key: 'Version', label: 'Version', sortable: true },
  { key: 'Value', label: 'Value', sortable: false },
  { key: 'LastModifiedDate', label: 'Modified', sortable: true },
  { key: 'LastModifiedUser', label: 'Modified By', sortable: false },
])

// Helper functions
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

function getParamTypeStatus(type: string): 'active' | 'pending' | 'inactive' {
  const typeMap: Record<string, 'active' | 'pending' | 'inactive'> = {
    String: 'active',
    StringList: 'active',
    SecureString: 'warning',
  }
  return typeMap[type] || 'inactive'
}

// API calls
async function loadParameters() {
  loading.value = true
  try {
    const result = await ssm.describeParameters()
    parameters.value = result.Parameters || []
  } catch (error) {
    uiStore.notifyError('Error', `Failed to load parameters: ${error}`)
  } finally {
    loading.value = false
  }
}

async function selectParameter(param: SSMParameterItem) {
  selectedParameter.value = param
}

async function getParameterValue(param: SSMParameterItem) {
  selectedParameter.value = param
  showValueModal.value = true
  
  try {
    const result = await ssm.getParameter(param.Name, { WithDecryption: true })
    if (result.Parameter) {
      selectedParameter.value.Value = result.Parameter.Value
    }
  } catch (error) {
    console.error('Failed to load parameter value:', error)
  }
}

async function loadParameterHistory() {
  if (!selectedParameter.value) return
  
  historyLoading.value = true
  showHistoryModal.value = true
  try {
    const result = await ssm.getParameterHistory(selectedParameter.value.Name, {
      WithDecryption: true,
    })
    parameterHistory.value = result.Parameters || (result.Parameter ? [result.Parameter] : [])
  } catch (error) {
    uiStore.notifyError('Error', `Failed to load parameter history: ${error}`)
  } finally {
    historyLoading.value = false
  }
}

async function createParameter() {
  if (!newParamName.value || !newParamValue.value) {
    uiStore.notifyWarning('Validation', 'Name and value are required')
    return
  }

  loading.value = true
  try {
    await ssm.putParameter({
      Name: newParamName.value,
      Value: newParamValue.value,
      Type: newParamType.value,
      Description: newParamDescription.value,
    })
    
    uiStore.notifySuccess('Success', `Parameter ${newParamName.value} created successfully`)
    showCreateModal.value = false
    resetForm()
    await loadParameters()
  } catch (error) {
    uiStore.notifyError('Error', `Failed to create parameter: ${error}`)
  } finally {
    loading.value = false
  }
}

async function updateParameter() {
  if (!selectedParameter.value || !newParamValue.value) {
    uiStore.notifyWarning('Validation', 'Value is required')
    return
  }

  loading.value = true
  try {
    await ssm.putParameter({
      Name: selectedParameter.value.Name,
      Value: newParamValue.value,
      Type: selectedParameter.value.Type,
      Overwrite: true,
    })
    
    uiStore.notifySuccess('Success', `Parameter ${selectedParameter.value.Name} updated successfully`)
    newParamValue.value = ''
    await loadParameters()
    
    const updatedParam = parameters.value.find(p => p.Name === selectedParameter.value.Name)
    if (updatedParam) {
      selectedParameter.value = updatedParam
      await getParameterValue(updatedParam)
    }
  } catch (error) {
    uiStore.notifyError('Error', `Failed to update parameter: ${error}`)
  } finally {
    loading.value = false
  }
}

async function deleteParameter() {
  if (!parameterToDelete.value) return

  loading.value = true
  try {
    await ssm.deleteParameter(parameterToDelete.value.Name)
    uiStore.notifySuccess('Success', `Parameter ${parameterToDelete.value.Name} deleted successfully`)
    
    if (selectedParameter.value?.Name === parameterToDelete.value.Name) {
      selectedParameter.value = null
    }
    
    showDeleteModal.value = false
    parameterToDelete.value = null
    await loadParameters()
  } catch (error) {
    uiStore.notifyError('Error', `Failed to delete parameter: ${error}`)
  } finally {
    loading.value = false
  }
}

function openDeleteModal(param: SSMParameterItem) {
  parameterToDelete.value = param
  showDeleteModal.value = true
}

function resetForm() {
  newParamName.value = ''
  newParamValue.value = ''
  newParamType.value = 'String'
  newParamDescription.value = ''
}

// Lifecycle
onMounted(() => {
  loadParameters()
})

watch(reloadTrigger, () => {
  loadParameters()
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
        <KeyIcon
          class="h-6 w-6"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        />
        <h1
          class="text-xl font-semibold"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Parameter Store
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          :loading="loading"
          @click="loadParameters"
        >
          <ArrowPathIcon class="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          @click="showCreateModal = true"
        >
          <PlusIcon class="h-4 w-4 mr-1" />
          Create Parameter
        </Button>
      </div>
    </div>
    
    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Empty State -->
      <EmptyState
        v-if="!loading && parameters.length === 0"
        icon="folder"
        title="No Parameters"
        description="Create your first parameter to store and manage configuration data."
        @action="showCreateModal = true"
      />
      
      <template v-else>
        <!-- Parameter List -->
        <div class="mb-6">
          <h2
            class="text-lg font-medium mb-4"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Parameters
          </h2>
          
          <DataTable
            :columns="paramColumns"
            :data="parameters"
            :loading="loading"
            selectable
            empty-title="No Parameters"
            empty-text="No parameters found"
            @row-click="selectParameter"
          >
            <template #cell-Name="{ value, row }">
              <div class="flex items-center gap-2">
                <KeyIcon class="h-4 w-4 text-primary-500" />
                <span class="font-medium">{{ value }}</span>
              </div>
            </template>
            
            <template #cell-Type="{ value }">
              <StatusBadge
                :status="getParamTypeStatus(value)"
                :label="value"
                size="sm"
              />
            </template>
            
            <template #cell-Version="{ value }">
              <span class="text-sm">v{{ value || 1 }}</span>
            </template>
            
            <template #cell-Tier="{ value }">
              <span
                class="text-sm capitalize"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                {{ value || 'Standard' }}
              </span>
            </template>
            
            <template #cell-LastModifiedDate="{ value }">
              <span
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                {{ formatDate(value) }}
              </span>
            </template>
            
            <template #row-actions="{ row }">
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="p-1.5 rounded hover:bg-light-border dark:hover:bg-dark-border transition-colors"
                  :class="settingsStore.darkMode ? 'text-dark-muted hover:text-dark-text' : 'text-light-muted hover:text-light-text'"
                  title="View Value"
                  @click.stop="getParameterValue(row)"
                >
                  <EyeIcon class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="p-1.5 rounded hover:bg-light-border dark:hover:bg-dark-border transition-colors"
                  :class="settingsStore.darkMode ? 'text-dark-muted hover:text-dark-text' : 'text-light-muted hover:text-light-text'"
                  title="View History"
                  @click.stop="selectParameter(row); loadParameterHistory()"
                >
                  <ArrowPathIcon class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                  title="Delete"
                  @click.stop="openDeleteModal(row)"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </template>
          </DataTable>
        </div>
        
        <!-- Selected Parameter Details -->
        <div
          v-if="selectedParameter"
          class="p-6 rounded-lg border"
          :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
        >
          <h3
            class="text-lg font-semibold mb-4"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Parameter: {{ selectedParameter.Name }}
          </h3>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Type
              </p>
              <StatusBadge
                :status="getParamTypeStatus(selectedParameter.Type)"
                :label="selectedParameter.Type"
                class="mt-1"
              />
            </div>
            <div>
              <p
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Version
              </p>
              <p
                class="mt-1 font-medium"
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
              >
                {{ selectedParameter.Version || 1 }}
              </p>
            </div>
            <div>
              <p
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Tier
              </p>
              <p
                class="mt-1 font-medium"
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
              >
                {{ selectedParameter.Tier || 'Standard' }}
              </p>
            </div>
            <div>
              <p
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Data Type
              </p>
              <p
                class="mt-1 font-medium"
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
              >
                {{ selectedParameter.DataType || 'text' }}
              </p>
            </div>
          </div>
          
          <div class="mt-4 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              @click="getParameterValue(selectedParameter)"
            >
              <EyeIcon class="h-4 w-4 mr-1" />
              View Value
            </Button>
            <Button
              variant="secondary"
              size="sm"
              @click="loadParameterHistory"
            >
              <ArrowPathIcon class="h-4 w-4 mr-1" />
              View History
            </Button>
          </div>
        </div>
      </template>
    </div>
    
    <!-- Create Parameter Modal -->
    <Modal
      v-model:open="showCreateModal"
      title="Create Parameter"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newParamName"
          label="Name"
          placeholder="/my-app/feature-flag"
          required
          help-text="Use a path-like structure for organization (e.g., /app/env/var)"
        />
        
        <FormSelect
          v-model="newParamType"
          label="Type"
          :options="[
            { value: 'String', label: 'String - Plain text value' },
            { value: 'StringList', label: 'StringList - Comma-separated list' },
            { value: 'SecureString', label: 'SecureString - Encrypted value' },
          ]"
        />
        
        <div>
          <label
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Value
          </label>
          <textarea
            v-model="newParamValue"
            class="w-full h-24 px-3 py-2 rounded-lg border bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            placeholder="Enter parameter value"
            required
          />
        </div>
        
        <FormInput
          v-model="newParamDescription"
          label="Description"
          placeholder="Optional description"
        />
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
            @click="createParameter"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>
    
    <!-- View Value Modal -->
    <Modal
      v-model:open="showValueModal"
      :title="`Parameter: ${selectedParameter?.Name || ''}`"
      size="md"
    >
      <div
        v-if="selectedParameter"
        class="space-y-4"
      >
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p
              class="text-sm"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              Type
            </p>
            <StatusBadge
              :status="getParamTypeStatus(selectedParameter.Type)"
              :label="selectedParameter.Type"
              class="mt-1"
            />
          </div>
          <div>
            <p
              class="text-sm"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              Version
            </p>
            <p
              class="mt-1 font-medium"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              {{ selectedParameter.Version || 1 }}
            </p>
          </div>
        </div>
        
        <div>
          <p
            class="text-sm mb-2"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            Value
          </p>
          <div 
            class="p-4 rounded-lg border font-mono text-sm break-all"
            :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-light-bg border-light-border text-light-text'"
          >
            {{ selectedParameter.Value || '(Value not loaded)' }}
          </div>
        </div>
        
        <div v-if="selectedParameter.Description">
          <p
            class="text-sm"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            Description
          </p>
          <p
            class="mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ selectedParameter.Description }}
          </p>
        </div>
        
        <!-- Update Value Form -->
        <div class="border-t pt-4 mt-4">
          <p
            class="text-sm font-medium mb-2"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Update Value
          </p>
          <textarea
            v-model="newParamValue"
            class="w-full h-24 px-3 py-2 rounded-lg border bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            placeholder="New value"
          />
          <Button
            class="mt-2"
            size="sm"
            :loading="loading"
            @click="updateParameter"
          >
            Update
          </Button>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showValueModal = false"
          >
            Close
          </Button>
        </div>
      </template>
    </Modal>
    
    <!-- Parameter History Modal -->
    <Modal
      v-model:open="showHistoryModal"
      :title="`History: ${selectedParameter?.Name || ''}`"
      size="lg"
    >
      <LoadingSpinner v-if="historyLoading" />
      
      <EmptyState
        v-else-if="parameterHistory.length === 0"
        icon="folder"
        title="No History"
        description="No version history for this parameter"
      />
      
      <DataTable
        v-else
        :columns="historyColumns"
        :data="parameterHistory"
        empty-title="No History"
        empty-text="No history found"
      >
        <template #cell-Version="{ value }">
          <span class="font-medium">v{{ value }}</span>
        </template>
        
        <template #cell-Value="{ value }">
          <code class="text-xs truncate max-w-xs block">{{ value }}</code>
        </template>
        
        <template #cell-LastModifiedDate="{ value }">
          <span class="text-sm">{{ formatDate(value) }}</span>
        </template>
        
        <template #cell-LastModifiedUser="{ value }">
          <span class="text-sm">{{ value || 'System' }}</span>
        </template>
      </DataTable>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showHistoryModal = false"
          >
            Close
          </Button>
        </div>
      </template>
    </Modal>
    
    <!-- Delete Confirmation Modal -->
    <Modal
      v-model:open="showDeleteModal"
      title="Delete Parameter"
      size="sm"
    >
      <p :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
        Are you sure you want to delete parameter 
        <strong>{{ parameterToDelete?.Name }}</strong>?
        This action cannot be undone.
      </p>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showDeleteModal = false"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            :loading="loading"
            @click="deleteParameter"
          >
            Delete
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
