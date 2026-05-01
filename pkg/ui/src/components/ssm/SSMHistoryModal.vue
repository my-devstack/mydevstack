<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import DataTable from '@/components/common/DataTable.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Button from '@/components/common/Button.vue'
import type { SSMParameterHistoryItem } from '@/composables/useSSM'

const settingsStore = useSettingsStore()

const props = defineProps<{
  open: boolean
  loading: boolean
  history: SSMParameterHistoryItem[]
  columns: { key: string; label: string; sortable: boolean }[]
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}
</script>

<template>
  <Modal
    :open="open"
    :title="`History: ${history[0]?.Name || ''}`"
    size="lg"
    @update:open="emit('update:open', $event)"
  >
    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="history.length === 0"
      icon="folder"
      title="No History"
      description="No version history for this parameter"
    />

    <DataTable
      v-else
      :columns="columns"
      :data="history"
      empty-title="No History"
      empty-text="No history found"
    >
      <template #cell-Version="{ value }">
        <span class="font-medium">v{{ value }}</span>
      </template>

      <template #cell-Value="{ value }">
        <code class="text-xs truncate max-w-xs block">{{ value }}</code>
      </template>

      <template #cell-LastModifiedDate="{ value }">
        <span class="text-sm">{{ formatDate(value) }}</span>
      </template>

      <template #cell-LastModifiedUser="{ value }">
        <span class="text-sm">{{ value || 'System' }}</span>
      </template>
    </DataTable>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="secondary"
          @click="emit('update:open', false)"
        >
          Close
        </Button>
      </div>
    </template>
  </Modal>
</template>
