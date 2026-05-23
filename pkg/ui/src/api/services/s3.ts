/**
 * S3 Service API Client
 * REST HTTP client for S3 via Go proxy
 * @module api/services/s3
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'
import type { S3Bucket, S3Object } from '../types/aws'

const BASE = PROXY_BACKEND.replace(/\/$/, '')

function enc(s: string): string {
  return encodeURIComponent(s)
}

async function restFetch<T = any>(method: string, path: string, body?: object): Promise<T> {
  const url = `${BASE}${path}`
  try {
    const response = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!response.ok) {
      const text = await response.text()
      throw new APIError(`S3 ${method} ${path} failed: ${text}`, response.status, 's3')
    }
    const contentLength = response.headers.get('content-length')
    if (contentLength === '0' || response.status === 204) {
      return {} as T
    }
    return response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    throw new APIError(`S3 request error`, 500, 's3')
  }
}

export class S3Service {
  async listBuckets(): Promise<S3Bucket[]> {
    const data = await restFetch<any>('GET', '/s3/buckets')
    return (data.Buckets || []).map(bucket => ({
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
    await restFetch('POST', '/s3/buckets', params)

    const bucketEnc = enc(bucket)

    // Apply versioning if enabled
    if (options?.enableVersioning) {
      await restFetch('PUT', `/s3/buckets/${bucketEnc}/versioning`, {
        VersioningConfiguration: { Status: 'Enabled' },
      })
    }

    // Apply encryption if specified
    if (options?.encryptionType) {
      const encryptionBody: any = {
        ServerSideEncryptionConfiguration: {
          Rules: [
            {
              ApplyServerSideEncryptionByDefault: {
                SSEAlgorithm: options.encryptionType,
              },
            },
          ],
        },
      }
      if (options.encryptionType === 'aws:kms' && options.kmsKeyId) {
        encryptionBody.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.KMSKeyId = options.kmsKeyId
      }
      await restFetch('PUT', `/s3/buckets/${bucketEnc}/encryption`, encryptionBody)
    }

    // Apply tags if specified
    if (options?.tags && options.tags.length > 0) {
      await restFetch('PUT', `/s3/buckets/${bucketEnc}/tagging`, {
        Tagging: { TagSet: options.tags },
      })
    }

    // Block public access if enabled
    if (options?.blockPublicAccess) {
      await restFetch('PUT', `/s3/buckets/${bucketEnc}/public-access-block`, {
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
      await restFetch('PUT', `/s3/buckets/${bucketEnc}/policy`, {
        Policy: options.bucketPolicy,
      })
    }

    return { Location: `/${bucket}` }
  }

  async deleteBucket(bucket: string): Promise<void> {
    await restFetch('DELETE', `/s3/buckets/${enc(bucket)}`)
  }

  async emptyBucket(bucket: string): Promise<void> {
    let marker: string | undefined
    do {
      const result = await this.listObjects(bucket, marker ? { marker } : undefined)
      for (const obj of result.objects) {
        await this.deleteObject(bucket, obj.Key)
      }
      marker = result.nextMarker
    } while (marker)
  }

  async headBucket(bucket: string): Promise<void> {
    const url = `${BASE}/s3/buckets/${enc(bucket)}`
    const response = await fetch(url, { method: 'HEAD' })
    if (!response.ok) {
      throw new APIError(`S3 headBucket failed`, response.status, 's3')
    }
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
    const qp = new URLSearchParams()
    if (options?.prefix) qp.set('prefix', options.prefix)
    if (options?.delimiter) qp.set('delimiter', options.delimiter)
    if (options?.marker) qp.set('continuationToken', options.marker)
    if (options?.maxKeys !== undefined) qp.set('maxKeys', String(options.maxKeys))
    const qs = qp.toString()
    const path = `/s3/buckets/${enc(bucket)}/objects${qs ? `?${qs}` : ''}`
    const response = await restFetch<any>('GET', path)

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
    const url = `${BASE}/s3/buckets/${enc(bucket)}/objects/${enc(key)}`

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`S3 getObject failed: ${errorText}`, response.status, 's3')
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
    return restFetch('POST', `/s3/buckets/${enc(bucket)}/objects`, {
      Key: key,
      Body: serializedBody,
      ContentType: contentType,
    })
  }

  async deleteObject(bucket: string, key: string): Promise<any> {
    return restFetch('DELETE', `/s3/buckets/${enc(bucket)}/objects/${enc(key)}`)
  }

  async headObject(bucket: string, key: string): Promise<Record<string, string>> {
    const url = `${BASE}/s3/buckets/${enc(bucket)}/objects/${enc(key)}`
    const response = await fetch(url, { method: 'HEAD' })
    if (!response.ok) {
      throw new APIError(`S3 headObject failed`, response.status, 's3')
    }
    // Go backend returns JSON body even for HEAD; fallback to response headers
    try {
      const data = await response.json()
      return {
        contentLength: String(data.ContentLength || 0),
        contentType: data.ContentType || '',
        etag: (data.ETag || '').replace(/"/g, ''),
        lastModified: data.LastModified || '',
      }
    } catch {
      return {
        contentLength: response.headers.get('content-length') || '0',
        contentType: response.headers.get('content-type') || '',
        etag: (response.headers.get('etag') || '').replace(/"/g, ''),
        lastModified: response.headers.get('last-modified') || '',
      }
    }
  }

  async getBucketVersioning(bucket: string): Promise<{ status: string; mfaDelete: string }> {
    const response = await restFetch<any>('GET', `/s3/buckets/${enc(bucket)}/versioning`)
    return {
      status: response.Status || 'Unknown',
      mfaDelete: response.MFADelete || 'Disabled',
    }
  }

  async getBucketEncryption(bucket: string): Promise<{ algorithm: string; keyId: string }> {
    const response = await restFetch<any>('GET', `/s3/buckets/${enc(bucket)}/encryption`)
    const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault || {}
    return {
      algorithm: rule.SSEAlgorithm || 'None',
      keyId: rule.KMSKeyId || '',
    }
  }

  async getBucketTagging(bucket: string): Promise<{ tags: Array<{ Key: string; Value: string }> }> {
    const response = await restFetch<any>('GET', `/s3/buckets/${enc(bucket)}/tagging`)
    return {
      tags: response.TagSet || [],
    }
  }

  async getBucketPolicy(bucket: string): Promise<{ Policy?: string }> {
    try {
      return await restFetch<any>('GET', `/s3/buckets/${enc(bucket)}/policy`)
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
  const response = await restFetch<any>('POST', `/s3/buckets/${enc(bucket)}/presign-get`, {
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
  const response = await restFetch<any>('POST', `/s3/buckets/${enc(bucket)}/presign-put`, {
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
  return restFetch('PUT', `/s3/buckets/${enc(bucket)}/notification`, {
    NotificationConfiguration: config.NotificationConfiguration,
  })
}

export async function getNotificationConfig(bucket: string): Promise<any> {
  return restFetch('GET', `/s3/buckets/${enc(bucket)}/notification`)
}

export default s3Service
