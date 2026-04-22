<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { useContentReload } from '@/composables/useContentReload'
import { CodeBracketIcon } from '@heroicons/vue/24/outline'
import * as lambda from '@/api/services/lambda'
import type { LambdaFunction } from '@/api/types/aws'
import LambdaFunctionsList from '@/components/lambda/LambdaFunctionsList.vue'
import LambdaCreateModal from '@/components/lambda/LambdaCreateModal.vue'
import LambdaEditModal from '@/components/lambda/LambdaEditModal.vue'
import LambdaDeleteModal from '@/components/lambda/LambdaDeleteModal.vue'
import LambdaCodeExamples from '@/components/lambda/LambdaCodeExamples.vue'

const settingsStore = useSettingsStore()
const toast = useToast()
const { reloadTrigger } = useContentReload()

// State
const functions = ref<LambdaFunction[]>([])
const loading = ref(false)
const selectedFunction = ref<LambdaFunction | null>(null)
const functionsListRef = ref<InstanceType<typeof LambdaFunctionsList> | null>(null)

// Modal state
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)

// Form state
const creating = ref(false)
const invokeLoading = ref(false)
const updating = ref(false)

// Edit form
const editForm = ref({
  memory: 128,
  timeout: 30,
})

const DEFAULT_ROLE_ARN = 'arn:aws:iam::123456789012:role/test'

// Load functions
async function loadFunctions() {
  loading.value = true
  try {
    const result = await lambda.listFunctions()
    functions.value = result.functions || []
  } catch (error) {
    console.error('Error loading functions:', error)
    toast.error('Failed to load Lambda functions')
  } finally {
    loading.value = false
  }
}

// Create function
async function handleCreate(data: {
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
        toast.error('Invalid environment JSON format')
        creating.value = false
        return
      }
    }

    await lambda.createFunction({
      FunctionName: data.functionName,
      Runtime: data.runtime,
      Handler: data.handler,
      MemorySize: data.memory,
      Timeout: data.timeout,
      Role: data.roleArn,
      Code: zipFileData ? { ZipFile: zipFileData } : undefined,
      Architectures: [data.architecture],
      Environment: environment,
    })
    toast.success('Function created successfully')
    showCreateModal.value = false
    loadFunctions()
  } catch (error) {
    console.error('Error creating function:', error)
    toast.error('Failed to create function')
  } finally {
    creating.value = false
  }
}

// Invoke function (moved from modal to inline)
async function handleInvokeFromList(func: LambdaFunction, payload: string, invocationType: string) {
  invokeLoading.value = true
  let result = ''
  try {
    let finalPayload: string
    try {
      finalPayload = JSON.stringify(JSON.parse(payload))
    } catch {
      finalPayload = payload
    }

    const response = await lambda.invoke(
      func.FunctionName,
      finalPayload,
      { invocationType }
    )
    result = response?.payload || response?.Payload || 'Success (no output)'
  } catch (error) {
    console.error('Error invoking function:', error)
    result = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  } finally {
    invokeLoading.value = false
  }
  // Update result in the list
  functionsListRef.value?.updateInvokeResult(func.FunctionName, result)
}

// Open edit modal
function openEditModal(func: LambdaFunction) {
  selectedFunction.value = func
  editForm.value = {
    memory: func.MemorySize || 128,
    timeout: func.Timeout || 30,
  }
  showEditModal.value = true
}

// Update function configuration
async function handleUpdateConfig(memory: number, timeout: number) {
  if (!selectedFunction.value) return

  updating.value = true
  try {
    await lambda.updateFunctionConfiguration({
      FunctionName: selectedFunction.value.FunctionName,
      MemorySize: memory,
      Timeout: timeout,
    })
    toast.success('Function configuration updated')
    showEditModal.value = false
    loadFunctions()
  } catch (error) {
    console.error('Error updating function:', error)
    toast.error('Failed to update function configuration')
  } finally {
    updating.value = false
  }
}

// Open delete modal
function openDeleteModal(func: LambdaFunction) {
  selectedFunction.value = func
  showDeleteModal.value = true
}

// Delete function
async function deleteFunction() {
  if (!selectedFunction.value) return

  loading.value = true
  try {
    await lambda.deleteFunction(selectedFunction.value.FunctionName)
    toast.success('Function deleted')
    showDeleteModal.value = false
    selectedFunction.value = null
    loadFunctions()
  } catch (error) {
    console.error('Error deleting function:', error)
    toast.error('Failed to delete function')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadFunctions()
})

watch(reloadTrigger, () => {
  loadFunctions()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <CodeBracketIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            Lambda Functions
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ functions.length }} function(s)
          </span>
        </div>
        
        <div class="flex items-center gap-2">
          <button
            class="p-2 text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border rounded"
            title="Refresh"
            @click="loadFunctions"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            @click="showCreateModal = true"
          >
            + Create Function
          </button>
        </div>
      </div>
    </div>

    <!-- Functions List -->
    <LambdaFunctionsList
      ref="functionsListRef"
      :functions="functions"
      :loading="loading"
      @delete-function="openDeleteModal"
      @invoke-function="handleInvokeFromList"
    />

    <!-- Create Modal -->
    <LambdaCreateModal
      :open="showCreateModal"
      :loading="creating"
      @update:open="showCreateModal = $event"
      @create="handleCreate"
    />

    <!-- Edit Modal -->
    <LambdaEditModal
      :open="showEditModal"
      :function-name="selectedFunction?.FunctionName || ''"
      :memory="editForm.memory"
      :timeout="editForm.timeout"
      :loading="updating"
      @update:open="showEditModal = $event"
      @update-config="handleUpdateConfig"
    />

    <!-- Delete Modal -->
    <LambdaDeleteModal
      :open="showDeleteModal"
      :function-name="selectedFunction?.FunctionName || ''"
      :loading="loading"
      @update:open="showDeleteModal = $event"
      @delete="deleteFunction"
    />

    <!-- Code Examples -->
    <LambdaCodeExamples
      :region="settingsStore.region"
      :access-key="settingsStore.accessKey"
      :secret-key="settingsStore.secretKey"
    />
  </div>
</template>