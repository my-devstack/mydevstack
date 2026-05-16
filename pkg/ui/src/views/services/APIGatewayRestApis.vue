<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { usePagination } from '@/composables/usePagination'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import * as apigateway from '@/api/services/api-gateway'
import { listFunctions } from '@/api/services/lambda'

import APIGatewayRestApisList from '@/components/apiGateway/APIGatewayRestApisList.vue'
import APIGatewayResourceModal from '@/components/apiGateway/APIGatewayResourceModal.vue'
import APIGatewayMethodModal from '@/components/apiGateway/APIGatewayMethodModal.vue'
import APIGatewayIntegrationModal from '@/components/apiGateway/APIGatewayIntegrationModal.vue'
import APIGatewayIntegrationDetailsModal from '@/components/apiGateway/APIGatewayIntegrationDetailsModal.vue'
import APIGatewayStageModal from '@/components/apiGateway/APIGatewayStageModal.vue'
import APIGatewayDeploymentsModal from '@/components/apiGateway/APIGatewayDeploymentsModal.vue'

const emit = defineEmits<{
  'edit-api': [api: any]
  'get-invoke-url': [api: any]
}>()

const settingsStore = useSettingsStore()
const toast = useToast()

const apis = ref<any[]>([])
const resources = ref<any[]>([])
const deployments = ref<any[]>([])
const stages = ref<any[]>([])
const expandedApis = ref<Set<string>>(new Set())
const expandedResources = ref<Set<string>>(new Set())
const resourceMethodsMap = ref<Record<string, Record<string, any>>>({})
const resourceMethodsLoading = ref<Record<string, boolean>>({})

const selectedApi = ref<any>(null)
const selectedResource = ref<any>(null)
const selectedMethod = ref<any>(null)
const selectedIntegration = ref<any>(null)

const showResourceModal = ref(false)
const showMethodModal = ref(false)
const showIntegrationModal = ref(false)
const showIntegrationDetailsModal = ref(false)
const showStageModal = ref(false)
const showDeploymentModal = ref(false)
const showDeleteModal = ref(false)
const apiToDelete = ref<any>(null)

const lambdaFunctions = ref<any[]>([])

// Pagination
const {
  currentPage: restApiPage,
  itemsPerPage: restApisPerPage,
  totalPages: totalRestApiPages,
  paginatedItems: paginatedRestApis,
  goToPage: goToRestApiPage,
  perPageOptions,
} = usePagination(apis, { defaultPerPage: 10 })

onMounted(async () => {
  await loadApis()
})

async function loadApis() {
  try {
    const result = await apigateway.getRestApis()
    apis.value = result?.items || result?.Items || []
  } catch (e) {
    console.error('Error loading REST APIs:', e)
    toast.error('Failed to load REST APIs')
  }
  try {
    lambdaFunctions.value = await listFunctions()
  } catch (e) {
    console.error('Error loading Lambda functions:', e)
  }
}

async function loadResourcesForApi(apiId: string) {
  selectedApi.value = apis.value.find(a => a.id === apiId)
  try {
    const [res, deps, sts] = await Promise.all([
      apigateway.getResources(apiId),
      apigateway.getDeployments(apiId),
      apigateway.getStages(apiId)
    ])
    resources.value = res?.items || []
    deployments.value = deps?.items || []
    stages.value = sts?.items || []
  } catch (e) {
    console.error('Error loading REST API details:', e)
  }
}

async function loadMethodsForResource(resourceId: string) {
  if (!selectedApi.value) return
  resourceMethodsLoading.value[resourceId] = true
  
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
  const methodMap: Record<string, any> = {}
  
  for (const method of methods) {
    try {
      const result = await apigateway.getMethod(selectedApi.value.id, resourceId, method)
      if (result && (result.httpMethod || result.HttpMethod)) {
        const m = result.httpMethod || result.HttpMethod
        methodMap[m] = result
      }
    } catch {
      // Method doesn't exist
    }
  }
  
  const possibleMethods = Object.keys(methodMap).length > 0 ? Object.keys(methodMap) : methods
  for (const m of possibleMethods) {
    try {
      const integration = await apigateway.getIntegration(selectedApi.value.id, resourceId, m)
      if (integration && (integration.type || integration.Type || integration.uri || integration.Uri)) {
        methodMap[m] = { ...methodMap[m], ...integration }
      }
    } catch {
      // Integration doesn't exist
    }
  }
  
  resourceMethodsMap.value[resourceId] = methodMap
  resourceMethodsLoading.value[resourceId] = false
}

function toggleApiExpansion(apiId: string) {
  const newSet = new Set(expandedApis.value)
  if (newSet.has(apiId)) {
    newSet.delete(apiId)
  } else {
    newSet.clear()
    newSet.add(apiId)
    loadResourcesForApi(apiId)
  }
  expandedApis.value = newSet
}

