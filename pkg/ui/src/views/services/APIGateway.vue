<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CodeBracketSquareIcon } from '@heroicons/vue/24/outline'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Tabs from '@/components/common/Tabs.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import * as apigateway from '@/api/services/api-gateway'

import APIGatewayRestApisList from '@/components/apiGateway/APIGatewayRestApisList.vue'
import APIGatewayHttpApisList from '@/components/apiGateway/APIGatewayHttpApisList.vue'
import APIGatewayCreateModal from '@/components/apiGateway/APIGatewayCreateModal.vue'
import APIGatewayDeleteModal from '@/components/apiGateway/APIGatewayDeleteModal.vue'
import APIGatewayInvokeUrlModal from '@/components/apiGateway/APIGatewayInvokeUrlModal.vue'
import APIGatewayCodeExamples from '@/components/apiGateway/APIGatewayCodeExamples.vue'

const settingsStore = useSettingsStore()

const restApis = ref<any[]>([])
const httpApis = ref<any[]>([])
const loading = ref(false)
const expandedApis = ref<Set<string>>(new Set())
const expandedHttpApis = ref<Set<string>>(new Set())

function toggleApiExpansion(apiId: string) {
  const newSet = new Set(expandedApis.value)
  if (newSet.has(apiId)) {
    newSet.delete(apiId)
  } else {
    newSet.add(apiId)
  }
  expandedApis.value = newSet
}

function toggleHttpApiExpansion(apiId: string) {
  const newSet = new Set(expandedHttpApis.value)
  if (newSet.has(apiId)) {
    newSet.delete(apiId)
  } else {
    newSet.add(apiId)
  }
  expandedHttpApis.value = newSet
}

async function loadRestApis() {
  loading.value = true
  try {
    const result = await apigateway.getRestApis()
    restApis.value = result?.items || result?.Items || []
  } catch (e) {
    console.error('Error loading REST APIs:', e)
  } finally {
    loading.value = false
  }
}

async function loadHttpApis() {
  loading.value = true
  try {
    const result = await apigateway.getHttpApis()
    httpApis.value = result?.items || result?.Items || []
  } catch (e) {
    console.error('Error loading HTTP APIs:', e)
  } finally {
    loading.value = false
  }
}

async function createRestApi(name: string, desc?: string) {
  await apigateway.createRestApi(name, { Description: desc })
}

async function createHttpApi(name: string, desc?: string) {
  await apigateway.createHttpApi({ name, description: desc })
}

const activeTab = ref<'rest' | 'http'>('rest')
const isLoading = computed(() => loading.value)

const tabs = [
  { id: 'rest', label: 'REST APIs' },
  { id: 'http', label: 'HTTP APIs' },
]

const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const showInvokeUrlModal = ref(false)
const selectedApi = ref<any>(null)
const apiToDelete = ref<any>(null)
const invokeUrl = ref('')

onMounted(() => {
  loadRestApis()
  loadHttpApis()
})

function handleTabChange(tabId: string) {
  activeTab.value = tabId as 'rest' | 'http'
  if (tabId === 'rest' && restApis.value.length === 0) {
    loadRestApis()
  } else if (tabId === 'http' && httpApis.value.length === 0) {
    loadHttpApis()
  }
}

function handleCreateApi() {
  selectedApi.value = null
  showCreateModal.value = true
}

function handleViewApi(api: any) {
  selectedApi.value = api
  // Show API details - for now just open create modal in view mode
  showCreateModal.value = true
}

function handleEditApi(api: any) {
  selectedApi.value = api
  showCreateModal.value = true
}

function handleDeleteApi(api: any) {
  apiToDelete.value = api
  showDeleteModal.value = true
}

