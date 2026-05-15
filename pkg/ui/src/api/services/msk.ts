/**
 * MSK Service API Client
 * Amazon Managed Streaming for Kafka API via Go proxy
 * @module api/services/msk
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

export type MSKService = {
  listClustersV2: (params?: any) => Promise<any>
  describeClusterV2: (clusterArn: string) => Promise<any>
  createClusterV2: (params: any) => Promise<any>
  deleteCluster: (clusterArn: string) => Promise<any>
  getBootstrapBrokers: (clusterArn: string) => Promise<any>
}

async function mskRequest<T = any>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')
  const url = `${endpoint}/kafka/`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': `Kafka.${action}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`MSK ${action} failed: ${errorText}`, response.status, 'msk')
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error(`MSK ${action} error:`, error)
    throw new APIError(`Failed to ${action}`, 500, 'msk')
  }
}

export class MSKService {
  async listClustersV2(params: { MaxResults?: number; NextToken?: string; ClusterTypeFilter?: string } = {}): Promise<any> {
    return mskRequest('ListClustersV2', params)
  }

  async describeClusterV2(clusterArn: string): Promise<any> {
    return mskRequest('DescribeClusterV2', { ClusterArn: clusterArn })
  }

  async createClusterV2(params: any): Promise<any> {
    return mskRequest('CreateClusterV2', params)
  }

  async deleteCluster(clusterArn: string): Promise<any> {
    return mskRequest('DeleteCluster', { ClusterArn: clusterArn })
  }

  async getBootstrapBrokers(clusterArn: string): Promise<any> {
    return mskRequest('GetBootstrapBrokers', { ClusterArn: clusterArn })
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
