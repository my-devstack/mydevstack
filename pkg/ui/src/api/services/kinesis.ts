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

  async describeStreamSummary(streamName: string): Promise<any> {
    return this.request('GET', `/kinesis/streams/${enc(streamName)}/summary`)
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

  async putRecords(
    streamName: string,
    records: Array<{ Data: string; PartitionKey: string }>,
  ): Promise<any> {
    const recordsData = records.map(r => ({
      Data: btoa(r.Data),
      PartitionKey: r.PartitionKey,
    }))
    return this.request('POST', `/kinesis/streams/${enc(streamName)}/records/batch`, {
      Records: recordsData,
    })
  }

  async getRecords(shardIterator: string, options?: { Limit?: number }): Promise<any> {
    return this.request('POST', '/kinesis/records', {
      ShardIterator: shardIterator,
      ...options,
    })
  }

  async getShardIterator(
    streamName: string,
    shardId: string,
    iteratorType: string = 'LATEST',
  ): Promise<any> {
    return this.request('POST', `/kinesis/streams/${enc(streamName)}/shard-iterator`, {
      ShardId: shardId,
      ShardIteratorType: iteratorType,
    })
  }

  async listShards(
    streamName: string,
    options?: { ExclusiveStartShardId?: string; MaxResults?: number },
  ): Promise<any> {
    const qs = new URLSearchParams()
    if (options?.ExclusiveStartShardId) qs.set('ExclusiveStartShardId', options.ExclusiveStartShardId)
    if (options?.MaxResults !== undefined) qs.set('MaxResults', String(options.MaxResults))
    const query = qs.toString()
    return this.request('GET', `/kinesis/streams/${enc(streamName)}/shards${query ? `?${query}` : ''}`)
  }

  async splitShard(
    streamName: string,
    shardToSplit: string,
    newStartingHashKey: string,
  ): Promise<any> {
    return this.request('POST', `/kinesis/streams/${enc(streamName)}/shards/split`, {
      ShardToSplit: shardToSplit,
      NewStartingHashKey: newStartingHashKey,
    })
  }

  async mergeShards(
    streamName: string,
    shardToMerge: string,
    adjacentShardToMerge: string,
  ): Promise<any> {
    return this.request('POST', `/kinesis/streams/${enc(streamName)}/shards/merge`, {
      ShardToMerge: shardToMerge,
      AdjacentShardToMerge: adjacentShardToMerge,
    })
  }

  async updateShardCount(streamName: string, targetShardCount: number): Promise<any> {
    return this.request('POST', `/kinesis/streams/${enc(streamName)}/shards/count`, {
      TargetShardCount: targetShardCount,
      ScalingType: 'UNIFORM_SCALING',
    })
  }

  async increaseStreamRetentionPeriod(
    streamName: string,
    retentionPeriodHours: number,
  ): Promise<any> {
    return this.request('POST', `/kinesis/streams/${enc(streamName)}/retention/increase`, {
      RetentionPeriodHours: retentionPeriodHours,
    })
  }

  async decreaseStreamRetentionPeriod(
    streamName: string,
    retentionPeriodHours: number,
  ): Promise<any> {
    return this.request('POST', `/kinesis/streams/${enc(streamName)}/retention/decrease`, {
      RetentionPeriodHours: retentionPeriodHours,
    })
  }

  async enableEnhancedMonitoring(
    streamName: string,
    shardLevelMetrics: string[],
  ): Promise<any> {
    return this.request('POST', `/kinesis/streams/${enc(streamName)}/enhanced-monitoring`, {
      ShardLevelMetrics: shardLevelMetrics,
    })
  }

  async disableEnhancedMonitoring(
    streamName: string,
    shardLevelMetrics: string[],
  ): Promise<any> {
    return this.request('DELETE', `/kinesis/streams/${enc(streamName)}/enhanced-monitoring`, {
      ShardLevelMetrics: shardLevelMetrics,
    })
  }
}

export const kinesisService = new KinesisService()

// Exported wrappers
export const createStream = (streamName: string, options?: any) =>
  kinesisService.createStream(streamName, options)
export const describeStream = (streamName: string) =>
  kinesisService.describeStream(streamName)
export const describeStreamSummary = (streamName: string) =>
  kinesisService.describeStreamSummary(streamName)
export const deleteStream = (streamName: string) =>
  kinesisService.deleteStream(streamName)
export const listStreams = (options?: any) =>
  kinesisService.listStreams(options)
export const listShards = (streamName: string, options?: any) =>
  kinesisService.listShards(streamName, options)
export const getShardIterator = (streamName: string, shardId: string, iteratorType?: string) =>
  kinesisService.getShardIterator(streamName, shardId, iteratorType || 'LATEST')
export const getRecords = (shardIterator: string, options?: any) =>
  kinesisService.getRecords(shardIterator, options)
export const putRecord = (streamName: string, data: string, partitionKey: string, options?: any) =>
  kinesisService.putRecord(streamName, data, partitionKey, options)
export const putRecords = (streamName: string, records: any[]) =>
  kinesisService.putRecords(streamName, records)
export const mergeShards = (
  streamName: string,
  shardToMerge: string,
  adjacentShardToMerge: string,
) => kinesisService.mergeShards(streamName, shardToMerge, adjacentShardToMerge)
export const splitShard = (
  streamName: string,
  shardToSplit: string,
  newStartingHashKey: string,
) => kinesisService.splitShard(streamName, shardToSplit, newStartingHashKey)
export const updateShardCount = (streamName: string, targetShardCount: number) =>
  kinesisService.updateShardCount(streamName, targetShardCount)
export const increaseStreamRetentionPeriod = (
  streamName: string,
  retentionPeriodHours: number,
) => kinesisService.increaseStreamRetentionPeriod(streamName, retentionPeriodHours)
export const decreaseStreamRetentionPeriod = (
  streamName: string,
  retentionPeriodHours: number,
) => kinesisService.decreaseStreamRetentionPeriod(streamName, retentionPeriodHours)
export const enableEnhancedMonitoring = (streamName: string, shardLevelMetrics: string[]) =>
  kinesisService.enableEnhancedMonitoring(streamName, shardLevelMetrics)
export const disableEnhancedMonitoring = (streamName: string, shardLevelMetrics: string[]) =>
  kinesisService.disableEnhancedMonitoring(streamName, shardLevelMetrics)

export default kinesisService