async function confirmDeleteApi() {
  if (activeTab.value === 'rest' && apiToDelete.value) {
    await apigateway.deleteRestApi(apiToDelete.value.id)
  } else if (apiToDelete.value) {
    await apigateway.deleteHttpApi(apiToDelete.value.apiId || apiToDelete.value.id)
  }
  showDeleteModal.value = false
  if (activeTab.value === 'rest') {
    await loadRestApis()
  } else {
    await loadHttpApis()
  }
}

function handleGetInvokeUrl(api: any) {
  selectedApi.value = api
  showInvokeUrlModal.value = true
}

function handleCreateResource(api: any) {
  selectedApi.value = api
  showCreateModal.value = true
}

function handleDeleteHttpApi(api: any) {
  apiToDelete.value = api
  showDeleteModal.value = true
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <CodeBracketSquareIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            API Gateway
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ activeTab === 'rest' ? restApis.length : httpApis.length }} API(s)
          </span>
        </div>
        
        <div class="flex items-center gap-2">
          <button
            class="p-2 text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border rounded"
            title="Refresh"
            @click="activeTab === 'rest' ? loadRestApis() : loadHttpApis()"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            @click="handleCreateApi"
          >
            + Create {{ activeTab === 'rest' ? 'REST API' : 'HTTP API' }}
          </button>
        </div>
      </div>
    </div>

    <Tabs
      :tabs="tabs"
      :active-tab="activeTab"
      @update:active-tab="handleTabChange"
    />

    <LoadingSpinner v-if="isLoading" />

    <template v-else>
      <APIGatewayRestApisList
        v-if="activeTab === 'rest'"
        :apis="restApis"
        :resources="[]"
        :loading="loading"
        :expanded-apis="expandedApis"
        :expanded-resources="new Set()"
        :resource-methods-map="{}"
        :resource-methods-loading="{}"
        @toggle-api="toggleApiExpansion"
        @view-api="handleViewApi"
        @edit-api="handleEditApi"
        @delete-api="handleDeleteApi"
        @get-invoke-url="handleGetInvokeUrl"
        @create-resource="handleCreateResource"
      />

      <APIGatewayHttpApisList
        v-if="activeTab === 'http'"
        :apis="httpApis"
        :loading="loading"
        :expanded-apis="expandedHttpApis"
        @toggle-api="toggleHttpApiExpansion"
        @delete-api="handleDeleteHttpApi"
      />
    </template>

    <!-- Delete Modal -->
    <Modal
      :open="showDeleteModal"
      title="Confirm Delete"
      @close="showDeleteModal = false"
    >
      <p>Are you sure you want to delete <strong>{{ apiToDelete?.name }}</strong>?</p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <button
            class="px-4 py-2 rounded border"
            @click="showDeleteModal = false"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
            @click="confirmDeleteApi"
          >
            Delete
          </button>
        </div>
      </template>
    </Modal>

    <!-- Invoke URL Modal -->
    <Modal
      :open="showInvokeUrlModal"
      title="Invoke URL"
      @close="showInvokeUrlModal = false"
    >
      <div class="space-y-4">
        <p>Selected API: <strong>{{ selectedApi?.name }}</strong></p>
        <p class="text-sm text-gray-500">
          Select a stage to get the invoke URL
        </p>
      </div>
    </Modal>

    <APIGatewayCodeExamples
      :region="settingsStore.region"
      :access-key="settingsStore.accessKey"
      :secret-key="settingsStore.secretKey"
      :active-tab="activeTab"
    />

    <Modal
      :open="showCreateModal"
      :title="selectedApi ? 'API Details' : 'Create API'"
      @close="showCreateModal = false"
    >
      <APIGatewayCreateModal
        :open="showCreateModal"
        :type="activeTab"
        @create-rest="async (name, desc) => {
          await createRestApi(name, desc)
          showCreateModal = false
          await loadRestApis()
        }"
        @create-http="async (name, desc) => {
          await createHttpApi(name, desc)
          showCreateModal = false
          await loadHttpApis()
        }"
        @close="showCreateModal = false"
      />
    </Modal>
  </div>
</template>