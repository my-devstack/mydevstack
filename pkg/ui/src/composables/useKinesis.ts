import { ref, computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useContentReload } from '@/composables/useContentReload'
import * as kinesisApi from '@/api/services/kinesis'

// Types
export interface KinesisStreamSummary {
  StreamName: string
  StreamARN: string
  StreamStatus: string
}

export interface KinesisStream {
  StreamName: string
  StreamARN: string
  StreamStatus: string
  StreamModeDetails?: { StreamMode: 'PROVISIONED' | 'ON_DEMAND' }
  ShardCount: number
  RetentionPeriodHours: number
  StreamCreationTimestamp: string
  EncryptionType: string
}

export interface KinesisShard {
  ShardId: string
  ParentShardId?: string
  AdjacentParentShardId?: string
  HashKeyRange?: { StartingHashKey: string; EndingHashKey: string }
  SequenceNumberRange?: { StartingSequenceNumber: string; EndingSequenceNumber?: string }
}

export interface KinesisRecord {
  SequenceNumber: string
  Data: string
  PartitionKey: string
  ApproximateArrivalTimestamp?: string
}

export interface StreamForm {
  name: string
  shardCount: number
}

export interface RecordForm {
  partitionKey: string
  data: string
}

export function useKinesis() {
  const uiStore = useUIStore()
  const { reloadTrigger } = useContentReload()

  // State
  const streams = ref<KinesisStreamSummary[]>([])
  const selectedStream = ref<KinesisStream | null>(null)
  const shards = ref<KinesisShard[]>([])
  const records = ref<KinesisRecord[]>([])
  const isLoading = ref(false)
  const recordsLoading = ref(false)

  // Modal states
  const showCreateModal = ref(false)
  const showPutRecordModal = ref(false)
  const showRecordModal = ref(false)
  const showDeleteModal = ref(false)

  // Selected items
  const selectedRecord = ref<KinesisRecord | null>(null)
  const streamToDelete = ref<KinesisStreamSummary | null>(null)
  const selectedShard = ref<KinesisShard | null>(null)

  // Shard iterators map
  const shardIterators = ref<Map<string, string>>(new Map())

  // Form states
  const newStream = ref<StreamForm>({
    name: '',
    shardCount: 1,
  })

  const putRecordForm = ref<RecordForm>({
    partitionKey: '',
    data: '',
  })

  // Computed
  const streamCount = computed(() => streams.value.length)

  const streamColumns = computed(() => [
    { key: 'StreamName', label: 'Stream Name', sortable: true },
    { key: 'StreamARN', label: 'ARN', sortable: false },
    { key: 'StreamStatus', label: 'Status', sortable: true },
  ])

  const shardColumns = computed(() => [
    { key: 'ShardId', label: 'Shard ID', sortable: true },
    { key: 'ParentShardId', label: 'Parent Shard', sortable: false },
    { key: 'StartingSequenceNumber', label: 'Starting Sequence', sortable: false },
  ])

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

  // API functions
  async function loadStreams() {
    isLoading.value = true
    try {
      const result = await kinesisApi.listStreams()
      let streamList = result.StreamSummaries || []

      // Handle case where StreamSummaries is null but StreamNames exists
      if (streamList.length === 0 && result.StreamNames && result.StreamNames.length > 0) {
        streamList = result.StreamNames.map((name: string) => ({
          StreamName: name,
          StreamARN: '',
          StreamStatus: 'UNKNOWN',
        }))
      }

      streams.value = streamList

      if (streams.value.length > 0 && !selectedStream.value) {
        await selectStream(streams.value[0])
      }
    } catch (error) {
      uiStore.notifyError('Error', `Failed to load streams: ${error}`)
    } finally {
      isLoading.value = false
    }
  }

  async function selectStream(stream: KinesisStreamSummary) {
    isLoading.value = true
    selectedStream.value = null
    shards.value = []
    records.value = []

    try {
      const result = await kinesisApi.describeStream(stream.StreamName)
      const streamDesc = result.StreamDescription
      selectedStream.value = {
        StreamName: streamDesc.StreamName,
        StreamARN: streamDesc.StreamARN,
        StreamStatus: streamDesc.StreamStatus,
        StreamModeDetails: streamDesc.StreamModeDetails,
        ShardCount: streamDesc.Shards?.length || 0,
        RetentionPeriodHours: 24,
        StreamCreationTimestamp: streamDesc.StreamCreationTimestamp || new Date().toISOString(),
        EncryptionType: streamDesc.EncryptionType || 'NONE',
      }
      shards.value = streamDesc.Shards || []
    } catch (error) {
      uiStore.notifyError('Error', `Failed to describe stream: ${error}`)
    } finally {
      isLoading.value = false
    }
  }

  async function createStream() {
    if (!newStream.value.name) {
      uiStore.notifyWarning('Validation', 'Stream name is required')
      return
    }

    isLoading.value = true
    try {
      await kinesisApi.createStream(newStream.value.name, {
        ShardCount: newStream.value.shardCount,
      })
      uiStore.notifySuccess('Success', `Stream ${newStream.value.name} is being created`)
      showCreateModal.value = false
      newStream.value = { name: '', shardCount: 1 }
      await loadStreams()
    } catch (error) {
      uiStore.notifyError('Error', `Failed to create stream: ${error}`)
    } finally {
      isLoading.value = false
    }
  }

  function openDeleteModal(stream: KinesisStreamSummary) {
    streamToDelete.value = stream
    showDeleteModal.value = true
  }

  async function confirmDeleteStream() {
    if (!streamToDelete.value) return

    isLoading.value = true
    try {
      await kinesisApi.deleteStream(streamToDelete.value.StreamName)
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
      isLoading.value = false
    }
  }

  async function getRecordsForShard(shard: KinesisShard) {
    if (!selectedStream.value) return

    selectedShard.value = shard
    recordsLoading.value = true
    records.value = []

    try {
      // Get shard iterator
      const iteratorResult = await kinesisApi.getShardIterator(
        selectedStream.value.StreamName,
        shard.ShardId,
        'TRIM_HORIZON',
      )

      shardIterators.value.set(shard.ShardId, iteratorResult.ShardIterator)

      // Get records
      const recordsResult = await kinesisApi.getRecords(iteratorResult.ShardIterator, { Limit: 100 })

      records.value = recordsResult.Records.map((r: any) => ({
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
    if (!selectedStream.value || !putRecordForm.value.partitionKey || !putRecordForm.value.data) {
      uiStore.notifyWarning('Validation', 'Partition key and data are required')
      return
    }

    isLoading.value = true
    try {
      await kinesisApi.putRecord(
        selectedStream.value.StreamName,
        putRecordForm.value.data,
        putRecordForm.value.partitionKey,
      )

      uiStore.notifySuccess('Success', 'Record put successfully')
      showPutRecordModal.value = false
      putRecordForm.value = { partitionKey: '', data: '' }

      // Refresh records if we have a selected shard
      if (selectedShard.value) {
        await getRecordsForShard(selectedShard.value)
      }
    } catch (error) {
      uiStore.notifyError('Error', `Failed to put record: ${error}`)
    } finally {
      isLoading.value = false
    }
  }

  function viewRecord(record: KinesisRecord) {
    selectedRecord.value = record
    showRecordModal.value = true
  }

  // Setup reload watcher helper
  function setupReloadWatcher() {
    return reloadTrigger
  }

  return {
    // State
    streams,
    selectedStream,
    shards,
    records,
    isLoading,
    recordsLoading,
    showCreateModal,
    showPutRecordModal,
    showRecordModal,
    showDeleteModal,
    selectedRecord,
    streamToDelete,
    selectedShard,
    newStream,
    putRecordForm,
    shardIterators,

    // Computed
    streamCount,
    streamColumns,
    shardColumns,
    recordColumns,

    // Functions
    loadStreams,
    selectStream,
    createStream,
    openDeleteModal,
    confirmDeleteStream,
    getRecordsForShard,
    putRecord,
    viewRecord,
    getStatus,
    decodeData,
    setupReloadWatcher,
  }
}