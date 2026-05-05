<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

interface Props {
  open: boolean
  tableName: string
  streams: Array<{
    StreamArn?: string
    StreamStatus?: string
    StreamViewType?: string
    StreamLabel?: string
    TableName?: string
  }>
  loading: boolean
  error: string | null
  records: Array<{
    eventName?: string
    dynamodb?: { ApproximateCreationDateTime?: number }
    [key: string]: unknown
  }>
  selectedStream: {
    StreamArn?: string
    StreamStatus?: string
    StreamViewType?: string
    StreamLabel?: string
  } | null
  loadingRecords: boolean
  streamError: string | null
  hasMore: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  loadRecords: []
  selectStream: [stream: { StreamArn?: string; StreamStatus?: string; StreamViewType?: string; StreamLabel?: string }]
}>()

const settingsStore = useSettingsStore()

// Format event name for styling
function formatEventName(eventName?: string): string {
  if (!eventName) return 'bg-gray-100 text-gray-800'
  switch (eventName) {
    case 'INSERT':
      return 'bg-green-100 text-green-800'
    case 'MODIFY':
      return 'bg-yellow-100 text-yellow-800'
    case 'REMOVE':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Format record data for display
function formatRecordData(record: unknown): string {
  try {
    const r = record as Record<string, unknown>
    const dynamodb = r.dynamodb
    if (!dynamodb) return JSON.stringify(r, null, 2)
    return JSON.stringify({ NewImage: (dynamodb as { NewImage?: unknown }).NewImage, OldImage: (dynamodb as { OldImage?: unknown }).OldImage }, null, 2)
  } catch {
    return String(record)
  }
}

function close() {
  emit('update:open', false)
}

function loadMore() {
  emit('loadRecords')
}

function selectStream(stream: { StreamArn?: string; StreamStatus?: string; StreamViewType?: string; StreamLabel?: string }) {
  emit('selectStream', stream)
}
</script>

<template>
  <Modal
    :open="open"
    :title="'DynamoDB Streams: ' + tableName"
    size="3xl"
    @update:open="close"
  >
    <div
      v-if="loading"
      class="flex justify-center py-8"
    >
      <LoadingSpinner />
    </div>

    <div
      v-else-if="error && streams.length === 0"
      class="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg"
    >
      {{ error }}
    </div>

    <div
      v-else
      class="space-y-4"
    >
      <div
        class="p-4 rounded-lg"
        :class="settingsStore.darkMode ? 'bg-gray-700' : 'bg-gray-50'"
      >
        <div v-if="streams.length > 0">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span
                class="text-xs"
                :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
              >Stream ARN:</span>
              <p
                class="font-mono text-xs mt-1 break-all"
                :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
              >
                {{ streams[0]?.StreamArn }}
              </p>
            </div>
            <div>
              <span
                class="text-xs"
                :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
              >Status:</span>
              <p
                class="font-medium text-sm mt-1"
                :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
              >
                {{ streams[0]?.StreamStatus }}
              </p>
            </div>
            <div>
              <span
                class="text-xs"
                :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
              >View Type:</span>
              <p
                class="font-medium text-sm mt-1"
                :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
              >
                {{ streams[0]?.StreamViewType?.replace(/_/g, ' ') }}
              </p>
            </div>
            <div>
              <span
                class="text-xs"
                :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
              >Stream Label:</span>
              <p
                class="font-mono text-xs mt-1"
                :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
              >
                {{ streams[0]?.StreamLabel }}
              </p>
            </div>
          </div>
        </div>
        <div
          v-else
          class="text-center py-4"
        >
          <p :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'">
            No streams available for this table
          </p>
        </div>
      </div>

      <div v-if="selectedStream">
        <div class="flex items-center justify-between mb-3">
          <h4
            class="text-sm font-medium"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >
            Stream Records
            <span class="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {{ records.length }}
            </span>
          </h4>
          <button
            v-if="hasMore"
            :disabled="loadingRecords"
            class="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            @click="loadMore"
          >
            {{ loadingRecords ? 'Loading...' : 'Load More' }}
          </button>
        </div>

        <div
          v-if="records.length > 0"
          class="space-y-3 max-h-96 overflow-y-auto"
        >
          <div
            v-for="(record, index) in records"
            :key="index"
            class="p-4 rounded-lg border"
            :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'"
          >
            <div class="flex items-center justify-between mb-2">
              <span
                class="px-2 py-0.5 text-xs font-medium rounded"
                :class="formatEventName(record.eventName)"
              >
                {{ record.eventName }}
              </span>
              <span
                class="text-xs"
                :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
              >
                {{ new Date((record.dynamodb?.ApproximateCreationDateTime || 0) * 1000).toLocaleString() }}
              </span>
            </div>
            <pre
              class="text-xs font-mono overflow-x-auto p-2 rounded"
              :class="settingsStore.darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'"
            >{{ formatRecordData(record) }}</pre>
          </div>
        </div>
        <div
          v-else
          class="text-center py-8"
        >
          <p :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'">
            No records in stream yet. Make changes to items in the table to see stream events.
          </p>
        </div>
      </div>

      <div
        v-if="streams.length > 0 && !selectedStream"
        class="text-center py-4"
      >
        <button
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          @click="selectStream(streams[0])"
        >
          View Stream Events
        </button>
      </div>
    </div>

    <template #footer>
      <button
        class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        @click="close"
      >
        Close
      </button>
    </template>
  </Modal>
</template>