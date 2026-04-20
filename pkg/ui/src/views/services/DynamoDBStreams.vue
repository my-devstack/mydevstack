<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUIStore } from '@/stores/ui'
import { useContentReload } from '@/composables/useContentReload'
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  QueueListIcon,
  EyeIcon,
  PlayIcon,
} from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import JsonViewer from '@/components/common/JsonViewer.vue'
import {
  listTables,
  describeTable,
  listStreams,
  describeStream,
  getShardIterator,
  getRecords,
  unmarshall,
  type DynamoDBTableDescription,
} from '@/api/services/dynamodb'

// Stores
const settingsStore = useSettingsStore()
const uiStore = useUIStore()
const { reloadTrigger } = useContentReload()

// Types
interface DynamoDBStream {
  StreamArn: string
  TableName: string
  StreamLabel: string
  StreamStatus: 'ENABLING' | 'ENABLED' | 'DISABLING' | 'DISABLED'
  StreamViewType: 'KEYS_ONLY' | 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES'
}

interface DynamoDBShard {
  ShardId: string
  ParentShardId?: string
  SequenceNumberRange: {
    StartingSequenceNumber: string
    EndingSequenceNumber?: string
  }
}

interface StreamRecord {
  eventID: string
  eventName: string
  eventVersion: string
  eventSource: string
  awsRegion: string
  dynamodb: {
    Keys?: Record<string, unknown>
    NewImage?: Record<string, unknown>
    OldImage?: Record<string, unknown>
    SequenceNumber: string
    SizeBytes: number
    StreamViewType: string
  }
  userIdentity?: {
    PrincipalId: string
  }
}

// State
const loading = ref(false)
const tables = ref<string[]>([])
const selectedTable = ref<string | null>(null)
const tableDetails = ref<DynamoDBTableDescription | null>(null)
const streams = ref<DynamoDBStream[]>([])
const selectedStream = ref<DynamoDBStream | null>(null)
const streamDescription = ref<{
  StreamArn: string
  TableName: string
  StreamLabel: string
  StreamStatus: string
  StreamViewType: string
  Shards: DynamoDBShard[]
} | null>(null)

// Shard iterator state
const shards = ref<DynamoDBShard[]>([])
const selectedShard = ref<DynamoDBShard | null>(null)
const shardIterator = ref<string | null>(null)
const iteratorType = ref<'TRIM_HORIZON' | 'LATEST' | 'AT_SEQUENCE_NUMBER'>('LATEST')
const startingSequenceNumber = ref('')

// Records state
const records = ref<StreamRecord[]>([])
const recordsLoading = ref(false)
const nextShardIterator = ref<string | null>(null)
const millisBehindLatest = ref(0)

// View record modal
const showRecordModal = ref(false)
const selectedRecord = ref<StreamRecord | null>(null)

// Stream columns
const streamColumns = computed(() => [
  { key: 'StreamLabel', label: 'Stream Label', sortable: true },
  { key: 'StreamArn', label: 'Stream ARN', sortable: false },
  { key: 'StreamStatus', label: 'Status', sortable: true },
  { key: 'StreamViewType', label: 'View Type', sortable: true },
])

// Shard columns
const shardColumns = computed(() => [
  { key: 'ShardId', label: 'Shard ID', sortable: true },
  { key: 'ParentShardId', label: 'Parent Shard', sortable: false },
  { key: 'StartingSequenceNumber', label: 'Starting Sequence', sortable: false },
  { key: 'EndingSequenceNumber', label: 'Ending Sequence', sortable: false },
])

// Record columns for display
const recordColumns = computed(() => [
  { key: 'eventID', label: 'Event ID', sortable: false },
  { key: 'eventName', label: 'Event Name', sortable: true },
  { key: 'SequenceNumber', label: 'Sequence', sortable: false },
  { key: 'SizeBytes', label: 'Size', sortable: true },
])

// Helper functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString()
}

function getStreamStatus(status: string): 'active' | 'pending' | 'inactive' | 'error' {
  const statusMap: Record<string, 'active' | 'pending' | 'inactive' | 'error'> = {
    ENABLED: 'active',
    ENABLING: 'pending',
    DISABLING: 'pending',
    DISABLED: 'inactive',
  }
  return statusMap[status] || 'inactive'
}

// API calls
async function loadTables() {
  loading.value = true
  try {
    const result = await listTables()
    tables.value = result.TableNames || []
    
    // Filter tables that have streams enabled
    if (tables.value.length > 0) {
      // Load streams for all tables or selected table
      await loadStreams()
    }
  } catch (error) {
    uiStore.notifyError('Error', `Failed to load tables: ${error}`)
  } finally {
    loading.value = false
  }
}

