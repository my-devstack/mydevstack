import { ref } from 'vue'
import { useToast } from '@/composables/useToast'
import type { LambdaEventSourceMapping } from '@/api/types/aws'
import * as lambdaApi from '@/api/services/lambda'

export function useLambdaEventSourceMapping() {
  const toast = useToast()

  const mappings = ref<LambdaEventSourceMapping[]>([])
  const loading = ref(false)
  const selectedMapping = ref<LambdaEventSourceMapping | null>(null)
  const creating = ref(false)
  const deleting = ref(false)

  async function loadMappings(functionName?: string) {
    loading.value = true
    try {
      const result = await lambdaApi.listEventSourceMappings(
        functionName ? { FunctionName: functionName } : undefined
      )
      mappings.value = result.EventSourceMappings || []
    } catch (error) {
      toast.error('Failed to load event source mappings: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  async function createMapping(data: {
    functionName: string
    eventSourceArn: string
    batchSize: number
    maxBatchingWindow: number
    parallelizationFactor: number
    onSuccessDestination?: string
    onFailureDestination?: string
  }) {
    creating.value = true
    try {
      const params: Parameters<typeof lambdaApi.createEventSourceMapping>[0] = {
        FunctionName: data.functionName,
        EventSourceArn: data.eventSourceArn,
        BatchSize: data.batchSize,
        MaximumBatchingWindowInSeconds: data.maxBatchingWindow,
        ParallelizationFactor: data.parallelizationFactor,
      }

      if (data.onSuccessDestination || data.onFailureDestination) {
        params.DestinationConfig = {}
        if (data.onSuccessDestination) {
          params.DestinationConfig.OnSuccess = { Destination: data.onSuccessDestination }
        }
        if (data.onFailureDestination) {
          params.DestinationConfig.OnFailure = { Destination: data.onFailureDestination }
        }
      }

      await lambdaApi.createEventSourceMapping(params)
      toast.success(`Mapping for "${data.functionName}" created successfully`)
      await loadMappings()
    } catch (error) {
      toast.error('Failed to create event source mapping: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      creating.value = false
    }
  }

  async function deleteMapping(uuid: string) {
    deleting.value = true
    try {
      await lambdaApi.deleteEventSourceMapping(uuid)
      toast.success('Mapping deleted successfully')
      if (selectedMapping.value?.UUID === uuid) {
        selectedMapping.value = null
      }
      await loadMappings()
    } catch (error) {
      toast.error('Failed to delete event source mapping: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      deleting.value = false
    }
  }

  async function getMapping(uuid: string) {
    try {
      const result = await lambdaApi.getEventSourceMapping(uuid)
      selectedMapping.value = result
      return result
    } catch (error) {
      toast.error('Failed to get event source mapping: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    }
  }

  return {
    mappings,
    loading,
    selectedMapping,
    creating,
    deleting,
    loadMappings,
    createMapping,
    deleteMapping,
    getMapping,
  }
}