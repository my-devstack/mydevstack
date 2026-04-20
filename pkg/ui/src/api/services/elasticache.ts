/**
 * ElastiCache Service API Client
 * HTTP client for ElastiCache via Go proxy
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
}

async function elasticacheRequest(action: string, body: object = {}): Promise<any> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')
  const url = `${endpoint}/elasticache/`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': `elasticache.${action}`,
      },
      body: JSON.stringify(body),
    })

    const responseText = await response.text()
    
    // Check for error responses
    if (!response.ok || responseText.includes('ErrorResponse') || responseText.includes('<Error>')) {
      throw new APIError(`ElastiCache ${action} failed: ${responseText}`, response.status, 'elasticache')
    }

    // Parse response
    return parseElastiCacheXML(responseText, action)
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error(`ElastiCache ${action} error:`, error)
    throw new APIError(`Failed to ${action}`, 500, 'elasticache')
  }
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
  async describeReplicationGroups(): Promise<ReplicationGroup[]> {
    const response = await elasticacheRequest('DescribeReplicationGroups', {})
    return response.ReplicationGroups || []
  }

  async createReplicationGroup(input: CreateReplicationGroupInput): Promise<ReplicationGroup> {
    const response = await elasticacheRequest('CreateReplicationGroup', {
      ReplicationGroupId: input.ReplicationGroupId,
      ReplicationGroupDescription: input.ReplicationGroupDescription,
      Engine: input.Engine || 'valkey',
      CacheNodeType: input.CacheNodeType || 'cache.t3.micro',
      NumNodeGroups: input.NumNodeGroups || 1,
      Port: input.Port || 6379,
    })
    return response.ReplicationGroup
  }

  async deleteReplicationGroup(replicationGroupId: string): Promise<void> {
    return elasticacheRequest('DeleteReplicationGroup', { ReplicationGroupId: replicationGroupId })
  }
}

export const elasticacheService = new ElastiCacheService()

export const describeReplicationGroups = () => elasticacheService.describeReplicationGroups()
export const createReplicationGroup = (input: CreateReplicationGroupInput) => elasticacheService.createReplicationGroup(input)
export const deleteReplicationGroup = (id: string) => elasticacheService.deleteReplicationGroup(id)

export default elasticacheService