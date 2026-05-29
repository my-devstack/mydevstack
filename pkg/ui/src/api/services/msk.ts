/**
 * MSK Service API Client
 * Amazon Managed Streaming for Kafka API via Go proxy
 * REST-style endpoints
 * @module api/services/msk
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

type ServiceName = 'msk'

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
      throw new APIError(`MSK request failed: ${errorText}`, response.status, 'msk' as ServiceName)
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error('MSK request error:', error)
    throw new APIError('Failed to call MSK service', 500, 'msk' as ServiceName)
  }
}

export class MSKService {
  async listClustersV2(params: { MaxResults?: number; NextToken?: string; ClusterTypeFilter?: string } = {}): Promise<any> {
    const query = new URLSearchParams()
    if (params.MaxResults !== undefined) query.set('MaxResults', String(params.MaxResults))
    if (params.NextToken !== undefined) query.set('NextToken', params.NextToken)
    if (params.ClusterTypeFilter !== undefined) query.set('ClusterTypeFilter', params.ClusterTypeFilter)
    const qs = query.toString()
    return request(`/msk/clusters${qs ? `?${qs}` : ''}`, { method: 'GET' })
  }

  async describeClusterV2(clusterArn: string): Promise<any> {
    return request(`/msk/clusters/${encodeURIComponent(clusterArn)}`, { method: 'GET' })
  }

  async createClusterV2(params: any): Promise<any> {
    return request('/msk/clusters', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async deleteCluster(clusterArn: string): Promise<any> {
    return request(`/msk/clusters/${encodeURIComponent(clusterArn)}`, { method: 'DELETE' })
  }

  async getBootstrapBrokers(clusterArn: string): Promise<any> {
    return request(`/msk/clusters/${encodeURIComponent(clusterArn)}/bootstrap-brokers`, { method: 'GET' })
  }
}

export const mskService = new MSKService()

// Export functions
export const listClustersV2 = (params?: any) => mskService.listClustersV2(params)
export const describeClusterV2 = (clusterArn: string) => mskService.describeClusterV2(clusterArn)
export const createClusterV2 = (params: any) => mskService.createClusterV2(params)
export const deleteCluster = (clusterArn: string) => mskService.deleteCluster(clusterArn)
export const getBootstrapBrokers = (clusterArn: string) => mskService.getBootstrapBrokers(clusterArn)
export default mskService