async function loadStreams() {
  loading.value = true
  streams.value = []
  selectedStream.value = null
  streamDescription.value = null
  
  try {
    const result = await listStreams(selectedTable.value || undefined)
    streams.value = result.Streams || []
    
    if (streams.value.length > 0) {
      await selectStream(streams.value[0])
    }
  } catch (error) {
    uiStore.notifyError('Error', `Failed to load streams: ${error}`)
  } finally {
    loading.value = false
  }
}

async function selectTable(tableName: string) {
  selectedTable.value = tableName
  selectedStream.value = null
  streamDescription.value = null
  records.value = []
  shards.value = []
  
  try {
    tableDetails.value = await describeTable(tableName)
    await loadStreams()
  } catch (error) {
    uiStore.notifyError('Error', `Failed to load table details: ${error}`)
  }
}

async function selectStream(stream: DynamoDBStream) {
  selectedStream.value = stream
  shards.value = []
  selectedShard.value = null
  records.value = []
  shardIterator.value = null
  
  try {
    const result = await describeStream(stream.StreamArn)
    streamDescription.value = result.StreamDescription
    shards.value = result.StreamDescription.Shards || []
  } catch (error) {
    uiStore.notifyError('Error', `Failed to describe stream: ${error}`)
  }
}

async function getShardIteratorForShard(shard: DynamoDBShard) {
  if (!selectedStream.value) return
  
  selectedShard.value = shard
  records.value = []
  
  try {
    const result = await getShardIterator(
      selectedStream.value.StreamArn,
      shard.ShardId,
      iteratorType.value,
      iteratorType.value === 'AT_SEQUENCE_NUMBER' ? startingSequenceNumber.value : undefined
    )
    shardIterator.value = result.ShardIterator
    uiStore.notifySuccess('Success', 'Shard iterator obtained')
    await getRecords()
  } catch (error) {
    uiStore.notifyError('Error', `Failed to get shard iterator: ${error}`)
  }
}

async function getRecords() {
  if (!shardIterator.value) return
  
  recordsLoading.value = true
  try {
    const result = await getRecords(shardIterator.value, 100)
    records.value = result.Records || []
    nextShardIterator.value = result.NextShardIterator
    millisBehindLatest.value = result.MillisBehindLatest
    
    uiStore.notifySuccess('Records Loaded', `Retrieved ${records.value.length} records`)
  } catch (error) {
    uiStore.notifyError('Error', `Failed to get records: ${error}`)
  } finally {
    recordsLoading.value = false
  }
}

async function getMoreRecords() {
  if (!nextShardIterator.value) return
  
  recordsLoading.value = true
  try {
    const result = await getRecords(nextShardIterator.value, 100)
    records.value = [...records.value, ...(result.Records || [])]
    nextShardIterator.value = result.NextShardIterator
    millisBehindLatest.value = result.MillisBehindLatest
  } catch (error) {
    uiStore.notifyError('Error', `Failed to get more records: ${error}`)
  } finally {
    recordsLoading.value = false
  }
}

function viewRecord(record: StreamRecord) {
  selectedRecord.value = record
  showRecordModal.value = true
}

function getRecordData(record: StreamRecord): Record<string, unknown> {
  const data: Record<string, unknown> = {
    eventID: record.eventID,
    eventName: record.eventName,
    eventVersion: record.eventVersion,
    eventSource: record.eventSource,
    awsRegion: record.awsRegion,
    SequenceNumber: record.dynamodb.SequenceNumber,
    SizeBytes: record.dynamodb.SizeBytes,
    StreamViewType: record.dynamodb.StreamViewType,
  }
  
  if (record.dynamodb.Keys) {
    data.Keys = unmarshall(record.dynamodb.Keys)
  }
  if (record.dynamodb.NewImage) {
    data.NewImage = unmarshall(record.dynamodb.NewImage)
  }
  if (record.dynamodb.OldImage) {
    data.OldImage = unmarshall(record.dynamodb.OldImage)
  }
  
  return data
}

// Lifecycle
onMounted(() => {
  loadTables()
})

watch(reloadTrigger, () => {
  loadTables()
})
</script>

