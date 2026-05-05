<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import { useDynamoDB } from '@/composables/useDynamoDB'
import { RssIcon } from '@heroicons/vue/24/outline'

interface Props {
  tableName: string
  details?: {
    TableStatus?: string
    BillingModeSummary?: { BillingMode?: string }
    KeySchema?: Array<{ AttributeName: string; KeyType: string }>
    AttributeDefinitions?: Array<{ AttributeName: string; AttributeType: string }>
    ProvisionedThroughput?: { ReadCapacityUnits: number; WriteCapacityUnits: number }
    ItemCount?: number
    TableSizeBytes?: number
    StreamSpecification?: { StreamEnabled?: boolean; StreamViewType?: string }
  } | null
  loading: boolean
}

const props = withDefaults(defineProps<Props>(), {
  details: null,
})

const emit = defineEmits<{
  viewStreams: [tableName: string]
}>()

const settingsStore = useSettingsStore()
const { getKeyTypeLabel, getBillingModeLabel } = useDynamoDB()

function handleViewStreams() {
  emit('viewStreams', props.tableName)
}
</script>

<template>
  <div
    v-if="details"
    class="mt-4 space-y-4"
  >
    <!-- Table Status -->
    <div class="flex items-center gap-2">
      <span
        class="px-2 py-1 text-xs rounded"
        :class="details.TableStatus === 'ACTIVE' 
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'"
      >
        {{ details.TableStatus }}
      </span>
      <span class="text-sm text-light-muted dark:text-dark-muted">
        {{ getBillingModeLabel(details.BillingModeSummary?.BillingMode || 'PROVISIONED') }}
      </span>
      <span
        v-if="details.StreamSpecification?.StreamEnabled"
        class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-900/50"
        @click="handleViewStreams"
      >
        <RssIcon class="w-3 h-3" />
        Stream
      </span>
    </div>
    
    <!-- Key Schema -->
    <div>
      <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-2">Key Schema</label>
      <div class="space-y-2">
        <div 
          v-for="key in details.KeySchema"
          :key="key.AttributeName"
          class="flex items-center gap-2"
        >
          <span class="text-sm font-medium text-light-text dark:text-dark-text">{{ key.AttributeName }}</span>
          <span
            class="text-xs px-2 py-0.5 rounded"
            :class="key.KeyType === 'HASH' 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'"
          >
            {{ key.KeyType === 'HASH' ? 'Partition Key' : 'Sort Key' }}
            ({{ getKeyTypeLabel(details.AttributeDefinitions?.find((a) => a.AttributeName === key.AttributeName)?.AttributeType || 'S') }})
          </span>
        </div>
      </div>
    </div>
    
    <!-- Attribute Definitions -->
    <div v-if="details.AttributeDefinitions?.length > 0">
      <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-2">Attributes</label>
      <div class="flex flex-wrap gap-2">
        <span 
          v-for="attr in details.AttributeDefinitions"
          :key="attr.AttributeName"
          class="text-sm px-2 py-1 rounded bg-light-border dark:bg-dark-border text-light-text dark:text-dark-text"
        >
          {{ attr.AttributeName }} ({{ attr.AttributeType }})
        </span>
      </div>
    </div>
    
    <!-- Provisioned Throughput -->
    <div
      v-if="details.ProvisionedThroughput"
      class="grid grid-cols-2 gap-4"
    >
      <div>
        <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Read Capacity</label>
        <p class="text-sm text-light-text dark:text-dark-text">
          {{ details.ProvisionedThroughput.ReadCapacityUnits }}
        </p>
      </div>
      <div>
        <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Write Capacity</label>
        <p class="text-sm text-light-text dark:text-dark-text">
          {{ details.ProvisionedThroughput.WriteCapacityUnits }}
        </p>
      </div>
    </div>
    
    <!-- Table Stats -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Item Count</label>
        <p class="text-sm text-light-text dark:text-dark-text">
          {{ details.ItemCount || 0 }}
        </p>
      </div>
      <div>
        <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Size</label>
        <p class="text-sm text-light-text dark:text-dark-text">
          {{ details.TableSizeBytes ? (details.TableSizeBytes / 1024).toFixed(2) + ' KB' : '0 KB' }}
        </p>
      </div>
    </div>
  </div>
  <div
    v-else-if="loading"
    class="mt-4 text-center py-4"
  >
    <div class="inline-block animate-spin rounded-full h-6 w-6 border-4 border-blue-600 border-t-transparent" />
    <p class="mt-2 text-sm text-light-muted dark:text-dark-muted">
      Loading table details...
    </p>
  </div>
</template>