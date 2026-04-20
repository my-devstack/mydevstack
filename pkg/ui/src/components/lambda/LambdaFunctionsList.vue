<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import StatusBadge from '@/components/common/StatusBadge.vue'
import DataTable from '@/components/common/DataTable.vue'
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

const columns = computed(() => [
  { key: 'FunctionName', label: 'Function Name', sortable: true },
  { key: 'Runtime', label: 'Runtime', sortable: true },
  { key: 'MemorySize', label: 'Memory', sortable: true },
  { key: 'Timeout', label: 'Timeout', sortable: true },
  { key: 'LastModified', label: 'Last Modified', sortable: true },
])

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

  <DataTable
    v-else
    :columns="columns"
    :data="functions"
    :loading="loading"
    selectable
    empty-message="No Lambda functions found. Create one to get started!"
    @row-click="(row) => emit('select-function', row)"
  >
    <template #cell-FunctionName="{ value }">
      <span class="font-medium text-light-text dark:text-dark-text">{{ value }}</span>
    </template>
    <template #cell-Runtime="{ value }">
      <span class="text-light-muted dark:text-dark-muted">{{ value }}</span>
    </template>
    <template #cell-MemorySize="{ value }">
      <span class="text-light-muted dark:text-dark-muted">{{ formatMemory(value) }}</span>
    </template>
    <template #cell-Timeout="{ value }">
      <span class="text-light-muted dark:text-dark-muted">{{ value ? `${value}s` : '-' }}</span>
    </template>
    <template #cell-LastModified="{ value }">
      <span class="text-light-muted dark:text-dark-muted">{{ formatDate(value) }}</span>
    </template>
    <template #row-actions="{ row }">
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
          title="Delete"
          @click.stop="emit('delete-function', row)"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </template>
  </DataTable>
</template>