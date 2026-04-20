/**
 * Region API Client
 * @module api/services/region
 */

import { api } from '../client'

export interface SetRegionResponse {
  region: string
  message: string
}

/**
 * Set the AWS region in the backend
 * @param region - AWS region code (e.g., 'us-east-1', 'us-west-2')
 */
export async function setRegion(region: string): Promise<SetRegionResponse> {
  return api.post<SetRegionResponse>('/proxy/region', { region })
}

/**
 * Get current region from backend
 * This is fetched via the health endpoint
 */
export async function getRegion(): Promise<string> {
  const response = await api.get<{ region: string }>('/health')
  return response.data.region || 'us-east-1'
}