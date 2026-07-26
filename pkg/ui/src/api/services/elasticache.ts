/**
 * ElastiCache Service API Client
 * REST client for ElastiCache via Go proxy
 * Uses Replication Groups (Valkey/Redis) - compatible with Floci and MiniStack
 * @module api/services/elasticache
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

// Types
export interface ReplicationGroup {
  ReplicationGroupId: string
  ReplicationGroupDescription?: string
  Status?: string
  NodeGroups?: Array<{
    NodeGroupId: string
    PrimaryEndpoint?: { Address: string; Port: number }
    ReaderEndpoint?: { Address: string; Port: number }
    Slots?: string
  }>
  CacheNodeType?: string
  Engine?: string
}

export interface CreateReplicationGroupInput {
  ReplicationGroupId: string
  ReplicationGroupDescription?: string
  Engine?: string
  CacheNodeType?: string
  NumNodeGroups?: number
  ReplicasPerNodeGroup?: number
  Port?: number
  CacheSubnetGroupName?: string
  SecurityGroupIds?: string[]
}

// Parse XML response - works with Floci and MiniStack
function parseElastiCacheXML(xml: string, operation: string): any {
  if (operation === 'DescribeReplicationGroups') {
    const groups: ReplicationGroup[] = []

    // Match all ReplicationGroupId values - works with both <member> and direct tags
    const regex = /<ReplicationGroupId>([^<]+)<\/ReplicationGroupId>/g
    const matches = xml.matchAll(regex)

    for (const match of matches) {
      const groupId = match[1]
      if (groupId) {
        groups.push({
          ReplicationGroupId: groupId,
          Status: extractTag(xml, 'Status') || 'available',
          CacheNodeType: extractTag(xml, 'CacheNodeType') || 'cache.t3.micro',
          Engine: extractTag(xml, 'Engine') || 'valkey',
          NodeGroups: [{
            NodeGroupId: '0001',
            PrimaryEndpoint: {
              Address: extractTag(xml, 'Address') || 'redis',
              Port: parseInt(extractTag(xml, 'Port') || '6379'),
            },
            ReaderEndpoint: {
              Address: extractTag(xml, 'Address') || 'redis',
              Port: parseInt(extractTag(xml, 'Port') || '6379'),
            },
          }],
        })
      }
    }
    return { ReplicationGroups: groups }
  }

  if (operation === 'CreateReplicationGroup') {
    return { ReplicationGroup: { ReplicationGroupId: extractTag(xml, 'ReplicationGroupId') } }
  }

  return {}
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
  return match ? match[1].trim() : ''
}

export class ElastiCacheService {
  private baseUrl: string

  constructor() {
    this.baseUrl = PROXY_BACKEND.replace(/\/$/, '')
  }

  private async request(method: string, path: string, operation: string, body?: object): Promise<any> {
    const url = `${this.baseUrl}${path}`
    const fetchOptions: RequestInit = { method }

    if (body !== undefined) {
      fetchOptions.headers = { 'Content-Type': 'application/json' }
      fetchOptions.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, fetchOptions)
      const responseText = await response.text()

      // Check for error responses
      if (!response.ok || responseText.includes('ErrorResponse') || responseText.includes('<Error>')) {
        throw new APIError(`ElastiCache ${operation} failed: ${responseText}`, response.status, 'elasticache')
      }

      // Parse response
      return parseElastiCacheXML(responseText, operation)
    } catch (error) {
      if (error instanceof APIError) throw error
      console.error(`ElastiCache ${operation} error:`, error)
      throw new APIError(`Failed to ${operation}`, 500, 'elasticache')
    }
  }

  async describeReplicationGroups(): Promise<ReplicationGroup[]> {
    const response = await this.request('GET', '/elasticache/replication-groups', 'DescribeReplicationGroups')
    return response.ReplicationGroups || []
  }

  async createReplicationGroup(input: CreateReplicationGroupInput): Promise<ReplicationGroup> {
    const body: Record<string, any> = {
      ReplicationGroupId: input.ReplicationGroupId,
      ReplicationGroupDescription: input.ReplicationGroupDescription,
      Engine: input.Engine || 'valkey',
      CacheNodeType: input.CacheNodeType || 'cache.t3.micro',
      NumNodeGroups: input.NumNodeGroups || 1,
      Port: input.Port || 6379,
    }
    if (input.CacheSubnetGroupName) {
      body.CacheSubnetGroupName = input.CacheSubnetGroupName
    }
    if (input.SecurityGroupIds && input.SecurityGroupIds.length > 0) {
      body.SecurityGroupIds = input.SecurityGroupIds
    }
    const response = await this.request('POST', '/elasticache/replication-groups', 'CreateReplicationGroup', body)
    return response.ReplicationGroup
  }

  async deleteReplicationGroup(replicationGroupId: string): Promise<void> {
    await this.request(
      'DELETE',
      `/elasticache/replication-groups/${encodeURIComponent(replicationGroupId)}`,
      'DeleteReplicationGroup',
      { ReplicationGroupId: replicationGroupId },
    )
  }
}

export const elasticacheService = new ElastiCacheService()

export const describeReplicationGroups = () => elasticacheService.describeReplicationGroups()
export const createReplicationGroup = (input: CreateReplicationGroupInput) => elasticacheService.createReplicationGroup(input)
export const deleteReplicationGroup = (id: string) => elasticacheService.deleteReplicationGroup(id)

// Cache Subnet Groups (stub - not yet implemented by proxy backend)
export interface DescribeCacheSubnetGroupsResponse {
  CacheSubnetGroups: Array<{
    CacheSubnetGroupName: string
    VpcId: string
    CacheSubnetGroupDescription?: string
  }>
}

export async function describeCacheSubnetGroups(): Promise<DescribeCacheSubnetGroupsResponse> {
  return { CacheSubnetGroups: [] }
}

// Cache Security Groups (stub - not yet implemented by proxy backend)
export interface DescribeCacheSecurityGroupsResponse {
  CacheSecurityGroups: Array<{
    CacheSecurityGroupId: string
    CacheSecurityGroupName: string
    VpcId?: string
  }>
}

export async function describeCacheSecurityGroups(): Promise<DescribeCacheSecurityGroupsResponse> {
  return { CacheSecurityGroups: [] }
}

export default elasticacheService
