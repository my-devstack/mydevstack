<script setup lang="ts">
import { computed } from 'vue'
import { ArchiveBoxIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/components/common/DataTable.vue'
import { useSettingsStore } from '@/stores/settings'

interface Bucket {
  Name: string
  CreationDate?: string
}

const props = defineProps<{
  buckets: Bucket[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'select-bucket': [bucketName: string]
  'delete-bucket': [bucketName: string]
}>()

const settingsStore = useSettingsStore()

const columns = computed(() => [
  { key: 'Name', label: 'Name', sortable: true },
  { key: 'CreationDate', label: 'Created', sortable: true },
])

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
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
      Loading...
    </p>
  </div>

  <div
    v-else-if="buckets.length === 0"
    class="text-center py-12"
  >
    <p
      class="text-lg"
      :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
    >
      No buckets found. Create one to get started!
    </p>
  </div>

  <DataTable
    v-else
    :columns="columns"
    :data="buckets"
    :loading="loading"
    selectable
    empty-message="No buckets found. Create one to get started!"
    @row-click="(row) => emit('select-bucket', row.Name)"
  >
    <template #cell-Name="{ value }">
      <div class="flex items-center gap-2">
        <ArchiveBoxIcon class="h-5 w-5 text-primary-500" />
        <span class="font-medium text-light-text dark:text-dark-text">{{ value }}</span>
      </div>
    </template>
    <template #cell-CreationDate="{ value }">
      <span class="text-light-muted dark:text-dark-muted">{{ formatDate(value) }}</span>
    </template>
    <template #row-actions="{ row }">
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
          title="Delete"
          @click.stop="emit('delete-bucket', row.Name)"
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