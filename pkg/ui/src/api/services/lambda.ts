/**
 * Lambda Service API Client
 * REST client for Lambda via Go proxy
 * @module api/services/lambda
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

export class LambdaService {
  private baseUrl: string

  constructor() {
    this.baseUrl = PROXY_BACKEND.replace(/\/$/, '')
  }

  private async request(method: string, path: string, options?: { body?: unknown; query?: Record<string, string | undefined> }): Promise<any> {
    let url = `${this.baseUrl}${path}`

    if (options?.query) {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) {
          params.set(key, value)
        }
      }
      const qs = params.toString()
      if (qs) url += `?${qs}`
    }

    const fetchOptions: RequestInit = { method }

    if (options?.body !== undefined) {
      fetchOptions.headers = { 'Content-Type': 'application/json' }
      fetchOptions.body = JSON.stringify(options.body)
    }

    try {
      const response = await fetch(url, fetchOptions)

      if (!response.ok) {
        const errorText = await response.text()
        throw new APIError(`Lambda ${method} ${path} failed: ${errorText}`, response.status, 'lambda')
      }

      const text = await response.text()
      if (!text) return {}
      return JSON.parse(text)
    } catch (error) {
      if (error instanceof APIError) throw error
      console.error(`Lambda ${method} ${path} error:`, error)
      throw new APIError(`Failed to ${method} ${path}`, 500, 'lambda')
    }
  }

  async listFunctions(): Promise<any> {
    const response = await this.request('GET', '/lambda/functions')
    return {
      functions: response.Functions || [],
      ...response,
    }
  }

  async createFunction(params: {
    FunctionName: string
    Runtime: string
    Handler: string
    Role: string
    MemorySize?: number
    Timeout?: number
    Code?: { ZipFile?: Uint8Array | string }
    Architectures?: string[]
    Environment?: { Variables?: Record<string, string> }
    VpcConfig?: { SubnetIds: string[]; SecurityGroupIds: string[] }
  }): Promise<any> {
    const code = params.Code
    if (code?.ZipFile && code.ZipFile instanceof Uint8Array) {
      let binary = ''
      const bytes = code.ZipFile
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      code.ZipFile = btoa(binary)
    }
    return this.request('POST', '/lambda/functions', { body: params })
  }

  async getFunction(FunctionName: string): Promise<any> {
    return this.request('GET', `/lambda/functions/${encodeURIComponent(FunctionName)}`)
  }

  async deleteFunction(FunctionName: string): Promise<any> {
    return this.request('DELETE', `/lambda/functions/${encodeURIComponent(FunctionName)}`)
  }

  async invoke(FunctionName: string, payload?: string, options?: { invocationType?: string }): Promise<any> {
    const url = `${this.baseUrl}/lambda/functions/${encodeURIComponent(FunctionName)}/invocations`

    let payloadBase64 = ''
    if (payload) {
      const encoder = new TextEncoder()
      const bytes = encoder.encode(payload)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      payloadBase64 = btoa(binary)
    }

    const body: Record<string, string> = {}
    if (payloadBase64) body.Payload = payloadBase64
    if (options?.invocationType) body.InvocationType = options.invocationType

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const text = await response.text()
      const result: any = { payload: text }

      try {
        const data = JSON.parse(text)
        if (data.Payload) {
          try {
            const binary = atob(data.Payload)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i)
            }
            const decoder = new TextDecoder()
            result.payload = decoder.decode(bytes)
          } catch {
            result.payload = data.Payload
          }
        }
        if (data.FunctionError) {
          result.functionError = data.FunctionError
        }
      } catch {
        // Response is not JSON
      }

      return {
        statusCode: response.status,
        payload: result.payload,
      }
    } catch (error) {
      throw new APIError('Failed to invoke function', 500, 'lambda')
    }
  }

  async updateFunctionConfiguration(params: {
    FunctionName: string
    Description?: string
    MemorySize?: number
    Timeout?: number
    Environment?: { Variables?: Record<string, string> }
  }): Promise<any> {
    return this.request('PUT', `/lambda/functions/${encodeURIComponent(params.FunctionName)}`, { body: params })
  }

  async updateFunctionCode(params: {
    FunctionName: string
    ZipFile?: string
    S3Bucket?: string
    S3Key?: string
  }): Promise<any> {
    return this.request('PUT', `/lambda/functions/${encodeURIComponent(params.FunctionName)}/code`, { body: params })
  }

  async getFunctionConfiguration(FunctionName: string): Promise<any> {
    return this.request('GET', `/lambda/functions/${encodeURIComponent(FunctionName)}/configuration`)
  }

  async listEventSourceMappings(params?: { FunctionName?: string; MaxItems?: number }): Promise<any> {
    return this.request('GET', '/lambda/event-source-mappings', {
      query: params
        ? {
            FunctionName: params.FunctionName,
            MaxItems: params.MaxItems !== undefined ? String(params.MaxItems) : undefined,
          }
        : undefined,
    })
  }

  async createEventSourceMapping(params: {
    FunctionName: string
    EventSourceArn: string
    BatchSize?: number
    MaximumBatchingWindowInSeconds?: number
    ParallelizationFactor?: number
    DestinationConfig?: {
      OnSuccess?: { Destination: string }
      OnFailure?: { Destination: string }
    }
  }): Promise<any> {
    return this.request('POST', '/lambda/event-source-mappings', { body: params })
  }

  async getEventSourceMapping(UUID: string): Promise<any> {
    return this.request('GET', `/lambda/event-source-mappings/${encodeURIComponent(UUID)}`)
  }

  async deleteEventSourceMapping(UUID: string): Promise<any> {
    return this.request('DELETE', `/lambda/event-source-mappings/${encodeURIComponent(UUID)}`)
  }
}

export const lambdaService = new LambdaService()

export const listFunctions = () => lambdaService.listFunctions()
export const createFunction = (params: Parameters<LambdaService['createFunction']>[0]) =>
  lambdaService.createFunction(params)
export const getFunction = (FunctionName: string) => lambdaService.getFunction(FunctionName)
export const deleteFunction = (FunctionName: string) => lambdaService.deleteFunction(FunctionName)
export const invoke = (FunctionName: string, payload?: string, options?: { invocationType?: string }) =>
  lambdaService.invoke(FunctionName, payload, options)
export const invokeFunction = (FunctionName: string, payload?: string) =>
  lambdaService.invoke(FunctionName, payload)
export const updateFunctionConfiguration = (params: Parameters<LambdaService['updateFunctionConfiguration']>[0]) =>
  lambdaService.updateFunctionConfiguration(params)
export const updateFunctionCode = (params: Parameters<LambdaService['updateFunctionCode']>[0]) =>
  lambdaService.updateFunctionCode(params)
export const getFunctionConfiguration = (FunctionName: string) =>
  lambdaService.getFunctionConfiguration(FunctionName)

// Event Source Mapping API
export const listEventSourceMappings = (params?: { FunctionName?: string; MaxItems?: number }) =>
  lambdaService.listEventSourceMappings(params)
export const createEventSourceMapping = (params: Parameters<LambdaService['createEventSourceMapping']>[0]) =>
  lambdaService.createEventSourceMapping(params)
export const getEventSourceMapping = (UUID: string) => lambdaService.getEventSourceMapping(UUID)
export const deleteEventSourceMapping = (UUID: string) => lambdaService.deleteEventSourceMapping(UUID)

export const lambda = {
  listFunctions: () => lambdaService.listFunctions(),
  createFunction: (params: any) => lambdaService.createFunction(params),
  getFunction: (FunctionName: string) => lambdaService.getFunction(FunctionName),
  deleteFunction: (FunctionName: string) => lambdaService.deleteFunction(FunctionName),
  invoke: (FunctionName: string, payload?: string, options?: { invocationType?: string }) =>
    lambdaService.invoke(FunctionName, payload, options),
  updateFunctionConfiguration: (params: any) => lambdaService.updateFunctionConfiguration(params),
  updateFunctionCode: (params: any) => lambdaService.updateFunctionCode(params),
  getFunctionConfiguration: (FunctionName: string) => lambdaService.getFunctionConfiguration(FunctionName),
  listEventSourceMappings: (params?: { FunctionName?: string; MaxItems?: number }) =>
    lambdaService.listEventSourceMappings(params),
  createEventSourceMapping: (params: any) => lambdaService.createEventSourceMapping(params),
  getEventSourceMapping: (UUID: string) => lambdaService.getEventSourceMapping(UUID),
  deleteEventSourceMapping: (UUID: string) => lambdaService.deleteEventSourceMapping(UUID),
}

export default lambda
