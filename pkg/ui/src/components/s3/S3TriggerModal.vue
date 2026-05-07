<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import * as lambdaApi from '@/api/services/lambda'

export interface TriggerConfig {
  functionName: string
  events: string[]
  prefix?: string
  suffix?: string
}

interface LambdaFunction {
  FunctionName: string
  FunctionArn: string
  Runtime: string
}

const props = defineProps<{
  open: boolean
  bucketName: string
  existingTriggers?: TriggerConfig[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [config: TriggerConfig]
}>()

const settingsStore = useSettingsStore()

const functions = ref<LambdaFunction[]>([])
const selectedFunction = ref('')
const eventTypes = ref<string[]>([])
const prefixFilter = ref('')
const suffixFilter = ref('')
const loading = ref(false)

const availableEvents = [
  { value: 's3:ObjectCreated:*', label: 's3:ObjectCreated:* (All create events)' },
  { value: 's3:ObjectCreated:Put', label: 's3:ObjectCreated:Put' },
  { value: 's3:ObjectCreated:Post', label: 's3:ObjectCreated:Post' },
  { value: 's3:ObjectCreated:Copy', label: 's3:ObjectCreated:Copy' },
  { value: 's3:ObjectCreated:CompleteMultipartUpload', label: 's3:ObjectCreated:CompleteMultipartUpload' },
  { value: 's3:ObjectRemoved:*', label: 's3:ObjectRemoved:* (All delete events)' },
  { value: 's3:ObjectRemoved:Delete', label: 's3:ObjectRemoved:Delete' },
  { value: 's3:ObjectRemoved:LifecycleExpiration', label: 's3:ObjectRemoved:LifecycleExpiration' },
  { value: 's3:ObjectRestore:*', label: 's3:ObjectRestore:* (All restore events)' },
  { value: 's3:ObjectRestore:Post', label: 's3:ObjectRestore:Post' },
  { value: 's3:ObjectRestore:Completed', label: 's3:ObjectRestore:Completed' },
]

async function loadFunctions() {
  loading.value = true
  try {
    const response = await lambdaApi.listFunctions()
    functions.value = response.functions || []
  } catch (error) {
    console.error('Failed to load Lambda functions:', error)
    functions.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadFunctions()
})

watch(() => props.open, (isOpen) => {
  if (isOpen && props.existingTriggers && props.existingTriggers.length > 0) {
    const first = props.existingTriggers[0]
    selectedFunction.value = first.functionName
    eventTypes.value = [...first.events]
    prefixFilter.value = first.prefix || ''
    suffixFilter.value = first.suffix || ''
  } else if (!isOpen) {
    resetForm()
  }
})

function resetForm() {
  selectedFunction.value = ''
  eventTypes.value = []
  prefixFilter.value = ''
  suffixFilter.value = ''
}

function handleClose() {
  resetForm()
  emit('update:open', false)
}

function handleSave() {
  if (!selectedFunction.value || eventTypes.value.length === 0) return

  emit('save', {
    functionName: selectedFunction.value,
    events: eventTypes.value,
    prefix: prefixFilter.value || undefined,
    suffix: suffixFilter.value || undefined,
  })
  handleClose()
}

function getFunctionArn(functionName: string): string | undefined {
  const fn = functions.value.find((f: LambdaFunction) => f.FunctionName === functionName)
  return fn?.FunctionArn
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="handleClose"
  >
    <div
      class="p-6 rounded-lg w-[520px] max-h-[90vh] overflow-y-auto shadow-xl"
      :class="settingsStore.darkMode ? 'bg-gray-800' : 'bg-white'"
    >
      <h2
        class="text-xl font-bold mb-1"
        :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
      >
        Configure Lambda Trigger
      </h2>
      <p
        class="text-sm mb-4"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
      >
        Bucket: <span class="font-mono">{{ bucketName }}</span>
      </p>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="text-center py-4"
      >
        <div class="inline-block animate-spin rounded-full h-6 w-6 border-4 border-blue-600 border-t-transparent" />
        <p
          class="mt-2 text-sm"
          :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
        >
          Loading Lambda functions...
        </p>
      </div>

      <!-- Lambda Function Selection -->
      <div
        v-else
        class="space-y-4"
      >
        <div>
          <label
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >
            Lambda Function
          </label>
          <select
            v-model="selectedFunction"
            class="w-full px-3 py-2 border rounded-lg"
            :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
          >
            <option value="">
              Select a function
            </option>
            <option
              v-for="fn in functions"
              :key="fn.FunctionName"
              :value="fn.FunctionName"
            >
              {{ fn.FunctionName }}
            </option>
          </select>
          <p
            v-if="functions.length === 0"
            class="mt-1 text-xs"
            :class="settingsStore.darkMode ? 'text-yellow-400' : 'text-yellow-600'"
          >
            No Lambda functions found. Create a function first.
          </p>
        </div>

        <!-- Event Types -->
        <div>
          <label
            class="block text-sm font-medium mb-2"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >
            Event Types
          </label>
          <div class="max-h-48 overflow-y-auto border rounded-lg p-2">
            <label
              v-for="event in availableEvents"
              :key="event.value"
              class="flex items-center gap-2 mb-2 cursor-pointer"
            >
              <input
                v-model="eventTypes"
                type="checkbox"
                :value="event.value"
                class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              >
              <span
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
              >
                {{ event.label }}
              </span>
            </label>
          </div>
        </div>

        <!-- Prefix Filter -->
        <div>
          <label
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >
            Prefix Filter (optional)
          </label>
          <input
            v-model="prefixFilter"
            placeholder="e.g., uploads/"
            class="w-full px-3 py-2 border rounded-lg"
            :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 placeholder-gray-400'"
          >
          <p
            class="mt-1 text-xs"
            :class="settingsStore.darkMode ? 'text-gray-500' : 'text-gray-400'"
          >
            Only trigger for objects with this prefix
          </p>
        </div>

        <!-- Suffix Filter -->
        <div>
          <label
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >
            Suffix Filter (optional)
          </label>
          <input
            v-model="suffixFilter"
            placeholder="e.g., .json"
            class="w-full px-3 py-2 border rounded-lg"
            :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 placeholder-gray-400'"
          >
          <p
            class="mt-1 text-xs"
            :class="settingsStore.darkMode ? 'text-gray-500' : 'text-gray-400'"
          >
            Only trigger for objects with this suffix
          </p>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="flex gap-2 justify-end mt-6 pt-4 border-t border-light-border dark:border-dark-border">
        <button
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          @click="handleClose"
        >
          Cancel
        </button>
        <button
          :disabled="!selectedFunction || eventTypes.length === 0 || loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleSave"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>