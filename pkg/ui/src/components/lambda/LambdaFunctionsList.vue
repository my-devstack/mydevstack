<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import StatusBadge from '@/components/common/StatusBadge.vue'
import type { LambdaFunction } from '@/api/types/aws'

const props = defineProps<{
  functions: LambdaFunction[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'select-function': [func: LambdaFunction]
  'delete-function': [func: LambdaFunction]
}>()

const settingsStore = useSettingsStore()
const expandedFunctions = ref<Set<string>>(new Set())

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
</script>

<template>
  <div
    v-if="loading"
    class="text-center py-12"
  >
    <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
    <p
      class="mt-2"
      :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
    >
      Loading functions...
    </p>
  </div>

  <div
    v-else-if="functions.length === 0"
    class="text-center py-12"
  >
    <p
      class="text-lg"
      :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
    >
      No Lambda functions found. Create one to get started!
    </p>
  </div>

  <div
    v-else
    class="space-y-2"
  >
    <!-- Column Headers -->
    <div
      class="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b"
      :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
    >
      <div class="col-span-1" />
      <div class="col-span-3">
        Function Name
      </div>
      <div class="col-span-2">
        Runtime
      </div>
      <div class="col-span-2">
        Memory
      </div>
      <div class="col-span-2">
        Timeout
      </div>
      <div class="col-span-2">
        Last Modified
      </div>
    </div>

    <!-- Function Rows -->
    <div
      v-for="func in functions"
      :key="func.FunctionName"
      class="border rounded-lg overflow-hidden"
      :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
    >
      <!-- Main Row -->
      <div
        class="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 items-center cursor-pointer hover:bg-light-border/30 dark:hover:bg-dark-border/30"
        :class="{ 'border-b': isExpanded(func.FunctionName), 'border-dark-border': settingsStore.darkMode, 'border-light-border': !settingsStore.darkMode }"
        @click="toggleFunctionExpansion(func.FunctionName)"
      >
        <div class="col-span-1 flex items-center justify-center">
          <svg
            class="w-5 h-5 transition-transform text-light-muted dark:text-dark-muted"
            :class="{ 'rotate-90': isExpanded(func.FunctionName) }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
        <div class="col-span-3 font-medium text-light-text dark:text-dark-text">
          {{ func.FunctionName }}
        </div>
        <div class="col-span-2 text-light-muted dark:text-dark-muted">
          {{ func.Runtime || '-' }}
        </div>
        <div class="col-span-2 text-light-muted dark:text-dark-muted">
          {{ formatMemory(func.MemorySize) }}
        </div>
        <div class="col-span-2 text-light-muted dark:text-dark-muted">
          {{ func.Timeout ? `${func.Timeout}s` : '-' }}
        </div>
        <div class="col-span-2 text-light-muted dark:text-dark-muted text-sm">
          {{ formatDate(func.LastModified) }}
        </div>
      </div>

      <!-- Accordion Content -->
      <div
        v-if="isExpanded(func.FunctionName)"
        class="border-t p-4"
        :class="settingsStore.darkMode ? 'border-dark-border bg-dark-bg' : 'border-light-border bg-light-bg'"
      >
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">
              Handler
            </label>
            <p class="text-sm text-light-text dark:text-dark-text font-mono">
              {{ func.Handler || '-' }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">
              ARN
            </label>
            <div class="flex items-center gap-2">
              <code class="text-xs text-light-muted dark:text-dark-muted bg-light-border dark:bg-dark-border px-2 py-1 rounded flex-1 break-all">{{ func.FunctionArn }}</code>
              <button
                class="p-2 rounded hover:bg-light-border dark:hover:bg-dark-border"
                title="Copy ARN"
                @click.stop="copyToClipboard(func.FunctionArn)"
              >
                <svg
                  class="w-4 h-4 text-light-muted dark:text-dark-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">
              Role
            </label>
            <p
              class="text-sm text-light-text dark:text-dark-text font-mono truncate"
              :title="func.Role"
            >
              {{ func.Role || '-' }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">
              Description
            </label>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ func.Description || '-' }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">
              Code Size
            </label>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ func.CodeSize ? (func.CodeSize / 1024).toFixed(2) + ' KB' : '-' }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">
              State
            </label>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ func.State || 'Active' }}
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div
          class="flex gap-2 mt-4 pt-4 border-t"
          :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
        >
          <button
            class="px-3 py-1.5 text-sm rounded border hover:bg-light-border dark:hover:bg-dark-border"
            :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
            @click.stop="emit('select-function', func)"
          >
            Select
          </button>
          <button
            class="px-3 py-1.5 text-sm rounded border hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800"
            @click.stop="emit('delete-function', func)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
