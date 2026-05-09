<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const settingsStore = useSettingsStore()

interface Column {
  key: string
  label: string
  sortable?: boolean
}

interface HistoryEvent {
  id?: string
  type?: string
  timestamp?: string
  previousEventId?: string
  [key: string]: unknown
}

const props = defineProps<{
  open: boolean
  loading: boolean
  events: HistoryEvent[]
  columns: Column[]
  formatDate: (date: string | undefined) => string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

function getCellValue(event: HistoryEvent, key: string): string {
  const value = event[key]
  if (key === 'timestamp' && typeof value === 'string') {
    return props.formatDate(value)
  }
  if (value === undefined || value === null) return '-'
  return String(value)
}
</script>

<template>
  <Modal
    :open="open"
    title="Execution History"
    size="4xl"
    @update:open="emit('update:open', $event)"
  >
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
        Loading execution history...
      </p>
    </div>

    <!-- Empty -->
    <div
      v-else-if="!events.length"
      class="text-center py-12"
    >
      <p
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        class="text-lg"
      >
        No history events found.
      </p>
    </div>

    <!-- History Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr
            :class="settingsStore.darkMode ? 'border-dark-border bg-dark-bg' : 'border-light-border bg-light-bg'"
            class="border-b"
          >
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(event, idx) in events"
            :key="event.id || idx"
            :class="[
              settingsStore.darkMode
                ? 'border-dark-border hover:bg-dark-bg'
                : 'border-light-border hover:bg-light-bg',
              'border-b transition-colors'
            ]"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              {{ getCellValue(event, col.key) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </Modal>
</template>
