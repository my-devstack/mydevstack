/**
 * Kinesis Service API Client
 * Simple HTTP client for Kinesis via Go proxy
 * @module api/services/kinesis
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

async function kinesisRequest(action: string, body: object = {}): Promise<any> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')

  const url = `${endpoint}/kinesis/`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': action,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`Kinesis ${action} failed: ${errorText}`, response.status, 'kinesis')
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error(`Kinesis ${action} error:`, error)
    throw new APIError(`Failed to ${action}`, 500, 'kinesis')
  }
}

export class KinesisService {
  async createStream(streamName: string, options?: {
    ShardCount?: number
    StreamModeDetails?: { StreamMode: 'PROVISIONED' | 'ON_DEMAND' }
  }): Promise<any> {
    return kinesisRequest('CreateStream', {
      StreamName: streamName,
      ShardCount: options?.ShardCount,
      StreamModeDetails: options?.StreamModeDetails,
    })
  }

  async describeStream(streamName: string): Promise<any> {
    return kinesisRequest('DescribeStream', { StreamName: streamName })
  }

  async describeStreamSummary(streamName: string): Promise<any> {
    return kinesisRequest('DescribeStreamSummary', { StreamName: streamName })
  }

  async deleteStream(streamName: string): Promise<any> {
    return kinesisRequest('DeleteStream', { StreamName: streamName })
  }

  async listStreams(options?: { ExclusiveStartStreamName?: string; Limit?: number }): Promise<any> {
    return kinesisRequest('ListStreams', options || {})
  }

  async listShards(streamName: string, options?: { ExclusiveStartShardId?: string; MaxResults?: number }): Promise<any> {
    return kinesisRequest('ListShards', {
      StreamName: streamName,
      ...options,
    })
  }

  async getShardIterator(streamName: string, shardId: string, iteratorType: string = 'LATEST'): Promise<any> {
    return kinesisRequest('GetShardIterator', {
      StreamName: streamName,
      ShardId: shardId,
      ShardIteratorType: iteratorType,
    })
  }

  async getRecords(shardIterator: string, options?: { Limit?: number }): Promise<any> {
    return kinesisRequest('GetRecords', {
      ShardIterator: shardIterator,
      ...options,
    })
  }

  async putRecord(streamName: string, data: string, partitionKey: string, options?: {
    ExplicitHashKey?: string
    SequenceNumberForOrdering?: string
  }): Promise<any> {
    // Convert string to base64
    const dataBase64 = btoa(data)
    return kinesisRequest('PutRecord', {
      StreamName: streamName,
      Data: dataBase64,
      PartitionKey: partitionKey,
      ...options,
    })
  }

  async putRecords(streamName: string, records: Array<{ Data: string; PartitionKey: string }>): Promise<any> {
    const recordsData = records.map(r => ({
      Data: btoa(r.Data),
      PartitionKey: r.PartitionKey,
    }))
    return kinesisRequest('PutRecords', {
      StreamName: streamName,
      Records: recordsData,
    })
  }

  async mergeShards(streamName: string, shardToMerge: string, adjacentShardToMerge: string): Promise<any> {
    return kinesisRequest('MergeShards', {
      StreamName: streamName,
      ShardToMerge: shardToMerge,
      AdjacentShardToMerge: adjacentShardToMerge,
    })
  }

  async splitShard(streamName: string, shardToSplit: string, newStartingHashKey: string): Promise<any> {
    return kinesisRequest('SplitShard', {
      StreamName: streamName,
      ShardToSplit: shardToSplit,
      NewStartingHashKey: newStartingHashKey,
    })
  }

  async updateShardCount(streamName: string, targetShardCount: number): Promise<any> {
    return kinesisRequest('UpdateShardCount', {
      StreamName: streamName,
      TargetShardCount: targetShardCount,
      ScalingType: 'UNIFORM_SCALING',
    })
  }

  async enableEnhancedMonitoring(streamName: string, shardLevelMetrics: string[]): Promise<any> {
    return kinesisRequest('EnableEnhancedMonitoring', {
      StreamName: streamName,
      ShardLevelMetrics: shardLevelMetrics,
    })
  }

  async disableEnhancedMonitoring(streamName: string, shardLevelMetrics: string[]): Promise<any> {
    return kinesisRequest('DisableEnhancedMonitoring', {
      StreamName: streamName,
      ShardLevelMetrics: shardLevelMetrics,
    })
  }
}

export const kinesisService = new KinesisService()

// Export functions
export const createStream = (streamName: string, options?: any) => kinesisService.createStream(streamName, options)
export const describeStream = (streamName: string) => kinesisService.describeStream(streamName)
export const describeStreamSummary = (streamName: string) => kinesisService.describeStreamSummary(streamName)
export const deleteStream = (streamName: string) => kinesisService.deleteStream(streamName)
export const listStreams = (options?: any) => kinesisService.listStreams(options)
export const listShards = (streamName: string, options?: any) => kinesisService.listShards(streamName, options)
export const getShardIterator = (streamName: string, shardId: string, iteratorType?: string) => 
  kinesisService.getShardIterator(streamName, shardId, iteratorType || 'LATEST')
export const getRecords = (shardIterator: string, options?: any) => kinesisService.getRecords(shardIterator, options)
export const putRecord = (streamName: string, data: string, partitionKey: string, options?: any) => 
  kinesisService.putRecord(streamName, data, partitionKey, options)
export const putRecords = (streamName: string, records: any[]) => kinesisService.putRecords(streamName, records)
export const mergeShards = (streamName: string, shardToMerge: string, adjacentShardToMerge: string) => 
  kinesisService.mergeShards(streamName, shardToMerge, adjacentShardToMerge)
export const splitShard = (streamName: string, shardToSplit: string, newStartingHashKey: string) => 
  kinesisService.splitShard(streamName, shardToSplit, newStartingHashKey)
export const updateShardCount = (streamName: string, targetShardCount: number) => 
  kinesisService.updateShardCount(streamName, targetShardCount)
export const enableEnhancedMonitoring = (streamName: string, shardLevelMetrics: string[]) => 
  kinesisService.enableEnhancedMonitoring(streamName, shardLevelMetrics)
export const disableEnhancedMonitoring = (streamName: string, shardLevelMetrics: string[]) => 
  kinesisService.disableEnhancedMonitoring(streamName, shardLevelMetrics)

export default kinesisService