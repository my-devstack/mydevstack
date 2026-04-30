<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import {
  EyeIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import Button from '@/components/common/Button.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { KinesisStreamSummary, KinesisStream } from '@/composables/useKinesis'

const settingsStore = useSettingsStore()

const props = defineProps<{
  streams: KinesisStreamSummary[]
  isLoading: boolean
  columns: { key: string; label: string; sortable: boolean }[]
  selectedStream: KinesisStream | null
}>()

const emit = defineEmits<{
  (e: 'select', stream: KinesisStreamSummary): void
  (e: 'delete', stream: KinesisStreamSummary): void
}>()

function getStatus(status: string): 'active' | 'pending' | 'inactive' | 'error' {
  const statusMap: Record<string, 'active' | 'pending' | 'inactive' | 'error'> = {
    ACTIVE: 'active',
    CREATING: 'pending',
    DELETING: 'pending',
    UPDATING: 'pending',
  }
  return statusMap[status] || 'inactive'
}
</script>

<template>
  <div class="mb-6">
    <h2
      class="text-lg font-medium mb-4"
      :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
    >
      Data Streams
    </h2>
    
    <DataTable
      :columns="columns"
      :data="streams"
      :loading="isLoading"
      :is-loading="isLoading"
      empty-title="No Streams"
      empty-text="No Kinesis streams found"
      @row-click="(row) => emit('select', row)"
    >
      <template #cell-StreamName="{ value, row }">
        <div class="flex items-center gap-2">
          <svg
            class="h-4 w-4 text-primary-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <span class="font-medium">{{ value }}</span>
        </div>
      </template>
      
      <template #cell-StreamStatus="{ value }">
        <StatusBadge
          :status="getStatus(value)"
          :label="value"
        />
      </template>
      
      <template #row-actions="{ row }">
        <div class="flex items-center gap-2">
          <button
            v-if="selectedStream?.StreamName !== row.StreamName"
            type="button"
            class="p-2 rounded hover:bg-light-border dark:hover:bg-dark-border"
            :class="settingsStore.darkMode ? 'text-dark-muted hover:text-dark-text' : 'text-light-muted hover:text-light-text'"
            title="View Details"
            @click.stop="emit('select', row)"
          >
            <EyeIcon class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
            title="Delete"
            @click.stop="emit('delete', row)"
          >
            <TrashIcon class="h-4 w-4" />
          </button>
        </div>
      </template>
    </DataTable>
  </div>
</template>
