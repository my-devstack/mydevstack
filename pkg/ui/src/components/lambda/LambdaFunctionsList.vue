<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import type { LambdaFunction } from '@/api/types/aws'

const props = defineProps<{
  functions: LambdaFunction[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'delete-function': [func: LambdaFunction]
  'invoke-function': [func: LambdaFunction, payload: string, invocationType: string]
}>()

const settingsStore = useSettingsStore()
const expandedFunctions = ref<Set<string>>(new Set())

const invokePayload = ref<Record<string, string>>({})
const invocationType = ref<Record<string, string>>({})
const invokeResult = ref<Record<string, string>>({})
const invokeLoading = ref<Record<string, boolean>>({})

const invocationTypes = [
  { value: 'RequestResponse', label: 'Synchronous' },
  { value: 'Event', label: 'Asynchronous' },
]

function toggleFunctionExpansion(functionName: string) {
  if (expandedFunctions.value.has(functionName)) {
    expandedFunctions.value.delete(functionName)
  } else {
    expandedFunctions.value.add(functionName)
  }
  expandedFunctions.value = new Set(expandedFunctions.value)
}

function isExpanded(functionName: string): boolean {
  return expandedFunctions.value.has(functionName)
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

function formatMemory(memory: number | undefined): string {
  return memory ? `${memory} MB` : '-'
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}

function getPayload(fn: string): string {
  return invokePayload.value[fn] || '{}'
}

function setPayload(fn: string, value: string) {
  invokePayload.value[fn] = value
}

function getInvocationType(fn: string): string {
  return invocationType.value[fn] || 'RequestResponse'
}

function setInvocationType(fn: string, value: string) {
  invocationType.value[fn] = value
}

function getResult(fn: string): string {
  return invokeResult.value[fn] || ''
}

function setResult(fn: string, value: string) {
  invokeResult.value[fn] = value
}

function isLoading(fn: string): boolean {
  return invokeLoading.value[fn] || false
}

function setLoading(fn: string, value: boolean) {
  invokeLoading.value[fn] = value
}

function handleInvoke(fn: string) {
  const func = props.functions.find(f => f.FunctionName === fn)
  if (!func) return
  
  setLoading(fn, true)
  setResult(fn, '')
  emit('invoke-function', func, getPayload(fn), getInvocationType(fn))
}

function updateInvokeResult(fn: string, result: string) {
  setResult(fn, result)
  setLoading(fn, false)
}

defineExpose({ updateInvokeResult })
</script>

<template>
  <div v-if="loading" class="text-center py-12">
    <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
    <p :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'" class="mt-2">Loading functions...</p>
  </div>

  <div v-else-if="functions.length === 0" class="text-center py-12">
    <p :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'" class="text-lg">No Lambda functions found. Create one to get started!</p>
  </div>

  <div v-else class="space-y-4">
    <!-- Headers -->
    <div class="flex px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b" :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'">
      <div class="w-8 flex-shrink-0" />
      <div class="flex-1 min-w-[100px]">Function Name</div>
      <div class="w-48 flex-shrink-0">Runtime</div>
      <div class="w-24 flex-shrink-0">Memory</div>
      <div class="w-20 flex-shrink-0">Timeout</div>
      <div class="w-36 flex-shrink-0">Last Modified</div>
      <div class="w-16 flex-shrink-0 text-right">Actions</div>
    </div>

    <!-- Rows -->
    <div v-for="func in functions" :key="func.FunctionName" class="border rounded-lg overflow-hidden" :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'">
      <!-- Main Row -->
      <div class="flex px-4 py-3 items-center cursor-pointer hover:bg-light-border/30 dark:hover:bg-dark-border/30" :class="{ 'border-b': isExpanded(func.FunctionName), 'border-dark-border': settingsStore.darkMode, 'border-light-border': !settingsStore.darkMode }" @click="toggleFunctionExpansion(func.FunctionName)">
        <div class="w-8 flex-shrink-0 flex items-center justify-center">
          <svg class="w-5 h-5 transition-transform text-light-muted dark:text-dark-muted" :class="{ 'rotate-90': isExpanded(func.FunctionName) }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <div class="flex-1 min-w-[100px] font-medium text-light-text dark:text-dark-text truncate">{{ func.FunctionName }}</div>
        <div class="w-48 flex-shrink-0 text-light-muted dark:text-dark-muted truncate">{{ func.Runtime || '-' }}</div>
        <div class="w-24 flex-shrink-0 text-light-muted dark:text-dark-muted">{{ formatMemory(func.MemorySize) }}</div>
        <div class="w-20 flex-shrink-0 text-light-muted dark:text-dark-muted">{{ func.Timeout ? `${func.Timeout}s` : '-' }}</div>
        <div class="w-36 flex-shrink-0 text-light-muted dark:text-dark-muted text-sm truncate">{{ formatDate(func.LastModified) }}</div>
        <div class="w-16 flex-shrink-0 flex justify-end gap-1">
          <button class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500" title="Delete" @click.stop="emit('delete-function', func)">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Accordion Content -->
      <div v-if="isExpanded(func.FunctionName)" class="border-t p-4" :class="settingsStore.darkMode ? 'border-dark-border bg-dark-bg' : 'border-light-border bg-light-bg'">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Handler</label>
            <p class="text-sm text-light-text dark:text-dark-text font-mono">{{ func.Handler || '-' }}</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">ARN</label>
            <div class="flex items-center gap-2">
              <code class="text-xs text-light-muted dark:text-dark-muted bg-light-border dark:bg-dark-border px-2 py-1 rounded flex-1 break-all">{{ func.FunctionArn }}</code>
              <button class="p-2 rounded hover:bg-light-border dark:hover:bg-dark-border" title="Copy ARN" @click.stop="copyToClipboard(func.FunctionArn)">
                <svg class="w-4 h-4 text-light-muted dark:text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Role</label>
            <p class="text-sm text-light-text dark:text-dark-text font-mono truncate" :title="func.Role">{{ func.Role || '-' }}</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Description</label>
            <p class="text-sm text-light-text dark:text-dark-text">{{ func.Description || '-' }}</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Code Size</label>
            <p class="text-sm text-light-text dark:text-dark-text">{{ func.CodeSize ? (func.CodeSize / 1024).toFixed(2) + ' KB' : '-' }}</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">State</label>
            <p class="text-sm text-light-text dark:text-dark-text">{{ func.State || 'Active' }}</p>
          </div>
        </div>

        <!-- Invoke Section -->
        <div class="mt-4 pt-4 border-t" :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'">
          <h4 class="text-sm font-medium mb-3 text-light-text dark:text-dark-text">Invoke Function</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Payload (JSON)</label>
              <textarea :value="getPayload(func.FunctionName)" class="w-full px-3 py-2 text-sm rounded-lg border bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-text dark:text-dark-text font-mono" rows="3" placeholder='{"key": "value"}' @input="setPayload(func.FunctionName, ($event.target as HTMLTextAreaElement).value)" />
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Invocation Type</label>
              <select :value="getInvocationType(func.FunctionName)" class="w-full px-3 py-2 text-sm rounded-lg border bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-text dark:text-dark-text" @change="setInvocationType(func.FunctionName, ($event.target as HTMLSelectElement).value)">
                <option v-for="type in invocationTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
              </select>
            </div>
          </div>
          <div class="flex gap-2 mb-4">
            <button class="px-3 py-1.5 text-sm rounded border hover:bg-light-border dark:hover:bg-dark-border" :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'" :disabled="isLoading(func.FunctionName)" @click.stop="handleInvoke(func.FunctionName)">
              {{ isLoading(func.FunctionName) ? 'Invoking...' : 'Invoke' }}
            </button>
          </div>
          <div v-if="getResult(func.FunctionName)">
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Result:</label>
            <pre class="p-3 rounded-lg overflow-auto max-h-40 text-sm font-mono" :class="settingsStore.darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-800'">{{ getResult(func.FunctionName) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
