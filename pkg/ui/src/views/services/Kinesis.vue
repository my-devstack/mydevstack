<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { QueueListIcon, ArrowPathIcon, PlusIcon } from '@heroicons/vue/24/outline'
import Button from '@/components/common/Button.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useSettingsStore } from '@/stores/settings'
import { useKinesis } from '@/composables/useKinesis'
import KinesisStreamsList from '@/components/kinesis/KinesisStreamsList.vue'
import KinesisStreamInfo from '@/components/kinesis/KinesisStreamInfo.vue'
import KinesisShardsList from '@/components/kinesis/KinesisShardsList.vue'
import KinesisRecordsList from '@/components/kinesis/KinesisRecordsList.vue'
import KinesisCreateModal from '@/components/kinesis/KinesisCreateModal.vue'
import KinesisPutRecordModal from '@/components/kinesis/KinesisPutRecordModal.vue'
import KinesisViewRecordModal from '@/components/kinesis/KinesisViewRecordModal.vue'

const settingsStore = useSettingsStore()
const selectedExample = ref(0)

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
        <KinesisStreamsList
          :streams="streams"
          :is-loading="isLoading"
          :columns="streamColumns"
          :selected-stream="selectedStream"
          @select="selectStream"
          @delete="openDeleteModal"
        />

        <KinesisStreamInfo
          v-if="selectedStream"
          :stream="selectedStream"
          @put-record-click="showPutRecordModal = true"
        />
        
        <KinesisShardsList
          v-if="selectedStream"
          :shards="shards"
          :columns="shardColumns"
          :selected-shard="selectedShard"
          @get-records="getRecordsForShard"
        />
        
        <KinesisRecordsList
          v-if="selectedShard"
          :records="records"
          :is-loading="recordsLoading"
          :columns="recordColumns"
          :selected-shard="selectedShard"
          @view="viewRecord"
        />
      </template>
    </div>
    
    <KinesisCreateModal
      :open="showCreateModal"
      :is-loading="isLoading"
      v-model:new-stream="newStream"
      @update:open="showCreateModal = $event"
      @create="createStream"
    />
    
    <KinesisPutRecordModal
      :open="showPutRecordModal"
      :is-loading="isLoading"
      :put-record-form="putRecordForm"
      @update:open="showPutRecordModal = $event"
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
      <h2
        class="text-lg font-semibold mb-4"
        :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
      >
        Usage Examples
      </h2>
      <div
        class="rounded-lg border overflow-hidden"
        :class="settingsStore.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
      >
        <div
          class="flex border-b"
          :class="settingsStore.darkMode ? 'border-gray-700' : 'border-gray-200'"
        >
          <button
            v-for="(example, index) in codeExamples"
            :key="example.language"
            class="px-4 py-2 text-sm font-medium transition-colors"
            :class="[
              selectedExample === index
                ? settingsStore.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                : settingsStore.darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            ]"
            @click="selectedExample = index"
          >
            {{ example.label }}
          </button>
        </div>
        <div class="p-4 overflow-x-auto">
          <pre
            class="text-sm font-mono"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >{{ codeExamples[selectedExample].code }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>
