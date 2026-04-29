import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { useKinesis } from '@/composables/useKinesis'
import KinesisCreateModal from '@/components/kinesis/KinesisCreateModal.vue'
import KinesisPutRecordModal from '@/components/kinesis/KinesisPutRecordModal.vue'
import KinesisViewRecordModal from '@/components/kinesis/KinesisViewRecordModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

// Mock services
vi.mock('@/api/services/kinesis', () => ({
  listStreams: vi.fn(),
  describeStream: vi.fn(),
  createStream: vi.fn(),
  deleteStream: vi.fn(),
  getShardIterator: vi.fn(),
  getRecords: vi.fn(),
  putRecord: vi.fn(),
}))

// Mock UI store
const mockNotifySuccess = vi.fn()
const mockNotifyError = vi.fn()
const mockNotifyWarning = vi.fn()

vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: mockNotifySuccess,
    notifyError: mockNotifyError,
    notifyWarning: mockNotifyWarning,
  })),
}))

// Mock useContentReload
vi.mock('@/composables/useContentReload', () => ({
  useContentReload: vi.fn(() => ({
    reloadTrigger: { value: 0 },
  })),
}))

import * as kinesisApi from '@/api/services/kinesis'

describe('Kinesis Integration Flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Create Stream Flow', () => {
    it('opens create modal and creates stream', async () => {
      vi.mocked(kinesisApi.createStream).mockResolvedValue({})
      vi.mocked(kinesisApi.listStreams).mockResolvedValue({ StreamSummaries: [] })

      const { showCreateModal, newStream, createStream, isLoading } = useKinesis()

      // Open modal
      showCreateModal.value = true
      expect(showCreateModal.value).toBe(true)

      // Fill form
      newStream.value = { name: 'test-stream', shardCount: 2 }
      expect(newStream.value.name).toBe('test-stream')

      // Create
      await createStream()

      expect(kinesisApi.createStream).toHaveBeenCalledWith('test-stream', { ShardCount: 2 })
      expect(mockNotifySuccess).toHaveBeenCalledWith('Success', 'Stream test-stream is being created')
      expect(showCreateModal.value).toBe(false)
      expect(newStream.value).toEqual({ name: '', shardCount: 1 })
    })

    it('validates stream name before creation', async () => {
      const { newStream, createStream } = useKinesis()

      newStream.value = { name: '', shardCount: 1 }
      await createStream()

      expect(kinesisApi.createStream).not.toHaveBeenCalled()
      expect(mockNotifyWarning).toHaveBeenCalledWith('Validation', 'Stream name is required')
    })

    it('handles creation error', async () => {
      vi.mocked(kinesisApi.createStream).mockRejectedValue(new Error('Create failed'))

      const { newStream, createStream, isLoading } = useKinesis()

      newStream.value = { name: 'bad-stream', shardCount: 1 }
      await createStream()

      expect(mockNotifyError).toHaveBeenCalled()
    })
  })

  describe('Delete Stream Flow', () => {
    it('opens delete modal and deletes stream', async () => {
      vi.mocked(kinesisApi.deleteStream).mockResolvedValue({})
      vi.mocked(kinesisApi.listStreams).mockResolvedValue({ StreamSummaries: [] })

      const { showDeleteModal, streamToDelete, confirmDeleteStream, selectedStream } = useKinesis()

      // Setup: selected stream
      selectedStream.value = {
        StreamName: 'stream-to-delete',
        StreamARN: 'arn:delete',
        StreamStatus: 'ACTIVE',
        ShardCount: 1,
        RetentionPeriodHours: 24,
        StreamCreationTimestamp: '',
        EncryptionType: '',
      }

      // Open modal
      streamToDelete.value = { StreamName: 'stream-to-delete', StreamARN: 'arn:delete', StreamStatus: 'ACTIVE' }
      showDeleteModal.value = true
      expect(showDeleteModal.value).toBe(true)

      // Confirm delete
      await confirmDeleteStream()

      expect(kinesisApi.deleteStream).toHaveBeenCalledWith('stream-to-delete')
      expect(mockNotifySuccess).toHaveBeenCalledWith('Success', 'Stream stream-to-delete is being deleted')
      expect(showDeleteModal.value).toBe(false)
      expect(selectedStream.value).toBeNull()
    })

    it('does nothing when no stream selected for delete', async () => {
      const { streamToDelete, confirmDeleteStream } = useKinesis()

      streamToDelete.value = null
      await confirmDeleteStream()

      expect(kinesisApi.deleteStream).not.toHaveBeenCalled()
    })
  })

  describe('Put Record Flow', () => {
    it('opens put record modal and puts record', async () => {
      vi.mocked(kinesisApi.putRecord).mockResolvedValue({})
      vi.mocked(kinesisApi.getShardIterator).mockResolvedValue({ ShardIterator: 'it' })
      vi.mocked(kinesisApi.getRecords).mockResolvedValue({ Records: [] })

      const { showPutRecordModal, putRecordForm, putRecord, selectedStream, selectedShard, showPutRecordModal: modal } = useKinesis()

      // Setup: selected stream and shard
      selectedStream.value = {
        StreamName: 'test-stream',
        StreamARN: 'arn:test',
        StreamStatus: 'ACTIVE',
        ShardCount: 1,
        RetentionPeriodHours: 24,
        StreamCreationTimestamp: '',
        EncryptionType: '',
      }
      selectedShard.value = { ShardId: 'shard-1' }

      // Open modal
      showPutRecordModal.value = true
      expect(showPutRecordModal.value).toBe(true)

      // Fill form
      putRecordForm.value = { partitionKey: 'pk1', data: '{"msg":"hello"}' }
      expect(putRecordForm.value.partitionKey).toBe('pk1')

      // Put record
      await putRecord()

      expect(kinesisApi.putRecord).toHaveBeenCalledWith('test-stream', '{"msg":"hello"}', 'pk1')
      expect(mockNotifySuccess).toHaveBeenCalledWith('Success', 'Record put successfully')
      expect(showPutRecordModal.value).toBe(false)
      expect(putRecordForm.value).toEqual({ partitionKey: '', data: '' })
    })

    it('validates partition key and data required', async () => {
      const { putRecordForm, putRecord, selectedStream } = useKinesis()

      selectedStream.value = {
        StreamName: 'test-stream',
        StreamARN: 'arn:test',
        StreamStatus: 'ACTIVE',
        ShardCount: 1,
        RetentionPeriodHours: 24,
        StreamCreationTimestamp: '',
        EncryptionType: '',
      }
      putRecordForm.value = { partitionKey: '', data: '' }

      await putRecord()

      expect(kinesisApi.putRecord).not.toHaveBeenCalled()
      expect(mockNotifyWarning).toHaveBeenCalledWith('Validation', 'Partition key and data are required')
    })

    it('refreshes records after putting', async () => {
      vi.mocked(kinesisApi.putRecord).mockResolvedValue({})
      vi.mocked(kinesisApi.getShardIterator).mockResolvedValue({ ShardIterator: 'it' })
      vi.mocked(kinesisApi.getRecords).mockResolvedValue({
        Records: [{ SequenceNumber: 'new', Data: 'new', PartitionKey: 'pk' }],
      })

      const { putRecordForm, putRecord, selectedStream, selectedShard, records } = useKinesis()

      selectedStream.value = {
        StreamName: 'test-stream',
        StreamARN: 'arn:test',
        StreamStatus: 'ACTIVE',
        ShardCount: 1,
        RetentionPeriodHours: 24,
        StreamCreationTimestamp: '',
        EncryptionType: '',
      }
      selectedShard.value = { ShardId: 'shard-1' }
      putRecordForm.value = { partitionKey: 'pk1', data: 'new-data' }

      await putRecord()

      expect(records.value).toHaveLength(1)
      expect(records.value[0].SequenceNumber).toBe('new')
    })
  })

  describe('View Record Flow', () => {
    it('opens view record modal with record details', () => {
      const { showRecordModal, selectedRecord, viewRecord } = useKinesis()

      const record = { SequenceNumber: '123', Data: 'SGVsbG8=', PartitionKey: 'key1' }
      viewRecord(record)

      expect(showRecordModal.value).toBe(true)
      expect(selectedRecord.value).toEqual(record)
      expect(selectedRecord.value?.SequenceNumber).toBe('123')
    })

    it('decodes base64 data correctly', () => {
      const { decodeData } = useKinesis()

      // Base64 of "Hello"
      const encoded = 'SGVsbG8='
      expect(decodeData(encoded)).toBe('Hello')
    })

    it('returns original if decode fails', () => {
      const { decodeData } = useKinesis()

      expect(decodeData('invalid!')).toBe('invalid!')
    })
  })

  describe('Full User Flow', () => {
    it('completes full flow: load streams -> select -> get records', async () => {
      // Mock API responses
      vi.mocked(kinesisApi.listStreams).mockResolvedValue({
        StreamSummaries: [{ StreamName: 'stream-1', StreamARN: 'arn:1', StreamStatus: 'ACTIVE' }],
      })

      vi.mocked(kinesisApi.describeStream).mockResolvedValue({
        StreamDescription: {
          StreamName: 'stream-1',
          StreamARN: 'arn:1',
          StreamStatus: 'ACTIVE',
          Shards: [{ ShardId: 'shard-1', SequenceNumberRange: { StartingSequenceNumber: '1' } }],
          StreamCreationTimestamp: '2024-01-01',
          EncryptionType: 'NONE',
        },
      })

      vi.mocked(kinesisApi.getShardIterator).mockResolvedValue({
        ShardIterator: 'iterator-1',
      })

      vi.mocked(kinesisApi.getRecords).mockResolvedValue({
        Records: [
          { SequenceNumber: '001', Data: 'dGVzdA==', PartitionKey: 'key1' },
          { SequenceNumber: '002', Data: 'ZGF0YQ==', PartitionKey: 'key2' },
        ],
      })

      const { loadStreams, selectStream, getRecordsForShard, streams, selectedStream, shards, records } = useKinesis()

      // Load streams
      await loadStreams()
      expect(streams.value).toHaveLength(1)
      expect(streams.value[0].StreamName).toBe('stream-1')

      // Stream is auto-selected
      expect(selectedStream.value).not.toBeNull()
      expect(selectedStream.value?.StreamName).toBe('stream-1')
      expect(shards.value).toHaveLength(1)
      expect(shards.value[0].ShardId).toBe('shard-1')

      // Get records for shard
      await getRecordsForShard(shards.value[0])
      expect(records.value).toHaveLength(2)
      expect(records.value[0].SequenceNumber).toBe('001')
    })
  })
})