function toggleResourceExpansion(resourceId: string) {
  const newSet = new Set(expandedResources.value)
  if (newSet.has(resourceId)) {
    newSet.delete(resourceId)
  } else {
    newSet.add(resourceId)
    loadMethodsForResource(resourceId)
  }
  expandedResources.value = newSet
}

function handleCreateResource(api: any, resource?: any) {
  selectedApi.value = api
  selectedResource.value = resource || { id: resources.value[0]?.id }
  showResourceModal.value = true
}

async function confirmCreateResource(resourcePath: string) {
  if (!selectedApi.value || !selectedResource.value) return
  await apigateway.createResource(
    selectedApi.value.id, 
    selectedResource.value.id,
    resourcePath
  )
  toast.success('Resource created successfully')
  showResourceModal.value = false
  await loadResourcesForApi(selectedApi.value.id)
}

function handleAddMethod(resource: any, api: any) {
  selectedApi.value = api
  selectedResource.value = resource
  showMethodModal.value = true
}

async function confirmCreateMethod(resourceId: string, httpMethod: string, authType: string) {
  if (!selectedApi.value || !resourceId) return
  await apigateway.createMethod(selectedApi.value.id, resourceId, httpMethod, { AuthorizationType: authType })
  toast.success(`Method ${httpMethod} created successfully`)
  showMethodModal.value = false
}

function handleSetupIntegration(method: any, resource: any) {
  selectedMethod.value = method
  selectedResource.value = resource
  showIntegrationModal.value = true
}

function handleViewIntegration(method: any, resource: any, integration: any) {
  selectedMethod.value = method
  selectedResource.value = resource
  selectedIntegration.value = integration
  showIntegrationDetailsModal.value = true
}

async function confirmSetupIntegration(integrationType: string, integrationHttpMethod: string, uri: string) {
  if (!selectedApi.value || !selectedResource.value || !selectedMethod.value) return
  await apigateway.putIntegration(
    selectedApi.value.id,
    selectedResource.value.id,
    selectedMethod.value,
    { type: integrationType, integrationHttpMethod, uri }
  )
  toast.success('Integration saved successfully')
  showIntegrationModal.value = false
  await loadMethodsForResource(selectedResource.value.id)
}

function handleCreateDeployment(api: any) {
  selectedApi.value = api
  showDeploymentModal.value = true
}

async function confirmCreateDeployment(stageName: string, description: string) {
  if (!selectedApi.value) return
  await apigateway.createDeployment(selectedApi.value.id, { stageName, Description: description })
  toast.success('Deployment created successfully')
  showDeploymentModal.value = false
  await loadResourcesForApi(selectedApi.value.id)
}

async function handleDeleteDeployment(deployment: any) {
  if (!selectedApi.value) return
  try {
    await apigateway.deleteDeployment(selectedApi.value.id, deployment.id)
    toast.success('Deployment deleted')
  } catch (e: any) {
    toast.error(e?.message || 'Failed to delete deployment')
  }
  await loadResourcesForApi(selectedApi.value.id)
}

async function handleDeleteStage(stage: any) {
  if (!selectedApi.value) return
  try {
    await apigateway.deleteStage(selectedApi.value.id, stage.stageName)
    toast.success('Stage deleted')
  } catch (e: any) {
    toast.error(e?.message || 'Failed to delete stage')
  }
  await loadResourcesForApi(selectedApi.value.id)
}

function handleCreateStage(api: any) {
  selectedApi.value = api
  showStageModal.value = true
}

async function confirmCreateStage(stageName: string, stageDescriptionOrDeploymentId?: string) {
  if (!selectedApi.value) return
  // For REST API, use the deployments to find a deploymentId or use latest
  const deploymentId = deployments.value[0]?.deploymentId || deployments.value[0]?.id || ''
  const stageDescription = stageDescriptionOrDeploymentId || ''
  await apigateway.createStage(selectedApi.value.id, deploymentId, stageName, stageDescription)
  toast.success('Stage created successfully')
  showDeploymentModal.value = false
  showStageModal.value = false
  await loadResourcesForApi(selectedApi.value.id)
}

async function handleDeleteResource(resource: any) {
  if (!selectedApi.value) return
  await apigateway.deleteResource(selectedApi.value.id, resource.id)
  toast.success('Resource deleted')
  await loadResourcesForApi(selectedApi.value.id)
}

async function handleDeleteMethod(method: string, resource: any) {
  if (!selectedApi.value) return
  await apigateway.deleteMethod(selectedApi.value.id, resource.id, method)
  toast.success('Method deleted')
  await loadMethodsForResource(resource.id)
}

function handleViewApi(api: any) {
  selectedApi.value = api
  selectedResource.value = null
  toggleApiExpansion(api.id)
}

function handleEditApi(api: any) {
  emit('edit-api', api)
}

function handleDeleteApi(api: any) {
  apiToDelete.value = api
  showDeleteModal.value = true
}

