<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useLambda } from '@/composables/useLambda'
import { useLambdaEventSourceMapping } from '@/composables/useLambdaEventSourceMapping'
import { useSQS } from '@/composables/useSQS'
import { useKinesis } from '@/composables/useKinesis'
import { useDynamoDB } from '@/composables/useDynamoDB'
import {
  EventSourceMappingList,
  EventSourceMappingCreateModal,
  EventSourceMappingDeleteModal,
} from '@/components/lambda'

const settingsStore = useSettingsStore()

// Lambda functions for selection
const { functions, loading: lambdaLoading, loadFunctions } = useLambda()

// Event source mappings
const {
  mappings,
  loading: mappingsLoading,
  selectedMapping,
  creating,
  deleting,
  loadMappings,
  createMapping,
  deleteMapping,
} = useLambdaEventSourceMapping()

// Event sources from other services
const { queues, loadQueues } = useSQS()
const { streams, loadStreams } = useKinesis()
const { tables, loadTables } = useDynamoDB()

const showCreateModal = ref(false)
const showDeleteModal = ref(false)

const loading = computed(() => lambdaLoading.value || mappingsLoading.value)

const eventSources = computed(() => {
  const sources: { arn: string; name: string; type: string }[] = []

  // Add SQS queues
  queues.value.forEach(q => {
    if (q.QueueUrl) {
      sources.push({
        arn: q.QueueArn,
        name: q.QueueUrl.split('/').pop() || q.QueueUrl,
        type: 'SQS',
      })
    }
  })

  // Add Kinesis streams
  streams.value.forEach(s => {
    if (s.StreamARN) {
      sources.push({
        arn: s.StreamARN,
        name: s.StreamName,
        type: 'Kinesis',
      })
    }
  })

  // Add DynamoDB tables with streams
  tables.value.forEach(t => {
    if (t.TableStatus === 'ACTIVE' && t.TableName) {
      sources.push({
        arn: `arn:aws:dynamodb:${settingsStore.region || 'us-east-1'}:${t.TableArn?.split(':')[4] || '123456789012'}:table/${t.TableName}/stream/*`,
        name: `${t.TableName} (stream)`,
        type: 'DynamoDB',
      })
    }
  })

  return sources
})

onMounted(async () => {
  await Promise.all([
    loadFunctions(),
    loadMappings(),
    loadQueues(),
    loadStreams(),
    loadTables(),
  ])
})

function handleDeleteClick(mapping: typeof selectedMapping.value) {
  selectedMapping.value = mapping
  showDeleteModal.value = true
}

async function handleCreate(data: {
  functionName: string
  eventSourceArn: string
  batchSize: number
  maxBatchingWindow: number
  parallelizationFactor: number
  onSuccessDestination?: string
  onFailureDestination?: string
}) {
  await createMapping(data)
  showCreateModal.value = false
}

async function handleDelete() {
  if (selectedMapping.value?.UUID) {
    await deleteMapping(selectedMapping.value.UUID)
    showDeleteModal.value = false
  }
}
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1
          class="text-2xl font-bold"
          :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
        >
          Lambda ESM
        </h1>
        <p
          class="text-sm mt-1"
          :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
        >
          Manage Lambda function triggers from event sources
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          :disabled="loading"
          @click="showCreateModal = true"
        >
          Create Mapping
        </button>
      </div>
    </div>

    <!-- Content -->
    <EventSourceMappingList
      :mappings="mappings"
      :loading="mappingsLoading"
      @delete-mapping="handleDeleteClick"
    />

    <!-- Create Modal -->
    <EventSourceMappingCreateModal
      :open="showCreateModal"
      :functions="functions"
      :event-sources="eventSources"
      :loading="creating"
      @update:open="showCreateModal = $event"
      @create="handleCreate"
    />

    <!-- Delete Modal -->
    <EventSourceMappingDeleteModal
      :open="showDeleteModal"
      :mapping="selectedMapping"
      :loading="deleting"
      @update:open="showDeleteModal = $event"
      @delete="handleDelete"
    />
  </div>
</template>