/**
 * CloudFront Service API Client
 * REST client for CloudFront via Go proxy
 * @module api/services/cloudfront
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'
import type {
  CloudFrontDistributionSummary,
  CloudFrontDistribution,
  CloudFrontInvalidation,
  CloudFrontOriginAccessControl,
  CloudFrontCreateDistributionRequest,
  CloudFrontUpdateDistributionRequest,
  CloudFrontCreateInvalidationRequest,
  CloudFrontCreateOriginAccessControlRequest,
} from '@/api/types/aws'

export class CloudFrontService {
  private baseUrl: string

  constructor() {
    this.baseUrl = PROXY_BACKEND.replace(/\/$/, '')
  }

  private async request(method: string, path: string, options?: { body?: unknown; query?: Record<string, string | undefined> }): Promise<any> {
    let url = `${this.baseUrl}${path}`

    if (options?.query) {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) {
          params.set(key, value)
        }
      }
      const qs = params.toString()
      if (qs) url += `?${qs}`
    }

    const fetchOptions: RequestInit = { method }

    if (options?.body !== undefined) {
      fetchOptions.headers = { 'Content-Type': 'application/json' }
      fetchOptions.body = JSON.stringify(options.body)
    }

    try {
      const response = await fetch(url, fetchOptions)

      if (!response.ok) {
        const errorText = await response.text()
        throw new APIError(`CloudFront ${method} ${path} failed: ${errorText}`, response.status, 'cloudfront')
      }

      const text = await response.text()
      if (!text) return {}
      return JSON.parse(text)
    } catch (error) {
      if (error instanceof APIError) throw error
      console.error(`CloudFront ${method} ${path} error:`, error)
      throw new APIError(`Failed to ${method} ${path}`, 500, 'cloudfront')
    }
  }

  // ---- Distributions ----
  async listDistributions(): Promise<{ DistributionList: { Items: CloudFrontDistributionSummary[]; Quantity: number } }> {
    const response = await this.request('GET', '/cloudfront/distributions')
    return {
      DistributionList: {
        Items: response.DistributionList?.Items || [],
        Quantity: response.DistributionList?.Quantity || 0,
      },
    }
  }

  async createDistribution(params: CloudFrontCreateDistributionRequest): Promise<{ Distribution: CloudFrontDistribution; ETag?: string }> {
    return this.request('POST', '/cloudfront/distributions', { body: params })
  }

  async getDistribution(id: string): Promise<{ Distribution: CloudFrontDistribution; ETag?: string }> {
    return this.request('GET', `/cloudfront/distributions/${encodeURIComponent(id)}`)
  }

  async updateDistribution(id: string, params: CloudFrontUpdateDistributionRequest): Promise<{ Distribution: CloudFrontDistribution; ETag?: string }> {
    return this.request('PUT', `/cloudfront/distributions/${encodeURIComponent(id)}`, { body: params })
  }

  async deleteDistribution(id: string): Promise<{ message: string }> {
    return this.request('DELETE', `/cloudfront/distributions/${encodeURIComponent(id)}`)
  }

  // ---- Invalidations ----
  async listInvalidations(distributionId: string): Promise<{ InvalidationList: { Items: CloudFrontInvalidation[]; Quantity: number } }> {
    const response = await this.request('GET', `/cloudfront/distributions/${encodeURIComponent(distributionId)}/invalidations`)
    return {
      InvalidationList: {
        Items: response.InvalidationList?.Items || [],
        Quantity: response.InvalidationList?.Quantity || 0,
      },
    }
  }

  async createInvalidation(distributionId: string, params: CloudFrontCreateInvalidationRequest): Promise<{ Invalidation: CloudFrontInvalidation }> {
    return this.request('POST', `/cloudfront/distributions/${encodeURIComponent(distributionId)}/invalidate`, { body: params })
  }

  // ---- Origin Access Controls ----
  async listOriginAccessControls(): Promise<{ OriginAccessControlList: { Items: CloudFrontOriginAccessControl[]; Quantity: number } }> {
    const response = await this.request('GET', '/cloudfront/origin-access-controls')
    return {
      OriginAccessControlList: {
        Items: response.OriginAccessControlList?.Items || [],
        Quantity: response.OriginAccessControlList?.Quantity || 0,
      },
    }
  }

  async createOriginAccessControl(params: CloudFrontCreateOriginAccessControlRequest): Promise<{ OriginAccessControl: CloudFrontOriginAccessControl }> {
    return this.request('POST', '/cloudfront/origin-access-controls', { body: params })
  }

  async deleteOriginAccessControl(id: string): Promise<{ message: string }> {
    return this.request('DELETE', `/cloudfront/origin-access-controls/${encodeURIComponent(id)}`)
  }
}

export const cloudfrontService = new CloudFrontService()

export const listDistributions = () => cloudfrontService.listDistributions()
export const createDistribution = (params: CloudFrontCreateDistributionRequest) =>
  cloudfrontService.createDistribution(params)
export const getDistribution = (id: string) => cloudfrontService.getDistribution(id)
export const updateDistribution = (id: string, params: CloudFrontUpdateDistributionRequest) =>
  cloudfrontService.updateDistribution(id, params)
export const deleteDistribution = (id: string) => cloudfrontService.deleteDistribution(id)
export const listInvalidations = (distributionId: string) => cloudfrontService.listInvalidations(distributionId)
export const createInvalidation = (distributionId: string, params: CloudFrontCreateInvalidationRequest) =>
  cloudfrontService.createInvalidation(distributionId, params)
export const listOriginAccessControls = () => cloudfrontService.listOriginAccessControls()
export const createOriginAccessControl = (params: CloudFrontCreateOriginAccessControlRequest) =>
  cloudfrontService.createOriginAccessControl(params)
export const deleteOriginAccessControl = (id: string) => cloudfrontService.deleteOriginAccessControl(id)

export const cloudfront = {
  listDistributions: () => cloudfrontService.listDistributions(),
  createDistribution: (params: CloudFrontCreateDistributionRequest) => cloudfrontService.createDistribution(params),
  getDistribution: (id: string) => cloudfrontService.getDistribution(id),
  updateDistribution: (id: string, params: CloudFrontUpdateDistributionRequest) => cloudfrontService.updateDistribution(id, params),
  deleteDistribution: (id: string) => cloudfrontService.deleteDistribution(id),
  listInvalidations: (distributionId: string) => cloudfrontService.listInvalidations(distributionId),
  createInvalidation: (distributionId: string, params: CloudFrontCreateInvalidationRequest) => cloudfrontService.createInvalidation(distributionId, params),
  listOriginAccessControls: () => cloudfrontService.listOriginAccessControls(),
  createOriginAccessControl: (params: CloudFrontCreateOriginAccessControlRequest) => cloudfrontService.createOriginAccessControl(params),
  deleteOriginAccessControl: (id: string) => cloudfrontService.deleteOriginAccessControl(id),
}

export default cloudfront

/**
 * Local viewer URL for a CloudFront distribution.
 * Floci serves distributions at {id}.cloudfront.localhost.floci.io:4566
 * (.localhost does not resolve on Debian-based CI; .localhost.floci.io resolves to 127.0.0.1 everywhere)
 */
export function localViewerUrl(id: string): string {
  return `http://${id.toLowerCase()}.cloudfront.localhost.floci.io:4566`
}