<template>
  <div class="h-full flex">
    <!-- Tables Sidebar -->
    <div 
      class="w-64 border-r flex-shrink-0 flex flex-col"
      :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
    >
      <!-- Header -->
      <div 
        class="p-4 border-b flex items-center justify-between"
        :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
      >
        <h2 
          class="font-semibold text-sm uppercase tracking-wide"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Tables
        </h2>
        <Button
          variant="ghost"
          size="sm"
          :loading="loading"
          @click="loadTables"
        >
          <ArrowPathIcon class="h-4 w-4" />
        </Button>
      </div>
      
      <!-- Tables List -->
      <div class="flex-1 overflow-y-auto">
        <LoadingSpinner v-if="loading && tables.length === 0" />
        
        <EmptyState
          v-else-if="tables.length === 0"
          icon="table-cells"
          title="No Tables"
          description="Create a DynamoDB table with streams enabled to see streams here"
          compact
        />
        
        <div
          v-else
          class="py-2"
        >
          <button
            v-for="tableName in tables"
            :key="tableName"
            type="button"
            class="w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors"
            :class="[
              selectedTable === tableName
                ? settingsStore.darkMode ? 'bg-dark-bg text-primary-400' : 'bg-light-bg text-primary-600'
                : settingsStore.darkMode ? 'text-dark-text hover:bg-dark-bg' : 'text-light-text hover:bg-light-bg',
            ]"
            @click="selectTable(tableName)"
          >
            <span class="truncate text-sm font-medium">{{ tableName }}</span>
            <ChevronRightIcon 
              class="h-4 w-4 flex-shrink-0"
              :class="selectedTable === tableName ? 'opacity-100' : 'opacity-0'"
            />
          </button>
        </div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <LoadingSpinner
        v-if="loading && !streamDescription"
        full-screen
      />
      
      <template v-else>
        <!-- Empty State -->
        <div
          v-if="!selectedTable"
          class="flex-1 flex items-center justify-center"
        >
          <EmptyState
            icon="folder"
            title="No Table Selected"
            description="Select a table from the sidebar to view its streams"
          />
        </div>
        
        <template v-else-if="selectedTable">
          <!-- Table Header -->
          <div 
            class="p-4 border-b"
            :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
          >
            <div class="flex items-center gap-4">
              <div>
                <div class="flex items-center gap-3">
                  <h1 
                    class="text-xl font-bold"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    DynamoDB Streams
                  </h1>
                </div>
                <div 
                  class="mt-1 text-sm"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  <span>Table: {{ selectedTable }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Streams List -->
          <div
            class="p-4 border-b"
            :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
          >
            <div class="flex items-center justify-between mb-4">
              <h2 
                class="font-semibold"
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
              >
                Streams
              </h2>
              <Button
                variant="ghost"
                size="sm"
                :loading="loading"
                @click="loadStreams"
              >
                <ArrowPathIcon class="h-4 w-4" />
              </Button>
            </div>
            
            <EmptyState
              v-if="streams.length === 0"
              icon="folder"
              title="No Streams"
              description="Enable DynamoDB Streams on your table to see changes here"
              compact
            />
            
            <div
              v-else
              class="flex flex-wrap gap-2"
            >
              <button
                v-for="stream in streams"
                :key="stream.StreamArn"
                type="button"
                class="px-4 py-2 rounded-lg border transition-colors flex items-center gap-2"
                :class="[
                  selectedStream?.StreamArn === stream.StreamArn
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : settingsStore.darkMode 
                      ? 'border-dark-border hover:bg-dark-bg' 
                      : 'border-light-border hover:bg-light-bg',
                ]"
                @click="selectStream(stream)"
              >
                <QueueListIcon
                  class="h-4 w-4"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                />
                <span :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
                  {{ stream.StreamLabel }}
                </span>
                <StatusBadge
                  :status="getStreamStatus(stream.StreamStatus)"
                  size="sm"
                />
              </button>
            </div>
          </div>
          
          <!-- Stream Details -->
          <template v-if="selectedStream && streamDescription">
            <!-- Stream Info -->
            <div
              class="p-4 border-b"
              :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
            >
              <div class="grid grid-cols-4 gap-4">
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Stream ARN
                  </p>
                  <code
                    class="text-xs mt-1 block truncate"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ streamDescription.StreamArn }}
                  </code>
                </div>
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Status
                  </p>
                  <StatusBadge
                    :status="getStreamStatus(streamDescription.StreamStatus)"
                    class="mt-1"
                  />
                </div>
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    View Type
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ streamDescription.StreamViewType }}
                  </p>
                </div>
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Shards
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ shards.length }}
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Get Records Controls -->
            <div
              class="p-4 border-b"
              :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
            >
              <div class="flex items-center gap-4">
                <FormSelect
                  v-model="iteratorType"
                  label="Iterator Type"
                  :options="[
                    { value: 'TRIM_HORIZON', label: 'Trim Horizon (oldest)' },
                    { value: 'LATEST', label: 'Latest (newest)' },
                    { value: 'AT_SEQUENCE_NUMBER', label: 'At Sequence Number' },
                  ]"
                  class="w-48"
                />
                <FormInput
                  v-if="iteratorType === 'AT_SEQUENCE_NUMBER'"
                  v-model="startingSequenceNumber"
                  label="Starting Sequence Number"
                  placeholder="Enter sequence number"
                  class="w-64"
                />
                <div class="flex items-end gap-2">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    :disabled="!selectedShard"
                    @click="getRecords"
                  >
                    <PlayIcon class="h-4 w-4 mr-1" />
                    Get Records
                  </Button>
                </div>
              </div>
            </div>
            
            <!-- Shards -->
            <div class="p-4">
              <h3 
                class="font-semibold mb-4"
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
              >
                Shards
              </h3>
              
              <EmptyState
                v-if="shards.length === 0"
                icon="folder"
                title="No Shards"
                description="This stream has no shards"
                compact
              />
              
              <DataTable
                v-else
                :columns="shardColumns"
                :data="shards.map(s => ({
                  ...s,
                  StartingSequenceNumber: s.SequenceNumberRange.StartingSequenceNumber,
                  EndingSequenceNumber: s.SequenceNumberRange.EndingSequenceNumber || 'Open',
                }))"
                :loading="loading"
                empty-title="No Shards"
                empty-text="No shards found"
              >
                <template #cell-ShardId="{ value }">
                  <code class="text-xs">{{ value }}</code>
                </template>
                
                <template #cell-StartingSequenceNumber="{ value }">
                  <code class="text-xs">{{ value }}</code>
                </template>
                
                <template #row-actions="{ row }">
                  <div class="flex items-center gap-2">
                    <Button 
                      :variant="selectedShard?.ShardId === row.ShardId ? 'primary' : 'secondary'" 
                      size="sm"
                      @click="getShardIteratorForShard(row)"
                    >
                      <PlayIcon class="h-3 w-3 mr-1" />
                      Get Records
                    </Button>
                  </div>
                </template>
              </DataTable>
              
              <!-- Records -->
              <div
                v-if="selectedShard"
                class="mt-6"
              >
                <div class="flex items-center justify-between mb-4">
                  <h3 
                    class="font-semibold"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    Records
                  </h3>
                  <div class="flex items-center gap-2">
                    <span 
                      v-if="millisBehindLatest > 0"
                      class="text-sm"
                      :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                    >
                      {{ millisBehindLatest }}ms behind latest
                    </span>
                    <Button 
                      v-if="nextShardIterator" 
                      variant="secondary" 
                      size="sm" 
                      :loading="recordsLoading"
                      @click="getMoreRecords"
                    >
                      Load More
                    </Button>
                  </div>
                </div>
                
                <LoadingSpinner v-if="recordsLoading" />
                
                <EmptyState
                  v-else-if="records.length === 0"
                  icon="folder"
                  title="No Records"
                  description="No records in this shard with the selected iterator"
                  compact
                />
                
                <DataTable
                  v-else
                  :columns="recordColumns"
                  :data="records.map(r => ({
                    eventID: r.eventID,
                    eventName: r.eventName,
                    SequenceNumber: r.dynamodb.SequenceNumber,
                    SizeBytes: formatBytes(r.dynamodb.SizeBytes),
                  }))"
                  empty-title="No Records"
                  empty-text="No records found"
                  @row-click="viewRecord"
                >
                  <template #cell-eventName="{ value }">
                    <StatusBadge 
                      :status="value === 'INSERT' ? 'active' : value === 'MODIFY' ? 'warning' : 'inactive'" 
                      :label="value"
                      size="sm"
                    />
                  </template>
                  
                  <template #cell-SequenceNumber="{ value }">
                    <code class="text-xs">{{ value }}</code>
                  </template>
                  
                  <template #cell-actions="{ row }">
                    <button
                      type="button"
                      class="p-1.5 rounded hover:bg-light-border dark:hover:bg-dark-border transition-colors"
                      :class="settingsStore.darkMode ? 'text-dark-muted hover:text-dark-text' : 'text-light-muted hover:text-light-text'"
                      title="View"
                      @click.stop="viewRecord(row)"
                    >
                      <EyeIcon class="h-4 w-4" />
                    </button>
                  </template>
                </DataTable>
              </div>
            </div>
          </template>
        </template>
      </template>
    </div>
    
    <!-- Record Viewer Modal -->
    <Modal
      v-model:open="showRecordModal"
      title="Stream Record"
      size="lg"
    >
      <div
        v-if="selectedRecord"
        class="space-y-4"
      >
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p
              class="text-sm"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              Event Name
            </p>
            <StatusBadge 
              :status="selectedRecord.eventName === 'INSERT' ? 'active' : selectedRecord.eventName === 'MODIFY' ? 'warning' : 'inactive'" 
              :label="selectedRecord.eventName"
              class="mt-1"
            />
          </div>
          <div>
            <p
              class="text-sm"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              AWS Region
            </p>
            <p :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
              {{ selectedRecord.awsRegion }}
            </p>
          </div>
        </div>
        
        <div>
          <p
            class="text-sm mb-2"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            Record Data
          </p>
          <JsonViewer :data="getRecordData(selectedRecord)" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showRecordModal = false"
          >
            Close
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
