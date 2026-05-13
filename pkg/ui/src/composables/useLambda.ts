import { ref } from 'vue'
import { useToast } from '@/composables/useToast'
import type { LambdaFunction } from '@/api/types/aws'
import * as lambdaApi from '@/api/services/lambda'

export function useLambda() {
  const toast = useToast()

  const functions = ref<LambdaFunction[]>([])
  const loading = ref(false)
  const selectedFunction = ref<LambdaFunction | null>(null)
  const creating = ref(false)
  const updating = ref(false)
  const invokeLoading = ref(false)

  const DEFAULT_ROLE_ARN = 'arn:aws:iam::123456789012:role/test'

  async function loadFunctions() {
    loading.value = true
    try {
      const result = await lambdaApi.listFunctions()
      functions.value = result.functions || []
    } catch (error) {
      toast.error('Failed to load Lambda functions: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  async function createFunction(data: {
    functionName: string
    runtime: string
    handler: string
    memory: number
    timeout: number
    roleArn: string
    zipFile: File | null
    architecture: string
    environment: string
  }) {
    creating.value = true
    try {
      let zipFileData: Uint8Array | undefined
      if (data.zipFile) {
        zipFileData = await data.zipFile.arrayBuffer().then(buf => new Uint8Array(buf))
      }

      let environment: { Variables: Record<string, string> } | undefined
      if (data.environment.trim()) {
        try {
          environment = { Variables: JSON.parse(data.environment) }
        } catch {
          toast.error('Invalid environment: Environment must be valid JSON')
          return
        }
      }

      await lambdaApi.createFunction({
        FunctionName: data.functionName,
        Runtime: data.runtime,
        Handler: data.handler,
        MemorySize: data.memory,
        Timeout: data.timeout,
        Role: data.roleArn || DEFAULT_ROLE_ARN,
        Code: zipFileData ? { ZipFile: zipFileData } : undefined,
        Architectures: [data.architecture],
        Environment: environment,
      })

      toast.success(`Function "${data.functionName}" created successfully`)
      await loadFunctions()
    } catch (error) {
      toast.error('Failed to create function: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      creating.value = false
    }
  }

  async function updateFunctionConfiguration(functionName: string, memory: number, timeout: number) {
    updating.value = true
    try {
      await lambdaApi.updateFunctionConfiguration({
        FunctionName: functionName,
        MemorySize: memory,
        Timeout: timeout,
      })
      toast.success('Function configuration updated successfully')
      await loadFunctions()
    } catch (error) {
      toast.error('Failed to update configuration: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      updating.value = false
    }
  }

  async function updateFunctionCode(functionName: string, zipFile: File) {
    updating.value = true
    try {
      const zipFileData = await zipFile.arrayBuffer().then(buf => new Uint8Array(buf))
      await lambdaApi.updateFunctionCode({
        FunctionName: functionName,
        ZipFile: zipFileData,
      })
      toast.success('Function code updated successfully')
      await loadFunctions()
    } catch (error) {
      toast.error('Failed to update code: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      updating.value = false
    }
  }

  async function deleteFunction(functionName: string) {
    loading.value = true
    try {
      await lambdaApi.deleteFunction(functionName)
      toast.success(`Function "${functionName}" deleted successfully`)
      if (selectedFunction.value?.FunctionName === functionName) {
        selectedFunction.value = null
      }
      await loadFunctions()
    } catch (error) {
      toast.error('Failed to delete function: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      loading.value = false
    }
  }

  async function invokeFunction(functionName: string, payload: string) {
    invokeLoading.value = true
    try {
      const result = await lambdaApi.invoke(functionName, payload)
      return result
    } catch (error) {
      toast.error('Failed to invoke function: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      invokeLoading.value = false
    }
  }

  return {
    functions,
    loading,
    selectedFunction,
    creating,
    updating,
    invokeLoading,
    DEFAULT_ROLE_ARN,
    loadFunctions,
    createFunction,
    updateFunctionConfiguration,
    updateFunctionCode,
    deleteFunction,
    invokeFunction,
  }
}