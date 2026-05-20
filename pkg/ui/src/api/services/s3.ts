/**
 * S3 Service API Client
 * Simple HTTP client for S3 via Go proxy
 * @module api/services/s3
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'
import type { S3Bucket, S3Object } from '../types/aws'

async function s3Request(action: string, body: object = {}): Promise<any> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')

  const url = `${endpoint}/s3/`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': `s3.${action}`,
      },
      body: JSON.stringify(body),
    })

    const contentLength = response.headers.get('content-length')
    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`S3 ${action} failed: ${errorText}`, response.status, 's3')
    }

    // Handle empty responses
    if (contentLength === '0' || response.status === 204) {
      return {}
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error(`S3 ${action} error:`, error)
    throw new APIError(`Failed to ${action}`, 500, 's3')
  }
}

export class S3Service {
  async listBuckets(): Promise<S3Bucket[]> {
    const response = await s3Request('ListBuckets', {})
    return (response.Buckets || []).map(bucket => ({
      Name: bucket.Name || '',
      CreationDate: bucket.CreationDate || '',
    }))
  }

  async createBucket(
    bucket: string,
    options?: {
      enableCors?: boolean
      enableVersioning?: boolean
      encryptionType?: 'AES256' | 'aws:kms'
      kmsKeyId?: string
      blockPublicAccess?: boolean
      tags?: Array<{ Key: string; Value: string }>
      bucketPolicy?: string
    }
  ): Promise<any> {
    const params: any = { Bucket: bucket }

    if (options?.enableCors) {
      params.CORSConfiguration = {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: ['*'],
            ExposeHeaders: [],
            MaxAgeSeconds: 3000,
          },
        ],
      }
    }

    // Create the bucket first
    await s3Request('CreateBucket', params)

    // Apply versioning if enabled
    if (options?.enableVersioning) {
      await s3Request('PutBucketVersioning', {
        Bucket: bucket,
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      })
    }

    // Apply encryption if specified
    if (options?.encryptionType) {
      const encryptionParams: any = {
        Bucket: bucket,
        ServerSideEncryptionConfiguration: {
          Rules: [
            {
              ApplyServerSideEncryptionByDefault: {
                SSEAlgorithm: options.encryptionType,
              },
            },
          ],
        }
      }

      if (options.encryptionType === 'aws:kms' && options.kmsKeyId) {
        encryptionParams.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.KMSKeyId = options.kmsKeyId
      }

      await s3Request('PutBucketEncryption', encryptionParams)
    }

    // Apply tags if specified
    if (options?.tags && options.tags.length > 0) {
      await s3Request('PutBucketTagging', {
        Bucket: bucket,
        Tagging: {
          TagSet: options.tags,
        },
      })
    }

    // Block public access if enabled
    if (options?.blockPublicAccess) {
      await s3Request('PutPublicAccessBlock', {
        Bucket: bucket,
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      })
    }

    // Apply bucket policy if specified
    if (options?.bucketPolicy) {
      // Validate JSON before sending
      try {
        JSON.parse(options.bucketPolicy)
      } catch {
        throw new Error('Invalid bucket policy JSON')
      }

      await s3Request('PutBucketPolicy', {
        Bucket: bucket,
        Policy: options.bucketPolicy,
      })
    }

    return { Location: `/${bucket}` }
  }

  async deleteBucket(bucket: string): Promise<void> {
    return s3Request('DeleteBucket', { Bucket: bucket })
  }

  async emptyBucket(bucket: string): Promise<void> {
    // List and delete all objects
    let continuationToken: string | undefined
    do {
      const params: any = { Bucket: bucket }
      if (continuationToken) {
        params.ContinuationToken = continuationToken
      }
      const listResponse = await s3Request('ListObjectsV2', params)

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        const objects = listResponse.Contents.map((obj: any) => ({ Key: obj.Key }))
        await s3Request('DeleteObjects', { Bucket: bucket, Delete: { Objects: objects } })
      }

      continuationToken = listResponse.NextContinuationToken
    } while (continuationToken)
  }

  async headBucket(bucket: string): Promise<void> {
    return s3Request('HeadBucket', { Bucket: bucket })
  }

  async listObjects(
    bucket: string,
    options?: {
      prefix?: string
      delimiter?: string
      marker?: string
      maxKeys?: number
    }
  ): Promise<{ objects: S3Object[]; prefixes: string[]; isTruncated: boolean; nextMarker?: string }> {
    const params: any = { Bucket: bucket, ...options }
    const response = await s3Request('ListObjectsV2', params)

    const objects = (response.Contents || []).map(obj => ({
      Key: obj.Key || '',
      LastModified: obj.LastModified || '',
      Size: obj.Size,
      ETag: obj.ETag?.replace(/"/g, '') || '',
      StorageClass: obj.StorageClass || 'STANDARD',
    }))

    const prefixes = (response.CommonPrefixes || []).map((p: any) => p.Prefix || '')

    return {
      objects,
      prefixes,
      isTruncated: response.IsTruncated || false,
      nextMarker: response.NextContinuationToken,
    }
  }

  async getObject(bucket: string, key: string): Promise<{
    body: ArrayBuffer
    contentType: string
    metadata: Record<string, string>
  }> {
    const endpoint = PROXY_BACKEND.replace(/\/$/, '')
    const url = `${endpoint}/s3/`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': 's3.GetObject',
      },
      body: JSON.stringify({ Bucket: bucket, Key: key }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`S3 GetObject failed: ${errorText}`, response.status, 's3')
    }

    const contentType = response.headers.get('Content-Type') || 'application/octet-stream'
    const arrayBuffer = await response.arrayBuffer()

    return {
      body: arrayBuffer,
      contentType,
      metadata: {},
    }
  }

  async putObject(
    bucket: string,
    key: string,
    body: string | Uint8Array,
    contentType?: string
  ): Promise<any> {
    const serializedBody = body instanceof Uint8Array ? Array.from(body) : body
    return s3Request('PutObject', {
      Bucket: bucket,
      Key: key,
      Body: serializedBody,
      ContentType: contentType,
    })
  }

  async deleteObject(bucket: string, key: string): Promise<any> {
    return s3Request('DeleteObject', { Bucket: bucket, Key: key })
  }

  async headObject(bucket: string, key: string): Promise<Record<string, string>> {
    const response = await s3Request('HeadObject', { Bucket: bucket, Key: key })
    return {
      contentLength: String(response.ContentLength || 0),
      contentType: response.ContentType || '',
      etag: response.ETag?.replace(/"/g, '') || '',
      lastModified: response.LastModified || '',
    }
  }

  async getBucketVersioning(bucket: string): Promise<{ status: string; mfaDelete: string }> {
    const response = await s3Request('GetBucketVersioning', { Bucket: bucket })
    return {
      status: response.Status || 'Unknown',
      mfaDelete: response.MFADelete || 'Disabled',
    }
  }

  async getBucketEncryption(bucket: string): Promise<{ algorithm: string; keyId: string }> {
    const response = await s3Request('GetBucketEncryption', { Bucket: bucket })
    const rule = response.ServerSideEncryptionRules?.[0] || {}
    return {
      algorithm: rule.ServerSideEncryptionAlgorithm || 'None',
      keyId: rule.ServerSideEncryptionKeyManagementService?.KeyId || '',
    }
  }

  async getBucketTagging(bucket: string): Promise<{ tags: Array<{ Key: string; Value: string }> }> {
    const response = await s3Request('GetBucketTagging', { Bucket: bucket })
    return {
      tags: response.TagSet || [],
    }
  }

  async getBucketPolicy(bucket: string): Promise<{ Policy?: string }> {
    // This may return 404 if no policy exists
    try {
      return await s3Request('GetBucketPolicy', { Bucket: bucket })
    } catch (error: any) {
      if (error.statusCode === 404 || error.message?.includes('NoSuchBucketPolicy')) {
        return {}
      }
      throw error
    }
  }
}

export const s3Service = new S3Service()

export const listBuckets = () => s3Service.listBuckets()
export const createBucket = (bucket: string, options?: Parameters<S3Service['createBucket']>[1]) =>
  s3Service.createBucket(bucket, options)
export const deleteBucket = (bucket: string) => s3Service.deleteBucket(bucket)
export const emptyBucket = (bucket: string) => s3Service.emptyBucket(bucket)
export const headBucket = (bucket: string) => s3Service.headBucket(bucket)
export const headObject = (bucket: string, key: string) => s3Service.headObject(bucket, key)
export const listObjects = (bucket: string, options?: Parameters<S3Service['listObjects']>[1]) =>
  s3Service.listObjects(bucket, options)
export const listObjectsV2 = (bucket: string, options?: Parameters<S3Service['listObjects']>[1]) =>
  s3Service.listObjects(bucket, options)
export const getObject = (bucket: string, key: string) => s3Service.getObject(bucket, key)
export const putObject = (bucket: string, key: string, body: string | Uint8Array, contentType?: string) =>
  s3Service.putObject(bucket, key, body, contentType)
export const deleteObject = (bucket: string, key: string) => s3Service.deleteObject(bucket, key)

export const createFolder = async (bucket: string, folderPath: string) => {
  const path = folderPath.endsWith('/') ? folderPath : `${folderPath}/`
  return s3Service.putObject(bucket, path, '', 'application/directory')
}

export const getPresignedUrl = async (bucket: string, key: string, expiresIn: number = 3600): Promise<string> => {
  const response = await s3Request('PresignGetObject', {
    Bucket: bucket,
    Key: key,
    Expires: expiresIn,
  })
  return response.url
}

export const getPresignedUploadUrl = async (
  bucket: string,
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> => {
  const response = await s3Request('PresignPutObject', {
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    Expires: expiresIn,
  })
  return response.url
}

export const getBucketVersioning = (bucket: string) => s3Service.getBucketVersioning(bucket)
export const getBucketEncryption = (bucket: string) => s3Service.getBucketEncryption(bucket)
export const getBucketTagging = (bucket: string) => s3Service.getBucketTagging(bucket)
export const getBucketPolicy = (bucket: string) => s3Service.getBucketPolicy(bucket)

export interface NotificationConfig {
  Bucket: string
  NotificationConfiguration?: {
    LambdaFunctionConfigurations?: Array<{
      Id?: string
      LambdaFunctionArn: string
      Events: string[]
      Filter?: {
        Key?: {
          FilterRules?: Array<{
            Name: string
            Value: string
          }>
        }
      }
    }>
    TopicConfigurations?: Array<any>
    QueueConfigurations?: Array<any>
  }
}

export async function configureNotification(bucket: string, config: NotificationConfig): Promise<any> {
  return s3Request('PutBucketNotificationConfiguration', {
    Bucket: bucket,
    NotificationConfiguration: config.NotificationConfiguration,
  })
}

export async function getNotificationConfig(bucket: string): Promise<any> {
  return s3Request('GetBucketNotificationConfiguration', { Bucket: bucket })
}

export default s3Service
