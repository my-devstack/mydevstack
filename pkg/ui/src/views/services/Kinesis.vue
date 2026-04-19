<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUIStore } from '@/stores/ui'
import { useContentReload } from '@/composables/useContentReload'
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  PlayIcon,
  EyeIcon,
  QueueListIcon,
} from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import JsonViewer from '@/components/common/JsonViewer.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import * as kinesis from '@/api/services/kinesis'

// Stores
const settingsStore = useSettingsStore()
const uiStore = useUIStore()
const { reloadTrigger } = useContentReload()

// Types
interface KinesisStreamSummary {
  StreamName: string
  StreamARN: string
  StreamStatus: string
}

interface KinesisStream {
  StreamName: string
  StreamARN: string
  StreamStatus: string
  StreamModeDetails?: { StreamMode: 'PROVISIONED' | 'ON_DEMAND' }
  ShardCount: number
  RetentionPeriodHours: number
  StreamCreationTimestamp: string
  EncryptionType: string
}

interface KinesisShard {
  ShardId: string
  ParentShardId?: string
  AdjacentParentShardId?: string
  HashKeyRange?: { StartingHashKey: string; EndingHashKey: string }
  SequenceNumberRange?: { StartingSequenceNumber: string; EndingSequenceNumber?: string }
}

// Delete confirmation state
const showDeleteModal = ref(false)
const streamToDelete = ref<KinesisStreamSummary | null>(null)

interface KinesisRecord {
  SequenceNumber: string
  Data: string
  PartitionKey: string
  ApproximateArrivalTimestamp?: string
}

// State
const loading = ref(false)
const streams = ref<KinesisStreamSummary[]>([])
const selectedStream = ref<KinesisStream | null>(null)
const shards = ref<KinesisShard[]>([])
const records = ref<KinesisRecord[]>([])
const recordsLoading = ref(false)

// Modals
const showCreateModal = ref(false)
const showPutRecordModal = ref(false)
const showRecordModal = ref(false)
const selectedRecord = ref<KinesisRecord | null>(null)

// Form state
const newStreamName = ref('')
const newShardCount = ref(1)
const putPartitionKey = ref('')
const putData = ref('')

// Shard iterator state
const shardIterators = ref<Map<string, string>>(new Map())
const selectedShard = ref<KinesisShard | null>(null)

// Stream columns
const streamColumns = computed(() => [
  { key: 'StreamName', label: 'Stream Name', sortable: true },
  { key: 'StreamARN', label: 'ARN', sortable: false },
  { key: 'StreamStatus', label: 'Status', sortable: true },
])

// Shard columns
const shardColumns = computed(() => [
  { key: 'ShardId', label: 'Shard ID', sortable: true },
  { key: 'ParentShardId', label: 'Parent Shard', sortable: false },
  { key: 'StartingSequenceNumber', label: 'Starting Sequence', sortable: false },
])

// Record columns
const recordColumns = computed(() => [
  { key: 'SequenceNumber', label: 'Sequence #', sortable: false },
  { key: 'PartitionKey', label: 'Partition Key', sortable: true },
  { key: 'Data', label: 'Data', sortable: false },
])

// Helper functions
function getStatus(status: string): 'active' | 'pending' | 'inactive' | 'error' {
  const statusMap: Record<string, 'active' | 'pending' | 'inactive' | 'error'> = {
    ACTIVE: 'active',
    CREATING: 'pending',
    DELETING: 'pending',
    UPDATING: 'pending',
  }
  return statusMap[status] || 'inactive'
}

function decodeData(base64Data: string): string {
  try {
    return atob(base64Data)
  } catch {
    return base64Data
  }
}

// API calls
async function loadStreams() {
  loading.value = true
  try {
    const result = await kinesis.listStreams()
    let streamList = result.StreamSummaries || []
    
    // Handle case where StreamSummaries is null but StreamNames exists
    if (streamList.length === 0 && result.StreamNames && result.StreamNames.length > 0) {
      streamList = result.StreamNames.map((name: string) => ({
        StreamName: name,
        StreamARN: '',
        StreamStatus: 'UNKNOWN'
      }))
    }
    
    streams.value = streamList
    
    if (streams.value.length > 0 && !selectedStream.value) {
      await selectStream(streams.value[0])
    }
  } catch (error) {
    uiStore.notifyError('Error', `Failed to load streams: ${error}`)
  } finally {
    loading.value = false
  }
}

async function selectStream(stream: KinesisStreamSummary) {
  loading.value = true
  selectedStream.value = null
  shards.value = []
  records.value = []
  
  try {
    const result = await kinesis.describeStream(stream.StreamName)
    const streamDesc = result.StreamDescription
    selectedStream.value = {
      StreamName: streamDesc.StreamName,
      StreamARN: streamDesc.StreamARN,
      StreamStatus: streamDesc.StreamStatus,
      StreamModeDetails: streamDesc.StreamModeDetails,
      ShardCount: streamDesc.Shards?.length || 0,
      RetentionPeriodHours: 24, // Would come from API
      StreamCreationTimestamp: streamDesc.StreamCreationTimestamp || new Date().toISOString(),
      EncryptionType: streamDesc.EncryptionType || 'NONE',
    }
    shards.value = streamDesc.Shards || []
  } catch (error) {
    uiStore.notifyError('Error', `Failed to describe stream: ${error}`)
  } finally {
    loading.value = false
  }
}

