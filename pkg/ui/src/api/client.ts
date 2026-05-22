import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { PROXY_BACKEND } from '@/config'
import { useToast } from '@/composables/useToast'

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
  const toast = useToast()

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
      return config
    },
    (error) => {
      toast.error('Request Error: ' + error.message)
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
        toast.error('Cannot reach the AWS endpoint. Make sure your AWS emulator is running on port 4566.')
        throw new APIError('Network Error - CORS or Connection Issue', 0, 'network', 'NETWORK_ERROR')
      }
      
      if (response) {
        const service = 'unknown'
        
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
          toast.error(`Server Error (${response.status}): ${errorMessage}`)
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
