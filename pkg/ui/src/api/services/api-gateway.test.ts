import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function mockResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
    clone: () => ({
      text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
    }),
    headers: new Headers({ 'content-type': 'application/json' }),
  }
}

import {
  getRestApis,
  createRestApi,
  deleteRestApi,
  getRestApi,
  updateRestApi,
  getResources,
  getResource,
  createResource,
  deleteResource,
  putMethod,
  getMethod,
  deleteMethod,
  putIntegration,
  getIntegration,
  deleteIntegration,
  createDeployment,
  deleteDeployment,
  getDeployments,
  createRestApiStage,
  getRestApiStages,
  updateRestApiStage,
  deleteRestApiStage,
  getHttpApis,
  createHttpApi,
  deleteHttpApi,
  getHttpApi,
  getHttpRoutes,
  createHttpRoute,
  updateHttpRoute,
  deleteHttpRoute,
  getHttpIntegrations,
  createHttpIntegration,
  updateHttpIntegration,
  deleteHttpApiIntegration,
  getHttpApiStages,
  getHttpApiStage,
  createHttpApiStage,
  updateHttpApiStage,
  deleteHttpApiStage,
  getRoutes,
  createRoute,
  deleteRoute,
  getIntegrations,
  createIntegration,
  createMethod,
  createStage,
  getStages,
  updateStage,
  deleteStage,
  getRestApiInvokeUrl,
  getHttpApiInvokeUrl,
} from './api-gateway'