async function createStream() {
  if (!newStreamName.value) {
    uiStore.notifyWarning('Validation', 'Stream name is required')
    return
  }

  loading.value = true
  try {
    await kinesis.createStream(newStreamName.value, {
      ShardCount: newShardCount.value,
    })
    uiStore.notifySuccess('Success', `Stream ${newStreamName.value} is being created`)
    showCreateModal.value = false
    newStreamName.value = ''
    newShardCount.value = 1
    await loadStreams()
  } catch (error) {
    uiStore.notifyError('Error', `Failed to create stream: ${error}`)
  } finally {
    loading.value = false
  }
}

function openDeleteModal(stream: KinesisStreamSummary) {
  streamToDelete.value = stream
  showDeleteModal.value = true
}

async function confirmDeleteStream() {
  if (!streamToDelete.value) return
  
  loading.value = true
  try {
    await kinesis.deleteStream(streamToDelete.value.StreamName)
    uiStore.notifySuccess('Success', `Stream ${streamToDelete.value.StreamName} is being deleted`)
    
    if (selectedStream.value?.StreamName === streamToDelete.value.StreamName) {
      selectedStream.value = null
      shards.value = []
      records.value = []
    }
    
    showDeleteModal.value = false
    streamToDelete.value = null
    await loadStreams()
  } catch (error) {
    uiStore.notifyError('Error', `Failed to delete stream: ${error}`)
  } finally {
    loading.value = false
  }
}

async function getRecordsForShard(shard: KinesisShard) {
  if (!selectedStream.value) return
  
  selectedShard.value = shard
  recordsLoading.value = true
  records.value = []
  
  try {
    // Get shard iterator
    const iteratorResult = await kinesis.getShardIterator(
      selectedStream.value.StreamName,
      shard.ShardId,
      'TRIM_HORIZON'
    )
    
    shardIterators.value.set(shard.ShardId, iteratorResult.ShardIterator)
    
    // Get records
    const recordsResult = await kinesis.getRecords(
      iteratorResult.ShardIterator,
      { Limit: 100 }
    )
    
    records.value = recordsResult.Records.map(r => ({
      SequenceNumber: r.SequenceNumber,
      Data: r.Data,
      PartitionKey: r.PartitionKey,
      ApproximateArrivalTimestamp: r.ApproximateArrivalTimestamp?.toString(),
    }))
    
    uiStore.notifySuccess('Success', `Retrieved ${records.value.length} records`)
  } catch (error) {
    uiStore.notifyError('Error', `Failed to get records: ${error}`)
  } finally {
    recordsLoading.value = false
  }
}

async function putRecord() {
  if (!selectedStream.value || !putPartitionKey.value || !putData.value) {
    uiStore.notifyWarning('Validation', 'Partition key and data are required')
    return
  }

  loading.value = true
  try {
    await kinesis.putRecord(
      selectedStream.value.StreamName,
      putData.value,
      putPartitionKey.value
    )
    
    uiStore.notifySuccess('Success', 'Record put successfully')
    showPutRecordModal.value = false
    putPartitionKey.value = ''
    putData.value = ''
    
    // Refresh records if we have a selected shard
    if (selectedShard.value) {
      await getRecordsForShard(selectedShard.value)
    }
  } catch (error) {
    uiStore.notifyError('Error', `Failed to put record: ${error}`)
  } finally {
    loading.value = false
  }
}

function viewRecord(record: KinesisRecord) {
  selectedRecord.value = record
  showRecordModal.value = true
}

