<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { EyeIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/components/common/DataTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import type { KinesisRecord } from '@/composables/useKinesis'
import type { KinesisShard } from '@/api/types/aws'

const settingsStore = useSettingsStore()

const props = defineProps<{
  records: KinesisRecord[]
  isLoading: boolean
  columns: { key: string; label: string; sortable: boolean }[]
  selectedShard: KinesisShard | null
}>()

const emit = defineEmits<{
  (e: 'view', record: KinesisRecord): void
}>()

function decodeData(base64Data: string): string {
  try {
    return atob(base64Data)
  } catch {
    return base64Data
  }
}
</script>

<template>
  <div
    v-if="selectedShard"
    class="p-6 rounded-lg border"
    :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
  >
    <h3
      class="text-lg font-semibold mb-4"
      :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
    >
      Records from Shard: {{ selectedShard.ShardId }}
    </h3>
    
    <LoadingSpinner v-if="isLoading" />
    
    <EmptyState
      v-else-if="records.length === 0"
      icon="folder"
      title="No Records"
      description="No records in this shard"
      compact
    />
    
    <DataTable
      v-else
      :columns="columns"
      :data="records"
      empty-title="No Records"
      empty-text="No records found"
      @row-click="(row) => emit('view', row)"
    >
      <template #cell-SequenceNumber="{ value }">
        <code class="text-xs">{{ value }}</code>
      </template>
      
      <template #cell-Data="{ value }">
        <code class="text-xs truncate max-w-xs block">{{ decodeData(value) }}</code>
      </template>
      
      <template #cell-actions="{ row }">
        <button
          type="button"
          class="p-1.5 rounded hover:bg-light-border dark:hover:bg-dark-border"
          :class="settingsStore.darkMode ? 'text-dark-muted hover:text-dark-text' : 'text-light-muted hover:text-light-text'"
          title="View"
          @click.stop="emit('view', row)"
        >
          <EyeIcon class="h-4 w-4" />
        </button>
      </template>
    </DataTable>
  </div>
</template>
