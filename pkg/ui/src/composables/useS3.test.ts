import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useS3 } from './useS3'

import * as s3Api from '@/api/services/s3'
import * as lambdaApi from '@/api/services/lambda'

vi.mock('@/api/services/s3', () => ({
  listBuckets: vi.fn(),
  listObjects: vi.fn(),
  createBucket: vi.fn(),
  deleteBucket: vi.fn(),
  deleteObject: vi.fn(),
  putObject: vi.fn(),
  getObject: vi.fn(),
  copyObject: vi.fn(),
  getBucketVersioning: vi.fn(),
  getBucketEncryption: vi.fn(),
  getBucketTagging: vi.fn(),
  getPresignedUrl: vi.fn(),
  configureNotification: vi.fn(),
  getNotificationConfig: vi.fn(),
}))

vi.mock('@/api/services/lambda', () => ({
  listFunctions: vi.fn(),
}))

vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
  })),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

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

  it('getPresignedUrl returns URL', async () => {
    vi.mocked(s3Api.getPresignedUrl).mockResolvedValue('https://presigned.url/test')

    const { getPresignedUrl } = useS3()
    const url = await getPresignedUrl('test-bucket', 'file.txt')

    expect(s3Api.getPresignedUrl).toHaveBeenCalledWith('test-bucket', 'file.txt')
    expect(url).toBe('https://presigned.url/test')
  })

  it('getPresignedUrl throws on error', async () => {
    vi.mocked(s3Api.getPresignedUrl).mockRejectedValue(new Error('Presign failed'))

    const { getPresignedUrl } = useS3()
    await expect(getPresignedUrl('test-bucket', 'file.txt')).rejects.toThrow('Presign failed')
  })

  it('deleteBucket error throws', async () => {
    vi.mocked(s3Api.deleteBucket).mockRejectedValue(new Error('Delete failed'))

    const { deleteBucket, loading } = useS3()
    await expect(deleteBucket('test-bucket')).rejects.toThrow('Delete failed')
    expect(loading.value).toBe(false)
  })

  it('deleteObject error throws', async () => {
    vi.mocked(s3Api.deleteObject).mockRejectedValue(new Error('Delete obj failed'))

    const { deleteObject, loading } = useS3()
    await expect(deleteObject('test-bucket', 'file.txt')).rejects.toThrow('Delete obj failed')
    expect(loading.value).toBe(false)
  })

  it('uploadObject error throws', async () => {
    vi.mocked(s3Api.putObject).mockRejectedValue(new Error('Upload failed'))

    const { uploadObject, uploading } = useS3()
    await expect(uploadObject('test-bucket', 'file.txt', 'data')).rejects.toThrow('Upload failed')
    expect(uploading.value).toBe(false)
  })

  it('getObject error throws', async () => {
    vi.mocked(s3Api.getObject).mockRejectedValue(new Error('Not found'))

    const { getObject } = useS3()
    await expect(getObject('test-bucket', 'file.txt')).rejects.toThrow('Not found')
  })

  it('loadBucketDetails success', async () => {
    const versioning = { status: 'Enabled', mfaDelete: 'Disabled' }
    const encryption = { algorithm: 'AES256', keyId: '' }
    const tags = { tags: [{ Key: 'Env', Value: 'Test' }] }
    vi.mocked(s3Api.getBucketVersioning).mockResolvedValue(versioning as any)
    vi.mocked(s3Api.getBucketEncryption).mockResolvedValue(encryption as any)
    vi.mocked(s3Api.getBucketTagging).mockResolvedValue(tags as any)

    const { bucketDetails, loadBucketDetails } = useS3()

    await loadBucketDetails('test-bucket')

    expect(bucketDetails.value['test-bucket']).toEqual({
      versioning,
      encryption,
      tags: [{ Key: 'Env', Value: 'Test' }],
      loading: false,
    })
  })

  it('loadBucketDetails handles individual API failures', async () => {
    vi.mocked(s3Api.getBucketVersioning).mockRejectedValue(new Error('No versioning'))
    vi.mocked(s3Api.getBucketEncryption).mockRejectedValue(new Error('No encryption'))
    vi.mocked(s3Api.getBucketTagging).mockResolvedValue({ tags: [] })

    const { bucketDetails, loadBucketDetails } = useS3()

    await loadBucketDetails('test-bucket')

    expect(bucketDetails.value['test-bucket'].versioning).toBeNull()
    expect(bucketDetails.value['test-bucket'].encryption).toBeNull()
    expect(bucketDetails.value['test-bucket'].tags).toEqual([])
    expect(bucketDetails.value['test-bucket'].loading).toBe(false)
  })

  it('loadBucketDetails existing entry loading flag reset on error', async () => {
    vi.mocked(s3Api.getBucketVersioning).mockRejectedValue(new Error('All fail'))
    vi.mocked(s3Api.getBucketEncryption).mockRejectedValue(new Error('All fail'))
    vi.mocked(s3Api.getBucketTagging).mockRejectedValue(new Error('All fail'))

    const { bucketDetails, loadBucketDetails } = useS3()
    // Pre-populate entry
    bucketDetails.value['test-bucket'] = { versioning: null, encryption: null, tags: [], loading: true }

    await loadBucketDetails('test-bucket')

    expect(bucketDetails.value['test-bucket'].loading).toBe(false)
  })

  it('createBucket adds bucket to list if not returned by API', async () => {
    vi.mocked(s3Api.createBucket).mockResolvedValue({})
    vi.mocked(s3Api.listBuckets).mockResolvedValue([{ Name: 'other-bucket' }])

    const { buckets, createBucket } = useS3()

    await createBucket('new-bucket')

    // Should have unshifted the new bucket to top
    expect(buckets.value[0].Name).toBe('new-bucket')
  })

  it('createBucket does not duplicate if API returns it', async () => {
    const existing = [{ Name: 'new-bucket' }]
    vi.mocked(s3Api.createBucket).mockResolvedValue({})
    vi.mocked(s3Api.listBuckets).mockResolvedValue(existing)

    const { buckets, createBucket } = useS3()

    await createBucket('new-bucket')

    // Should NOT be unshifted since already in list
    expect(buckets.value.length).toBe(1)
    expect(buckets.value[0].Name).toBe('new-bucket')
  })

  it('configureLambdaTrigger success', async () => {
    vi.mocked(lambdaApi.listFunctions).mockResolvedValue({
      functions: [{ FunctionName: 'my-fn', FunctionArn: 'arn:aws:lambda:us-east-1:123:function:my-fn' }],
    } as any)
    vi.mocked(s3Api.configureNotification).mockResolvedValue({} as any)

    const { configureLambdaTrigger } = useS3()
    await configureLambdaTrigger('test-bucket', {
      functionName: 'my-fn',
      events: ['s3:ObjectCreated:*'],
    })

    expect(lambdaApi.listFunctions).toHaveBeenCalled()
    expect(s3Api.configureNotification).toHaveBeenCalledWith('test-bucket', expect.objectContaining({
      Bucket: 'test-bucket',
      NotificationConfiguration: expect.objectContaining({
        LambdaFunctionConfigurations: expect.arrayContaining([
          expect.objectContaining({
            LambdaFunctionArn: 'arn:aws:lambda:us-east-1:123:function:my-fn',
            Events: ['s3:ObjectCreated:*'],
          }),
        ]),
      }),
    }))
  })

  it('configureLambdaTrigger with prefix and suffix filters', async () => {
    vi.mocked(lambdaApi.listFunctions).mockResolvedValue({
      functions: [{ FunctionName: 'my-fn', FunctionArn: 'arn:aws:lambda:us-east-1:123:function:my-fn' }],
    } as any)
    vi.mocked(s3Api.configureNotification).mockResolvedValue({} as any)

    const { configureLambdaTrigger } = useS3()
    await configureLambdaTrigger('test-bucket', {
      functionName: 'my-fn',
      events: ['s3:ObjectCreated:*'],
      prefix: 'images/',
      suffix: '.jpg',
    })

    expect(s3Api.configureNotification).toHaveBeenCalledWith('test-bucket', expect.objectContaining({
      NotificationConfiguration: expect.objectContaining({
        LambdaFunctionConfigurations: expect.arrayContaining([
          expect.objectContaining({
            Filter: {
              Key: {
                FilterRules: [
                  { Name: 'prefix', Value: 'images/' },
                  { Name: 'suffix', Value: '.jpg' },
                ],
              },
            },
          }),
        ]),
      }),
    }))
  })

  it('configureLambdaTrigger throws when function not found', async () => {
    vi.mocked(lambdaApi.listFunctions).mockResolvedValue({
      functions: [{ FunctionName: 'other-fn', FunctionArn: 'arn:aws:lambda:...' }],
    } as any)

    const { configureLambdaTrigger } = useS3()
    await expect(configureLambdaTrigger('test-bucket', {
      functionName: 'nonexistent',
      events: ['s3:ObjectCreated:*'],
    })).rejects.toThrow('Lambda function "nonexistent" not found')
  })

  it('configureLambdaTrigger throws on notification failure', async () => {
    vi.mocked(lambdaApi.listFunctions).mockResolvedValue({
      functions: [{ FunctionName: 'my-fn', FunctionArn: 'arn:aws:lambda:us-east-1:123:function:my-fn' }],
    } as any)
    vi.mocked(s3Api.configureNotification).mockRejectedValue(new Error('Config error'))

    const { configureLambdaTrigger, loading } = useS3()
    await expect(configureLambdaTrigger('test-bucket', {
      functionName: 'my-fn',
      events: ['s3:ObjectCreated:*'],
    })).rejects.toThrow('Config error')
    expect(loading.value).toBe(false)
  })

  it('getLambdaTriggers returns parsed trigger configs', async () => {
    vi.mocked(s3Api.getNotificationConfig).mockResolvedValue({
      LambdaFunctionConfigurations: [
        {
          LambdaFunctionArn: 'arn:aws:lambda:us-east-1:123:function:my-fn',
          Events: ['s3:ObjectCreated:*'],
          Filter: {
            Key: {
              FilterRules: [
                { Name: 'prefix', Value: 'img/' },
              ],
            },
          },
        },
      ],
    } as any)

    const { getLambdaTriggers } = useS3()
    const triggers = await getLambdaTriggers('test-bucket')

    expect(triggers).toHaveLength(1)
    expect(triggers[0].functionName).toBe('my-fn')
    expect(triggers[0].events).toEqual(['s3:ObjectCreated:*'])
    expect(triggers[0].prefix).toBe('img/')
    expect(triggers[0].suffix).toBeUndefined()
  })

  it('getLambdaTriggers returns empty on error', async () => {
    vi.mocked(s3Api.getNotificationConfig).mockRejectedValue(new Error('No config'))

    const { getLambdaTriggers } = useS3()
    const triggers = await getLambdaTriggers('test-bucket')

    expect(triggers).toEqual([])
  })
})