// Lifecycle
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
            :loading="loading"
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
      <!-- Empty State -->
      <EmptyState
        v-if="!loading && streams.length === 0"
        icon="folder"
        title="No Kinesis Streams"
        description="Create your first Kinesis stream to start processing data streams."
        @action="showCreateModal = true"
      />
      
      <template v-else>
        <!-- Stream List -->
        <div class="mb-6">
          <h2
            class="text-lg font-medium mb-4"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Data Streams
          </h2>
          
          <DataTable
            :columns="streamColumns"
            :data="streams"
            :loading="loading"
            empty-title="No Streams"
            empty-text="No Kinesis streams found"
            @row-click="selectStream"
          >
            <template #cell-StreamName="{ value, row }">
              <div class="flex items-center gap-2">
                <QueueListIcon class="h-4 w-4 text-primary-500" />
                <span class="font-medium">{{ value }}</span>
              </div>
            </template>
            
            <template #cell-StreamStatus="{ value }">
              <StatusBadge
                :status="getStatus(value)"
                :label="value"
              />
            </template>
            
            <template #row-actions="{ row }">
              <div class="flex items-center gap-2">
                <button
                  v-if="selectedStream?.StreamName !== row.StreamName"
                  type="button"
                  class="p-2 rounded hover:bg-light-border dark:hover:bg-dark-border"
                  :class="settingsStore.darkMode ? 'text-dark-muted hover:text-dark-text' : 'text-light-muted hover:text-light-text'"
                  title="View Details"
                  @click.stop="selectStream(row)"
                >
                  <EyeIcon class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                  title="Delete"
                  @click.stop="openDeleteModal(row)"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </template>
          </DataTable>
        </div>
        
        <!-- Stream Details -->
        <div
          v-if="selectedStream"
          class="space-y-6"
        >
          <!-- Stream Info -->
          <div
            class="p-6 rounded-lg border"
            :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
          >
            <div class="flex items-center justify-between mb-4">
              <h3
                class="text-lg font-semibold"
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
              >
                Stream: {{ selectedStream.StreamName }}
              </h3>
              <Button 
                v-if="selectedStream.StreamStatus === 'ACTIVE'" 
                size="sm" 
                @click="showPutRecordModal = true"
              >
                <PlusIcon class="h-4 w-4 mr-1" />
                Put Record
              </Button>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p
                  class="text-sm"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  Status
                </p>
                <StatusBadge
                  :status="getStatus(selectedStream.StreamStatus)"
                  class="mt-1"
                />
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
                  {{ selectedStream.ShardCount }}
                </p>
              </div>
              <div>
                <p
                  class="text-sm"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  Retention Period
                </p>
                <p
                  class="mt-1 font-medium"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                >
                  {{ selectedStream.RetentionPeriodHours }} hours
                </p>
              </div>
              <div>
                <p
                  class="text-sm"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  Encryption
                </p>
                <p
                  class="mt-1 font-medium"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                >
                  {{ selectedStream.EncryptionType }}
                </p>
              </div>
            </div>
          </div>
          
          <!-- Shards -->
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
              :columns="shardColumns"
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
              
              <template #cell-StartingSequenceNumber="{ value }">
                <code class="text-xs">{{ value }}</code>
              </template>
              
              <template #row-actions="{ row }">
                <div class="flex items-center gap-2">
                  <Button 
                    :variant="selectedShard?.ShardId === row.ShardId ? 'primary' : 'secondary'" 
                    size="sm"
                    @click="getRecordsForShard(row)"
                  >
                    <PlayIcon class="h-3 w-3 mr-1" />
                    Get Records
                  </Button>
                </div>
              </template>
            </DataTable>
          </div>
          
          <!-- Records -->
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
            
            <LoadingSpinner v-if="recordsLoading" />
            
            <EmptyState
              v-else-if="records.length === 0"
              icon="folder"
              title="No Records"
              description="No records in this shard"
              compact
            />
            
            <DataTable
              v-else
              :columns="recordColumns"
              :data="records"
              empty-title="No Records"
              empty-text="No records found"
              @row-click="viewRecord"
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
                  @click.stop="viewRecord(row)"
                >
                  <EyeIcon class="h-4 w-4" />
                </button>
              </template>
            </DataTable>
          </div>
        </div>
      </template>
    </div>
    
    <!-- Create Stream Modal -->
    <Modal
      v-model:open="showCreateModal"
      title="Create Kinesis Stream"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newStreamName"
          label="Stream Name"
          placeholder="my-stream"
          required
        />
        <FormInput
          v-model="newShardCount"
          label="Number of Shards"
          type="number"
          placeholder="1"
          help-text="Each shard can handle up to 1,000 records per second or 1 MB per second"
        />
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="loading"
            @click="createStream"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>
    
    <!-- Put Record Modal -->
    <Modal
      v-model:open="showPutRecordModal"
      title="Put Record"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="putPartitionKey"
          label="Partition Key"
          placeholder="partition-key-1"
          required
          help-text="Used to distribute records across shards"
        />
        <div>
          <label
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Data (JSON)
          </label>
          <textarea
            v-model="putData"
            class="w-full h-32 px-3 py-2 rounded-lg border bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            placeholder="{&quot;message&quot;: &quot;hello world&quot;}"
            required
          />
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showPutRecordModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="loading"
            @click="putRecord"
          >
            Put Record
          </Button>
        </div>
      </template>
    </Modal>
    
    <!-- View Record Modal -->
    <Modal
      v-model:open="showRecordModal"
      title="Record Details"
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
              Partition Key
            </p>
            <p
              class="mt-1 font-medium"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              {{ selectedRecord.PartitionKey }}
            </p>
          </div>
          <div>
            <p
              class="text-sm"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              Sequence Number
            </p>
            <code
              class="mt-1 text-xs block"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              {{ selectedRecord.SequenceNumber }}
            </code>
          </div>
        </div>
        
        <div>
          <p
            class="text-sm mb-2"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            Data
          </p>
          <JsonViewer :data="JSON.parse(decodeData(selectedRecord.Data))" />
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

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model:open="showDeleteModal"
      title="Delete Stream"
      :message="`Are you sure you want to delete stream ${streamToDelete?.StreamName}? This action cannot be undone.`"
      confirm-text="Delete"
      @confirm="confirmDeleteStream"
    />
  </div>
</template>
