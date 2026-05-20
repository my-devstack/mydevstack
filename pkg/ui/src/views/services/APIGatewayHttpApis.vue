<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { usePagination } from '@/composables/usePagination'
import { useSettingsStore } from '@/stores/settings'
import * as apigateway from '@/api/services/api-gateway'
import * as lambda from '@/api/services/lambda'

import APIGatewayHttpApisList from '@/components/apiGateway/APIGatewayHttpApisList.vue'
import APIGatewayIntegrationModal from '@/components/apiGateway/APIGatewayIntegrationModal.vue'
import APIGatewayRouteModal from '@/components/apiGateway/APIGatewayRouteModal.vue'
import APIGatewayStageModal from '@/components/apiGateway/APIGatewayStageModal.vue'
import APIGatewayEditRouteModal from '@/components/apiGateway/APIGatewayEditRouteModal.vue'
import APIGatewayEditStageModal from '@/components/apiGateway/APIGatewayEditStageModal.vue'
import Modal from '@/components/common/Modal.vue'

const emit = defineEmits<{
  'update:loading': [value: boolean]
  'delete-api': [api: any]
  'view-api': [api: any]
  'get-invoke-url': [api: any]
  'edit-api': [api: any]
}>()

const settingsStore = useSettingsStore()
const toast = useToast()

const loading = ref(false)
const apis = ref<any[]>([])
const stages = ref<Record<string, any[]>>({})
const routes = ref<Record<string, any[]>>({})
const integrations = ref<Record<string, any[]>>({})
const routeTargets = ref<Record<string, Record<string, string>>>({})
const expandedApis = ref<Set<string>>(new Set())

const lambdaFunctions = ref<any[]>([])
const lambdaLoading = ref(false)

// Pagination
const {
  currentPage: httpApiPage,
  itemsPerPage: httpApisPerPage,
  totalPages: totalHttpApiPages,
  paginatedItems: paginatedHttpApis,
  goToPage: goToHttpApiPage,
  perPageOptions,
} = usePagination(apis, { defaultPerPage: 10 })

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedApi = ref<any>(null)
const apiToDelete = ref<any>(null)

const showIntegrationModal = ref(false)
const showRouteModal = ref(false)
const showStageModal = ref(false)
const showEditRouteModal = ref(false)
const showEditStageModal = ref(false)

const integrationToEdit = ref<any>(null)
const routeToEdit = ref<any>(null)
const stageToEdit = ref<any>(null)

onMounted(async () => {
  await loadApis()
  await loadLambdaFunctions()
})

async function loadLambdaFunctions() {
  lambdaLoading.value = true
  try {
    const result = await lambda.listFunctions()
    lambdaFunctions.value = result?.Functions || result?.functions || []
  } catch (e) {
    console.error('Error loading Lambda functions:', e)
  } finally {
    lambdaLoading.value = false
  }
}

async function loadApis() {
  loading.value = true
  try {
    const result = await apigateway.getHttpApis()
    apis.value = result?.items || result?.Items || []
  } catch (e) {
    console.error('Error loading APIs:', e)
    toast.error('Failed to load APIs')
  } finally {
    loading.value = false
  }
}

async function loadDetailsForApi(apiId: string) {
  try {
    const [stg, rts, ints] = await Promise.all([
      apigateway.getHttpApiStages(apiId),
      apigateway.getHttpRoutes(apiId),
      apigateway.getHttpIntegrations(apiId),
    ])
    stages.value[apiId] = stg?.items || stg?.Items || []
    routes.value[apiId] = rts?.items || rts?.Items || []
    integrations.value[apiId] = ints?.items || ints?.Items || []
    
    const targets: Record<string, string> = {}
    if (rts?.items) {
      for (const route of rts.items) {
        targets[route.routeId] = route.target || route.Target || '-'
      }
    }
    routeTargets.value[apiId] = targets
  } catch (e) {
    console.error('Error loading HTTP API details:', e)
  }
}

function toggleApiExpansion(apiId: string) {
  const newSet = new Set(expandedApis.value)
  if (newSet.has(apiId)) {
    newSet.delete(apiId)
  } else {
    newSet.clear()
    newSet.add(apiId)
    loadDetailsForApi(apiId)
  }
  expandedApis.value = newSet
}

function handleDeleteApi(api: any) {
  apiToDelete.value = api
  showDeleteModal.value = true
}

function confirmDeleteApi() {
  if (apiToDelete.value) {
    apigateway.deleteHttpApi(apiToDelete.value.apiId).then(() => {
      toast.success('HTTP API deleted')
      showDeleteModal.value = false
      loadApis()
    }).catch((e: any) => {
      toast.error(e?.message || 'Failed to delete HTTP API')
    })
  }
}

function handleViewApi(api: any) {
  toggleApiExpansion(api.apiId)
}

function handleGetInvokeUrl(api: any) {
  emit('get-invoke-url', api)
}

function handleEditApi(api: any) {
  selectedApi.value = api
  showEditModal.value = true
}

