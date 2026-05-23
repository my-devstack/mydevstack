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
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets')
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
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Bucket).toBe('my-bucket')
    })

    it('creates bucket with CORS enabled', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const service = new S3Service()
      await service.createBucket('my-bucket', { enableCors: true })
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
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
      // First call: POST create bucket
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      // Second call: PUT versioning
      expect(mockFetch.mock.calls[1][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/versioning')
      expect(mockFetch.mock.calls[1][1].method).toBe('PUT')
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
      // Second call: PUT encryption
      expect(mockFetch.mock.calls[1][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/encryption')
      expect(mockFetch.mock.calls[1][1].method).toBe('PUT')
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
      expect(mockFetch.mock.calls[1][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/tagging')
      expect(mockFetch.mock.calls[1][1].method).toBe('PUT')
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
      expect(mockFetch.mock.calls[1][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/public-access-block')
      expect(mockFetch.mock.calls[1][1].method).toBe('PUT')
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
      expect(mockFetch.mock.calls[1][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/policy')
      expect(mockFetch.mock.calls[1][1].method).toBe('PUT')
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
    it('sends DELETE request with bucket name', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteBucket('my-bucket')
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('emptyBucket', () => {
    it('deletes all objects individually', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({ Contents: [{ Key: 'obj1' }, { Key: 'obj2' }] }))
        .mockResolvedValueOnce(mockResponse({}))
        .mockResolvedValueOnce(mockResponse({}))
      await emptyBucket('my-bucket')
      expect(mockFetch).toHaveBeenCalledTimes(3)
      // First call: list objects
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/objects')
      // Second call: delete obj1
      expect(mockFetch.mock.calls[1][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/objects/obj1')
      expect(mockFetch.mock.calls[1][1].method).toBe('DELETE')
      // Third call: delete obj2
      expect(mockFetch.mock.calls[2][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/objects/obj2')
      expect(mockFetch.mock.calls[2][1].method).toBe('DELETE')
    })

    it('handles empty bucket', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await emptyBucket('my-bucket')
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/objects')
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
      // First page: list + delete obj1
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/objects')
      expect(mockFetch.mock.calls[1][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/objects/obj1')
      expect(mockFetch.mock.calls[1][1].method).toBe('DELETE')
      // Second page: list + delete obj2
      expect(mockFetch.mock.calls[2][0]).toContain('/s3/buckets/my-bucket/objects?continuationToken=token1')
      expect(mockFetch.mock.calls[3][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/objects/obj2')
      expect(mockFetch.mock.calls[3][1].method).toBe('DELETE')
    })
  })

  describe('headBucket', () => {
    it('checks bucket exists with HEAD', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => null },
        text: () => Promise.resolve(''),
        json: () => Promise.resolve({}),
      })
      await headBucket('my-bucket')
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket')
      expect(mockFetch.mock.calls[0][1].method).toBe('HEAD')
    })

    it('throws on non-existent bucket', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        headers: { get: () => null },
        text: () => Promise.resolve('Not found'),
      })
      await expect(headBucket('no-bucket')).rejects.toThrow(/S3 headBucket failed/)
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
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/objects')
    })

    it('handles empty response', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listObjects('my-bucket')
      expect(result.objects).toEqual([])
      expect(result.prefixes).toEqual([])
      expect(result.isTruncated).toBe(false)
    })

    it('passes options as query params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await listObjects('my-bucket', { prefix: 'folder/', maxKeys: 10 })
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('/s3/buckets/my-bucket/objects?')
      expect(url).toContain('prefix=folder%2F')
      expect(url).toContain('maxKeys=10')
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
      expect(mockFetch.mock.calls[0][0]).toContain('/s3/buckets/my-bucket/objects?prefix=test%2F')
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
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/objects/file.txt')
    })

    it('throws on error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({}),
        text: () => Promise.resolve('Not found'),
      })
      await expect(getObject('my-bucket', 'missing.txt')).rejects.toThrow(/S3 getObject failed/)
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
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/objects/file.bin')
    })
  })

  describe('putObject', () => {
    it('sends body as-is for string', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putObject('my-bucket', 'file.txt', 'hello', 'text/plain')
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/objects')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Key).toBe('file.txt')
      expect(body.Body).toBe('hello')
      expect(body.ContentType).toBe('text/plain')
    })

    it('converts Uint8Array to Array', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putObject('my-bucket', 'file.bin', new Uint8Array([1, 2, 3]))
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Body).toEqual([1, 2, 3])
    })
  })

  describe('deleteObject', () => {
    it('sends DELETE request with bucket and key', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteObject('my-bucket', 'file.txt')
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/objects/file.txt')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('headObject', () => {
    it('returns metadata from JSON body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({}),
        json: () => Promise.resolve({ ContentLength: 100, ContentType: 'text/plain', ETag: '"abc"', LastModified: '2024-01-01' }),
        text: () => Promise.resolve(''),
      })
      const result = await headObject('my-bucket', 'file.txt')
      expect(result.contentLength).toBe('100')
      expect(result.contentType).toBe('text/plain')
      expect(result.etag).toBe('abc')
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/objects/file.txt')
      expect(mockFetch.mock.calls[0][1].method).toBe('HEAD')
    })

    it('provides defaults for missing response fields', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({}),
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
      })
      const result = await headObject('my-bucket', 'missing.txt')
      expect(result.contentLength).toBe('0')
      expect(result.contentType).toBe('')
      expect(result.etag).toBe('')
      expect(result.lastModified).toBe('')
    })

    it('falls back to response headers when JSON body unavailable', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-length': '200',
          'content-type': 'image/png',
          'etag': '"xyz"',
          'last-modified': '2024-06-01',
        }),
        json: () => Promise.reject(new Error('no body')),
        text: () => Promise.resolve(''),
      })
      const result = await headObject('my-bucket', 'img.png')
      expect(result.contentLength).toBe('200')
      expect(result.contentType).toBe('image/png')
      expect(result.etag).toBe('xyz')
      expect(result.lastModified).toBe('2024-06-01')
    })
  })

  describe('getBucketVersioning', () => {
    it('returns versioning status', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Status: 'Enabled', MFADelete: 'Disabled' }))
      const result = await getBucketVersioning('my-bucket')
      expect(result.status).toBe('Enabled')
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/versioning')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('getBucketEncryption', () => {
    it('returns encryption info', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        ServerSideEncryptionConfiguration: {
          Rules: [{ ApplyServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } }],
        },
      }))
      const result = await getBucketEncryption('my-bucket')
      expect(result.algorithm).toBe('AES256')
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/encryption')
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
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/tagging')
    })
  })

  describe('getBucketPolicy', () => {
    it('returns policy', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Policy: '{}' }))
      const result = await getBucketPolicy('my-bucket')
      expect(result.Policy).toBe('{}')
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/policy')
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
      await expect(getBucketPolicy('my-bucket')).rejects.toThrow(/S3 GET/)
    })
  })

  describe('createFolder', () => {
    it('adds trailing slash and calls putObject', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await createFolder('my-bucket', 'my-folder')
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/objects')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
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
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/presign-get')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
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
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/presign-put')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
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
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/notification')
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.NotificationConfiguration.LambdaFunctionConfigurations).toHaveLength(1)
      // Bucket field should not be in body (it's in URL path)
      expect(body.Bucket).toBeUndefined()
    })
  })

  describe('getNotificationConfig', () => {
    it('returns notification config', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await getNotificationConfig('my-bucket')
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/s3/buckets/my-bucket/notification')
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(listBuckets()).rejects.toThrow(/S3 GET/)
    })

    it('throws APIError on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listBuckets()).rejects.toThrow(/S3 request error/)
    })
  })
})
