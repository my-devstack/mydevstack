<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import StatusBadge from '@/components/common/StatusBadge.vue'
import JsonViewer from '@/components/common/JsonViewer.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import type { ExecutionItem } from '@/composables/useStepFunctions'

const settingsStore = useSettingsStore()

const props = defineProps<{
  execution: ExecutionItem | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

function getStatusType(status: string | undefined): 'active' | 'pending' | 'inactive' {
  const map: Record<string, 'active' | 'pending' | 'inactive'> = {
    ACTIVE: 'active',
    RUNNING: 'pending',
    SUCCEEDED: 'active',
    FAILED: 'inactive',
    TIMED_OUT: 'inactive',
    ABORTED: 'inactive',
  }
  return map[status || ''] || 'inactive'
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

function tryParseJson(value: string | undefined): object | string {
  if (!value) return { note: 'No data available' }
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div
      v-if="loading"
      class="text-center py-12"
    >
      <LoadingSpinner size="lg" />
      <p
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        class="mt-2"
      >
        Loading execution details...
      </p>
    </div>

    <!-- Error: null execution -->
    <div
      v-else-if="!execution"
      class="text-center py-12"
    >
      <p
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        class="text-lg"
      >
        No execution selected.
      </p>
    </div>

    <!-- Detail Content -->
    <div v-else>
      <!-- Back button -->
      <button
        type="button"
        class="flex items-center gap-1 text-sm mb-4 text-primary-500 hover:text-primary-600 transition-colors"
        @click="emit('back')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to executions
      </button>

      <h2
        class="text-lg font-medium mb-4"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        Execution: {{ execution.name || execution.executionArn?.split(':').pop() || '-' }}
      </h2>

      <!-- Metadata -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="p-4 rounded-lg border" :class="settingsStore.darkMode ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'">
          <label class="block text-xs font-semibold uppercase tracking-wider mb-1" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">Execution ARN</label>
          <span class="font-mono text-xs break-all" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">{{ execution.executionArn }}</span>
        </div>
        <div class="p-4 rounded-lg border" :class="settingsStore.darkMode ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'">
          <label class="block text-xs font-semibold uppercase tracking-wider mb-1" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">Status</label>
          <StatusBadge
            :status="getStatusType(execution.status)"
            :label="execution.status || 'Unknown'"
            size="sm"
          />
        </div>
        <div class="p-4 rounded-lg border" :class="settingsStore.darkMode ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'">
          <label class="block text-xs font-semibold uppercase tracking-wider mb-1" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">Start Date</label>
          <span :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">{{ formatDate(execution.startDate) }}</span>
        </div>
        <div class="p-4 rounded-lg border" :class="settingsStore.darkMode ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'">
          <label class="block text-xs font-semibold uppercase tracking-wider mb-1" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">Stop Date</label>
          <span :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">{{ formatDate(execution.stopDate) }}</span>
        </div>
      </div>

      <!-- Input / Output -->
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider mb-2" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">Input</label>
          <JsonViewer
            :data="tryParseJson(execution.input)"
            expanded
          />
        </div>
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider mb-2" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">Output</label>
          <JsonViewer
            :data="tryParseJson(execution.output)"
            expanded
          />
        </div>
      </div>
    </div>
  </div>
</template>
