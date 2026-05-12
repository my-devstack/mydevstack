<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import { EyeIcon, ClockIcon, StopIcon } from '@heroicons/vue/24/outline'
import StatusBadge from '@/components/common/StatusBadge.vue'
import type { ExecutionItem } from '@/composables/useStepFunctions'

const settingsStore = useSettingsStore()

const props = defineProps<{
  executions: ExecutionItem[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'view-detail', execution: ExecutionItem): void
  (e: 'view-history', execution: ExecutionItem): void
  (e: 'stop', execution: ExecutionItem): void
}>()

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

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
</script>

<template>
  <div>
    <h3
      class="text-base font-medium mb-3"
      :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
    >
      Executions
    </h3>

    <!-- Loading -->
    <div
      v-if="loading"
      class="text-center py-8"
    >
      <div class="inline-block animate-spin rounded-full h-6 w-6 border-4 border-blue-600 border-t-transparent" />
      <p
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        class="mt-2 text-sm"
      >
        Loading executions...
      </p>
    </div>

    <!-- Empty -->
    <div
      v-else-if="executions.length === 0"
      class="text-center py-8"
    >
      <p
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        class="text-sm"
      >
        No executions found.
      </p>
    </div>

    <!-- Table -->
    <div
      v-else
      class="border rounded-lg overflow-hidden"
      :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
    >
      <table class="w-full text-sm">
        <thead>
          <tr
            class="text-xs font-semibold uppercase tracking-wider border-b"
            :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border bg-dark-surface' : 'text-light-muted border-light-border bg-light-bg'"
          >
            <th class="px-4 py-3 text-left">
              Name
            </th>
            <th class="px-4 py-3 text-left">
              Status
            </th>
            <th class="px-4 py-3 text-left">
              Start
            </th>
            <th class="px-4 py-3 text-left">
              Stop
            </th>
            <th class="px-4 py-3 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="execution in executions"
            :key="execution.executionArn"
            class="border-b last:border-b-0"
            :class="settingsStore.darkMode ? 'border-dark-border hover:bg-dark-surface' : 'border-light-border hover:bg-light-border'"
          >
            <td
              class="px-4 py-3 font-medium truncate max-w-[200px]"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              {{ execution.name || execution.executionArn?.split(':').pop() || '-' }}
            </td>
            <td class="px-4 py-3">
              <StatusBadge
                :status="getStatusType(execution.status)"
                :label="execution.status || 'Unknown'"
                size="sm"
              />
            </td>
            <td
              class="px-4 py-3"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              {{ formatDate(execution.startDate) }}
            </td>
            <td
              class="px-4 py-3"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              {{ formatDate(execution.stopDate) }}
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-1">
                <button
                  type="button"
                  aria-label="View Detail"
                  class="p-1.5 rounded hover:bg-light-border dark:hover:bg-dark-border transition-colors"
                  :class="settingsStore.darkMode ? 'text-dark-muted hover:text-dark-text' : 'text-light-muted hover:text-light-text'"
                  @click="emit('view-detail', execution)"
                >
                  <EyeIcon class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="View History"
                  class="p-1.5 rounded hover:bg-light-border dark:hover:bg-dark-border transition-colors"
                  :class="settingsStore.darkMode ? 'text-dark-muted hover:text-dark-text' : 'text-light-muted hover:text-light-text'"
                  @click="emit('view-history', execution)"
                >
                  <ClockIcon class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Stop"
                  class="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                  @click="emit('stop', execution)"
                >
                  <StopIcon class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
