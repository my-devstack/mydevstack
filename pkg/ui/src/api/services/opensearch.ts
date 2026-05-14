/**
 * OpenSearch Service API Client
 * HTTP client for OpenSearch via Go proxy
 * Uses Domains API - compatible with Floci and LocalStack
 * @module api/services/opensearch
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

// Types
export interface DomainInfo {
  DomainName: string
  EngineVersion?: string
  DomainId?: string
  ARN?: string
  Created?: boolean
  Deleted?: boolean
  Processing?: boolean
  Endpoint?: string
  EndpointV2?: string
  ClusterConfig?: {
    InstanceType?: string
    InstanceCount?: number
    DedicatedMasterEnabled?: boolean
    ZoneAwarenessEnabled?: boolean
  }
  EBSOptions?: {
    EBSEnabled?: boolean
    VolumeType?: string
    VolumeSize?: number
  }
  CognitoOptions?: { Enabled?: boolean }
  EncryptionAtRestOptions?: { Enabled?: boolean }
  NodeToNodeEncryptionOptions?: { Enabled?: boolean }
  AdvancedOptions?: Record<string, string>
  LogPublishingOptions?: Record<string, any>
  AccessPolicies?: string
  SnapshotOptions?: { AutomatedSnapshotStartHour?: number }
  VPCOptions?: { VPCId?: string }
  TagList?: { Key: string; Value: string }[]
}

export interface CreateDomainInput {
  DomainName: string
  EngineVersion?: string
  ClusterConfig?: {
    InstanceType?: string
    InstanceCount?: number
    DedicatedMasterEnabled?: boolean
    ZoneAwarenessEnabled?: boolean
  }
  EBSOptions?: {
    EBSEnabled?: boolean
    VolumeType?: string
    VolumeSize?: number
  }
  EncryptionAtRestOptions?: { Enabled?: boolean }
  NodeToNodeEncryptionOptions?: { Enabled?: boolean }
  AdvancedOptions?: Record<string, string>
  AccessPolicies?: string
  TagList?: { Key: string; Value: string }[]
}

async function opensearchRequest(action: string, body: object = {}): Promise<any> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')
  const url = `${endpoint}/opensearch/`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': `opensearch.${action}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`OpenSearch ${action} failed: ${errorText}`, response.status, 'opensearch')
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error(`OpenSearch ${action} error:`, error)
    throw new APIError(`Failed to ${action}`, 500, 'opensearch')
  }
}

export class OpenSearchService {
  async listDomainNames(): Promise<DomainInfo[]> {
    const response = await opensearchRequest('ListDomainNames', {})
    // ListDomainNames returns EngineType, DescribeDomain returns EngineVersion
    // Map EngineType → EngineVersion for consistent frontend usage
    return (response.DomainNames || []).map((d: any) => ({
      DomainName: d.DomainName,
      EngineVersion: d.EngineType || d.EngineVersion,
      DomainId: d.DomainId,
    }))
  }

  async describeDomain(domainName: string): Promise<any> {
    return opensearchRequest('DescribeDomain', { DomainName: domainName })
  }

  async createDomain(input: CreateDomainInput): Promise<any> {
    return opensearchRequest('CreateDomain', input)
  }

  async deleteDomain(domainName: string): Promise<void> {
    return opensearchRequest('DeleteDomain', { DomainName: domainName })
  }

  async getCompatibleVersions(): Promise<any> {
    return opensearchRequest('GetCompatibleVersions', {})
  }

  async listTags(arn: string): Promise<any> {
    return opensearchRequest('ListTags', { ARN: arn })
  }

  async tagResource(arn: string, key: string, value: string): Promise<any> {
    return opensearchRequest('TagResource', { ARN: arn, TagList: [{ Key: key, Value: value }] })
  }

  async untagResource(arn: string, key: string): Promise<any> {
    return opensearchRequest('UntagResource', { ARN: arn, TagKeys: [key] })
  }
}

export const openSearchService = new OpenSearchService()

export const listDomainNames = () => openSearchService.listDomainNames()
export const describeDomain = (name: string) => openSearchService.describeDomain(name)
export const createDomain = (input: CreateDomainInput) => openSearchService.createDomain(input)
export const deleteDomain = (name: string) => openSearchService.deleteDomain(name)
export const getCompatibleVersions = () => openSearchService.getCompatibleVersions()
export const listTags = (arn: string) => openSearchService.listTags(arn)
export const tagResource = (arn: string, key: string, value: string) => openSearchService.tagResource(arn, key, value)
export const untagResource = (arn: string, key: string) => openSearchService.untagResource(arn, key)

export default openSearchService