async function confirmDeleteApi() {
  if (apiToDelete.value) {
    await apigateway.deleteRestApi(apiToDelete.value.id)
    toast.success('REST API deleted')
    showDeleteModal.value = false
    await loadApis()
  }
}

function handleGetInvokeUrl(api: any) {
  emit('get-invoke-url', api)
}

const confirmDeleteDeployment = async (deployment: any) => {
  await handleDeleteDeployment(deployment)
}

const confirmDeleteStage = async (stage: any) => {
  await handleDeleteStage(stage)
}

defineExpose({
  loadApis,
  apis,
  resources,
  deployments,
  stages
})
</script>

<template>
  <APIGatewayRestApisList
    :apis="paginatedRestApis"
    :resources="resources"
    :loading-resources="false"
    :expanded-apis="expandedApis"
    :expanded-resources="expandedResources"
    :resource-methods-map="resourceMethodsMap"
    :resource-methods-loading="resourceMethodsLoading"
    :deployments="deployments"
    :stages="stages"
    @toggle-api="toggleApiExpansion"
    @toggle-resource="toggleResourceExpansion"
    @view-api="handleViewApi"
    @edit-api="handleEditApi"
    @delete-api="handleDeleteApi"
    @get-invoke-url="handleGetInvokeUrl"
    @create-resource="handleCreateResource"
    @add-method="handleAddMethod"
    @delete-resource="handleDeleteResource"
    @setup-integration="handleSetupIntegration"
    @view-integration="handleViewIntegration"
    @delete-method="handleDeleteMethod"
    @create-deployment="handleCreateDeployment"
    @delete-deployment="confirmDeleteDeployment"
    @create-stage="handleCreateStage"
    @delete-stage="confirmDeleteStage"
  />

  <!-- Pagination -->
  <div
    v-if="apis.length > 0"
    class="flex flex-wrap items-center justify-between gap-4 py-4"
  >
    <div class="flex items-center gap-2">
      <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
      <select
        v-model="restApisPerPage"
        class="text-sm border rounded px-2 py-1"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
      >
        <option
          v-for="opt in perPageOptions"
          :key="opt"
          :value="opt"
        >
          {{ opt }}
        </option>
      </select>
      <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
    </div>

    <div
      v-if="totalRestApiPages > 1"
      class="flex items-center gap-2"
    >
      <button
        class="px-3 py-1 rounded border disabled:opacity-50"
        :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
        :disabled="restApiPage === 1"
        @click="goToRestApiPage(restApiPage - 1)"
      >
        Previous
      </button>
      <span
        class="text-sm"
        :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
      >
        Page {{ restApiPage }} of {{ totalRestApiPages }}
      </span>
      <button
        class="px-3 py-1 rounded border disabled:opacity-50"
        :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
        :disabled="restApiPage === totalRestApiPages"
        @click="goToRestApiPage(restApiPage + 1)"
      >
        Next
      </button>
    </div>
  </div>

  <!-- Resource Modal -->
  <APIGatewayResourceModal
    v-if="showResourceModal"
    :open="showResourceModal"
    :parent-id="selectedResource?.id"
    @create="confirmCreateResource"
    @close="showResourceModal = false"
    @update:open="showResourceModal = $event"
  />

  <!-- Method Modal -->
  <APIGatewayMethodModal
    v-if="showMethodModal"
    :open="showMethodModal"
    :resources="resources"
    @create="confirmCreateMethod"
    @close="showMethodModal = false"
    @update:open="showMethodModal = $event"
  />

  <!-- Integration Modal -->
  <APIGatewayIntegrationModal
    v-if="showIntegrationModal"
    :open="showIntegrationModal"
    type="rest"
    :lambda-functions="lambdaFunctions"
    @create="confirmSetupIntegration"
    @close="showIntegrationModal = false"
    @update:open="showIntegrationModal = $event"
  />

  <!-- Integration Details Modal -->
  <APIGatewayIntegrationDetailsModal
    v-if="showIntegrationDetailsModal"
    :open="showIntegrationDetailsModal"
    :integration-data="selectedIntegration"
    @close="showIntegrationDetailsModal = false"
    @update:open="showIntegrationDetailsModal = $event"
  />

  <!-- Stage Modal -->
  <APIGatewayStageModal
    v-if="showStageModal"
    :open="showStageModal"
    :type="'rest'"
    :deployments="deployments"
    @create-rest="confirmCreateStage"
    @close="showStageModal = false"
    @update:open="showStageModal = $event"
  />

  <!-- Deployment Modal -->
  <APIGatewayDeploymentsModal
    v-if="showDeploymentModal"
    :open="showDeploymentModal"
    :api-id="selectedApi?.id"
    :api-name="selectedApi?.name"
    :deployments="deployments"
    :stages="stages"
    @create-deployment="confirmCreateDeployment"
    @create-stage="confirmCreateStage"
    @delete-deployment="handleDeleteDeployment"
    @close="showDeploymentModal = false"
    @update:open="showDeploymentModal = $event"
  />

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
</template>
