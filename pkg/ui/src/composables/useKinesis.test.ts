import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useKinesis } from './useKinesis'

// Mock the Kinesis API module
vi.mock('@/api/services/kinesis', () => ({
  listStreams: vi.fn(),
  describeStream: vi.fn(),
  createStream: vi.fn(),
  deleteStream: vi.fn(),
  getShardIterator: vi.fn(),
  getRecords: vi.fn(),
  putRecord: vi.fn(),
}))

// Create shared mock functions for toast
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
const mockToastWarning = vi.fn()

// Mock the useToast composable
vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(() => ({
    success: mockToastSuccess,
    error: mockToastError,
    warning: mockToastWarning,
  })),
}))

// Mock the useContentReload composable
vi.mock('@/composables/useContentReload', () => ({
  useContentReload: vi.fn(() => ({
    reloadTrigger: { value: 0 },
  })),
}))

import * as kinesisApi from '@/api/services/kinesis'

describe('useKinesis', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('initializes with empty state', () => {
      const {
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
        streamCount,
      } = useKinesis()

      expect(streams.value).toEqual([])
      expect(selectedStream.value).toBeNull()
      expect(shards.value).toEqual([])
      expect(records.value).toEqual([])
      expect(isLoading.value).toBe(false)
      expect(recordsLoading.value).toBe(false)
      expect(showCreateModal.value).toBe(false)
      expect(showPutRecordModal.value).toBe(false)
      expect(showRecordModal.value).toBe(false)
      expect(showDeleteModal.value).toBe(false)
      expect(selectedRecord.value).toBeNull()
      expect(streamToDelete.value).toBeNull()
      expect(selectedShard.value).toBeNull()
      expect(newStream.value).toEqual({ name: '', shardCount: 1 })
      expect(putRecordForm.value).toEqual({ partitionKey: '', data: '' })
      expect(streamCount.value).toBe(0)
    })
  })

  describe('loadStreams', () => {
    it('loads streams successfully', async () => {
      const mockStreams = [
        { StreamName: 'stream-1', StreamARN: 'arn:1', StreamStatus: 'ACTIVE' },
        { StreamName: 'stream-2', StreamARN: 'arn:2', StreamStatus: 'CREATING' },
      ]

      vi.mocked(kinesisApi.listStreams).mockResolvedValue({
        StreamSummaries: mockStreams,
      })
      vi.mocked(kinesisApi.describeStream).mockResolvedValue({
        StreamDescription: {
          StreamName: 'stream-1',
          StreamARN: 'arn:1',
          StreamStatus: 'ACTIVE',
          Shards: [],
          StreamCreationTimestamp: '2024-01-01',
          EncryptionType: 'NONE',
        },
      })

      const { loadStreams, streams, isLoading, selectedStream } = useKinesis()

      await loadStreams()

      expect(kinesisApi.listStreams).toHaveBeenCalled()
      expect(streams.value).toHaveLength(2)
      expect(streams.value[0].StreamName).toBe('stream-1')
      expect(isLoading.value).toBe(false)
      expect(selectedStream.value).not.toBeNull()
    })

    it('handles StreamNames when StreamSummaries is empty', async () => {
      vi.mocked(kinesisApi.listStreams).mockResolvedValue({
        StreamNames: ['stream-a', 'stream-b'],
      })
      vi.mocked(kinesisApi.describeStream).mockResolvedValue({
        StreamDescription: {
          StreamName: 'stream-a',
          StreamARN: '',
          StreamStatus: 'UNKNOWN',
          Shards: [],
          StreamCreationTimestamp: '2024-01-01',
          EncryptionType: 'NONE',
        },
      })

      const { loadStreams, streams } = useKinesis()

      await loadStreams()

      expect(streams.value).toHaveLength(2)
      expect(streams.value[0].StreamName).toBe('stream-a')
    })

    it('handles error when loading streams fails', async () => {
      vi.mocked(kinesisApi.listStreams).mockRejectedValue(new Error('Network error'))

      const { loadStreams, isLoading } = useKinesis()

      await loadStreams()

      expect(isLoading.value).toBe(false)
      expect(mockToastError).toHaveBeenCalledWith('Failed to load streams: Error: Network error')
    })

    it('auto-selects first stream when streams exist', async () => {
      vi.mocked(kinesisApi.listStreams).mockResolvedValue({
        StreamSummaries: [
          { StreamName: 'stream-1', StreamARN: 'arn:1', StreamStatus: 'ACTIVE' },
        ],
      })
      vi.mocked(kinesisApi.describeStream).mockResolvedValue({
        StreamDescription: {
          StreamName: 'stream-1',
          StreamARN: 'arn:1',
          StreamStatus: 'ACTIVE',
          Shards: [{ ShardId: 'shard-1' }],
          StreamCreationTimestamp: '2024-01-01',
          EncryptionType: 'NONE',
        },
      })

      const { loadStreams, selectedStream } = useKinesis()

      await loadStreams()

      expect(selectedStream.value).not.toBeNull()
      expect(selectedStream.value?.StreamName).toBe('stream-1')
    })
  })

  describe('selectStream', () => {
    it('selects stream and loads details', async () => {
      vi.mocked(kinesisApi.describeStream).mockResolvedValue({
        StreamDescription: {
          StreamName: 'test-stream',
          StreamARN: 'arn:test',
          StreamStatus: 'ACTIVE',
          StreamModeDetails: { StreamMode: 'PROVISIONED' },
          Shards: [
            { ShardId: 'shard-1' },
            { ShardId: 'shard-2' },
          ],
          StreamCreationTimestamp: '2024-01-01',
          EncryptionType: 'KMS',
        },
      })

      const { selectStream, selectedStream, shards, isLoading } = useKinesis()

      await selectStream({ StreamName: 'test-stream', StreamARN: 'arn:test', StreamStatus: 'ACTIVE' })

      expect(kinesisApi.describeStream).toHaveBeenCalledWith('test-stream')
      expect(selectedStream.value).not.toBeNull()
      expect(selectedStream.value?.StreamName).toBe('test-stream')
      expect(shards.value).toHaveLength(2)
      expect(isLoading.value).toBe(false)
    })

    it('clears previous selection before loading new stream', async () => {
      vi.mocked(kinesisApi.describeStream).mockResolvedValue({
        StreamDescription: {
          StreamName: 'stream-2',
          StreamARN: 'arn:2',
          StreamStatus: 'ACTIVE',
          Shards: [],
          StreamCreationTimestamp: '2024-01-01',
          EncryptionType: 'NONE',
        },
      })

      const { selectStream, selectedStream, shards, records } = useKinesis()

      // First select sets values
      selectedStream.value = { StreamName: 'old', StreamARN: 'old', StreamStatus: 'ACTIVE', ShardCount: 1, RetentionPeriodHours: 24, StreamCreationTimestamp: '', EncryptionType: '' }
      shards.value = [{ ShardId: 'old-shard' }]
      records.value = [{ SequenceNumber: '1', Data: 'data', PartitionKey: 'key' }]

      await selectStream({ StreamName: 'stream-2', StreamARN: 'arn:2', StreamStatus: 'ACTIVE' })

      expect(selectedStream.value?.StreamName).toBe('stream-2')
      expect(shards.value).toEqual([])
      expect(records.value).toEqual([])
    })

    it('handles error when describing stream fails', async () => {
      vi.mocked(kinesisApi.describeStream).mockRejectedValue(new Error('Not found'))

      const { selectStream, isLoading } = useKinesis()

      await selectStream({ StreamName: 'bad', StreamARN: '', StreamStatus: 'ACTIVE' })

      expect(isLoading.value).toBe(false)
      expect(mockToastError).toHaveBeenCalled()
    })
  })

  describe('createStream', () => {
    it('creates stream successfully', async () => {
      vi.mocked(kinesisApi.createStream).mockResolvedValue({})
      vi.mocked(kinesisApi.listStreams).mockResolvedValue({ StreamSummaries: [] })

      const { createStream, newStream, showCreateModal, isLoading } = useKinesis()

      newStream.value = { name: 'new-stream', shardCount: 2 }

      await createStream()

      expect(kinesisApi.createStream).toHaveBeenCalledWith('new-stream', { ShardCount: 2 })
      expect(showCreateModal.value).toBe(false)
      expect(newStream.value).toEqual({ name: '', shardCount: 1 })
    })

    it('validates stream name required', async () => {
      const { createStream, newStream } = useKinesis()

      newStream.value = { name: '', shardCount: 1 }

      await createStream()

      expect(kinesisApi.createStream).not.toHaveBeenCalled()
      expect(mockToastWarning).toHaveBeenCalledWith('Stream name is required')
    })

    it('handles error when creating stream fails', async () => {
      vi.mocked(kinesisApi.createStream).mockRejectedValue(new Error('Create failed'))

      const { createStream, newStream, isLoading } = useKinesis()

      newStream.value = { name: 'bad-stream', shardCount: 1 }

      await createStream()

      expect(mockToastError).toHaveBeenCalled()
    })

    it('resets form after successful creation', async () => {
      vi.mocked(kinesisApi.createStream).mockResolvedValue({})
      vi.mocked(kinesisApi.listStreams).mockResolvedValue({ StreamSummaries: [] })

      const { createStream, newStream, showCreateModal } = useKinesis()

      newStream.value = { name: 'test', shardCount: 5 }
      showCreateModal.value = true

      await createStream()

      expect(newStream.value).toEqual({ name: '', shardCount: 1 })
    })
  })

  describe('openDeleteModal and confirmDeleteStream', () => {
    it('opens delete modal with stream', () => {
      const { openDeleteModal, showDeleteModal, streamToDelete } = useKinesis()

      const stream = { StreamName: 'to-delete', StreamARN: 'arn:del', StreamStatus: 'ACTIVE' }
      openDeleteModal(stream)

      expect(showDeleteModal.value).toBe(true)
      expect(streamToDelete.value).toEqual(stream)
    })

    it('deletes stream successfully', async () => {
      vi.mocked(kinesisApi.deleteStream).mockResolvedValue({})
      vi.mocked(kinesisApi.listStreams).mockResolvedValue({ StreamSummaries: [] })

      const { confirmDeleteStream, streamToDelete, showDeleteModal, selectedStream, isLoading } = useKinesis()

      streamToDelete.value = { StreamName: 'del-stream', StreamARN: 'arn:del', StreamStatus: 'ACTIVE' }

      await confirmDeleteStream()

      expect(kinesisApi.deleteStream).toHaveBeenCalledWith('del-stream')
      expect(showDeleteModal.value).toBe(false)
      expect(streamToDelete.value).toBeNull()
    })

    it('clears selection if deleted stream was selected', async () => {
      vi.mocked(kinesisApi.deleteStream).mockResolvedValue({})
      vi.mocked(kinesisApi.listStreams).mockResolvedValue({ StreamSummaries: [] })

      const { confirmDeleteStream, streamToDelete, selectedStream, showDeleteModal } = useKinesis()

      selectedStream.value = { StreamName: 'del-stream', StreamARN: 'arn:del', StreamStatus: 'ACTIVE', ShardCount: 1, RetentionPeriodHours: 24, StreamCreationTimestamp: '', EncryptionType: '' }
      streamToDelete.value = { StreamName: 'del-stream', StreamARN: 'arn:del', StreamStatus: 'ACTIVE' }

      await confirmDeleteStream()

      expect(selectedStream.value).toBeNull()
    })

    it('does nothing if no stream to delete', async () => {
      const { confirmDeleteStream, streamToDelete } = useKinesis()

      streamToDelete.value = null

      await confirmDeleteStream()

      expect(kinesisApi.deleteStream).not.toHaveBeenCalled()
    })

    it('handles error when delete fails', async () => {
      vi.mocked(kinesisApi.deleteStream).mockRejectedValue(new Error('Delete failed'))

      const { confirmDeleteStream, streamToDelete, isLoading } = useKinesis()

      streamToDelete.value = { StreamName: 'del-stream', StreamARN: 'arn:del', StreamStatus: 'ACTIVE' }

      await confirmDeleteStream()

      expect(mockToastError).toHaveBeenCalled()
    })
  })

  describe('getRecordsForShard', () => {
    it('fetches records for shard successfully', async () => {
      vi.mocked(kinesisApi.getShardIterator).mockResolvedValue({
        ShardIterator: 'iterator-123',
      })
      vi.mocked(kinesisApi.getRecords).mockResolvedValue({
        Records: [
          { SequenceNumber: '1', Data: 'dGVzdA==', PartitionKey: 'key1', ApproximateArrivalTimestamp: 123 },
          { SequenceNumber: '2', Data: 'ZGF0YQ==', PartitionKey: 'key2', ApproximateArrivalTimestamp: 124 },
        ],
      })

      const {
        getRecordsForShard,
        selectedStream,
        selectedShard,
        records,
        recordsLoading,
      } = useKinesis()

      selectedStream.value = {
        StreamName: 'test-stream',
        StreamARN: 'arn:test',
        StreamStatus: 'ACTIVE',
        ShardCount: 1,
        RetentionPeriodHours: 24,
        StreamCreationTimestamp: '',
        EncryptionType: '',
      }

      const shard = { ShardId: 'shard-1' }

      await getRecordsForShard(shard)

      expect(kinesisApi.getShardIterator).toHaveBeenCalledWith('test-stream', 'shard-1', 'TRIM_HORIZON')
      expect(kinesisApi.getRecords).toHaveBeenCalledWith('test-stream', 'shard-1', 'iterator-123', { Limit: 100 })
      expect(records.value).toHaveLength(2)
      expect(records.value[0].SequenceNumber).toBe('1')
      expect(recordsLoading.value).toBe(false)
    })

    it('does nothing if no stream selected', async () => {
      const { getRecordsForShard, selectedStream } = useKinesis()

      selectedStream.value = null

      await getRecordsForShard({ ShardId: 'shard-1' })

      expect(kinesisApi.getShardIterator).not.toHaveBeenCalled()
    })

    it('stores shard iterator', async () => {
      vi.mocked(kinesisApi.getShardIterator).mockResolvedValue({
        ShardIterator: 'iterator-abc',
      })
      vi.mocked(kinesisApi.getRecords).mockResolvedValue({ Records: [] })

      const { getRecordsForShard, selectedStream, shardIterators } = useKinesis()

      selectedStream.value = {
        StreamName: 'test-stream',
        StreamARN: 'arn:test',
        StreamStatus: 'ACTIVE',
        ShardCount: 1,
        RetentionPeriodHours: 24,
        StreamCreationTimestamp: '',
        EncryptionType: '',
      }

      await getRecordsForShard({ ShardId: 'shard-x' })

      expect(shardIterators.value.get('shard-x')).toBe('iterator-abc')
    })

    it('handles error when fetching records fails', async () => {
      vi.mocked(kinesisApi.getShardIterator).mockRejectedValue(new Error('Iterator failed'))

      const { getRecordsForShard, selectedStream, recordsLoading } = useKinesis()

      selectedStream.value = {
        StreamName: 'test-stream',
        StreamARN: 'arn:test',
        StreamStatus: 'ACTIVE',
        ShardCount: 1,
        RetentionPeriodHours: 24,
        StreamCreationTimestamp: '',
        EncryptionType: '',
      }

      await getRecordsForShard({ ShardId: 'bad-shard' })

      expect(recordsLoading.value).toBe(false)
      expect(mockToastError).toHaveBeenCalled()
    })
  })

  describe('putRecord', () => {
    it('puts record successfully', async () => {
      vi.mocked(kinesisApi.putRecord).mockResolvedValue({})

      const { putRecord, selectedStream, putRecordForm, showPutRecordModal, isLoading, selectedShard } = useKinesis()

      selectedStream.value = {
        StreamName: 'test-stream',
        StreamARN: 'arn:test',
        StreamStatus: 'ACTIVE',
        ShardCount: 1,
        RetentionPeriodHours: 24,
        StreamCreationTimestamp: '',
        EncryptionType: '',
      }
      putRecordForm.value = { partitionKey: 'pk1', data: '{"msg":"hello"}' }

      vi.mocked(kinesisApi.getShardIterator).mockResolvedValue({ ShardIterator: 'it' })
      vi.mocked(kinesisApi.getRecords).mockResolvedValue({ Records: [] })

      await putRecord()

      expect(kinesisApi.putRecord).toHaveBeenCalledWith('test-stream', '{"msg":"hello"}', 'pk1')
      expect(showPutRecordModal.value).toBe(false)
      expect(putRecordForm.value).toEqual({ partitionKey: '', data: '' })
    })

    it('validates required fields', async () => {
      const { putRecord, selectedStream, putRecordForm } = useKinesis()

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
      expect(mockToastWarning).toHaveBeenCalledWith('Partition key and data are required')
    })

    it('refreshes records after putting', async () => {
      vi.mocked(kinesisApi.putRecord).mockResolvedValue({})
      vi.mocked(kinesisApi.getShardIterator).mockResolvedValue({ ShardIterator: 'it' })
      vi.mocked(kinesisApi.getRecords).mockResolvedValue({ Records: [{ SequenceNumber: 'new', Data: 'new', PartitionKey: 'pk' }] })

      const { putRecord, selectedStream, putRecordForm, selectedShard, records } = useKinesis()

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
    })
  })

  describe('viewRecord', () => {
    it('opens record modal with record', () => {
      const { viewRecord, showRecordModal, selectedRecord } = useKinesis()

      const record = { SequenceNumber: '123', Data: 'dGVzdA==', PartitionKey: 'key1' }
      viewRecord(record)

      expect(showRecordModal.value).toBe(true)
      expect(selectedRecord.value).toEqual(record)
    })
  })

  describe('getStatus', () => {
    it('returns active for ACTIVE status', () => {
      const { getStatus } = useKinesis()

      expect(getStatus('ACTIVE')).toBe('active')
    })

    it('returns pending for CREATING status', () => {
      const { getStatus } = useKinesis()

      expect(getStatus('CREATING')).toBe('pending')
    })

    it('returns pending for DELETING status', () => {
      const { getStatus } = useKinesis()

      expect(getStatus('DELETING')).toBe('pending')
    })

    it('returns pending for UPDATING status', () => {
      const { getStatus } = useKinesis()

      expect(getStatus('UPDATING')).toBe('pending')
    })

    it('returns inactive for unknown status', () => {
      const { getStatus } = useKinesis()

      expect(getStatus('UNKNOWN')).toBe('inactive')
      expect(getStatus('RANDOM')).toBe('inactive')
    })
  })

  describe('decodeData', () => {
    it('decodes base64 string', () => {
      const { decodeData } = useKinesis()

      expect(decodeData('SGVsbG8gV29ybGQ=')).toBe('Hello World')
    })

    it('returns original string if decode fails', () => {
      const { decodeData } = useKinesis()

      expect(decodeData('not-valid-base64!')).toBe('not-valid-base64!')
    })
  })

  describe('streamCount', () => {
    it('returns correct count', () => {
      const { streams, streamCount } = useKinesis()

      expect(streamCount.value).toBe(0)

      streams.value = [
        { StreamName: 's1', StreamARN: 'a1', StreamStatus: 'ACTIVE' },
        { StreamName: 's2', StreamARN: 'a2', StreamStatus: 'ACTIVE' },
      ]

      expect(streamCount.value).toBe(2)
    })
  })

  describe('setupReloadWatcher', () => {
    it('returns the reloadTrigger', () => {
      const { setupReloadWatcher } = useKinesis()
      const result = setupReloadWatcher()

      expect(result).toBeDefined()
    })
  })
})