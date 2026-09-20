<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { usePagination } from '@/composables/usePagination'
import { useSettingsStore } from '@/stores/settings'
import * as apigateway from '@/api/services/api-gateway'
import * as lambda from '@/api/services/lambda'

import APIGatewayHttpApisList from '@/components/apiGateway/APIGatewayHttpApisList.vue'
import APIGatewayIntegrationModal from '@/components/apiGateway/APIGatewayIntegrationModal.vue'
import APIGatewayEditIntegrationModal from '@/components/apiGateway/APIGatewayEditIntegrationModal.vue'
import APIGatewayRouteModal from '@/components/apiGateway/APIGatewayRouteModal.vue'
import APIGatewayStageModal from '@/components/apiGateway/APIGatewayStageModal.vue'
import APIGatewayEditRouteModal from '@/components/apiGateway/APIGatewayEditRouteModal.vue'
import APIGatewayEditStageModal from '@/components/apiGateway/APIGatewayEditStageModal.vue'
import APIGatewayViewRouteModal from '@/components/apiGateway/APIGatewayViewRouteModal.vue'
import APIGatewayViewIntegrationModal from '@/components/apiGateway/APIGatewayViewIntegrationModal.vue'
import APIGatewayViewStageModal from '@/components/apiGateway/APIGatewayViewStageModal.vue'
import APIGatewayAuthorizersList from '@/components/apiGateway/APIGatewayAuthorizersList.vue'
import APIGatewayAuthorizersModal from '@/components/apiGateway/APIGatewayAuthorizersModal.vue'
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
const showEditIntegrationModal = ref(false)
const showViewRouteModal = ref(false)
const showViewIntegrationModal = ref(false)
const showViewStageModal = ref(false)

const integrationToEdit = ref<any>(null)
const routeToEdit = ref<any>(null)
const stageToEdit = ref<any>(null)
const routeToView = ref<any>(null)
const integrationToView = ref<any>(null)
const stageToView = ref<any>(null)

const showAuthorizers = ref(false)
const showAuthorizersModal = ref(false)
const authorizerToEdit = ref<any>(null)
const authorizersListKey = ref(0)

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
  const expandedId = Array.from(expandedApis.value)[0]
  if (expandedId) {
    selectedApi.value = { apiId: expandedId }
  }
  integrationToEdit.value = integration
  showEditIntegrationModal.value = true
}

function handleViewRoute(route: any) {
  routeToView.value = route
  showViewRouteModal.value = true
}

function handleViewIntegration(integration: any) {
  integrationToView.value = integration
  showViewIntegrationModal.value = true
}

function handleViewStage(stage: any) {
  stageToView.value = stage
  showViewStageModal.value = true
}

function handleCreateRoute(api: any) {
  selectedApi.value = api
  showRouteModal.value = true
}

function handleCreateStage(api: any) {
  selectedApi.value = api
  showStageModal.value = true
}

async function handleEditRoute(route: any, apiId: string) {
  selectedApi.value = { apiId }
  try {
    // Fetch full route details including authorizationType, authorizerId
    const fullRoute = await apigateway.getHttpRoute(apiId, route.routeId)
    routeToEdit.value = fullRoute
  } catch {
    // Fallback to partial data if getRoute fails
    routeToEdit.value = route
  }
  showEditRouteModal.value = true
}

function handleEditStage(stage: any, apiId: string) {
  selectedApi.value = { apiId }
  stageToEdit.value = stage
  showEditStageModal.value = true
}

function handleOpenAuthorizers(api: any) {
  selectedApi.value = api
  showAuthorizers.value = true
}

function handleCreateAuthorizer() {
  authorizerToEdit.value = null
  showAuthorizersModal.value = true
}

function handleEditAuthorizer(authorizer: any) {
  authorizerToEdit.value = authorizer
  showAuthorizersModal.value = true
}

function handleAuthorizersModalClose() {
  showAuthorizersModal.value = false
  authorizersListKey.value++
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
    showEditIntegrationModal.value = false
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

async function handleDeleteRoute(apiId: string, route: any) {
  try {
    await apigateway.deleteHttpRoute(apiId, route.routeId)
    toast.success('Route deleted')
    await loadDetailsForApi(apiId)
  } catch (e: any) {
    toast.error(e?.message || 'Failed to delete route')
  }
}

async function handleDeleteIntegration(apiId: string, integration: any) {
  try {
    await apigateway.deleteHttpApiIntegration(apiId, integration.integrationId)
    toast.success('Integration deleted')
    await loadDetailsForApi(apiId)
  } catch (e: any) {
    toast.error(e?.message || 'Failed to delete integration')
  }
}

async function handleDeleteStage(apiId: string, stage: any) {
  try {
    await apigateway.deleteHttpApiStage(apiId, stage.stageName)
    toast.success('Stage deleted')
    await loadDetailsForApi(apiId)
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
    @view-integration="handleViewIntegration"
    @delete-integration="handleDeleteIntegration"
    @create-route="handleCreateRoute"
    @edit-route="handleEditRoute"
    @view-route="handleViewRoute"
    @delete-route="handleDeleteRoute"
    @create-stage="handleCreateStage"
    @edit-stage="handleEditStage"
    @view-stage="handleViewStage"
    @delete-stage="handleDeleteStage"
    @open-authorizers="handleOpenAuthorizers"
  />

  <!-- Pagination -->
  <div
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

  <APIGatewayEditIntegrationModal
    v-if="showEditIntegrationModal"
    :open="showEditIntegrationModal"
    :integration-id="integrationToEdit?.integrationId"
    :integration-type="integrationToEdit?.integrationType"
    :integration-uri="integrationToEdit?.integrationUri"
    :integration-method="integrationToEdit?.integrationMethod"
    :description="integrationToEdit?.description"
    @update:open="showEditIntegrationModal = $event"
    @update="(integrationType: string, integrationUri: string, integrationMethod: string, description: string) => confirmUpdateIntegration(integrationType, integrationMethod, integrationUri, description)"
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

  <APIGatewayAuthorizersList
    v-if="showAuthorizers"
    :key="authorizersListKey"
    :open="showAuthorizers"
    :api-id="selectedApi?.apiId"
    :api-name="selectedApi?.name"
    api-type="http"
    @update:open="showAuthorizers = $event"
    @create-authorizer="handleCreateAuthorizer"
    @edit-authorizer="handleEditAuthorizer"
  />

  <APIGatewayAuthorizersModal
    v-if="showAuthorizersModal"
    :open="showAuthorizersModal"
    :mode="authorizerToEdit ? 'edit' : 'create'"
    :api-id="selectedApi?.apiId"
    :api-name="selectedApi?.name"
    api-type="http"
    :authorizer="authorizerToEdit"
    @update:open="handleAuthorizersModalClose"
  />

  <APIGatewayViewRouteModal
    v-if="showViewRouteModal"
    :open="showViewRouteModal"
    :route="routeToView"
    @update:open="showViewRouteModal = $event"
  />

  <APIGatewayViewIntegrationModal
    v-if="showViewIntegrationModal"
    :open="showViewIntegrationModal"
    :integration="integrationToView"
    @update:open="showViewIntegrationModal = $event"
  />

  <APIGatewayViewStageModal
    v-if="showViewStageModal"
    :open="showViewStageModal"
    :stage="stageToView"
    @update:open="showViewStageModal = $event"
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
