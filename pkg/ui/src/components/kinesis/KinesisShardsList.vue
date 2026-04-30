<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { PlayIcon } from '@heroicons/vue/24/outline'
import Button from '@/components/common/Button.vue'
import DataTable from '@/components/common/DataTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { KinesisShard } from '@/composables/useKinesis'

const settingsStore = useSettingsStore()

const props = defineProps<{
  shards: KinesisShard[]
  columns: { key: string; label: string; sortable: boolean }[]
  selectedShard: KinesisShard | null
}>()

const emit = defineEmits<{
  (e: 'get-records', shard: KinesisShard): void
}>()
</script>

<template>
  <div
    class="p-6 rounded-lg border"
    :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
  >
    <h3
      class="text-lg font-semibold mb-4"
      :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
    >
      Shards
    </h3>
    
    <EmptyState
      v-if="shards.length === 0"
      icon="folder"
      title="No Shards"
      description="No shards in this stream"
      compact
    />
    
    <DataTable
      v-else
      :columns="columns"
      :data="shards.map(s => ({
        ...s,
        StartingSequenceNumber: s.SequenceNumberRange?.StartingSequenceNumber || 'N/A',
      }))"
      empty-title="No Shards"
      empty-text="No shards found"
    >
      <template #cell-ShardId="{ value }">
        <code class="text-xs">{{ value }}</code>
      </template>
      
      <template #cell-ParentShardId="{ value }">
        <code class="text-xs">{{ value || 'N/A' }}</code>
      </template>
      
      <template #cell-StartingSequenceNumber="{ value }">
        <code class="text-xs">{{ value }}</code>
      </template>
      
      <template #row-actions="{ row }">
        <div class="flex items-center gap-2">
          <Button 
            :variant="selectedShard?.ShardId === row.ShardId ? 'primary' : 'secondary'" 
            size="sm"
            @click="emit('get-records', row)"
          >
            <PlayIcon class="h-3 w-3 mr-1" />
            Get Records
          </Button>
        </div>
      </template>
    </DataTable>
  </div>
</template>
