<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import Button from '@/components/common/Button.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import type { KinesisStream, KinesisStreamSummary, KinesisShard } from '@/composables/useKinesis'

const settingsStore = useSettingsStore()

interface Props {
  stream: KinesisStreamSummary
  streamDetails?: KinesisStream | null
  shards?: KinesisShard[]
  records?: any[]
  recordsLoading?: boolean
  selectedShard?: KinesisShard | null
}

const props = withDefaults(defineProps<Props>(), {
  streamDetails: null,
  shards: () => [],
  records: () => [],
  recordsLoading: false,
  selectedShard: null,
})

const emit = defineEmits<{
  'select': [stream: KinesisStreamSummary]
  'delete': [stream: KinesisStreamSummary]
  'get-records': [shard: KinesisShard]
  'view-record': [record: any]
  'put-record-click': []
}>()

const expanded = ref(false)

function toggleExpand() {
  expanded.value = !expanded.value
  if (expanded.value && !props.streamDetails) {
    emit('select', props.stream)
  }
}

function getStatus(status: string): 'active' | 'pending' | 'inactive' | 'error' {
  const statusMap: Record<string, 'active' | 'pending' | 'inactive' | 'error'> = {
    ACTIVE: 'active',
    CREATING: 'pending',
    DELETING: 'pending',
    UPDATING: 'pending',
  }
  return statusMap[status] || 'inactive'
}

function formatData(data: string): string {
  try {
    const decoded = atob(data)
    return decoded
  } catch {
    return data
  }
}
</script>

<template>
  <div
    class="border rounded-lg overflow-hidden"
    :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
  >
    <!-- Accordion Header -->
    <div
      class="grid grid-cols-12 gap-4 px-4 py-4 items-center cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg"
      :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-light-surface'"
      @click="toggleExpand"
    >
      <div class="col-span-8 flex items-center gap-2">
        <component
          :is="expanded ? ChevronDownIcon : ChevronRightIcon"
          class="h-5 w-5 text-light-muted dark:text-dark-muted"
        />
        <svg
          class="h-5 w-5 text-primary-500"
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
        <span class="font-medium text-light-text dark:text-dark-text">{{ stream.StreamName }}</span>
      </div>
      <div class="col-span-4 text-right flex items-center justify-end gap-2">
        <StatusBadge
          :status="getStatus(stream.StreamStatus)"
          :label="stream.StreamStatus"
        />
        <button
          class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
          title="Delete"
          @click.stop="$emit('delete', stream)"
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
    </div>

    <!-- Accordion Content -->
    <div
      v-if="expanded && streamDetails"
      class="px-4 pb-4 border-t"
      :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
    >
      <!-- Stream Info -->
      <div class="py-4">
        <div class="flex items-center justify-between mb-4">
          <h3
            class="text-lg font-semibold"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Stream Details
          </h3>
          <Button
            v-if="streamDetails.StreamStatus === 'ACTIVE'"
            size="sm"
            @click="emit('put-record-click', stream.StreamName)"
          >
            Put Record
          </Button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p
              class="text-xs font-medium text-light-muted dark:text-dark-muted uppercase"
            >
              Shards
            </p>
            <p
              class="font-medium text-light-text dark:text-dark-text"
            >
              {{ streamDetails.ShardCount }}
            </p>
          </div>
          <div>
            <p
              class="text-xs font-medium text-light-muted dark:text-dark-muted uppercase"
            >
              Retention
            </p>
            <p
              class="font-medium text-light-text dark:text-dark-text"
            >
              {{ streamDetails.RetentionPeriodHours }}h
            </p>
          </div>
          <div>
            <p
              class="text-xs font-medium text-light-muted dark:text-dark-muted uppercase"
            >
              Encryption
            </p>
            <p
              class="font-medium text-light-text dark:text-dark-text"
            >
              {{ streamDetails.EncryptionType }}
            </p>
          </div>
        </div>

        <!-- Shards -->
        <div v-if="shards.length > 0" class="mt-4">
          <h4
            class="text-sm font-medium mb-2"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Shards ({{ shards.length }})
          </h4>
          <div class="space-y-2">
            <div
              v-for="shard in shards"
              :key="shard.ShardId"
              class="p-2 rounded border"
              :class="[
                selectedShard?.ShardId === shard.ShardId
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                  : settingsStore.darkMode ? 'bg-dark-bg border-dark-border' : 'bg-light-bg border-light-border'
              ]"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">{{ shard.ShardId }}</span>
                <button
                  class="text-xs text-primary-600 hover:text-primary-700"
                  @click="emit('get-records', shard)"
                >
                  Get Records
                </button>
              </div>
              <div class="text-xs mt-1" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
                <span v-if="shard.SequenceNumberRange?.StartingSequenceNumber">
                  Seq: {{ shard.SequenceNumberRange.StartingSequenceNumber.slice(-10) }}...
                </span>
                <span v-if="shard.ParentShardId" class="ml-2">
                  Parent: {{ shard.ParentShardId.slice(-10) }}...
                </span>
              </div>
              <div
                v-if="selectedShard?.ShardId === shard.ShardId && records.length > 0"
                class="mt-2 space-y-1"
              >
                <div
                  v-for="(record, idx) in records"
                  :key="idx"
                  class="text-xs p-1 rounded cursor-pointer hover:bg-light-border dark:hover:bg-dark-border"
                  @click="emit('view-record', record)"
                >
                  {{ formatData(record.Data) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>