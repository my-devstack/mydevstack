<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { QueueListIcon, ArrowPathIcon, PlusIcon } from '@heroicons/vue/24/outline'
import Button from '@/components/common/Button.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useSettingsStore } from '@/stores/settings'
import { usePagination } from '@/composables/usePagination'
import { useKinesis } from '@/composables/useKinesis'
import {
  KinesisCreateModal,
  KinesisPutRecordModal,
  KinesisViewRecordModal,
} from '@/components/kinesis'
import KinesisStreamItem from '@/components/kinesis/KinesisStreamItem.vue'
import CodeSnippet from '@/components/common/CodeSnippet.vue'

const settingsStore = useSettingsStore()

const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List Kinesis streams
aws kinesis list-streams --endpoint-url http://localhost:8081

# Create stream
aws kinesis create-stream \\
  --stream-name my-stream \\
  --shard-count 1 \\
  --endpoint-url http://localhost:8081

# Describe stream
aws kinesis describe-stream \\
  --stream-name my-stream \\
  --endpoint-url http://localhost:8081

# Put record
aws kinesis put-record \\
  --stream-name my-stream \\
  --partition-key key1 \\
  --data "hello world" \\
  --endpoint-url http://localhost:8081

# Delete stream
aws kinesis delete-stream \\
  --stream-name my-stream \\
  --endpoint-url http://localhost:8081`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { KinesisClient, CreateStreamCommand, PutRecordCommand, GetRecordsCommand } from "@aws-sdk/client-kinesis";

const client = new KinesisClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8081',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

// Create stream
await client.send(new CreateStreamCommand({
  StreamName: 'my-stream',
  ShardCount: 1,
}));

// Put record
await client.send(new PutRecordCommand({
  StreamName: 'my-stream',
  PartitionKey: 'key1',
  Data: new TextEncoder().encode('hello world'),
}));

// Get records
const result = await client.send(new GetRecordsCommand({
  ShardIterator: shardIterator,
}));
console.log(result.Records);`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3
import json

client = boto3.client(
    'kinesis',
    region_name='us-east-1',
    endpoint_url='http://localhost:8081',
    aws_access_key_id='test',
    aws_secret_access_key='test',
)

# Create stream
client.create_stream(
    StreamName='my-stream',
    ShardCount=1,
)

# Put record
client.put_record(
    StreamName='my-stream',
    PartitionKey='key1',
    Data=json.dumps({'message': 'hello world'}),
)

# Get records
response = client.get_records(
    ShardIterator=shard_iterator,
)
for record in response['Records']:
    print(record['Data'])`
  },
])

const {
  // state
  isLoading, streams, selectedStream, shards, records, recordsLoading,
  showCreateModal, showPutRecordModal, showRecordModal, showDeleteModal,
  streamToDelete, newStream, putRecordForm,
  selectedShard, selectedRecord,
  // computed
  streamColumns, shardColumns, recordColumns,
  // functions
  loadStreams, selectStream, createStream, openDeleteModal, confirmDeleteStream,
  getRecordsForShard, putRecord, viewRecord, setupReloadWatcher,
} = useKinesis()

const reloadTrigger = setupReloadWatcher()

// Pagination via composable
const {
  currentPage: streamPage,
  itemsPerPage: streamsPerPage,
  totalPages: totalStreamPages,
  paginatedItems: paginatedStreams,
  goToPage,
  perPageOptions,
} = usePagination(streams, { defaultPerPage: 10 })

onMounted(() => {
  loadStreams()
})

watch(reloadTrigger, () => {
  loadStreams()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <QueueListIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            Kinesis
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ streams.length }} stream{{ streams.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            :loading="isLoading"
            @click="loadStreams"
          >
            <ArrowPathIcon class="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            @click="showCreateModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Create Stream
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <EmptyState
        v-if="!isLoading && streams.length === 0"
        icon="folder"
        title="No Kinesis Streams"
        description="Create your first Kinesis stream to start processing data streams."
        @action="showCreateModal = true"
      />
      
      <template v-else>
        <div class="space-y-4">
          <KinesisStreamItem
            v-for="stream in paginatedStreams"
            :key="stream.StreamName"
            :stream="stream"
            :stream-details="selectedStream?.StreamName === stream.StreamName ? selectedStream : null"
            :shards="selectedStream?.StreamName === stream.StreamName ? shards : []"
            :records="selectedStream?.StreamName === stream.StreamName && selectedShard ? records : []"
            :records-loading="recordsLoading"
            :selected-shard="selectedShard"
            @select="selectStream"
            @delete="openDeleteModal"
            @get-records="getRecordsForShard"
            @view-record="viewRecord"
            @put-record-click="(streamName) => { if (selectedStream?.StreamName !== streamName) selectStream({ StreamName: streamName } as any); showPutRecordModal = true }"
          />
        </div>

        <!-- Pagination -->
        <div
          v-if="streams.length > 0"
          class="flex flex-wrap items-center justify-between gap-4 py-4"
        >
          <div class="flex items-center gap-2">
            <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
            <select
              v-model="streamsPerPage"
              class="text-sm border rounded px-2 py-1"
              :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
            >
              <option
                v-for="opt in perPageOptions"
                :key="opt"
                :value="opt"
              >
                {{ opt }}
              </option>
            </select>
            <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
          </div>

          <div
            v-if="totalStreamPages > 1"
            class="flex items-center gap-2"
          >
            <button
              class="px-3 py-1 rounded border disabled:opacity-50"
              :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
              :disabled="streamPage === 1"
              @click="goToPage(streamPage - 1)"
            >
              Previous
            </button>
            <span
              class="text-sm"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              Page {{ streamPage }} of {{ totalStreamPages }}
            </span>
            <button
              class="px-3 py-1 rounded border disabled:opacity-50"
              :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
              :disabled="streamPage === totalStreamPages"
              @click="goToPage(streamPage + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </template>
    </div>
    
    <KinesisCreateModal
      v-model:new-stream="newStream"
      :open="showCreateModal"
      :is-loading="isLoading"
      @update:open="showCreateModal = $event"
      @create="createStream"
    />
    
    <KinesisPutRecordModal
      :open="showPutRecordModal"
      :is-loading="isLoading"
      :put-record-form="putRecordForm"
      @update:open="showPutRecordModal = $event"
      @update:put-record-form="putRecordForm = $event"
      @put-record="putRecord"
    />
    
    <KinesisViewRecordModal
      :open="showRecordModal"
      :selected-record="selectedRecord"
      @update:open="showRecordModal = $event"
    />
    
    <ConfirmModal
      v-model:open="showDeleteModal"
      title="Delete Stream"
      :message="`Are you sure you want to delete stream ${streamToDelete?.StreamName}? This action cannot be undone.`"
      confirm-text="Delete"
      @confirm="confirmDeleteStream"
    />

    <!-- Usage Examples -->
    <div class="mt-8">
      <CodeSnippet
        title="Usage Examples"
        :snippets="codeExamples"
        default-tab="aws-cli"
        :disable-highlight="true"
      />
    </div>
  </div>
</template>
