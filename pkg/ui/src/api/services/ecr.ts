/**
 * ECR Service API Client
 * REST client for ECR via Go proxy
 * @module api/services/ecr
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'
import type {
  ECRRepository,
  ECRImageIdentifier,
  ECRImageDetail,
  ECRAuthorizationData,
  ECRTag,
} from '@/api/types/aws'

export class ECRService {
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
        throw new APIError(`ECR ${method} ${path} failed: ${errorText}`, response.status, 'ecr')
      }

      const text = await response.text()
      if (!text) return {}
      return JSON.parse(text)
    } catch (error) {
      if (error instanceof APIError) throw error
      console.error(`ECR ${method} ${path} error:`, error)
      throw new APIError(`Failed to ${method} ${path}`, 500, 'ecr')
    }
  }

  // ---- Repositories ----
  async listRepositories(params?: { RepositoryNames?: string[]; NextToken?: string; MaxResults?: number }): Promise<{ Repositories: ECRRepository[]; NextToken?: string }> {
    const response = await this.request('GET', '/ecr/repositories', { body: params })
    return {
      Repositories: response.Repositories || [],
      NextToken: response.NextToken,
    }
  }

  async createRepository(params: {
    RepositoryName: string
    ImageTagMutability?: 'MUTABLE' | 'IMMUTABLE'
    ImageScanningConfiguration?: { ScanOnPush?: boolean }
    EncryptionConfiguration?: { EncryptionType?: string; KmsKey?: string }
    Tags?: ECRTag[]
  }): Promise<{ Repository: ECRRepository }> {
    return this.request('POST', '/ecr/repositories', { body: params })
  }

  async getRepository(repositoryName: string): Promise<{ Repositories: ECRRepository[] }> {
    return this.request('GET', `/ecr/repositories/${encodeURIComponent(repositoryName)}`)
  }

  async deleteRepository(repositoryName: string, force?: boolean): Promise<{ Repository: ECRRepository }> {
    return this.request('DELETE', `/ecr/repositories/${encodeURIComponent(repositoryName)}`, {
      query: force ? { force: 'true' } : undefined,
    })
  }

  // ---- Authorization ----
  async getAuthorizationToken(): Promise<{ AuthorizationData: ECRAuthorizationData[] }> {
    return this.request('GET', '/ecr/authorization-token')
  }

  // ---- Images ----
  async listImages(repositoryName: string, params?: { NextToken?: string; MaxResults?: number; TagStatus?: string }): Promise<{ ImageIds: ECRImageIdentifier[]; NextToken?: string }> {
    const response = await this.request('GET', `/ecr/images/${encodeURIComponent(repositoryName)}`, { body: params })
    return {
      ImageIds: response.ImageIds || [],
      NextToken: response.NextToken,
    }
  }

  async describeImages(repositoryName: string, params?: { ImageIds?: ECRImageIdentifier[]; NextToken?: string; MaxResults?: number; TagStatus?: string }): Promise<{ ImageDetails: ECRImageDetail[]; NextToken?: string }> {
    const response = await this.request('GET', `/ecr/images/details/${encodeURIComponent(repositoryName)}`, { body: params })
    return {
      ImageDetails: response.ImageDetails || [],
      NextToken: response.NextToken,
    }
  }

  async batchGetImage(repositoryName: string, params: { ImageIds: ECRImageIdentifier[]; AcceptedMediaTypes?: string[] }): Promise<any> {
    return this.request('POST', `/ecr/images/batch-get/${encodeURIComponent(repositoryName)}`, { body: params })
  }

  async batchDeleteImage(repositoryName: string, params: { ImageIds: ECRImageIdentifier[] }): Promise<any> {
    return this.request('POST', `/ecr/images/batch-delete/${encodeURIComponent(repositoryName)}`, { body: params })
  }

  // ---- Tags ----
  async listTagsForResource(repositoryName: string): Promise<{ Tags: ECRTag[] }> {
    const response = await this.request('GET', `/ecr/tags/${encodeURIComponent(repositoryName)}`)
    return {
      Tags: response.Tags || [],
    }
  }

  async updateTags(repositoryName: string, params: { Tags?: Record<string, string>; RemovedKeys?: string[] }): Promise<{ message: string }> {
    return this.request('PUT', `/ecr/tags/${encodeURIComponent(repositoryName)}`, { body: params })
  }
}

export const ecrService = new ECRService()

export const listRepositories = (params?: Parameters<ECRService['listRepositories']>[0]) =>
  ecrService.listRepositories(params)
export const createRepository = (params: Parameters<ECRService['createRepository']>[0]) =>
  ecrService.createRepository(params)
export const getRepository = (repositoryName: string) => ecrService.getRepository(repositoryName)
export const deleteRepository = (repositoryName: string, force?: boolean) =>
  ecrService.deleteRepository(repositoryName, force)
export const getAuthorizationToken = () => ecrService.getAuthorizationToken()
export const listImages = (repositoryName: string, params?: Parameters<ECRService['listImages']>[1]) =>
  ecrService.listImages(repositoryName, params)
export const describeImages = (repositoryName: string, params?: Parameters<ECRService['describeImages']>[1]) =>
  ecrService.describeImages(repositoryName, params)
export const batchGetImage = (repositoryName: string, params: Parameters<ECRService['batchGetImage']>[1]) =>
  ecrService.batchGetImage(repositoryName, params)
export const batchDeleteImage = (repositoryName: string, params: Parameters<ECRService['batchDeleteImage']>[1]) =>
  ecrService.batchDeleteImage(repositoryName, params)
export const listTagsForResource = (repositoryName: string) => ecrService.listTagsForResource(repositoryName)
export const updateTags = (repositoryName: string, params: Parameters<ECRService['updateTags']>[1]) =>
  ecrService.updateTags(repositoryName, params)

export const ecr = {
  listRepositories: (params?: Parameters<ECRService['listRepositories']>[0]) => ecrService.listRepositories(params),
  createRepository: (params: any) => ecrService.createRepository(params),
  getRepository: (repositoryName: string) => ecrService.getRepository(repositoryName),
  deleteRepository: (repositoryName: string, force?: boolean) => ecrService.deleteRepository(repositoryName, force),
  getAuthorizationToken: () => ecrService.getAuthorizationToken(),
  listImages: (repositoryName: string, params?: any) => ecrService.listImages(repositoryName, params),
  describeImages: (repositoryName: string, params?: any) => ecrService.describeImages(repositoryName, params),
  batchGetImage: (repositoryName: string, params: any) => ecrService.batchGetImage(repositoryName, params),
  batchDeleteImage: (repositoryName: string, params: any) => ecrService.batchDeleteImage(repositoryName, params),
  listTagsForResource: (repositoryName: string) => ecrService.listTagsForResource(repositoryName),
  updateTags: (repositoryName: string, params: any) => ecrService.updateTags(repositoryName, params),
}

export default ecr
