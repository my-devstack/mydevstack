import { ref } from 'vue'
import * as apigateway from '@/api/services/api-gateway'
import { useToast } from '@/composables/useToast'

export function useApiGateway() {
  const toast = useToast()
  const loading = ref(false)

  async function loadRestApis() {
    loading.value = true
    try {
      return await apigateway.getRestApis()
    } catch (e) {
      console.error('Error loading REST APIs:', e)
      toast.error('Failed to load REST APIs')
      return { items: [] }
    } finally {
      loading.value = false
    }
  }

  async function loadHttpApis() {
    loading.value = true
    try {
      return await apigateway.getHttpApis()
    } catch (e) {
      console.error('Error loading HTTP APIs:', e)
      toast.error('Failed to load HTTP APIs')
      return { items: [] }
    } finally {
      loading.value = false
    }
  }

  async function loadResources(apiId: string) {
    loading.value = true
    try {
      return await apigateway.getResources(apiId)
    } catch (e) {
      console.error('Error loading resources:', e)
      return { items: [] }
    } finally {
      loading.value = false
    }
  }

  async function loadMethods(apiId: string, resourceId: string, method: string) {
    loading.value = true
    try {
      return await apigateway.getMethod(apiId, resourceId, method)
    } catch {
      return null
    } finally {
      loading.value = false
    }
  }

  async function loadIntegration(apiId: string, resourceId: string, method: string) {
    try {
      return await apigateway.getIntegration(apiId, resourceId, method)
    } catch {
      return null
    }
  }

  async function loadRoutes(apiId: string) {
    loading.value = true
    try {
      return await apigateway.getRoutes(apiId)
    } catch {
      return { items: [] }
    } finally {
      loading.value = false
    }
  }

  async function loadIntegrations(apiId: string) {
    loading.value = true
    try {
      return await apigateway.getIntegrations(apiId)
    } catch {
      return { items: [] }
    } finally {
      loading.value = false
    }
  }

  async function loadRestStages(apiId: string) {
    loading.value = true
    try {
      return await apigateway.getRestApiStages(apiId)
    } catch {
      return { items: [] }
    } finally {
      loading.value = false
    }
  }

  async function loadHttpStages(apiId: string) {
    loading.value = true
    try {
      return await apigateway.getHttpApiStages(apiId)
    } catch {
      return { items: [] }
    } finally {
      loading.value = false
    }
  }

  async function createRestApi(name: string, description?: string) {
    loading.value = true
    try {
      await apigateway.createRestApi(name, { Description: description })
      toast.success('REST API created successfully')
    } catch (e) {
      console.error('Error creating REST API:', e)
      toast.error('Failed to create REST API')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateRestApi(apiId: string, name: string, description?: string) {
    loading.value = true
    try {
      await apigateway.updateRestApi(apiId, { name, description })
      toast.success('REST API updated successfully')
    } catch (e) {
      console.error('Error updating REST API:', e)
      toast.error('Failed to update REST API')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteRestApi(apiId: string) {
    loading.value = true
    try {
      await apigateway.deleteRestApi(apiId)
      toast.success('REST API deleted successfully')
    } catch (e) {
      console.error('Error deleting REST API:', e)
      toast.error('Failed to delete REST API')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createResource(apiId: string, parentId: string, pathPart: string) {
    loading.value = true
    try {
      await apigateway.createResource(apiId, parentId, pathPart)
      toast.success('Resource created successfully')
    } catch (e) {
      console.error('Error creating resource:', e)
      toast.error('Failed to create resource')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteResource(apiId: string, resourceId: string) {
    loading.value = true
    try {
      await apigateway.deleteResource(apiId, resourceId)
      toast.success('Resource deleted successfully')
    } catch (e) {
      console.error('Error deleting resource:', e)
      toast.error('Failed to delete resource')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createMethod(apiId: string, resourceId: string, httpMethod: string, options?: { authorizationType?: string; apiKeyRequired?: boolean }) {
    loading.value = true
    try {
      await apigateway.createMethod(apiId, resourceId, httpMethod, options)
      toast.success('Method created successfully')
    } catch (e) {
      console.error('Error creating method:', e)
      toast.error('Failed to create method')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteMethod(apiId: string, resourceId: string, httpMethod: string) {
    loading.value = true
    try {
      await apigateway.deleteMethod(apiId, resourceId, httpMethod)
      toast.success('Method deleted successfully')
    } catch (e) {
      console.error('Error deleting method:', e)
      toast.error('Failed to delete method')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function putIntegration(apiId: string, resourceId: string, httpMethod: string, options: { type?: string; uri?: string; integrationHttpMethod?: string }) {
    loading.value = true
    try {
      await apigateway.putIntegration(apiId, resourceId, httpMethod, options)
      toast.success('Integration saved successfully')
    } catch (e) {
      console.error('Error saving integration:', e)
      toast.error('Failed to save integration')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createDeployment(apiId: string, stageName: string, description?: string) {
    loading.value = true
    try {
      await apigateway.createDeployment(apiId, { stageName, description })
      toast.success('Deployment created successfully')
    } catch (e) {
      console.error('Error creating deployment:', e)
      toast.error('Failed to create deployment')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteDeployment(apiId: string, deploymentId: string) {
    loading.value = true
    try {
      await apigateway.deleteDeployment(apiId, deploymentId)
      toast.success('Deployment deleted successfully')
    } catch (e) {
      console.error('Error deleting deployment:', e)
      toast.error('Failed to delete deployment')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createRestStage(apiId: string, deploymentId: string, stageName: string) {
    loading.value = true
    try {
      await apigateway.createStage(apiId, deploymentId, stageName)
      toast.success('Stage created successfully')
    } catch (e) {
      console.error('Error creating stage:', e)
      toast.error('Failed to create stage')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteRestStage(apiId: string, stageName: string) {
    loading.value = true
    try {
      await apigateway.deleteStage(apiId, stageName)
      toast.success('Stage deleted successfully')
    } catch (e) {
      console.error('Error deleting stage:', e)
      toast.error('Failed to delete stage')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createHttpApi(name: string, description?: string, protocol?: string) {
    loading.value = true
    try {
      await apigateway.createHttpApi({ name, description, protocolType: protocol || 'HTTP' })
      toast.success('API created successfully')
    } catch (e) {
      console.error('Error creating HTTP API:', e)
      toast.error('Failed to create API')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteHttpApi(apiId: string) {
    loading.value = true
    try {
      await apigateway.deleteHttpApi(apiId)
      toast.success('HTTP API deleted successfully')
    } catch (e) {
      console.error('Error deleting HTTP API:', e)
      toast.error('Failed to delete HTTP API')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createHttpRoute(apiId: string, routeKey: string, target?: string, authType?: string) {
    loading.value = true
    try {
      await apigateway.createHttpRoute(apiId, { routeKey, target, authorizationType: authType })
      toast.success('Route created successfully')
    } catch (e) {
      console.error('Error creating route:', e)
      toast.error('Failed to create route')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateHttpRoute(apiId: string, routeId: string, options: any) {
    loading.value = true
    try {
      await apigateway.updateHttpRoute(apiId, routeId, options)
      toast.success('Route updated successfully')
    } catch (e) {
      console.error('Error updating route:', e)
      toast.error('Failed to update route')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteHttpRoute(apiId: string, routeId: string) {
    loading.value = true
    try {
      await apigateway.deleteHttpRoute(apiId, routeId)
      toast.success('Route deleted successfully')
    } catch (e) {
      console.error('Error deleting route:', e)
      toast.error('Failed to delete route')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createHttpIntegration(apiId: string, options: any) {
    loading.value = true
    try {
      await apigateway.createHttpIntegration(apiId, options)
      toast.success('Integration created successfully')
    } catch (e) {
      console.error('Error creating integration:', e)
      toast.error('Failed to create integration')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateHttpIntegration(apiId: string, integrationId: string, options: any) {
    loading.value = true
    try {
      await apigateway.updateHttpIntegration(apiId, integrationId, options)
      toast.success('Integration updated successfully')
    } catch (e) {
      console.error('Error updating integration:', e)
      toast.error('Failed to update integration')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteHttpIntegration(apiId: string, integrationId: string) {
    loading.value = true
    try {
      await apigateway.deleteHttpApiIntegration(apiId, integrationId)
      toast.success('Integration deleted successfully')
    } catch (e) {
      console.error('Error deleting integration:', e)
      toast.error('Failed to delete integration')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createHttpStage(apiId: string, stageName: string, options?: { description?: string; autoDeploy?: boolean }) {
    loading.value = true
    try {
      await apigateway.createHttpApiStage(apiId, { stageName, ...options })
      toast.success('Stage created successfully')
    } catch (e) {
      console.error('Error creating stage:', e)
      toast.error('Failed to create stage')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateHttpStage(apiId: string, stageName: string, options: any) {
    loading.value = true
    try {
      await apigateway.updateHttpApiStage(apiId, stageName, options)
      toast.success('Stage updated successfully')
    } catch (e) {
      console.error('Error updating stage:', e)
      toast.error('Failed to update stage')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteHttpStage(apiId: string, stageName: string) {
    loading.value = true
    try {
      await apigateway.deleteHttpApiStage(apiId, stageName)
      toast.success('Stage deleted successfully')
    } catch (e) {
      console.error('Error deleting stage:', e)
      toast.error('Failed to delete stage')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function getRestInvokeUrl(apiId: string, stageName: string) {
    try {
      const response = await apigateway.getRestApiInvokeUrl(apiId, stageName)
      return response?.invokeUrl || ''
    } catch {
      return ''
    }
  }

  async function getHttpInvokeUrl(apiId: string, stageName: string) {
    try {
      const response = await apigateway.getHttpApiInvokeUrl(apiId, stageName)
      return response?.invokeUrl || ''
    } catch {
      return ''
    }
  }

  async function getRestApiDetails(apiId: string) {
    loading.value = true
    try {
      return await apigateway.getRestApi(apiId)
    } catch {
      return null
    } finally {
      loading.value = false
    }
  }

  async function getHttpApiDetails(apiId: string) {
    loading.value = true
    try {
      return await apigateway.getHttpApi(apiId)
    } catch {
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    loadRestApis,
    loadHttpApis,
    loadResources,
    loadMethods,
    loadIntegration,
    loadRoutes,
    loadIntegrations,
    loadRestStages,
    loadHttpStages,
    createRestApi,
    updateRestApi,
    deleteRestApi,
    createResource,
    deleteResource,
    createMethod,
    deleteMethod,
    putIntegration,
    createDeployment,
    deleteDeployment,
    createRestStage,
    deleteRestStage,
    createHttpApi,
    deleteHttpApi,
    createHttpRoute,
    updateHttpRoute,
    deleteHttpRoute,
    createHttpIntegration,
    updateHttpIntegration,
    deleteHttpIntegration,
    createHttpStage,
    updateHttpStage,
    deleteHttpStage,
    getRestInvokeUrl,
    getHttpInvokeUrl,
    getRestApiDetails,
    getHttpApiDetails,
  }
}

export default useApiGateway