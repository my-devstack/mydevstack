import { ref, computed, watch } from 'vue'
import { useApiGateway } from '@/composables/useApiGateway'
import type { APIGatewayRestAPI, APIGatewayResource, APIGatewayMethod } from '@/api/types/aws'

export function useApiGatewayState() {
  const api = useApiGateway()

  const activeTab = ref<'rest' | 'http'>('rest')
  
  const restApis = ref<APIGatewayRestAPI[]>([])
  const httpApis = ref<any[]>([])
  const restResources = ref<APIGatewayResource[]>([])
  const restMethods = ref<Record<string, APIGatewayMethod>>({})
  const httpRoutes = ref<any[]>([])
  const httpIntegrations = ref<any[]>([])
  const httpStages = ref<any[]>([])
  const restDeployments = ref<any[]>([])
  const restStagesData = ref<any[]>([])

  const selectedRestApi = ref<APIGatewayRestAPI | null>(null)
  const selectedResource = ref<APIGatewayResource | null>(null)
  const selectedHttpApi = ref<any | null>(null)

  const expandedApis = ref<Set<string>>(new Set())
  const expandedResources = ref<Set<string>>(new Set())
  const expandedHttpApis = ref<Set<string>>(new Set())
  const resourceMethodsMap = ref<Record<string, Record<string, APIGatewayMethod>>>({})
  const resourceMethodsLoading = ref<Record<string, boolean>>({})

  const loadingRestApis = ref(false)
  const loadingHttpApis = ref(false)
  const loadingResources = ref(false)
  const loadingMethods = ref(false)
  const loadingRoutes = ref(false)
  const loadingIntegrations = ref(false)
  const loadingHttpStages = ref(false)
  const loadingDeployments = ref(false)
  const loadingRestStages = ref(false)

  const isLoading = computed(() => 
    loadingRestApis.value || loadingHttpApis.value || loadingResources.value || loadingMethods.value ||
    loadingRoutes.value || loadingIntegrations.value || loadingHttpStages.value || api.loading.value
  )

  async function loadRestApis() {
    loadingRestApis.value = true
    const result = await api.loadRestApis()
    restApis.value = result?.items || []
    loadingRestApis.value = false
  }

  async function loadHttpApis() {
    loadingHttpApis.value = true
    const result = await api.loadHttpApis()
    httpApis.value = result?.items || []
    loadingHttpApis.value = false
  }

  async function loadResourcesForApi(apiId: string) {
    const apiItem = restApis.value.find(a => a.id === apiId)
    if (!apiItem) return

    selectedRestApi.value = apiItem
    loadingResources.value = true
    loadingDeployments.value = true
    loadingRestStages.value = true

    const [resourcesResult, deploymentsResult, stagesResult] = await Promise.all([
      api.loadResources(apiId),
      api.loadRestApis().then(() => ({ items: [] })),
      api.loadRestStages(apiId),
    ])

    restResources.value = resourcesResult?.items || []
    restDeployments.value = deploymentsResult?.items || []
    restStagesData.value = stagesResult?.items || []
    loadingResources.value = false
    loadingDeployments.value = false
    loadingRestStages.value = false
  }

  async function loadMethodsForResource(resourceId: string) {
    if (!selectedRestApi.value) return
    const resource = restResources.value.find(r => r.id === resourceId)
    if (!resource) return

    resourceMethodsLoading.value[resourceId] = true
    resourceMethodsMap.value[resourceId] = {}

    const methodsToTry = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
    for (const method of methodsToTry) {
      try {
        const result = await api.loadMethods(selectedRestApi.value.id, resource.id, method)
        if (result) {
          const integration = await api.loadIntegration(selectedRestApi.value.id, resource.id, method)
          resourceMethodsMap.value[resourceId][method] = { ...result, ...integration }
        }
      } catch {
        // skip
      }
    }
    resourceMethodsLoading.value[resourceId] = false
  }

  async function loadHttpApiDetails(apiId: string) {
    const apiItem = httpApis.value.find(a => a.apiId === apiId)
    if (!apiItem) return

    selectedHttpApi.value = apiItem
    loadingRoutes.value = true
    loadingIntegrations.value = true
    loadingHttpStages.value = true

    const [routesResult, integrationsResult, stagesResult] = await Promise.all([
      api.loadRoutes(apiId),
      api.loadIntegrations(apiId),
      api.loadHttpStages(apiId),
    ])

    httpRoutes.value = routesResult?.items || []
    httpIntegrations.value = integrationsResult?.items || []
    httpStages.value = stagesResult?.items || []
    loadingRoutes.value = false
    loadingIntegrations.value = false
    loadingHttpStages.value = false
  }

  function toggleApiExpansion(apiId: string) {
    if (expandedApis.value.has(apiId)) {
      expandedApis.value.delete(apiId)
    } else {
      expandedApis.value.add(apiId)
      loadResourcesForApi(apiId)
    }
    expandedApis.value = new Set(expandedApis.value)
  }

  function toggleResourceExpansion(resourceId: string) {
    if (expandedResources.value.has(resourceId)) {
      expandedResources.value.delete(resourceId)
    } else {
      expandedResources.value.add(resourceId)
      loadMethodsForResource(resourceId)
    }
    expandedResources.value = new Set(expandedResources.value)
  }

  function toggleHttpApiExpansion(apiId: string) {
    if (expandedHttpApis.value.has(apiId)) {
      expandedHttpApis.value.delete(apiId)
    } else {
      expandedHttpApis.value.add(apiId)
      loadHttpApiDetails(apiId)
    }
    expandedHttpApis.value = new Set(expandedHttpApis.value)
  }

  return {
    activeTab,
    isLoading,
    restApis,
    httpApis,
    restResources,
    restMethods,
    httpRoutes,
    httpIntegrations,
    httpStages,
    restDeployments,
    restStagesData,
    selectedRestApi,
    selectedResource,
    selectedHttpApi,
    expandedApis,
    expandedResources,
    expandedHttpApis,
    resourceMethodsMap,
    resourceMethodsLoading,
    loadingRestApis,
    loadingHttpApis,
    loadingResources,
    loadingMethods,
    loadingRoutes,
    loadingIntegrations,
    loadingHttpStages,
    loadingDeployments,
    loadingRestStages,
    loadRestApis,
    loadHttpApis,
    loadResourcesForApi,
    loadMethodsForResource,
    loadHttpApiDetails,
    toggleApiExpansion,
    toggleResourceExpansion,
    toggleHttpApiExpansion,
    ...api,
  }
}

export default useApiGatewayState