function handleCreateIntegration(api: any) {
  selectedApi.value = api
  integrationToEdit.value = null
  showIntegrationModal.value = true
}

function handleEditIntegration(integration: any) {
  integrationToEdit.value = integration
  showIntegrationModal.value = true
}

function handleCreateRoute(api: any) {
  selectedApi.value = api
  showRouteModal.value = true
}

function handleCreateStage(api: any) {
  selectedApi.value = api
  showStageModal.value = true
}

function handleEditRoute(route: any, apiId: string) {
  selectedApi.value = { apiId }
  routeToEdit.value = route
  showEditRouteModal.value = true
}

function handleEditStage(stage: any, apiId: string) {
  selectedApi.value = { apiId }
  stageToEdit.value = stage
  showEditStageModal.value = true
}

async function confirmCreateIntegration(integrationType: string, httpMethod: string, uri: string, mappingTemplate?: string) {
  if (!selectedApi.value) return
  try {
    const options: any = {
      integrationType,
      integrationMethod: httpMethod,
      integrationUri: uri,
    }
    if (mappingTemplate && (integrationType === 'AWS' || integrationType === 'HTTP')) {
      options.requestTemplates = { 'application/json': mappingTemplate }
    }
    await apigateway.createHttpIntegration(selectedApi.value.apiId, options)
    toast.success('Integration created successfully')
    showIntegrationModal.value = false
    await loadDetailsForApi(selectedApi.value.apiId)
  } catch (e: any) {
    toast.error(e?.message || 'Failed to create integration')
  }
}

async function confirmUpdateIntegration(integrationType: string, httpMethod: string, uri: string, payloadFormat: string, mappingTemplate?: string) {
  if (!selectedApi.value || !integrationToEdit.value) return
  try {
    const options: any = {
      integrationType,
      integrationUri: uri,
    }
    if (mappingTemplate && (integrationType === 'AWS' || integrationType === 'HTTP')) {
      options.requestTemplates = { 'application/json': mappingTemplate }
    }
    await apigateway.updateHttpIntegration(selectedApi.value.apiId, integrationToEdit.value.integrationId, options)
    toast.success('Integration updated successfully')
    showIntegrationModal.value = false
    await loadDetailsForApi(selectedApi.value.apiId)
  } catch (e: any) {
    toast.error(e?.message || 'Failed to update integration')
  }
}

async function confirmCreateRoute(routeKey: string, target: string) {
  if (!selectedApi.value) return
  try {
    await apigateway.createHttpRoute(selectedApi.value.apiId, { routeKey, target })
    toast.success('Route created successfully')
    showRouteModal.value = false
    await loadDetailsForApi(selectedApi.value.apiId)
  } catch (e: any) {
    toast.error(e?.message || 'Failed to create route')
  }
}

async function confirmCreateStage(stageName: string, options: any) {
  if (!selectedApi.value) return
  try {
    await apigateway.createHttpApiStage(selectedApi.value.apiId, { stageName, ...options })
    toast.success('Stage created successfully')
    showStageModal.value = false
    await loadDetailsForApi(selectedApi.value.apiId)
  } catch (e: any) {
    toast.error(e?.message || 'Failed to create stage')
  }
}

async function confirmUpdateRoute(routeKey: string, authorizationType: string, authorizerId: string) {
  if (!selectedApi.value || !routeToEdit.value) return
  try {
    await apigateway.updateHttpRoute(selectedApi.value.apiId, routeToEdit.value.routeId, { routeKey, authorizationType, authorizerId })
    toast.success('Route updated successfully')
    showEditRouteModal.value = false
    await loadDetailsForApi(selectedApi.value.apiId)
  } catch (e: any) {
    toast.error(e?.message || 'Failed to update route')
  }
}

async function confirmUpdateStage(description: string, autoDeploy: boolean) {
  if (!selectedApi.value || !stageToEdit.value) return
  try {
    await apigateway.updateHttpApiStage(selectedApi.value.apiId, stageToEdit.value.stageName, { description, autoDeploy })
    toast.success('Stage updated successfully')
    showEditStageModal.value = false
    await loadDetailsForApi(selectedApi.value.apiId)
  } catch (e: any) {
    toast.error(e?.message || 'Failed to update stage')
  }
}

async function handleDeleteRoute(route: any) {
  if (!selectedApi.value) return
  try {
    await apigateway.deleteHttpRoute(selectedApi.value.apiId, route.routeId)
    toast.success('Route deleted')
    await loadDetailsForApi(selectedApi.value.apiId)
  } catch (e: any) {
    toast.error(e?.message || 'Failed to delete route')
  }
}

async function handleDeleteIntegration(integration: any) {
  if (!selectedApi.value) return
  try {
    await apigateway.deleteHttpApiIntegration(selectedApi.value.apiId, integration.integrationId)
    toast.success('Integration deleted')
    await loadDetailsForApi(selectedApi.value.apiId)
  } catch (e: any) {
    toast.error(e?.message || 'Failed to delete integration')
  }
}

