/**
 * OpenSearch Service API Client
 * HTTP client for OpenSearch via Go proxy
 * Uses REST-style endpoints - compatible with Floci and LocalStack
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
  VPCOptions?: {
    VPCId?: string
    SubnetIds?: string[]
    SecurityGroupIds?: string[]
  }
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
  VPCOptions?: {
    SubnetIds: string[]
    SecurityGroupIds: string[]
  }
  EncryptionAtRestOptions?: { Enabled?: boolean }
  NodeToNodeEncryptionOptions?: { Enabled?: boolean }
  AdvancedOptions?: Record<string, string>
  AccessPolicies?: string
  TagList?: { Key: string; Value: string }[]
}

async function request<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')
  const fullUrl = `${endpoint}${url}`

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`OpenSearch request failed: ${errorText}`, response.status, 'opensearch')
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error('OpenSearch request error:', error)
    throw new APIError('Failed to call OpenSearch service', 500, 'opensearch')
  }
}

export class OpenSearchService {
  async listDomainNames(): Promise<DomainInfo[]> {
    const response = await request<{ DomainNames?: any[] }>('/opensearch/domains', { method: 'GET' })
    // ListDomainNames returns EngineType, DescribeDomain returns EngineVersion
    // Map EngineType → EngineVersion for consistent frontend usage
    return (response.DomainNames || []).map((d: any) => ({
      DomainName: d.DomainName,
      EngineVersion: d.EngineType || d.EngineVersion,
      DomainId: d.DomainId,
    }))
  }

  async describeDomain(domainName: string): Promise<any> {
    return request(`/opensearch/domains/${encodeURIComponent(domainName)}`, { method: 'GET' })
  }

  async createDomain(input: CreateDomainInput): Promise<any> {
    return request('/opensearch/domains', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  async deleteDomain(domainName: string): Promise<void> {
    return request(`/opensearch/domains/${encodeURIComponent(domainName)}`, { method: 'DELETE' })
  }

  async getCompatibleVersions(): Promise<any> {
    return request('/opensearch/compatible-versions', { method: 'GET' })
  }

  async listTags(arn: string): Promise<any> {
    return request(`/opensearch/tags/${encodeURIComponent(arn)}`, { method: 'GET' })
  }

  async tagResource(arn: string, key: string, value: string): Promise<any> {
    return request(`/opensearch/tags/${encodeURIComponent(arn)}`, {
      method: 'POST',
      body: JSON.stringify({ Key: key, Value: value }),
    })
  }

  async untagResource(arn: string, key: string): Promise<any> {
    return request(`/opensearch/tags/${encodeURIComponent(arn)}`, {
      method: 'DELETE',
      body: JSON.stringify({ Key: key }),
    })
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
