import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function mockResponse(data: any, status = 200) {
  const body = typeof data === 'string' ? data : JSON.stringify(data)
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(body),
    headers: { get: (name: string) => name === 'content-length' ? String(body.length) : null },
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  }
}

function mock204Response() {
  return {
    ok: true,
    status: 204,
    statusText: 'No Content',
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: { get: (name: string) => name === 'content-length' ? '0' : null },
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  }
}

import {
  listBuckets,
  createBucket,
  deleteBucket,
  emptyBucket,
  headBucket,
  listObjects,
  listObjectsV2,
  getObject,
  putObject,
  deleteObject,
  headObject,
  getBucketVersioning,
  getBucketEncryption,
  getBucketTagging,
  getBucketPolicy,
  createFolder,
  getPresignedUrl,
  getPresignedUploadUrl,
  configureNotification,
  getNotificationConfig,
} from './s3'
import { S3Service } from './s3'

describe('S3 Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('listBuckets', () => {
    it('returns mapped buckets', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Buckets: [{ Name: 'my-bucket', CreationDate: '2024-01-01' }],
      }))
      const result = await listBuckets()
      expect(result).toHaveLength(1)
      expect(result[0].Name).toBe('my-bucket')
    })

    it('handles empty response', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listBuckets()
      expect(result).toEqual([])
    })
  })

  describe('createBucket', () => {
    it('creates bucket with minimal params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await createBucket('my-bucket')
      expect(result.Location).toBe('/my-bucket')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Bucket).toBe('my-bucket')
    })

    it('creates bucket with CORS enabled', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const service = new S3Service()
      await service.createBucket('my-bucket', { enableCors: true })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Bucket).toBe('my-bucket')
      expect(body.CORSConfiguration).toBeDefined()
      expect(body.CORSConfiguration.CORSRules[0].AllowedMethods).toContain('GET')
    })

    it('creates bucket with versioning enabled', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({}))
        .mockResolvedValueOnce(mockResponse({}))
      const service = new S3Service()
      await service.createBucket('my-bucket', { enableVersioning: true })
      expect(mockFetch).toHaveBeenCalledTimes(2)
      const versionBody = JSON.parse(mockFetch.mock.calls[1][1].body)
      expect(versionBody.VersioningConfiguration.Status).toBe('Enabled')
    })

    it('creates bucket with AES256 encryption', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({}))
        .mockResolvedValueOnce(mockResponse({}))
      const service = new S3Service()
      await service.createBucket('my-bucket', { encryptionType: 'AES256' })
      expect(mockFetch).toHaveBeenCalledTimes(2)
      const encBody = JSON.parse(mockFetch.mock.calls[1][1].body)
      expect(encBody.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256')
    })

    it('creates bucket with KMS encryption and key ID', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({}))
        .mockResolvedValueOnce(mockResponse({}))
      const service = new S3Service()
      await service.createBucket('my-bucket', { encryptionType: 'aws:kms', kmsKeyId: 'arn:aws:kms:key/123' })
      expect(mockFetch).toHaveBeenCalledTimes(2)
      const encBody = JSON.parse(mockFetch.mock.calls[1][1].body)
      expect(encBody.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms')
      expect(encBody.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.KMSKeyId).toBe('arn:aws:kms:key/123')
    })

    it('creates bucket with tags', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({}))
        .mockResolvedValueOnce(mockResponse({}))
      const service = new S3Service()
      await service.createBucket('my-bucket', { tags: [{ Key: 'Env', Value: 'dev' }] })
      expect(mockFetch).toHaveBeenCalledTimes(2)
      const tagBody = JSON.parse(mockFetch.mock.calls[1][1].body)
      expect(tagBody.Tagging.TagSet).toEqual([{ Key: 'Env', Value: 'dev' }])
    })

    it('creates bucket with public access blocked', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({}))
        .mockResolvedValueOnce(mockResponse({}))
      const service = new S3Service()
      await service.createBucket('my-bucket', { blockPublicAccess: true })
      expect(mockFetch).toHaveBeenCalledTimes(2)
      const blockBody = JSON.parse(mockFetch.mock.calls[1][1].body)
      expect(blockBody.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true)
    })

    it('creates bucket with valid bucket policy', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({}))
        .mockResolvedValueOnce(mockResponse({}))
      const policy = JSON.stringify({ Version: '2012-10-17', Statement: [] })
      const service = new S3Service()
      await service.createBucket('my-bucket', { bucketPolicy: policy })
      expect(mockFetch).toHaveBeenCalledTimes(2)
      const policyBody = JSON.parse(mockFetch.mock.calls[1][1].body)
      expect(policyBody.Policy).toBe(policy)
    })

    it('throws error for invalid bucket policy JSON', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const service = new S3Service()
      await expect(service.createBucket('my-bucket', { bucketPolicy: 'not-json' })).rejects.toThrow('Invalid bucket policy JSON')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('creates bucket with multiple options', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({}))
        .mockResolvedValueOnce(mockResponse({}))
        .mockResolvedValueOnce(mockResponse({}))
        .mockResolvedValueOnce(mockResponse({}))
        .mockResolvedValueOnce(mockResponse({}))
        .mockResolvedValueOnce(mockResponse({}))
      const service = new S3Service()
      await service.createBucket('my-bucket', {
        enableCors: true,
        enableVersioning: true,
        encryptionType: 'AES256',
        tags: [{ Key: 'Env', Value: 'test' }],
        blockPublicAccess: true,
        bucketPolicy: JSON.stringify({ Version: '2012-10-17' }),
      })
      expect(mockFetch).toHaveBeenCalledTimes(6)
    })
  })

  describe('deleteBucket', () => {
    it('sends Bucket name', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteBucket('my-bucket')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Bucket).toBe('my-bucket')
    })
  })

  describe('emptyBucket', () => {
    it('deletes all objects', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({ Contents: [{ Key: 'obj1' }, { Key: 'obj2' }] }))
        .mockResolvedValueOnce(mockResponse({}))
      await emptyBucket('my-bucket')
      expect(mockFetch).toHaveBeenCalledTimes(2)
      const body2 = JSON.parse(mockFetch.mock.calls[1][1].body)
      expect(body2.Delete.Objects).toHaveLength(2)
    })

    it('handles empty bucket', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await emptyBucket('my-bucket')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('handles pagination', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({
          Contents: [{ Key: 'obj1' }],
          NextContinuationToken: 'token1',
        }))
        .mockResolvedValueOnce(mockResponse({}))
        .mockResolvedValueOnce(mockResponse({ Contents: [{ Key: 'obj2' }] }))
        .mockResolvedValueOnce(mockResponse({}))
      await emptyBucket('my-bucket')
      expect(mockFetch.mock.calls.length).toBe(4)
    })
  })

  describe('headBucket', () => {
    it('checks bucket exists', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await headBucket('my-bucket')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Bucket).toBe('my-bucket')
    })
  })

  describe('listObjects', () => {
    it('returns objects and prefixes', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Contents: [{ Key: 'file.txt', Size: 100, ETag: '"abc123"' }],
        CommonPrefixes: [{ Prefix: 'folder/' }],
      }))
      const result = await listObjects('my-bucket')
      expect(result.objects).toHaveLength(1)
      expect(result.objects[0].Key).toBe('file.txt')
      expect(result.objects[0].ETag).toBe('abc123')
      expect(result.prefixes).toEqual(['folder/'])
    })

    it('handles empty response', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listObjects('my-bucket')
      expect(result.objects).toEqual([])
      expect(result.prefixes).toEqual([])
      expect(result.isTruncated).toBe(false)
    })

    it('passes options as params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await listObjects('my-bucket', { prefix: 'folder/', maxKeys: 10 })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.prefix).toBe('folder/')
      expect(body.maxKeys).toBe(10)
    })

    it('handles paginated response with IsTruncated and nextMarker', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Contents: [{ Key: 'f1.txt', Size: 50, ETag: '"etag1"' }],
        IsTruncated: true,
        NextContinuationToken: 'token-next',
      }))
      const result = await listObjects('my-bucket')
      expect(result.isTruncated).toBe(true)
      expect(result.nextMarker).toBe('token-next')
    })
  })

  describe('listObjectsV2', () => {
    it('is alias for listObjects', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listObjectsV2('my-bucket', { prefix: 'test/' })
      expect(result.objects).toEqual([])
    })
  })

  describe('getObject', () => {
    it('returns object data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'text/plain' }),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(5)),
        json: () => Promise.resolve({}),
        text: () => Promise.resolve('hello'),
      })
      const result = await getObject('my-bucket', 'file.txt')
      expect(result.contentType).toBe('text/plain')
      expect(result.body.byteLength).toBe(5)
    })

    it('throws on error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({}),
        text: () => Promise.resolve('Not found'),
      })
      await expect(getObject('my-bucket', 'missing.txt')).rejects.toThrow(/S3 GetObject failed/)
    })

    it('uses default content-type when header missing', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({}),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
      })
      const result = await getObject('my-bucket', 'file.bin')
      expect(result.contentType).toBe('application/octet-stream')
    })
  })

  describe('putObject', () => {
    it('sends body as-is for string', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putObject('my-bucket', 'file.txt', 'hello', 'text/plain')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Body).toBe('hello')
    })

    it('converts Uint8Array to Array', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putObject('my-bucket', 'file.bin', new Uint8Array([1, 2, 3]))
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Body).toEqual([1, 2, 3])
    })
  })

  describe('deleteObject', () => {
    it('sends Bucket and Key', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteObject('my-bucket', 'file.txt')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Bucket).toBe('my-bucket')
      expect(body.Key).toBe('file.txt')
    })
  })

  describe('headObject', () => {
    it('returns metadata from response', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ContentLength: 100, ContentType: 'text/plain', ETag: '"abc"', LastModified: '2024-01-01' }))
      const result = await headObject('my-bucket', 'file.txt')
      expect(result.contentLength).toBe('100')
      expect(result.contentType).toBe('text/plain')
      expect(result.etag).toBe('abc')
    })

    it('provides defaults for missing response fields', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await headObject('my-bucket', 'missing.txt')
      expect(result.contentLength).toBe('0')
      expect(result.contentType).toBe('')
      expect(result.etag).toBe('')
      expect(result.lastModified).toBe('')
    })
  })

  describe('getBucketVersioning', () => {
    it('returns versioning status', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Status: 'Enabled', MFADelete: 'Disabled' }))
      const result = await getBucketVersioning('my-bucket')
      expect(result.status).toBe('Enabled')
    })
  })

  describe('getBucketEncryption', () => {
    it('returns encryption info', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        ServerSideEncryptionRules: [{ ServerSideEncryptionAlgorithm: 'AES256' }],
      }))
      const result = await getBucketEncryption('my-bucket')
      expect(result.algorithm).toBe('AES256')
    })

    it('handles missing rules', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await getBucketEncryption('my-bucket')
      expect(result.algorithm).toBe('None')
    })
  })

  describe('getBucketTagging', () => {
    it('returns tags', async () => {
      mockFetch.mockResolvedValue(mockResponse({ TagSet: [{ Key: 'Env', Value: 'dev' }] }))
      const result = await getBucketTagging('my-bucket')
      expect(result.tags).toHaveLength(1)
    })
  })

  describe('getBucketPolicy', () => {
    it('returns policy', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Policy: '{}' }))
      const result = await getBucketPolicy('my-bucket')
      expect(result.Policy).toBe('{}')
    })

    it('returns empty on 404', async () => {
      mockFetch.mockResolvedValue(mockResponse('NoSuchBucketPolicy', 404))
      const result = await getBucketPolicy('my-bucket')
      expect(result).toEqual({})
    })

    it('returns empty on message match', async () => {
      mockFetch.mockResolvedValue(mockResponse('NoSuchBucketPolicy', 400))
      const result = await getBucketPolicy('my-bucket')
      expect(result).toEqual({})
    })

    it('throws non-matching errors', async () => {
      mockFetch.mockResolvedValue(mockResponse('AccessDenied', 403))
      await expect(getBucketPolicy('my-bucket')).rejects.toThrow(/S3 GetBucketPolicy failed/)
    })
  })

  describe('createFolder', () => {
    it('adds trailing slash and calls putObject', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await createFolder('my-bucket', 'my-folder')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Key).toBe('my-folder/')
      expect(body.ContentType).toBe('application/directory')
    })

    it('does not double-slash', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await createFolder('my-bucket', 'my-folder/')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Key).toBe('my-folder/')
    })
  })

  describe('getPresignedUrl', () => {
    it('returns URL from response', async () => {
      mockFetch.mockResolvedValue(mockResponse({ url: 'https://presigned.url' }))
      const result = await getPresignedUrl('my-bucket', 'file.txt')
      expect(result).toBe('https://presigned.url')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Expires).toBe(3600)
    })

    it('uses custom expiry', async () => {
      mockFetch.mockResolvedValue(mockResponse({ url: 'https://presigned.url' }))
      await getPresignedUrl('my-bucket', 'file.txt', 600)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Expires).toBe(600)
    })
  })

  describe('getPresignedUploadUrl', () => {
    it('returns upload URL', async () => {
      mockFetch.mockResolvedValue(mockResponse({ url: 'https://upload.url' }))
      const result = await getPresignedUploadUrl('my-bucket', 'file.txt', 'text/plain')
      expect(result).toBe('https://upload.url')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ContentType).toBe('text/plain')
    })
  })

  describe('configureNotification', () => {
    it('sends notification config', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await configureNotification('my-bucket', {
        Bucket: 'my-bucket',
        NotificationConfiguration: {
          LambdaFunctionConfigurations: [{ LambdaFunctionArn: 'arn:lambda:func', Events: ['s3:ObjectCreated:*'] }],
        },
      })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.NotificationConfiguration.LambdaFunctionConfigurations).toHaveLength(1)
    })
  })

  describe('getNotificationConfig', () => {
    it('returns notification config', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await getNotificationConfig('my-bucket')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Bucket).toBe('my-bucket')
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(listBuckets()).rejects.toThrow(/S3 ListBuckets failed/)
    })

    it('throws APIError on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listBuckets()).rejects.toThrow(/Failed to ListBuckets/)
    })

    it('returns empty for 204 responses', async () => {
      mockFetch.mockResolvedValue(mock204Response())
      const result = await headBucket('my-bucket')
      expect(result).toEqual({})
    })
  })

  describe('X-Amz-Target header', () => {
    it('uses s3 prefix', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Buckets: [] }))
      await listBuckets()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('s3.ListBuckets')
    })
  })
})
