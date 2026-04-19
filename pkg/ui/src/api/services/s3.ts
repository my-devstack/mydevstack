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

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`S3 ${action} failed: ${errorText}`, response.status, 's3')
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

  async createBucket(bucket: string, options?: { enableCors?: boolean }): Promise<any> {
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
    
    return s3Request('CreateBucket', params)
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
}

export const s3Service = new S3Service()

export const listBuckets = () => s3Service.listBuckets()
export const createBucket = (bucket: string) => s3Service.createBucket(bucket)
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

export const getPresignedUrl = (bucket: string, key: string) => {
  return `/${bucket}/${key}`
}

export default s3Service