async function handleDeleteStage(stage: any) {
  if (!selectedApi.value) return
  try {
    await apigateway.deleteHttpApiStage(selectedApi.value.apiId, stage.stageName)
    toast.success('Stage deleted')
    await loadDetailsForApi(selectedApi.value.apiId)
  } catch (e: any) {
    toast.error(e?.message || 'Failed to delete stage')
  }
}

defineExpose({
  loadApis,
  apis
})
</script>

<template>
  <APIGatewayHttpApisList
    :apis="paginatedHttpApis"
    :loading="loading"
    :expanded-apis="expandedApis"
    :stages="stages"
    :routes="routes"
    :route-targets="routeTargets"
    :integrations="integrations"
    @toggle-api="toggleApiExpansion"
    @view-api="handleViewApi"
    @delete-api="handleDeleteApi"
    @get-invoke-url="handleGetInvokeUrl"
    @edit-api="handleEditApi"
    @create-integration="handleCreateIntegration"
    @edit-integration="handleEditIntegration"
    @delete-integration="handleDeleteIntegration"
    @create-route="handleCreateRoute"
    @edit-route="handleEditRoute"
    @delete-route="handleDeleteRoute"
    @create-stage="handleCreateStage"
    @edit-stage="handleEditStage"
    @delete-stage="handleDeleteStage"
  />

  <!-- Pagination -->
  <div
    v-if="apis.length > 0"
    class="flex flex-wrap items-center justify-between gap-4 py-4"
  >
    <div class="flex items-center gap-2">
      <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
      <select
        v-model="httpApisPerPage"
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
      v-if="totalHttpApiPages > 1"
      class="flex items-center gap-2"
    >
      <button
        class="px-3 py-1 rounded border disabled:opacity-50"
        :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
        :disabled="httpApiPage === 1"
        @click="goToHttpApiPage(httpApiPage - 1)"
      >
        Previous
      </button>
      <span
        class="text-sm"
        :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
      >
        Page {{ httpApiPage }} of {{ totalHttpApiPages }}
      </span>
      <button
        class="px-3 py-1 rounded border disabled:opacity-50"
        :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
        :disabled="httpApiPage === totalHttpApiPages"
        @click="goToHttpApiPage(httpApiPage + 1)"
      >
        Next
      </button>
    </div>
  </div>

  <APIGatewayIntegrationModal
    v-if="showIntegrationModal"
    :open="showIntegrationModal"
    type="http"
    :integration-id="integrationToEdit?.integrationId"
    :integration-data="integrationToEdit"
    :lambda-functions="lambdaFunctions"
    :lambda-loading="lambdaLoading"
    @close="showIntegrationModal = false"
    @update:open="showIntegrationModal = $event"
    @create="confirmCreateIntegration"
    @update="confirmUpdateIntegration"
  />

  <APIGatewayRouteModal
    v-if="showRouteModal"
    :open="showRouteModal"
    :protocol-type="selectedApi?.protocolType || 'HTTP'"
    :integrations="selectedApi ? (integrations[selectedApi.apiId] || []).map((i: any) => i.integrationId) : []"
    @close="showRouteModal = false"
    @update:open="showRouteModal = $event"
    @create="confirmCreateRoute"
  />

  <APIGatewayStageModal
    v-if="showStageModal"
    :open="showStageModal"
    type="http"
    @close="showStageModal = false"
    @update:open="showStageModal = $event"
    @create-http="(stageName: string, options: any) => confirmCreateStage(stageName, options)"
  />

  <APIGatewayEditRouteModal
    v-if="showEditRouteModal"
    :open="showEditRouteModal"
    :route-key="routeToEdit?.routeKey || ''"
    :authorization-type="routeToEdit?.authorizationType"
    :authorizer-id="routeToEdit?.authorizerId"
    @close="showEditRouteModal = false"
    @update:open="showEditRouteModal = $event"
    @update="confirmUpdateRoute"
  />

  <APIGatewayEditStageModal
    v-if="showEditStageModal"
    :open="showEditStageModal"
    :stage-name="stageToEdit?.stageName || ''"
    :description="stageToEdit?.description"
    :auto-deploy="stageToEdit?.autoDeploy"
    @close="showEditStageModal = false"
    @update:open="showEditStageModal = $event"
    @update="confirmUpdateStage"
  />

  <Modal
    v-if="showDeleteModal"
    :open="showDeleteModal"
    title="Delete HTTP API"
    @close="showDeleteModal = false"
    @update:open="showDeleteModal = $event"
  >
    <p class="text-light-text dark:text-dark-text mb-4">
      Are you sure you want to delete <strong>{{ apiToDelete?.name }}</strong>?
    </p>
    <p class="text-light-muted dark:text-dark-muted text-sm mb-4">
      This action cannot be undone.
    </p>
    <div class="flex justify-end gap-2">
      <button
        class="px-4 py-2 rounded border border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:bg-light-border dark:hover:bg-dark-border"
        @click="showDeleteModal = false"
      >
        Cancel
      </button>
      <button
        class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
        @click="confirmDeleteApi"
      >
        Delete
      </button>
    </div>
  </Modal>
</template>
