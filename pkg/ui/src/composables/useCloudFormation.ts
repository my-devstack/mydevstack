import { ref, shallowRef } from 'vue'
import { useUIStore } from '@/stores/ui'
import * as cfApi from '@/api/services/cloudformation'
import type { CloudFormationStack } from '@/api/types/aws'

export function useCloudFormation() {
  const uiStore = useUIStore()

  const stacks = ref<CloudFormationStack[]>([])
  const loading = shallowRef(false)
  const error = shallowRef<string | null>(null)
  const selectedStackName = ref<string | null>(null)

  async function fetchStacks() {
    loading.value = true
    error.value = null
    try {
      const result = await cfApi.listStacks()
      stacks.value = result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load stacks'
      uiStore.notifyError('Failed to load stacks', error.value)
    } finally {
      loading.value = false
    }
  }

  async function createStack(params: cfApi.CreateStackRequest) {
    loading.value = true
    error.value = null
    try {
      await cfApi.createStack(params)
      uiStore.notifySuccess('Stack created', `Stack "${params.StackName}" created successfully`)
      await fetchStacks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create stack'
      uiStore.notifyError('Failed to create stack', error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteStack(stackName: string) {
    loading.value = true
    error.value = null
    try {
      await cfApi.deleteStack({ StackName: stackName })
      uiStore.notifySuccess('Stack deleted', `Stack "${stackName}" deleted successfully`)
      if (selectedStackName.value === stackName) {
        selectedStackName.value = null
      }
      await fetchStacks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete stack'
      uiStore.notifyError('Failed to delete stack', error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  function selectStack(stack: CloudFormationStack | null) {
    if (stack === null) {
      selectedStackName.value = null
    } else {
      // Toggle: if same stack selected, deselect; else select
      selectedStackName.value = selectedStackName.value === stack.StackName ? null : stack.StackName
    }
  }

  function clearError() {
    error.value = null
  }

  async function getStackDetails(stackName: string) {
    return cfApi.getStackDetails({ StackName: stackName })
  }

  async function getStackTemplate(stackName: string) {
    return cfApi.getStackTemplate(stackName)
  }

  return {
    stacks,
    loading,
    error,
    selectedStackName,
    fetchStacks,
    createStack,
    deleteStack,
    selectStack,
    clearError,
    getStackDetails,
    getStackTemplate,
  }
}