describe('API Gateway Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('REST API operations', () => {
    it('getRestApis returns normalized items', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Items: [{ Id: 'api1', Name: 'Test', Description: 'desc', CreatedDate: '2024-01-01' }],
      }))
      const result = await getRestApis()
      expect(result.items).toHaveLength(1)
      expect(result.items[0]).toEqual({
        id: 'api1', name: 'Test', description: 'desc', createdDate: '2024-01-01',
      })
    })

    it('getRestApis handles empty Items', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await getRestApis()
      expect(result.items).toBeUndefined()
    })

    it('getRestApis handles empty Items array', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Items: [] }))
      const result = await getRestApis()
      expect(result.items).toEqual([])
    })

    it('getRestApis normalizes lowercase fields', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Items: [{ id: 'api2', name: 'Lower', description: 'desc', createdDate: '2024-02-01' }],
      }))
      const result = await getRestApis()
      expect(result.items[0].id).toBe('api2')
      expect(result.items[0].name).toBe('Lower')
    })

    it('createRestApi sends correct request', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 'new-api' }))
      const result = await createRestApi('MyApi', { Description: 'test' })
      expect(result).toEqual({ id: 'new-api' })
      expect(mockFetch).toHaveBeenCalledTimes(1)
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArgs.name).toBe('MyApi')
      expect(callArgs.Description).toBe('test')
    })

    it('deleteRestApi sends correct body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteRestApi('api123')
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArgs.restApiId).toBe('api123')
    })

    it('getRestApi normalizes response', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Id: 'api1', Name: 'Test' }))
      const result = await getRestApi('api1')
      expect(result.id).toBe('api1')
      expect(result.name).toBe('Test')
    })

    it('getRestApi handles falsy result', async () => {
      mockFetch.mockResolvedValue(mockResponse(null))
      const result = await getRestApi('nonexistent')
      expect(result).toBeNull()
    })

    it('getRestApi normalizes lowercase fields', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 'api2', name: 'Lower', description: 'desc2' }))
      const result = await getRestApi('api2')
      expect(result.id).toBe('api2')
      expect(result.name).toBe('Lower')
      expect(result.description).toBe('desc2')
    })

    it('getResources normalizes items', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Items: [{ Id: 'r1', Path: '/', PathPart: '' }],
      }))
      const result = await getResources('api1')
      expect(result.items).toHaveLength(1)
      expect(result.items[0].id).toBe('r1')
    })

    it('getResources handles missing Items', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await getResources('api1')
      expect(result.items).toEqual([])
    })

    it('getResources handles non-array Items', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Items: 'not-array' }))
      const result = await getResources('api1')
      expect(result.items).toEqual([])
    })

    it('getResource works', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 'r1' }))
      const result = await getResource('api1', 'r1')
      expect(result.id).toBe('r1')
    })

    it('createResource works', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 'r2' }))
      const result = await createResource('api1', 'parent1', 'users')
      expect(result.id).toBe('r2')
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArgs.parentId).toBe('parent1')
      expect(callArgs.pathPart).toBe('users')
    })

    it('deleteResource works', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteResource('api1', 'r1')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('putMethod uppercases httpMethod', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putMethod('api1', 'r1', 'get', { authorizationType: 'NONE' })
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArgs.httpMethod).toBe('GET')
      expect(callArgs.authorizationType).toBe('NONE')
    })

    it('getMethod works', async () => {
      mockFetch.mockResolvedValue(mockResponse({ httpMethod: 'GET' }))
      const result = await getMethod('api1', 'r1', 'GET')
      expect(result.httpMethod).toBe('GET')
    })

    it('deleteMethod works', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteMethod('api1', 'r1', 'GET')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('putIntegration works with uppercase conversion', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putIntegration('api1', 'r1', 'post', { type: 'HTTP', integrationHttpMethod: 'post' })
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArgs.httpMethod).toBe('POST')
      expect(callArgs.integrationHttpMethod).toBe('POST')
    })

    it('getIntegration works', async () => {
      mockFetch.mockResolvedValue(mockResponse({ type: 'HTTP' }))
      const result = await getIntegration('api1', 'r1', 'GET')
      expect(result.type).toBe('HTTP')
    })

    it('deleteIntegration works', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteIntegration('api1', 'r1', 'GET')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('createDeployment passes options', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 'd1' }))
      await createDeployment('api1', { stageName: 'prod', description: 'release' })
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArgs.stageName).toBe('prod')
      expect(callArgs.description).toBe('release')
    })

    it('deleteDeployment works', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteDeployment('api1', 'd1')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('getDeployments normalizes items', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        items: [{ Id: 'd1', Description: 'deploy1' }],
      }))
      const result = await getDeployments('api1')
      expect(result.items[0].id).toBe('d1')
    })

    it('getDeployments handles capitalized Items', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Items: [{ Id: 'd2', Description: 'deploy2' }],
      }))
      const result = await getDeployments('api1')
      expect(result.items[0].id).toBe('d2')
    })
  })

  describe('REST API Stages', () => {
    it('createRestApiStage works', async () => {
      mockFetch.mockResolvedValue(mockResponse({ StageName: 'prod' }))
      const result = await createRestApiStage('api1', 'd1', 'prod')
      expect(result.StageName).toBe('prod')
    })

    it('getRestApiStages normalizes items', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        item: [{ StageName: 'prod', DeploymentId: 'd1' }],
      }))
      const result = await getRestApiStages('api1')
      expect(result.items[0].stageName).toBe('prod')
      expect(result.items[0].deploymentId).toBe('d1')
    })

    it('getRestApiStages handles Item with capital I', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Item: [{ StageName: 'prod' }],
      }))
      const result = await getRestApiStages('api1')
      expect(result.items[0].stageName).toBe('prod')
    })

    it('getRestApiStages handles missing item field', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await getRestApiStages('api1')
      expect(result.items).toEqual([])
    })

    it('updateRestApiStage works', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateRestApiStage('api1', 'prod', { description: 'updated' })
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('deleteRestApiStage works', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteRestApiStage('api1', 'prod')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('HTTP API v2 operations', () => {
    it('getHttpApis returns normalized items', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Items: [{ ApiId: 'http1', Name: 'HTTP API' }],
      }))
      const result = await getHttpApis()
      expect(result.items[0].apiId).toBe('http1')
      expect(result.items[0].name).toBe('HTTP API')
    })

    it('getHttpApis handles no Items', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await getHttpApis()
      expect(result.items).toBeUndefined()
    })

    it('createHttpApi sends with defaults', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ApiId: 'new-api' }))
      await createHttpApi({ name: 'MyHTTP' })
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArgs.Name).toBe('MyHTTP')
      expect(callArgs.ProtocolType).toBe('HTTP')
    })

    it('createHttpApi uses lowercase options', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ApiId: 'new-api' }))
      await createHttpApi({ name: 'MyHTTP', protocolType: 'WEBSOCKET', description: 'ws api' })
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArgs.Name).toBe('MyHTTP')
      expect(callArgs.ProtocolType).toBe('WEBSOCKET')
      expect(callArgs.Description).toBe('ws api')
    })

    it('deleteHttpApi works', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteHttpApi('http1')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('getHttpApi works', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ApiId: 'http1' }))
      const result = await getHttpApi('http1')
      expect(result.ApiId).toBe('http1')
    })

    it('getHttpRoutes normalizes items', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Items: [{ RouteId: 'r1', RouteKey: 'GET /' }],
      }))
      const result = await getHttpRoutes('http1')
      expect(result.items[0].routeId).toBe('r1')
    })

    it('getHttpRoutes handles no Items', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await getHttpRoutes('http1')
      expect(result.items).toBeUndefined()
    })

    it('createHttpRoute maps options to SDK names', async () => {
      mockFetch.mockResolvedValue(mockResponse({ RouteId: 'r1' }))
      await createHttpRoute('http1', { routeKey: 'GET /users', authorizationType: 'NONE', target: 'integ1' })
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArgs.RouteKey).toBe('GET /users')
      expect(callArgs.AuthorizationType).toBe('NONE')
      expect(callArgs.Target).toBe('integ1')
    })

    it('createHttpRoute maps all optional fields', async () => {
      mockFetch.mockResolvedValue(mockResponse({ RouteId: 'r1' }))
      await createHttpRoute('http1', {
        routeKey: 'PUT /items',
        authorizationType: 'CUSTOM',
        authorizerId: 'auth1',
        target: 'integ2',
        apiKeyRequired: true,
        modelSelectionExpression: 'modelExpr',
        operationName: 'myOp',
      })
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArgs.RouteKey).toBe('PUT /items')
      expect(callArgs.AuthorizationType).toBe('CUSTOM')
      expect(callArgs.AuthorizerId).toBe('auth1')
      expect(callArgs.Target).toBe('integ2')
      expect(callArgs.ApiKeyRequired).toBe(true)
      expect(callArgs.ModelSelectionExpression).toBe('modelExpr')
      expect(callArgs.OperationName).toBe('myOp')
    })

    it('updateHttpRoute maps options', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateHttpRoute('http1', 'r1', { routeKey: 'POST /' })
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArgs.RouteKey).toBe('POST /')
    })

    it('updateHttpRoute maps all optional fields', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateHttpRoute('http1', 'r1', {
        routeKey: 'DELETE /',
        authorizationType: 'AWS_IAM',
        authorizerId: 'auth2',
        target: 'integ3',
        apiKeyRequired: false,
        modelSelectionExpression: 'expr2',
        operationName: 'delOp',
      })
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArgs.RouteKey).toBe('DELETE /')
      expect(callArgs.AuthorizationType).toBe('AWS_IAM')
      expect(callArgs.AuthorizerId).toBe('auth2')
      expect(callArgs.Target).toBe('integ3')
      expect(callArgs.ApiKeyRequired).toBe(false)
      expect(callArgs.ModelSelectionExpression).toBe('expr2')
      expect(callArgs.OperationName).toBe('delOp')
    })

    it('deleteHttpRoute works', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteHttpRoute('http1', 'r1')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('getHttpIntegrations normalizes items', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Items: [{ IntegrationId: 'i1', IntegrationType: 'HTTP' }],
      }))
      const result = await getHttpIntegrations('http1')
      expect(result.items[0].integrationId).toBe('i1')
    })

    it('getHttpIntegrations handles lowercase items', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        items: [{ integrationId: 'i2', integrationType: 'HTTP_PROXY' }],
      }))
      const result = await getHttpIntegrations('http1')
      expect(result.items[0].integrationId).toBe('i2')
    })

    it('getHttpIntegrations handles IntegrationID capitalization', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Items: [{ IntegrationID: 'i3', IntegrationType: 'AWS' }],
      }))
      const result = await getHttpIntegrations('http1')
      expect(result.items[0].integrationId).toBe('i3')
    })

    it('createHttpIntegration maps options', async () => {
      mockFetch.mockResolvedValue(mockResponse({ IntegrationId: 'i1' }))
      await createHttpIntegration('http1', { integrationType: 'HTTP', integrationUri: 'https://example.com' })
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArgs.IntegrationType).toBe('HTTP')
      expect(callArgs.IntegrationUri).toBe('https://example.com')
    })

    it('createHttpIntegration maps all optional fields', async () => {
      mockFetch.mockResolvedValue(mockResponse({ IntegrationId: 'i1' }))
      await createHttpIntegration('http1', {
        integrationType: 'HTTP',
        integrationUri: 'https://example.com/api',
        integrationMethod: 'POST',
        payloadFormatVersion: '2.0',
        description: 'test integration',
        timeoutInMillis: 30000,
        credentialsArn: 'arn:aws:iam::123:role/test',
        connectionType: 'VPC_LINK',
        connectionId: 'conn1',
        integrationSubtype: 'EventBridge',
        passthroughBehavior: 'WHEN_NO_MATCH',
        contentHandlingStrategy: 'CONVERT_TO_TEXT',
        templateSelectionExpression: 'tplExpr',
        requestTemplates: { 'application/json': '{ "body": $input.body }' },
      })
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArgs.IntegrationType).toBe('HTTP')
      expect(callArgs.IntegrationUri).toBe('https://example.com/api')
      expect(callArgs.IntegrationMethod).toBe('POST')
      expect(callArgs.PayloadFormatVersion).toBe('2.0')
      expect(callArgs.Description).toBe('test integration')
      expect(callArgs.TimeoutInMillis).toBe(30000)
      expect(callArgs.CredentialsArn).toBe('arn:aws:iam::123:role/test')
      expect(callArgs.ConnectionType).toBe('VPC_LINK')
      expect(callArgs.ConnectionId).toBe('conn1')
      expect(callArgs.IntegrationSubtype).toBe('EventBridge')
      expect(callArgs.PassthroughBehavior).toBe('WHEN_NO_MATCH')
      expect(callArgs.ContentHandlingStrategy).toBe('CONVERT_TO_TEXT')
      expect(callArgs.TemplateSelectionExpression).toBe('tplExpr')
      expect(callArgs.RequestTemplates).toEqual({ 'application/json': '{ "body": $input.body }' })
    })

    it('updateHttpIntegration works', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateHttpIntegration('http1', 'i1', { description: 'updated' })
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('updateHttpIntegration maps all optional fields', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateHttpIntegration('http1', 'i1', {
        integrationType: 'HTTP',
        integrationUri: 'https://example.com/new',
        integrationMethod: 'PUT',
        payloadFormatVersion: '1.0',
        description: 'updated integration',
        timeoutInMillis: 60000,
        credentialsArn: 'arn:aws:iam::123:role/new',
        connectionType: 'INTERNET',
        connectionId: 'conn2',
        integrationSubtype: 'StepFunctions',
        passthroughBehavior: 'NEVER',
        contentHandlingStrategy: 'CONVERT_TO_BINARY',
        templateSelectionExpression: 'tplExpr2',
      })
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArgs.IntegrationType).toBe('HTTP')
      expect(callArgs.IntegrationUri).toBe('https://example.com/new')
      expect(callArgs.IntegrationMethod).toBe('PUT')
      expect(callArgs.PayloadFormatVersion).toBe('1.0')
      expect(callArgs.Description).toBe('updated integration')
      expect(callArgs.TimeoutInMillis).toBe(60000)
      expect(callArgs.CredentialsArn).toBe('arn:aws:iam::123:role/new')
      expect(callArgs.ConnectionType).toBe('INTERNET')
      expect(callArgs.ConnectionId).toBe('conn2')
      expect(callArgs.IntegrationSubtype).toBe('StepFunctions')
      expect(callArgs.PassthroughBehavior).toBe('NEVER')
      expect(callArgs.ContentHandlingStrategy).toBe('CONVERT_TO_BINARY')
      expect(callArgs.TemplateSelectionExpression).toBe('tplExpr2')
    })

    it('deleteHttpApiIntegration works', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteHttpApiIntegration('http1', 'i1')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('getHttpApiStages normalizes items', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        items: [{ StageName: 'prod' }],
      }))
      const result = await getHttpApiStages('http1')
      expect(result.items[0].stageName).toBe('prod')
    })

    it('getHttpApiStages handles capitalized Items', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Items: [{ StageName: 'staging' }],
      }))
      const result = await getHttpApiStages('http1')
      expect(result.items[0].stageName).toBe('staging')
    })

    it('getHttpApiStage works', async () => {
      mockFetch.mockResolvedValue(mockResponse({ StageName: 'prod' }))
      const result = await getHttpApiStage('http1', 'prod')
      expect(result.StageName).toBe('prod')
    })

    it('createHttpApiStage maps options', async () => {
      mockFetch.mockResolvedValue(mockResponse({ StageName: 'prod' }))
      await createHttpApiStage('http1', { stageName: 'prod', autoDeploy: true })
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArgs.StageName).toBe('prod')
      expect(callArgs.AutoDeploy).toBe(true)
    })

    it('createHttpApiStage maps all options', async () => {
      mockFetch.mockResolvedValue(mockResponse({ StageName: 'prod' }))
      await createHttpApiStage('http1', {
        stageName: 'prod',
        description: 'production stage',
        stageVariables: { VAR: 'val' },
        autoDeploy: true,
        defaultRouteSettings: { DataTraceEnabled: true },
        accessLogSettings: { Format: '$context.requestId' },
        tags: { Env: 'prod' },
      })
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArgs.StageName).toBe('prod')
      expect(callArgs.Description).toBe('production stage')
      expect(callArgs.StageVariables).toEqual({ VAR: 'val' })
      expect(callArgs.AutoDeploy).toBe(true)
      expect(callArgs.DefaultRouteSettings).toEqual({ DataTraceEnabled: true })
      expect(callArgs.AccessLogSettings).toEqual({ Format: '$context.requestId' })
      expect(callArgs.Tags).toEqual({ Env: 'prod' })
    })

    it('updateHttpApiStage works', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateHttpApiStage('http1', 'prod', { description: 'updated' })
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('updateHttpApiStage maps all options', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateHttpApiStage('http1', 'prod', {
        description: 'updated stage',
        stageVariables: { KEY: 'val' },
        autoDeploy: false,
        defaultRouteSettings: { DetailedMetricsEnabled: true },
        accessLogSettings: { Format: '$context.requestId' },
      })
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArgs.Description).toBe('updated stage')
      expect(callArgs.StageVariables).toEqual({ KEY: 'val' })
      expect(callArgs.AutoDeploy).toBe(false)
      expect(callArgs.DefaultRouteSettings).toEqual({ DetailedMetricsEnabled: true })
      expect(callArgs.AccessLogSettings).toEqual({ Format: '$context.requestId' })
    })

    it('deleteHttpApiStage works', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteHttpApiStage('http1', 'prod')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('getRestApiInvokeUrl calls GetInvokeUrl with APIGateway prefix', async () => {
      mockFetch.mockResolvedValue(mockResponse({ url: 'https://api.example.com' }))
      const result = await getRestApiInvokeUrl('api1', 'prod')
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('APIGateway.GetInvokeUrl')
    })

    it('getHttpApiInvokeUrl calls GetInvokeUrl with ApiGatewayV2 prefix', async () => {
      mockFetch.mockResolvedValue(mockResponse({ url: 'https://http-api.example.com' }))
      const result = await getHttpApiInvokeUrl('http1', 'prod')
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('ApiGatewayV2.GetInvokeUrl')
    })
  })

  describe('Alias functions', () => {
    it('getRoutes aliases getHttpRoutes', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Items: [] }))
      const result = await getRoutes('http1')
      expect(result.items).toEqual([])
    })

    it('createRoute aliases createHttpRoute', async () => {
      mockFetch.mockResolvedValue(mockResponse({ RouteId: 'r1' }))
      await createRoute('http1', { routeKey: 'GET /' })
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('deleteRoute aliases deleteHttpRoute', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteRoute('http1', 'r1')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('getIntegrations aliases getHttpIntegrations', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Items: [] }))
      const result = await getIntegrations('http1')
      expect(result.items).toEqual([])
    })

    it('createIntegration aliases createHttpIntegration', async () => {
      mockFetch.mockResolvedValue(mockResponse({ IntegrationId: 'i1' }))
      await createIntegration('http1', { integrationType: 'HTTP' })
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('createMethod aliases putMethod', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await createMethod('api1', 'r1', 'POST')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Stage aliases (REST v1)', () => {
    it('createStage works', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await createStage('api1', 'd1', 'prod')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('getStages works', async () => {
      mockFetch.mockResolvedValue(mockResponse({ item: [] }))
      const result = await getStages('api1')
      expect(result.items).toEqual([])
    })

    it('updateStage works', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateStage('api1', 'prod', { description: 'updated' })
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('deleteStage works', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteStage('api1', 'prod')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error handling', () => {
    it('throws Error on 500 status code', async () => {
      mockFetch.mockResolvedValue(mockResponse('Server error', 500))
      await expect(getRestApis()).rejects.toThrow('Server error')
    })

    it('throws Error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(getRestApis()).rejects.toThrow('Network error')
    })

    it('throws generic error on network failure with empty message', async () => {
      mockFetch.mockRejectedValue({})
      await expect(getRestApis()).rejects.toThrow('Request failed')
    })

    it('returns notFound object on 404', async () => {
      mockFetch.mockResolvedValue(mockResponse('Not found', 404))
      const result = await getRestApis()
      expect(result.notFound).toBe(true)
      expect(result.error).toBeDefined()
    })

    it('returns empty array on 400', async () => {
      mockFetch.mockResolvedValue(mockResponse('Bad request', 400))
      const result = await getRestApis()
      expect(result.Items).toEqual([])
      expect(result.error).toBeDefined()
    })
  })

  describe('X-Amz-Target header', () => {
    it('uses APIGateway prefix for REST operations', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await getRestApis()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('APIGateway.GetRestApis')
    })

    it('uses ApiGatewayV2 prefix for HTTP v2 operations', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Items: [] }))
      await getHttpApis()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('ApiGatewayV2.GetApis')
    })
  })
})
