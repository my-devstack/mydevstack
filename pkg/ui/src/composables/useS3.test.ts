import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useS3 } from './useS3'

vi.mock('@/api/services/s3', () => ({
  listBuckets: vi.fn(),
  listObjects: vi.fn(),
  createBucket: vi.fn(),
  deleteBucket: vi.fn(),
  deleteObject: vi.fn(),
  putObject: vi.fn(),
  getObject: vi.fn(),
  copyObject: vi.fn(),
}))

vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
  })),
}))

import * as s3Api from '@/api/services/s3'

describe('useS3', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const { buckets, objects, selectedBucket, loading, uploading } = useS3()
    expect(buckets.value).toEqual([])
    expect(objects.value).toEqual([])
    expect(selectedBucket.value).toBeNull()
    expect(loading.value).toBe(false)
    expect(uploading.value).toBe(false)
  })

  it('loadBuckets success', async () => {
    const mockBuckets = [{ Name: 'bucket1', CreationDate: '2024-01-01' }, { Name: 'bucket2', CreationDate: '2024-01-02' }]
    vi.mocked(s3Api.listBuckets).mockResolvedValue(mockBuckets)

    const { loadBuckets, buckets, loading } = useS3()
    
    await loadBuckets()
    
    expect(s3Api.listBuckets).toHaveBeenCalled()
    expect(buckets.value).toHaveLength(2)
    expect(loading.value).toBe(false)
  })

  it('loadBuckets handles error', async () => {
    vi.mocked(s3Api.listBuckets).mockRejectedValue(new Error('Network error'))

    const { loadBuckets, loading } = useS3()
    
    await loadBuckets()
    
    expect(loading.value).toBe(false)
  })

  it('loadObjects sets selectedBucket and fetches', async () => {
    const mockObjects = { objects: [{ Key: 'file1.txt' }, { Key: 'file2.txt' }] }
    vi.mocked(s3Api.listObjects).mockResolvedValue(mockObjects)

    const { loadObjects, objects, selectedBucket, loading } = useS3()
    
    await loadObjects('test-bucket')
    
    expect(s3Api.listObjects).toHaveBeenCalledWith('test-bucket')
    expect(selectedBucket.value).toBe('test-bucket')
    expect(objects.value).toHaveLength(2)
    expect(loading.value).toBe(false)
  })

  it('loadObjects handles error', async () => {
    vi.mocked(s3Api.listObjects).mockRejectedValue(new Error('Network error'))

    const { loadObjects, loading } = useS3()
    
    await loadObjects('test-bucket')
    
    expect(loading.value).toBe(false)
  })

  it('createBucket calls API and reloads', async () => {
    vi.mocked(s3Api.createBucket).mockResolvedValue({})
    vi.mocked(s3Api.listBuckets).mockResolvedValue([])

    const { createBucket, loading } = useS3()
    
    await createBucket('test-bucket')
    
    expect(s3Api.createBucket).toHaveBeenCalledWith('test-bucket', undefined)
    expect(s3Api.listBuckets).toHaveBeenCalled()
    expect(loading.value).toBe(false)
  })

  it('createBucket with cors option', async () => {
    vi.mocked(s3Api.createBucket).mockResolvedValue({})
    vi.mocked(s3Api.listBuckets).mockResolvedValue([])

    const { createBucket } = useS3()

    await createBucket('test-bucket', { enableCors: true })

    expect(s3Api.createBucket).toHaveBeenCalledWith('test-bucket', { enableCors: true })
  })

  it('createBucket throws on error', async () => {
    vi.mocked(s3Api.createBucket).mockRejectedValue(new Error('Failed'))

    const { createBucket, loading } = useS3()
    
    await expect(createBucket('test-bucket')).rejects.toThrow('Failed')
    expect(loading.value).toBe(false)
  })

  it('deleteBucket calls API and reloads', async () => {
    vi.mocked(s3Api.deleteBucket).mockResolvedValue({})
    vi.mocked(s3Api.listBuckets).mockResolvedValue([])

    const { deleteBucket, loading, selectedBucket } = useS3()
    selectedBucket.value = 'test-bucket'
    
    await deleteBucket('test-bucket')
    
    expect(s3Api.deleteBucket).toHaveBeenCalledWith('test-bucket')
    expect(s3Api.listBuckets).toHaveBeenCalled()
    expect(selectedBucket.value).toBeNull()
  })

  it('deleteBucket clears selectedBucket if matches', async () => {
    vi.mocked(s3Api.deleteBucket).mockResolvedValue({})
    vi.mocked(s3Api.listBuckets).mockResolvedValue([])

    const { deleteBucket, selectedBucket, objects } = useS3()
    selectedBucket.value = 'test-bucket'
    objects.value = [{ Key: 'file.txt' }]
    
    await deleteBucket('test-bucket')
    
    expect(selectedBucket.value).toBeNull()
    expect(objects.value).toEqual([])
  })

  it('deleteBucket does not clear selectedBucket if different', async () => {
    vi.mocked(s3Api.deleteBucket).mockResolvedValue({})
    vi.mocked(s3Api.listBuckets).mockResolvedValue([])

    const { deleteBucket, selectedBucket } = useS3()
    selectedBucket.value = 'other-bucket'
    
    await deleteBucket('test-bucket')
    
    expect(selectedBucket.value).toBe('other-bucket')
  })

  it('deleteObject calls API and reloads', async () => {
    vi.mocked(s3Api.deleteObject).mockResolvedValue({})
    vi.mocked(s3Api.listObjects).mockResolvedValue({ objects: [] })

    const { deleteObject, loading } = useS3()
    
    await deleteObject('test-bucket', 'file.txt')
    
    expect(s3Api.deleteObject).toHaveBeenCalledWith('test-bucket', 'file.txt')
    expect(s3Api.listObjects).toHaveBeenCalledWith('test-bucket')
  })

  it('uploadObject sets uploading and calls API', async () => {
    vi.mocked(s3Api.putObject).mockResolvedValue({})
    vi.mocked(s3Api.listObjects).mockResolvedValue({ objects: [] })

    const { uploadObject, uploading } = useS3()
    
    await uploadObject('test-bucket', 'file.txt', 'content', 'text/plain')
    
    expect(s3Api.putObject).toHaveBeenCalledWith('test-bucket', 'file.txt', 'content', 'text/plain')
    expect(uploading.value).toBe(false)
  })

  it('uploadObject defaults contentType to text/plain', async () => {
    vi.mocked(s3Api.putObject).mockResolvedValue({})
    vi.mocked(s3Api.listObjects).mockResolvedValue({ objects: [] })

    const { uploadObject } = useS3()
    
    await uploadObject('test-bucket', 'file.txt', 'content')
    
    expect(s3Api.putObject).toHaveBeenCalledWith('test-bucket', 'file.txt', 'content', 'text/plain')
  })

  it('getObject returns object data', async () => {
    const mockData = { Body: 'content', ContentType: 'text/plain' }
    vi.mocked(s3Api.getObject).mockResolvedValue(mockData)

    const { getObject } = useS3()
    
    const result = await getObject('test-bucket', 'file.txt')
    
    expect(s3Api.getObject).toHaveBeenCalledWith('test-bucket', 'file.txt')
    expect(result).toEqual(mockData)
  })

  it('getObject throws on error', async () => {
    vi.mocked(s3Api.getObject).mockRejectedValue(new Error('Not found'))

    const { getObject } = useS3()
    
    await expect(getObject('test-bucket', 'file.txt')).rejects.toThrow('Not found')
  })

  it('formatBody parses JSON', () => {
    const { formatBody } = useS3()
    
    const result = formatBody('{"key": "value"}')
    
    expect(result).toBe('{\n  "key": "value"\n}')
  })

  it('formatBody returns plain text for non-JSON', () => {
    const { formatBody } = useS3()
    
    const result = formatBody('plain text message')
    
    expect(result).toBe('plain text message')
  })

  it('formatBody handles invalid JSON', () => {
    const { formatBody } = useS3()
    
    const result = formatBody('{invalid json}')
    
    expect(result).toBe('{invalid json}')
  })
})