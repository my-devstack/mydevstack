<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useContentReload } from '@/composables/useContentReload'
import { CodeBracketIcon } from '@heroicons/vue/24/outline'
import { useLambda } from '@/composables/useLambda'
import type { LambdaFunction } from '@/api/types/aws'
import {
  LambdaFunctionsList,
  LambdaCreateModal,
  LambdaCodeExamples,
} from '@/components/lambda'
import LambdaEditModal from '@/components/lambda/LambdaEditModal.vue'
import LambdaDeleteModal from '@/components/lambda/LambdaDeleteModal.vue'

const settingsStore = useSettingsStore()
const { reloadTrigger } = useContentReload()

// Use composable for Lambda functions
const {
  functions,
  loading,
  selectedFunction,
  creating,
  updating,
  invokeLoading,
  DEFAULT_ROLE_ARN,
  loadFunctions: loadFunctionsFromComposable,
  createFunction: createFunctionFromComposable,
  updateFunctionConfiguration,
  deleteFunction: deleteFunctionFromComposable,
  invokeFunction,
} = useLambda()

// Ref for functions list
const functionsListRef = ref<InstanceType<typeof LambdaFunctionsList> | null>(null)

// Modal state
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)

// Edit form
const editForm = ref({
  memory: 128,
  timeout: 30,
})

// Create function handler
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
  try {
    await createFunctionFromComposable({
      functionName: data.functionName,
      runtime: data.runtime,
      handler: data.handler,
      memory: data.memory,
      timeout: data.timeout,
      roleArn: data.roleArn,
      zipFile: data.zipFile,
      architecture: data.architecture,
      environment: data.environment,
    })
    showCreateModal.value = false
  } catch (error) {
    // Error handling is done in composable
  }
}

// Invoke function handler
async function handleInvokeFromList(func: LambdaFunction, payload: string, invocationType: string) {
  let result = ''
  try {
    let finalPayload: string
    try {
      finalPayload = JSON.stringify(JSON.parse(payload))
    } catch {
      finalPayload = payload
    }

    const response = await invokeFunction(func.FunctionName, finalPayload)
    result = response?.payload || response?.Payload || 'Success (no output)'
  } catch (error) {
    console.error('Error invoking function:', error)
    result = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
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

// Update function configuration handler
async function handleUpdateConfig(memory: number, timeout: number) {
  if (!selectedFunction.value) return

  try {
    await updateFunctionConfiguration(
      selectedFunction.value.FunctionName,
      memory,
      timeout
    )
    showEditModal.value = false
  } catch (error) {
    // Error handling is done in composable
  }
}

// Open delete modal
function openDeleteModal(func: LambdaFunction) {
  selectedFunction.value = func
  showDeleteModal.value = true
}

// Delete function handler
async function deleteFunctionHandler() {
  if (!selectedFunction.value) return

  try {
    await deleteFunctionFromComposable(selectedFunction.value.FunctionName)
    showDeleteModal.value = false
    selectedFunction.value = null
  } catch (error) {
    // Error handling is done in composable
  }
}

onMounted(() => {
  loadFunctionsFromComposable()
})

watch(reloadTrigger, () => {
  loadFunctionsFromComposable()
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
            @click="loadFunctionsFromComposable"
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
      @delete="deleteFunctionHandler"
    />

    <!-- Code Examples -->
    <LambdaCodeExamples
      :region="settingsStore.region"
      :access-key="settingsStore.accessKey"
      :secret-key="settingsStore.secretKey"
    />
  </div>
</template>