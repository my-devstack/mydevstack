import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { PROXY_BACKEND } from '@/config'
import { useSettingsStore } from '@/stores/settings'
import { useUIStore } from '@/stores/ui'

// AWS Signature Version 4 Signer (mock implementation for local development)
class AWSSigV4Signer {
  constructor(
    _accessKey: string,
    _secretKey: string,
    _region: string,
    _service: string
  ) {
    // Parameters kept for future real SigV4 signing implementation
  }

  sign(): Record<string, string> {
    // For local development with MiniStack/LocalStack, we typically don't need real SigV4 signing
    // This is a placeholder for production AWS environments
    return {
      'X-Mock-Signature': 'local-dev-signature',
    }
  }
}

// Parse XML response
export function parseXML<T>(xml: string): T | null {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    console.error('XML Parse Error:', parseError.textContent)
    return null
  }

  return xmlToJson(doc.documentElement) as T
}

// Convert XML DOM to JSON
function xmlToJson(node: Element): unknown {
  const result: Record<string, unknown> = {}

  // Handle attributes
  if (node.attributes && node.attributes.length > 0) {
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i]
      result[`@${attr.name}`] = attr.value
    }
  }

  // Handle child nodes
  if (node.childNodes && node.childNodes.length > 0) {
    const textContent: string[] = []
    
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i]
      
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim()
        if (text) {
          textContent.push(text)
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const childElement = child as Element
        const childName = childElement.tagName
        const childValue = xmlToJson(childElement)
        
        if (result[childName]) {
          if (Array.isArray(result[childName])) {
            (result[childName] as unknown[]).push(childValue)
          } else {
            result[childName] = [result[childName], childValue]
          }
        } else {
          result[childName] = childValue
        }
      }
    }

    if (textContent.length > 0 && Object.keys(result).length === 0) {
      return textContent.join('')
    }

    if (textContent.length === 1 && Object.keys(result).filter(k => !k.startsWith('@')).length === 0) {
      result['#text'] = textContent[0]
    }
  }

  return result
}

// API Error class
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public service: string,
    public errorCode?: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// Create axios instance
function createApiClient(): AxiosInstance {
  const settingsStore = useSettingsStore()
  const uiStore = useUIStore()

  // Always use the fixed endpoint from config
  const baseURL = PROXY_BACKEND
  
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  // Request interceptor
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const signer = new AWSSigV4Signer(
        settingsStore.accessKey,
        settingsStore.secretKey,
        settingsStore.region,
        extractService(config.url || '')
      )

      const signedHeaders = signer.sign()

      Object.entries(signedHeaders).forEach(([key, value]) => {
        config.headers[key] = value
      })

      return config
    },
    (error) => {
      uiStore.notifyError('Request Error', error.message)
      return Promise.reject(error)
    }
  )

  // Response interceptor - pass through without auto XML parsing
  // Each service handles its own response parsing
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response
    },
    (error) => {
      const { response, request, message } = error
      
      // Check for CORS/network errors
      const isCorsError = 
        message?.includes('Network Error') ||
        message?.includes('Failed to fetch') ||
        message?.includes('NetworkError') ||
        request?.readyState === 0 ||
        !response
      
      if (isCorsError) {
        uiStore.notifyError(
          'Connection Error',
          'Cannot reach the AWS endpoint. Make sure your AWS emulator is running on port 4566.'
        )
        throw new APIError('Network Error - CORS or Connection Issue', 0, 'network', 'NETWORK_ERROR')
      }
      
      if (response) {
        const service = extractService(error.config?.url || '')
        
        // Try to extract error info from various AWS error formats
        const errorData = response.data?.Error || 
                          response.data?.message || 
                          response.data?.Message ||
                          {}
        
        const errorMessage = typeof errorData === 'string' 
          ? errorData 
          : (errorData.Message || errorData.message || errorData.Code || error.message)
        
        // Log but don't show toast for client errors (400, 401, 403, 404)
        // These are expected when resources don't exist
        if (response.status >= 500) {
          uiStore.notifyError(
            `Server Error (${response.status})`,
            errorMessage
          )
        }

        throw new APIError(
          errorMessage,
          response.status,
          service,
          typeof errorData === 'string' ? undefined : (errorData.Code || errorData.code),
          typeof errorData === 'object' ? errorData : {}
        )
      }

      return Promise.reject(error)
    }
  )

  return client
}

// Extract service name from URL
function extractService(url: string): string {
  // Match pattern like /iam?, /iam/, /iam?Action= or just /iam
  const match = url.match(/\/(s3|lambda|dynamodb|sqs|sns|iam|kms|secretsmanager|events|cognito|apigateway|kinesis|cloudformation|ssm|elasticache|rds)(?:\?|\/|$)/)
  return match ? match[1] : 'unknown'
}

// Singleton API client
let apiClient: AxiosInstance | null = null

export function getApiClient(): AxiosInstance {
  if (!apiClient) {
    apiClient = createApiClient()
  }
  return apiClient
}

// Generic API methods
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    getApiClient().get<T>(url, config),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    getApiClient().post<T>(url, data, config),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    getApiClient().put<T>(url, data, config),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    getApiClient().patch<T>(url, data, config),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    getApiClient().delete<T>(url, config),

  head: <T>(url: string, config?: AxiosRequestConfig) =>
    getApiClient().head<T>(url, config),
}

export default api
