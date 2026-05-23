<script setup lang="ts">
import EmptyState from './EmptyState.vue'

import type { TableColumn } from './types'

export type { TableColumn }

interface Props {
  columns: TableColumn[]
  data: Record<string, any>[]
  loading?: boolean
  selectable?: boolean
  emptyText?: string
  loadingText?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  selectable: false,
  emptyText: 'No data available',
  loadingText: 'Loading...',
})

const emit = defineEmits<{
  'row-click': [row: Record<string, any>]
  'selection-change': [selected: Record<string, any>[]]
}>()

function handleRowClick(row: Record<string, any>) {
  emit('row-click', row)
}

function getCellValue(row: Record<string, any>, key: string): string {
  const value = row[key]
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
</script>

<template>
  <div class="w-full overflow-x-auto">
    <table class="min-w-full divide-y divide-light-border dark:divide-dark-border">
      <thead class="bg-light-bg dark:bg-dark-bg">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            class="px-6 py-3 text-left text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider"
            :style="column.width ? { width: column.width } : {}"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody class="bg-light-surface dark:bg-dark-surface divide-y divide-light-border dark:divide-dark-border">
        <template v-if="loading">
          <tr
            v-for="i in 3"
            :key="'loading-' + i"
            class="animate-pulse"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-4 whitespace-nowrap"
            >
              <div class="h-4 bg-light-border dark:bg-dark-border rounded w-24" />
            </td>
          </tr>
        </template>
        <tr
          v-else-if="data.length === 0"
          class="hover:bg-light-bg dark:hover:bg-dark-bg"
        >
          <td
            :colspan="columns.length"
            class="px-6 py-12"
          >
            <EmptyState :message="emptyText" />
          </td>
        </tr>
        <tr
          v-for="(row, index) in data"
          v-else
          :key="index"
          class="hover:bg-light-bg dark:hover:bg-dark-bg cursor-pointer transition-colors"
          @click="handleRowClick(row)"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            class="px-6 py-4 whitespace-nowrap text-sm text-light-text dark:text-dark-text"
          >
            {{ getCellValue(row, column.key) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>