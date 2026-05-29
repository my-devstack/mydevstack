/**
 * Kinesis Service API Client
 * REST HTTP client for Kinesis via Go proxy
 * @module api/services/kinesis
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

function enc(s: string): string {
  return encodeURIComponent(s)
}

export class KinesisService {
  private baseUrl: string

  constructor() {
    this.baseUrl = PROXY_BACKEND.replace(/\/$/, '')
  }

  private async request<T = any>(method: string, path: string, body?: object): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const fetchOptions: RequestInit = { method }
    if (body !== undefined) {
      fetchOptions.headers = { 'Content-Type': 'application/json' }
      fetchOptions.body = JSON.stringify(body)
    }
    try {
      const response = await fetch(url, fetchOptions)
      if (!response.ok) {
        const errorText = await response.text()
        throw new APIError(`Kinesis ${method} ${path} failed: ${errorText}`, response.status, 'kinesis')
      }
      const text = await response.text()
      if (!text) return {} as T
      return JSON.parse(text) as T
    } catch (error) {
      if (error instanceof APIError) throw error
      console.error(`Kinesis ${method} ${path} error:`, error)
      throw new APIError(`Failed to ${method} ${path}`, 500, 'kinesis')
    }
  }

  async createStream(streamName: string, options?: {
    ShardCount?: number
    StreamModeDetails?: { StreamMode: 'PROVISIONED' | 'ON_DEMAND' }
  }): Promise<any> {
    return this.request('POST', '/kinesis/streams', {
      StreamName: streamName,
      ShardCount: options?.ShardCount,
      StreamModeDetails: options?.StreamModeDetails,
    })
  }

  async listStreams(options?: {
    ExclusiveStartStreamName?: string
    Limit?: number
  }): Promise<any> {
    const qs = new URLSearchParams()
    if (options?.ExclusiveStartStreamName) qs.set('ExclusiveStartStreamName', options.ExclusiveStartStreamName)
    if (options?.Limit !== undefined) qs.set('Limit', String(options.Limit))
    const query = qs.toString()
    return this.request('GET', `/kinesis/streams${query ? `?${query}` : ''}`)
  }

  async describeStream(streamName: string): Promise<any> {
    return this.request('GET', `/kinesis/streams/${enc(streamName)}`)
  }

  async deleteStream(streamName: string): Promise<any> {
    return this.request('DELETE', `/kinesis/streams/${enc(streamName)}`)
  }

  async putRecord(
    streamName: string,
    data: string,
    partitionKey: string,
    options?: {
      ExplicitHashKey?: string
      SequenceNumberForOrdering?: string
    },
  ): Promise<any> {
    const dataBase64 = btoa(data)
    return this.request('POST', `/kinesis/streams/${enc(streamName)}/records`, {
      Data: dataBase64,
      PartitionKey: partitionKey,
      ...options,
    })
  }

  async getRecords(streamName: string, shardId: string, shardIterator: string, options?: { Limit?: number }): Promise<any> {
    return this.request('GET', `/kinesis/streams/${enc(streamName)}/shards/${enc(shardId)}/records`, {
      ShardIterator: shardIterator,
      ...options,
    })
  }

  async getShardIterator(
    streamName: string,
    shardId: string,
    iteratorType: string = 'LATEST',
  ): Promise<any> {
    return this.request('POST', `/kinesis/streams/${enc(streamName)}/shards/${enc(shardId)}/iterator`, {
      ShardIteratorType: iteratorType,
    })
  }

}

export const kinesisService = new KinesisService()

// Exported wrappers
export const createStream = (streamName: string, options?: any) =>
  kinesisService.createStream(streamName, options)
export const describeStream = (streamName: string) =>
  kinesisService.describeStream(streamName)
export const deleteStream = (streamName: string) =>
  kinesisService.deleteStream(streamName)
export const listStreams = (options?: any) =>
  kinesisService.listStreams(options)
export const getShardIterator = (streamName: string, shardId: string, iteratorType?: string) =>
  kinesisService.getShardIterator(streamName, shardId, iteratorType || 'LATEST')
export const getRecords = (streamName: string, shardId: string, shardIterator: string, options?: any) =>
  kinesisService.getRecords(streamName, shardId, shardIterator, options)
export const putRecord = (streamName: string, data: string, partitionKey: string, options?: any) =>
  kinesisService.putRecord(streamName, data, partitionKey, options)

export default kinesisService
