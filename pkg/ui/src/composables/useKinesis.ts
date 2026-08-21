import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
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
  const toast = useToast()
  const settingsStore = useSettingsStore()
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
      toast.error(`Failed to load streams: ${error}`)
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
      toast.error(`Failed to describe stream: ${error}`)
    } finally {
      isLoading.value = false
    }
  }

  async function createStream() {
    if (!newStream.value.name) {
      toast.warning('Stream name is required')
      return
    }

    isLoading.value = true
    try {
      await kinesisApi.createStream(newStream.value.name, {
        ShardCount: newStream.value.shardCount,
      })
      toast.success(`Stream ${newStream.value.name} is being created`)
      showCreateModal.value = false
      newStream.value = { name: '', shardCount: 1 }
      await loadStreams()
    } catch (error) {
      toast.error(`Failed to create stream: ${error}`)
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
      toast.success(`Stream ${streamToDelete.value.StreamName} is being deleted`)

      if (selectedStream.value?.StreamName === streamToDelete.value.StreamName) {
        selectedStream.value = null
        shards.value = []
        records.value = []
      }

      showDeleteModal.value = false
      streamToDelete.value = null
      await loadStreams()
    } catch (error) {
      toast.error(`Failed to delete stream: ${error}`)
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
      const recordsResult = await kinesisApi.getRecords(
        selectedStream.value.StreamName,
        shard.ShardId,
        iteratorResult.ShardIterator,
        { Limit: 100 },
      )

      records.value = recordsResult.Records.map((r: any) => ({
        SequenceNumber: r.SequenceNumber,
        Data: r.Data,
        PartitionKey: r.PartitionKey,
        ApproximateArrivalTimestamp: r.ApproximateArrivalTimestamp?.toString(),
      }))

      toast.success(`Retrieved ${records.value.length} records`)
    } catch (error) {
      toast.error(`Failed to get records: ${error}`)
    } finally {
      recordsLoading.value = false
    }
  }

  async function putRecord() {
    if (!selectedStream.value || !putRecordForm.value.partitionKey || !putRecordForm.value.data) {
      toast.warning('Partition key and data are required')
      return
    }

    isLoading.value = true
    try {
      await kinesisApi.putRecord(
        selectedStream.value.StreamName,
        putRecordForm.value.data,
        putRecordForm.value.partitionKey,
      )

      toast.success('Record put successfully')
      showPutRecordModal.value = false
      putRecordForm.value = { partitionKey: '', data: '' }

      // Refresh records if we have a selected shard
      if (selectedShard.value) {
        await getRecordsForShard(selectedShard.value)
      }
    } catch (error) {
      toast.error(`Failed to put record: ${error}`)
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

  // Code examples
  const codeExamples = computed(() => [
    {
      language: 'aws-cli',
      label: 'AWS CLI',
      code: `# List Kinesis streams
aws kinesis list-streams --endpoint-url ${settingsStore.publicEndpoint}

# Create stream
aws kinesis create-stream \\
  --stream-name my-stream \\
  --shard-count 1 \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Describe stream
aws kinesis describe-stream \\
  --stream-name my-stream \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Put record
aws kinesis put-record \\
  --stream-name my-stream \\
  --partition-key key1 \\
  --data "hello world" \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Delete stream
aws kinesis delete-stream \\
  --stream-name my-stream \\
  --endpoint-url ${settingsStore.publicEndpoint}`,
    },
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `// Using AWS SDK v3
import { KinesisClient, CreateStreamCommand, PutRecordCommand, GetRecordsCommand } from "@aws-sdk/client-kinesis";

const client = new KinesisClient({
  region: 'us-east-1',
  endpoint: '${settingsStore.publicEndpoint}',
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
console.log(result.Records);`,
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
    endpoint_url='${settingsStore.publicEndpoint}',
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
    print(record['Data'])`,
    },
    {
      language: 'go',
      label: 'Go',
      code: `// Using AWS SDK for Go v2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/kinesis"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("us-east-1"),
)

client := kinesis.NewFromConfig(cfg, func(o *kinesis.Options) {
    o.BaseEndpoint = aws.String("${settingsStore.publicEndpoint}")
})

// Create stream
client.CreateStream(context.Background(), &kinesis.CreateStreamInput{
    StreamName: aws.String("my-stream"),
    ShardCount: aws.Int32(1),
})

// List streams
streams, _ := client.ListStreams(context.Background(), &kinesis.ListStreamsInput{})
fmt.Println(streams.StreamNames)

// Put record
client.PutRecord(context.Background(), &kinesis.PutRecordInput{
    StreamName:   aws.String("my-stream"),
    PartitionKey: aws.String("key1"),
    Data:         []byte("hello world"),
})`,
    },
  ])

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
    codeExamples,

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