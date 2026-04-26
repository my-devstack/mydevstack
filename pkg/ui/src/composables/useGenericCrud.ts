import { ref } from 'vue'
import { api, APIError, type AxiosRequestConfig } from '@/api/client'

export interface UseGenericCrudOptions {
  getEndpoint: string
  createEndpoint?: string
  updateEndpoint?: string
  deleteEndpoint?: string
  getParams?: (item: Record<string, unknown>) => Record<string, string>
}

export interface UseGenericCrudReturn<T> {
  items: ref<T[]>
  loading: ref<boolean>
  error: ref<string | null>
  selectedItem: ref<T | null>
  fetch: () => Promise<T[]>
  create: (data: unknown) => Promise<T>
  update: (id: string, data: unknown) => Promise<T>
  remove: (id: string) => Promise<void>
  select: (item: T | null) => void
  clearError: () => void
}

export function useGenericCrud<T extends Record<string, unknown>>(
  options: UseGenericCrudOptions
): UseGenericCrudReturn<T> {
  const items = ref<T[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedItem = ref<T | null>(null)

  async function fetch(): Promise<T[]> {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<T[]>(options.getEndpoint)
      items.value = response.data
      return response.data
    } catch (e) {
      const message = e instanceof APIError ? e.message : 'Failed to fetch'
      error.value = message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(data: unknown): Promise<T> {
    if (!options.createEndpoint) {
      throw new Error('Create endpoint not configured')
    }
    loading.value = true
    error.value = null
    try {
      const response = await api.post<T>(options.createEndpoint, data)
      await fetch()
      return response.data
    } catch (e) {
      const message = e instanceof APIError ? e.message : 'Failed to create'
      error.value = message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, data: unknown): Promise<T> {
    if (!options.updateEndpoint) {
      throw new Error('Update endpoint not configured')
    }
    loading.value = true
    error.value = null
    try {
      const endpoint = options.getParams
        ? options.updateEndpoint + '?' + new URLSearchParams(options.getParams({ id } as unknown as Record<string, unknown>)).toString()
        : `${options.updateEndpoint}/${id}`
      const response = await api.put<T>(endpoint, data)
      await fetch()
      return response.data
    } catch (e) {
      const message = e instanceof APIError ? e.message : 'Failed to update'
      error.value = message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string): Promise<void> {
    if (!options.deleteEndpoint) {
      throw new Error('Delete endpoint not configured')
    }
    loading.value = true
    error.value = null
    try {
      const endpoint = options.getParams
        ? options.deleteEndpoint + '?' + new URLSearchParams(options.getParams({ id } as unknown as Record<string, unknown>)).toString()
        : `${options.deleteEndpoint}/${id}`
      await api.delete(endpoint)
      await fetch()
    } catch (e) {
      const message = e instanceof APIError ? e.message : 'Failed to delete'
      error.value = message
      throw e
    } finally {
      loading.value = false
    }
  }

  function select(item: T | null) {
    selectedItem.value = item
  }

  function clearError() {
    error.value = null
  }

  return {
    items,
    loading,
    error,
    selectedItem,
    fetch,
    create,
    update,
    remove,
    select,
    clearError,
  }
}