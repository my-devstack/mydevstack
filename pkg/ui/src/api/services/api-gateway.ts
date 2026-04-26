/**
 * API Gateway Service API Client
 * Simple HTTP client for API Gateway via Go proxy
 * @module api/services/api-gateway
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

async function apiGatewayRequest(action: string, body: object = {}, targetPrefix: string = 'APIGateway'): Promise<any> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')
  const url = `${endpoint}/apigateway/`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': `${targetPrefix}.${action}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.clone().text()
      if (response.status === 404) {
        return { error: errorText, notFound: true }
      }
      if (response.status >= 500) {
        throw new Error(errorText || `HTTP ${response.status}`)
      }
      return { Items: [], items: [], error: errorText }
    }

    return response.json()
  } catch (error: any) {
    throw new Error(error?.message || 'Request failed')
  }
}

// HTTP API v2 requests use ApiGatewayV2 prefix (already uppercase)
async function apiGatewayV2Request(action: string, body: object = {}): Promise<any> {
  return apiGatewayRequest(action, body, 'ApiGatewayV2')
}

export class APIGatewayService {
  // REST API operations
  async getRestApis(options?: { position?: string; limit?: number }): Promise<any> {
    const response = await apiGatewayRequest('GetRestApis', options || {})
    // Normalize case: AWS SDK returns Items, Id (capitalized)
    if (response && response.Items) {
      response.items = response.Items.map((item: any) => ({
        id: item.Id || item.id,
        name: item.Name || item.name,
        description: item.Description || item.description,
        createdDate: item.CreatedDate || item.createdDate,
      }))
    }
    return response
  }

  async createRestApi(name: string, options?: {
    Description?: string
    Version?: string
    BinaryMediaTypes?: string[]
  }): Promise<any> {
    return apiGatewayRequest('CreateRestApi', { name, ...options })
  }

  async deleteRestApi(restApiId: string): Promise<any> {
    return apiGatewayRequest('DeleteRestApi', { restApiId })
  }

  async getRestApi(restApiId: string): Promise<any> {
    const result = await apiGatewayRequest('GetRestApi', { restApiId })
    // Normalize case: AWS SDK returns Name, Id (capitalized), but we want name, id (lowercase)
    if (result) {
      result.id = result.id || result.Id
      result.name = result.name || result.Name
      result.description = result.description || result.Description
    }
    return result
  }

  async updateRestApi(restApiId: string, options: {
    name?: string
    description?: string
  }): Promise<any> {
    return apiGatewayRequest('UpdateRestApi', { restApiId, ...options })
  }

  async getResources(restApiId: string): Promise<any> {
    const response = await apiGatewayRequest('GetResources', { restApiId })
    // Normalize - AWS SDK uses capitalized keys (Id, Path, PathPart)
    if (response && response.Items && Array.isArray(response.Items)) {
      response.items = response.Items.map((item: any) => ({
        id: item.Id,
        parentId: item.ParentId,
        path: item.Path,
        pathPart: item.PathPart,
        resourceMethods: item.ResourceMethods,
      }))
    } else {
      response.items = []
    }
    return response
  }

  async getResource(restApiId: string, resourceId: string): Promise<any> {
    return apiGatewayRequest('GetResource', { restApiId, resourceId })
  }

  async createResource(restApiId: string, parentId: string, pathPart: string): Promise<any> {
    return apiGatewayRequest('CreateResource', { restApiId, parentId, pathPart })
  }

  async deleteResource(restApiId: string, resourceId: string): Promise<any> {
    return apiGatewayRequest('DeleteResource', { restApiId, resourceId })
  }

  async putMethod(restApiId: string, resourceId: string, httpMethod: string, options?: {
    authorizationType?: string
    apiKeyRequired?: boolean
  }): Promise<any> {
    return apiGatewayRequest('PutMethod', {
      restApiId,
      resourceId,
      httpMethod: httpMethod.toUpperCase(),
      ...options,
    })
  }

  async getMethod(restApiId: string, resourceId: string, httpMethod: string): Promise<any> {
    return apiGatewayRequest('GetMethod', { restApiId, resourceId, httpMethod: httpMethod.toUpperCase() })
  }

  async deleteMethod(restApiId: string, resourceId: string, httpMethod: string): Promise<any> {
    return apiGatewayRequest('DeleteMethod', { restApiId, resourceId, httpMethod: httpMethod.toUpperCase() })
  }

  // Create method (wrapper around PutMethod)
  async createMethod(restApiId: string, resourceId: string, httpMethod: string, options?: {
    authorizationType?: string
    apiKeyRequired?: boolean
  }): Promise<any> {
    return this.putMethod(restApiId, resourceId, httpMethod, options)
  }

  async putIntegration(restApiId: string, resourceId: string, httpMethod: string, options?: {
    type?: string
    uri?: string
    integrationHttpMethod?: string
  }): Promise<any> {
    return apiGatewayRequest('PutIntegration', {
      restApiId,
      resourceId,
      httpMethod: httpMethod.toUpperCase(),
      integrationHttpMethod: options?.integrationHttpMethod?.toUpperCase(),
      type: options?.type,
      uri: options?.uri,
    })
  }

  async getIntegration(restApiId: string, resourceId: string, httpMethod: string): Promise<any> {
    return apiGatewayRequest('GetIntegration', { restApiId, resourceId, httpMethod: httpMethod.toUpperCase() })
  }

  async deleteIntegration(restApiId: string, resourceId: string, httpMethod: string): Promise<any> {
    return apiGatewayRequest('DeleteIntegration', { restApiId, resourceId, httpMethod: httpMethod.toUpperCase() })
  }

  async createDeployment(restApiId: string, options?: {
    stageName?: string
    stageDescription?: string
    description?: string
  }): Promise<any> {
    return apiGatewayRequest('CreateDeployment', { restApiId, ...options })
  }

  async deleteDeployment(restApiId: string, deploymentId: string): Promise<any> {
    return apiGatewayRequest('DeleteDeployment', { restApiId, deploymentId })
  }

  async createStage(restApiId: string, deploymentId: string, stageName: string, stageDescription?: string): Promise<any> {
    return apiGatewayRequest('CreateStage', { 
      RestApiId: restApiId, 
      DeploymentId: deploymentId, 
      StageName: stageName,
      Description: stageDescription || '',
    })
  }

  async getStages(restApiId: string): Promise<any> {
    const response = await apiGatewayRequest('GetStages', { RestApiId: restApiId })
    // Normalize case: REST API uses "item" (singular) not "items" (plural)
    if (response) {
      const sourceItems = response.item || response.Item || []
      response.items = sourceItems.map((item: any) => ({
        stageName: item.StageName || item.stageName,
        deploymentId: item.DeploymentId || item.deploymentId,
        description: item.Description || item.description,
        createdDate: item.CreatedDate || item.createdDate,
        cacheClusterEnabled: item.CacheClusterEnabled || item.cacheClusterEnabled,
        cacheClusterStatus: item.CacheClusterStatus || item.cacheClusterStatus,
        tracingEnabled: item.TracingEnabled || item.tracingEnabled,
        variables: item.Variables || item.variables,
      }))
    }
    return response
  }

  async updateStage(restApiId: string, stageName: string, patchOperations: Array<{
    op: string
    path: string
    value?: string
  }>): Promise<any> {
    return apiGatewayRequest('UpdateStage', { RestApiId: restApiId, StageName: stageName, PatchOperations: patchOperations })
  }

  async deleteStage(restApiId: string, stageName: string): Promise<any> {
    return apiGatewayRequest('DeleteStage', { RestApiId: restApiId, StageName: stageName })
  }

  // HTTP API v2 operations
  async getApis(options?: any): Promise<any> {
    const response = await apiGatewayV2Request('GetApis', options || {})
    // Normalize case: AWS SDK returns Items (capitalized)
    if (response && response.Items) {
      response.items = response.Items.map((item: any) => ({
        apiId: item.ApiId || item.apiId,
        name: item.Name || item.name,
        description: item.Description || item.description,
        protocolType: item.ProtocolType || item.protocolType,
        apiEndpoint: item.ApiEndpoint || item.apiEndpoint,
        createdDate: item.CreatedDate || item.createdDate,
      }))
    }
    return response
  }

  async createApi(options?: any): Promise<any> {
    return apiGatewayV2Request('CreateApi', { 
      Name: options?.name || options?.Name || '', 
      ProtocolType: options?.ProtocolType || options?.protocolType || 'HTTP',
      Description: options?.Description || options?.description || '',
    })
  }

  async deleteApi(apiId: string): Promise<any> {
    return apiGatewayV2Request('DeleteApi', { apiId })
  }

  async getApi(apiId: string): Promise<any> {
    return apiGatewayV2Request('GetApi', { apiId })
  }

  async getRoutes(apiId: string): Promise<any> {
    const response = await apiGatewayV2Request('GetRoutes', { ApiId: apiId })
    // Normalize case: AWS SDK returns Items (capitalized)
    if (response && response.Items) {
      response.items = response.Items.map((item: any) => ({
        routeId: item.RouteId || item.routeId,
        routeKey: item.RouteKey || item.routeKey,
        target: item.Target || item.target,
      }))
    }
    return response
  }

  async createRoute(apiId: string, options?: any): Promise<any> {
    // Map frontend field names to AWS SDK field names (capitalized)
    const sdkOptions: any = {
      ApiId: apiId,
    }
    
    if (options?.routeKey) sdkOptions.RouteKey = options.routeKey
    if (options?.routeKey) sdkOptions.RouteKey = options.routeKey
    if (options?.authorizationType) sdkOptions.AuthorizationType = options.authorizationType
    if (options?.authorizerId) sdkOptions.AuthorizerId = options.authorizerId
    if (options?.target) sdkOptions.Target = options.target
    if (options?.apiKeyRequired !== undefined) sdkOptions.ApiKeyRequired = options.apiKeyRequired
    if (options?.modelSelectionExpression) sdkOptions.ModelSelectionExpression = options.modelSelectionExpression
    if (options?.operationName) sdkOptions.OperationName = options.operationName
    
    return apiGatewayV2Request('CreateRoute', sdkOptions)
  }

  async updateRoute(apiId: string, routeId: string, options?: any): Promise<any> {
    const sdkOptions: any = {
      ApiId: apiId,
      RouteId: routeId,
    }
    
    if (options?.routeKey) sdkOptions.RouteKey = options.routeKey
    if (options?.authorizationType !== undefined) sdkOptions.AuthorizationType = options.authorizationType
    if (options?.authorizerId !== undefined) sdkOptions.AuthorizerId = options.authorizerId
    if (options?.target !== undefined) sdkOptions.Target = options.target
    if (options?.apiKeyRequired !== undefined) sdkOptions.ApiKeyRequired = options.apiKeyRequired
    if (options?.modelSelectionExpression !== undefined) sdkOptions.ModelSelectionExpression = options.modelSelectionExpression
    if (options?.operationName !== undefined) sdkOptions.OperationName = options.operationName
    
    return apiGatewayV2Request('UpdateRoute', sdkOptions)
  }

  async deleteRoute(apiId: string, routeId: string): Promise<any> {
    return apiGatewayV2Request('DeleteRoute', { ApiId: apiId, RouteId: routeId })
  }

  async getIntegrations(apiId: string): Promise<any> {
    const response = await apiGatewayV2Request('GetIntegrations', { ApiId: apiId })
    
    // Normalize case: AWS SDK returns Items (capitalized), LocalStack might return items (lowercase)
    if (response) {
      const sourceItems = response.Items || response.items || []
      response.items = sourceItems.map((item: any) => ({
        integrationId: item.IntegrationId || item.integrationId || item.IntegrationID,
        integrationType: item.IntegrationType || item.integrationType,
        integrationUri: item.IntegrationUri || item.integrationUri,
        integrationMethod: item.IntegrationMethod || item.integrationMethod,
        payloadFormatVersion: item.PayloadFormatVersion || item.payloadFormatVersion,
        description: item.Description || item.description,
        timeoutInMillis: item.TimeoutInMillis || item.timeoutInMillis,
        connectionType: item.ConnectionType || item.connectionType,
        connectionId: item.ConnectionId || item.connectionId,
        credentialsArn: item.CredentialsArn || item.credentialsArn,
      }))
    }
    return response
  }

  async createIntegration(apiId: string, options?: any): Promise<any> {
    // Map frontend field names to AWS SDK field names (capitalized)
    const sdkOptions: any = {
      ApiId: apiId,
    }
    
    if (options?.integrationType) sdkOptions.IntegrationType = options.integrationType
    if (options?.integrationUri) sdkOptions.IntegrationUri = options.integrationUri
    if (options?.integrationMethod) sdkOptions.IntegrationMethod = options.integrationMethod
    if (options?.payloadFormatVersion) sdkOptions.PayloadFormatVersion = options.payloadFormatVersion
    if (options?.description) sdkOptions.Description = options.description
    if (options?.timeoutInMillis) sdkOptions.TimeoutInMillis = options.timeoutInMillis
    if (options?.credentialsArn) sdkOptions.CredentialsArn = options.credentialsArn
    if (options?.connectionType) sdkOptions.ConnectionType = options.connectionType
    if (options?.connectionId) sdkOptions.ConnectionId = options.connectionId
    if (options?.integrationSubtype) sdkOptions.IntegrationSubtype = options.integrationSubtype
    if (options?.passthroughBehavior) sdkOptions.PassthroughBehavior = options.passthroughBehavior
    if (options?.contentHandlingStrategy) sdkOptions.ContentHandlingStrategy = options.contentHandlingStrategy
    if (options?.templateSelectionExpression) sdkOptions.TemplateSelectionExpression = options.templateSelectionExpression
    if (options?.requestTemplates) sdkOptions.RequestTemplates = options.requestTemplates
    
    return apiGatewayV2Request('CreateIntegration', sdkOptions)
  }

  async updateIntegration(apiId: string, integrationId: string, options?: any): Promise<any> {
    const sdkOptions: any = {
      ApiId: apiId,
      IntegrationId: integrationId,
    }
    
    if (options?.integrationType !== undefined) sdkOptions.IntegrationType = options.integrationType
    if (options?.integrationUri !== undefined) sdkOptions.IntegrationUri = options.integrationUri
    if (options?.integrationMethod !== undefined) sdkOptions.IntegrationMethod = options.integrationMethod
    if (options?.payloadFormatVersion !== undefined) sdkOptions.PayloadFormatVersion = options.payloadFormatVersion
    if (options?.description !== undefined) sdkOptions.Description = options.description
    if (options?.timeoutInMillis !== undefined) sdkOptions.TimeoutInMillis = options.timeoutInMillis
    if (options?.credentialsArn !== undefined) sdkOptions.CredentialsArn = options.credentialsArn
    if (options?.connectionType !== undefined) sdkOptions.ConnectionType = options.connectionType
    if (options?.connectionId !== undefined) sdkOptions.ConnectionId = options.connectionId
    if (options?.integrationSubtype !== undefined) sdkOptions.IntegrationSubtype = options.integrationSubtype
    if (options?.passthroughBehavior !== undefined) sdkOptions.PassthroughBehavior = options.passthroughBehavior
    if (options?.contentHandlingStrategy !== undefined) sdkOptions.ContentHandlingStrategy = options.contentHandlingStrategy
    if (options?.templateSelectionExpression !== undefined) sdkOptions.TemplateSelectionExpression = options.templateSelectionExpression
    
    return apiGatewayV2Request('UpdateIntegration', sdkOptions)
  }

  async deleteIntegrationV2(apiId: string, integrationId: string): Promise<any> {
    // Note: This uses the v2 API endpoint (ApiGatewayV2) - uses capitalized field names
    return apiGatewayV2Request('DeleteIntegration', { ApiId: apiId, IntegrationId: integrationId })
  }

  // Deployments (REST API v1)
  async getDeployments(apiId: string): Promise<any> {
    const response = await apiGatewayRequest('GetDeployments', { RestApiId: apiId })
    // Normalize case
    if (response) {
      const sourceItems = response.items || response.Items || []
      response.items = sourceItems.map((item: any) => ({
        id: item.Id || item.id,
        description: item.Description || item.description,
        createdDate: item.CreatedDate || item.createdDate,
      }))
    }
    return response
  }

  // HTTP API v2 Stages
  async getStagesV2(apiId: string): Promise<any> {
    const response = await apiGatewayV2Request('GetStages', { ApiId: apiId })
    // Normalize case
    if (response) {
      const sourceItems = response.items || response.Items || []
      response.items = sourceItems.map((item: any) => ({
        stageName: item.StageName || item.stageName,
        apiId: item.ApiId || item.apiId,
        stageVariables: item.StageVariables || item.stageVariables,
        description: item.Description || item.description,
        autoDeploy: item.AutoDeploy || item.autoDeploy,
      }))
    }
    return response
  }

  async getStageV2(apiId: string, stageName: string): Promise<any> {
    return apiGatewayV2Request('GetStage', { ApiId: apiId, StageName: stageName })
  }

  async createStageV2(apiId: string, options?: any): Promise<any> {
    // Map frontend field names to AWS SDK field names (capitalized)
    const sdkOptions: any = {
      ApiId: apiId,
    }
    
    if (options?.stageName) sdkOptions.StageName = options.stageName
    if (options?.description) sdkOptions.Description = options.description
    if (options?.stageVariables) sdkOptions.StageVariables = options.stageVariables
    if (options?.autoDeploy !== undefined) sdkOptions.AutoDeploy = options.autoDeploy
    if (options?.defaultRouteSettings) sdkOptions.DefaultRouteSettings = options.defaultRouteSettings
    if (options?.accessLogSettings) sdkOptions.AccessLogSettings = options.accessLogSettings
    if (options?.tags) sdkOptions.Tags = options.tags
    
    return apiGatewayV2Request('CreateStage', sdkOptions)
  }

  async updateStageV2(apiId: string, stageName: string, options?: any): Promise<any> {
    const sdkOptions: any = {
      ApiId: apiId,
      StageName: stageName,
    }
    
    if (options?.description !== undefined) sdkOptions.Description = options.description
    if (options?.stageVariables !== undefined) sdkOptions.StageVariables = options.stageVariables
    if (options?.autoDeploy !== undefined) sdkOptions.AutoDeploy = options.autoDeploy
    if (options?.defaultRouteSettings !== undefined) sdkOptions.DefaultRouteSettings = options.defaultRouteSettings
    if (options?.accessLogSettings !== undefined) sdkOptions.AccessLogSettings = options.accessLogSettings
    
    return apiGatewayV2Request('UpdateStage', sdkOptions)
  }

  async deleteStageV2(apiId: string, stageName: string): Promise<any> {
    return apiGatewayV2Request('DeleteStage', { ApiId: apiId, StageName: stageName })
  }

  async getInvokeUrl(apiId: string, stageName: string, targetPrefix: string = 'APIGateway'): Promise<any> {
    return apiGatewayRequest('GetInvokeUrl', { apiId, stageName }, targetPrefix)
  }
}

export const apiGatewayService = new APIGatewayService()

// Re-export for backward compatibility
export const getRestApis = (options?: any) => apiGatewayService.getRestApis(options)
export const createRestApi = (name: string, options?: any) => apiGatewayService.createRestApi(name, options)
export const deleteRestApi = (apiId: string) => apiGatewayService.deleteRestApi(apiId)
export const getRestApi = (apiId: string) => apiGatewayService.getRestApi(apiId)
export const updateRestApi = (apiId: string, options?: any) => apiGatewayService.updateRestApi(apiId, options)
export const getResources = (apiId: string) => apiGatewayService.getResources(apiId)
export const getResource = (apiId: string, resourceId: string) => apiGatewayService.getResource(apiId, resourceId)
export const createResource = (apiId: string, parentId: string, pathPart: string) =>
  apiGatewayService.createResource(apiId, parentId, pathPart)
export const deleteResource = (apiId: string, resourceId: string) =>
  apiGatewayService.deleteResource(apiId, resourceId)
export const putMethod = (apiId: string, resourceId: string, httpMethod: string, options?: any) =>
  apiGatewayService.putMethod(apiId, resourceId, httpMethod, options)
export const getMethod = (apiId: string, resourceId: string, httpMethod: string) =>
  apiGatewayService.getMethod(apiId, resourceId, httpMethod)
export const deleteMethod = (apiId: string, resourceId: string, httpMethod: string) =>
  apiGatewayService.deleteMethod(apiId, resourceId, httpMethod)
export const putIntegration = (apiId: string, resourceId: string, httpMethod: string, options?: any) =>
  apiGatewayService.putIntegration(apiId, resourceId, httpMethod, options)
export const getIntegration = (apiId: string, resourceId: string, httpMethod: string) =>
  apiGatewayService.getIntegration(apiId, resourceId, httpMethod)
export const deleteIntegration = (apiId: string, resourceId: string, httpMethod: string) =>
  apiGatewayService.deleteIntegration(apiId, resourceId, httpMethod)
export const createDeployment = (apiId: string, options?: any) =>
  apiGatewayService.createDeployment(apiId, options)
export const deleteDeployment = (apiId: string, deploymentId: string) =>
  apiGatewayService.deleteDeployment(apiId, deploymentId)
export const getDeployments = (apiId: string) => apiGatewayService.getDeployments(apiId)

// REST API v1 Stages
export const createRestApiStage = (apiId: string, deploymentId: string, stageName: string) =>
  apiGatewayService.createStage(apiId, deploymentId, stageName)
export const getRestApiStages = (apiId: string) => apiGatewayService.getStages(apiId)
export const updateRestApiStage = (apiId: string, stageName: string, options?: any) =>
  apiGatewayService.updateStage(apiId, stageName, options)
export const deleteRestApiStage = (apiId: string, stageName: string) =>
  apiGatewayService.deleteStage(apiId, stageName)

// HTTP API v2 methods
export const getHttpApis = (options?: any) => apiGatewayService.getApis(options)
export const createHttpApi = (options?: any) => apiGatewayService.createApi(options)
export const deleteHttpApi = (apiId: string) => apiGatewayService.deleteApi(apiId)
export const getHttpApi = (apiId: string) => apiGatewayService.getApi(apiId)
export const getHttpRoutes = (apiId: string) => apiGatewayService.getRoutes(apiId)
export const createHttpRoute = (apiId: string, options: any) => apiGatewayService.createRoute(apiId, options)
export const updateHttpRoute = (apiId: string, routeId: string, options: any) => apiGatewayService.updateRoute(apiId, routeId, options)
export const deleteHttpRoute = (apiId: string, routeId: string) => apiGatewayService.deleteRoute(apiId, routeId)
export const getHttpIntegrations = (apiId: string) => apiGatewayService.getIntegrations(apiId)
export const createHttpIntegration = (apiId: string, options: any) => apiGatewayService.createIntegration(apiId, options)
export const updateHttpIntegration = (apiId: string, integrationId: string, options: any) => apiGatewayService.updateIntegration(apiId, integrationId, options)
export const deleteHttpApiIntegration = (apiId: string, integrationId: string) =>
  apiGatewayService.deleteIntegrationV2(apiId, integrationId)

// HTTP API v2 Stages
export const getHttpApiStages = (apiId: string) => apiGatewayService.getStagesV2(apiId)
export const getHttpApiStage = (apiId: string, stageName: string) => apiGatewayService.getStageV2(apiId, stageName)
export const createHttpApiStage = (apiId: string, options: any) => apiGatewayService.createStageV2(apiId, options)
export const updateHttpApiStage = (apiId: string, stageName: string, options?: any) =>
  apiGatewayService.updateStageV2(apiId, stageName, options)
export const deleteHttpApiStage = (apiId: string, stageName: string) =>
  apiGatewayService.deleteStageV2(apiId, stageName)

// Aliases for convenience (matching component expectations)
export const getRoutes = (apiId: string) => apiGatewayService.getRoutes(apiId)
export const createRoute = (apiId: string, options: any) => apiGatewayService.createRoute(apiId, options)
export const deleteRoute = (apiId: string, routeId: string) => apiGatewayService.deleteRoute(apiId, routeId)
export const getIntegrations = (apiId: string) => apiGatewayService.getIntegrations(apiId)
export const createIntegration = (apiId: string, options: any) => apiGatewayService.createIntegration(apiId, options)
export const createMethod = (restApiId: string, resourceId: string, httpMethod: string, options?: any) =>
  apiGatewayService.createMethod(restApiId, resourceId, httpMethod, options)

// REST API v1 Stage aliases
export const createStage = (apiId: string, deploymentId: string, stageName: string) =>
  apiGatewayService.createStage(apiId, deploymentId, stageName)
export const getStages = (apiId: string) => apiGatewayService.getStages(apiId)
export const updateStage = (apiId: string, stageName: string, options?: any) =>
  apiGatewayService.updateStage(apiId, stageName, options)
export const deleteStage = (apiId: string, stageName: string) =>
  apiGatewayService.deleteStage(apiId, stageName)

// Get Invoke URL
export const getRestApiInvokeUrl = (apiId: string, stageName: string) =>
  apiGatewayService.getInvokeUrl(apiId, stageName, 'APIGateway')
export const getHttpApiInvokeUrl = (apiId: string, stageName: string) =>
  apiGatewayService.getInvokeUrl(apiId, stageName, 'ApiGatewayV2')

export default apiGatewayService