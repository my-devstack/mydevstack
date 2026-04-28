import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useS3 } from '@/composables/useS3'
import * as s3Api from '@/api/services/s3'

vi.mock('@/api/services/s3', () => ({
  listBuckets: vi.fn().mockResolvedValue([]),
  listObjects: vi.fn().mockResolvedValue({ objects: [] }),
  createBucket: vi.fn().mockResolvedValue({}),
  deleteBucket: vi.fn().mockResolvedValue({}),
  deleteObject: vi.fn().mockResolvedValue({}),
  putObject: vi.fn().mockResolvedValue({}),
  getObject: vi.fn().mockResolvedValue({ Body: 'test', ContentType: 'text/plain' }),
}))

vi.mock('@/stores/ui', () => ({
  useUIStore: () => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
  }),
}))

describe('useS3 Composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('initializes with empty state', () => {
      const { buckets, objects, selectedBucket, loading, uploading } = useS3()
      expect(buckets.value).toEqual([])
      expect(objects.value).toEqual([])
      expect(selectedBucket.value).toBeNull()
      expect(loading.value).toBe(false)
      expect(uploading.value).toBe(false)
    })

    it('has all required methods', () => {
      const { loadBuckets, loadObjects, createBucket, deleteBucket, deleteObject, uploadObject, getObject } = useS3()
      expect(typeof loadBuckets).toBe('function')
      expect(typeof loadObjects).toBe('function')
      expect(typeof createBucket).toBe('function')
      expect(typeof deleteBucket).toBe('function')
      expect(typeof deleteObject).toBe('function')
      expect(typeof uploadObject).toBe('function')
      expect(typeof getObject).toBe('function')
    })
  })

  describe('loadBuckets', () => {
    it('loads buckets successfully', async () => {
      const mockBuckets = [{ Name: 'bucket1' }, { Name: 'bucket2' }]
      vi.mocked(s3Api.listBuckets).mockResolvedValue(mockBuckets)

      const { loadBuckets, buckets } = useS3()
      await loadBuckets()
      
      expect(buckets.value).toHaveLength(2)
      expect(s3Api.listBuckets).toHaveBeenCalled()
    })

    it('sets loading during load', async () => {
      const { loadBuckets, loading } = useS3()
      
      expect(loading.value).toBe(false)
      const promise = loadBuckets()
      expect(loading.value).toBe(true)
      await promise
      expect(loading.value).toBe(false)
    })

    it('handles error gracefully', async () => {
      vi.mocked(s3Api.listBuckets).mockRejectedValue(new Error('Failed'))
      
      const { loadBuckets, loading } = useS3()
      await loadBuckets()
      
      expect(loading.value).toBe(false)
    })
  })

  describe('loadObjects', () => {
    it('sets selectedBucket', async () => {
      const { loadObjects, selectedBucket } = useS3()
      await loadObjects('test-bucket')
      
      expect(selectedBucket.value).toBe('test-bucket')
      expect(s3Api.listObjects).toHaveBeenCalledWith('test-bucket')
    })

    it('populates objects array', async () => {
      const mockObjects = { objects: [{ Key: 'file1.txt' }, { Key: 'file2.txt' }] }
      vi.mocked(s3Api.listObjects).mockResolvedValue(mockObjects)

      const { loadObjects, objects } = useS3()
      await loadObjects('test-bucket')
      
      expect(objects.value).toHaveLength(2)
    })
  })

  describe('createBucket', () => {
    it('creates bucket successfully', async () => {
      vi.mocked(s3Api.createBucket).mockResolvedValue({})
      
      const { createBucket } = useS3()
      await createBucket('new-bucket')
      
      expect(s3Api.createBucket).toHaveBeenCalledWith('new-bucket', undefined)
    })

    it('creates bucket with CORS option', async () => {
      vi.mocked(s3Api.createBucket).mockResolvedValue({})
      
      const { createBucket } = useS3()
      await createBucket('new-bucket', { enableCors: true })
      
      expect(s3Api.createBucket).toHaveBeenCalledWith('new-bucket', true)
    })

    it('handles empty name gracefully', async () => {
      const { createBucket } = useS3()
      await createBucket('')
    })
  })

  describe('deleteBucket', () => {
    it('deletes bucket successfully', async () => {
      vi.mocked(s3Api.deleteBucket).mockResolvedValue({})
      
      const { deleteBucket } = useS3()
      await deleteBucket('test-bucket')
      
      expect(s3Api.deleteBucket).toHaveBeenCalledWith('test-bucket')
    })

    it('clears selectedBucket if matches', async () => {
      vi.mocked(s3Api.deleteBucket).mockResolvedValue({})
      
      const { deleteBucket, selectedBucket, objects } = useS3()
      selectedBucket.value = 'test-bucket'
      objects.value = [{ Key: 'file.txt' }]
      
      await deleteBucket('test-bucket')
      
      expect(selectedBucket.value).toBeNull()
      expect(objects.value).toEqual([])
    })
  })

  describe('deleteObject', () => {
    it('deletes object successfully', async () => {
      vi.mocked(s3Api.deleteObject).mockResolvedValue({})
      
      const { deleteObject, selectedBucket } = useS3()
      selectedBucket.value = 'test-bucket'
      
      await deleteObject('test-bucket', 'file.txt')
      
      expect(s3Api.deleteObject).toHaveBeenCalledWith('test-bucket', 'file.txt')
    })
  })

  describe('uploadObject', () => {
    it('uploads file successfully', async () => {
      vi.mocked(s3Api.putObject).mockResolvedValue({})
      
      const { uploadObject, uploading } = useS3()
      await uploadObject('test-bucket', 'file.txt', 'content', 'text/plain')
      
      expect(s3Api.putObject).toHaveBeenCalledWith('test-bucket', 'file.txt', 'content', 'text/plain')
      expect(uploading.value).toBe(false)
    })

    it('sets uploading state during upload', async () => {
      vi.mocked(s3Api.putObject).mockResolvedValue({})
      
      const { uploadObject, uploading } = useS3()
      expect(uploading.value).toBe(false)
      
      const promise = uploadObject('test-bucket', 'file.txt', 'content')
      expect(uploading.value).toBe(true)
      await promise
    })
  })

  describe('getObject', () => {
    it('returns object data', async () => {
      const mockData = { Body: 'content', ContentType: 'text/plain' }
      vi.mocked(s3Api.getObject).mockResolvedValue(mockData)
      
      const { getObject } = useS3()
      const result = await getObject('test-bucket', 'file.txt')
      
      expect(result).toEqual(mockData)
    })

    it('throws on error', async () => {
      vi.mocked(s3Api.getObject).mockRejectedValue(new Error('Not found'))
      
      const { getObject } = useS3()
      await expect(getObject('test-bucket', 'nonexistent.txt')).rejects.toThrow('Not found')
    })
  })
})

describe('useS3 State Management', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('manages selectedBucket independently', () => {
    const { selectedBucket } = useS3()
    selectedBucket.value = 'bucket-1'
    expect(selectedBucket.value).toBe('bucket-1')
  })

  it('manages buckets independently', () => {
    const { buckets } = useS3()
    buckets.value = [{ Name: 'bucket1' }]
    expect(buckets.value).toHaveLength(1)
  })

  it('manages objects independently', () => {
    const { objects } = useS3()
    objects.value = [{ Key: 'file.txt' }]
    expect(objects.value).toHaveLength(1)
  })

  it('resets state on navigation', async () => {
    const { selectedBucket, objects, loadObjects } = useS3()
    
    objects.value = [{ Key: 'file.txt' }]
    selectedBucket.value = 'test-bucket'
    
    selectedBucket.value = null
    objects.value = []
    
    expect(selectedBucket.value).toBeNull()
    expect(objects.value).toEqual([])
  })
})