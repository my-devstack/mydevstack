/**
 * SSM Parameter Store Service API Client
 * Simple HTTP client for SSM via Go proxy
 * @module api/services/ssm
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

async function ssmRequest(action: string, body: object = {}): Promise<any> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')

  const url = `${endpoint}/ssm/`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': `ssm.${action}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`SSM ${action} failed: ${errorText}`, response.status, 'ssm')
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error(`SSM ${action} error:`, error)
    throw new APIError(`Failed to ${action}`, 500, 'ssm')
  }
}

export class SSMService {
  async getParameter(name: string, options?: { WithDecryption?: boolean }): Promise<any> {
    return ssmRequest('GetParameter', { Name: name, ...options })
  }

  async getParameters(names: string[], options?: { WithDecryption?: boolean }): Promise<any> {
    return ssmRequest('GetParameters', { Names: names, ...options })
  }

  async getParametersByPath(path: string, options?: {
    WithDecryption?: boolean
    Recursive?: boolean
    NextToken?: string
  }): Promise<any> {
    return ssmRequest('GetParametersByPath', { Path: path, ...options })
  }

  async putParameter(params: {
    Name: string
    Value: string
    Type: 'String' | 'SecureString' | 'StringList'
    Description?: string
    Overwrite?: boolean
    AllowedPattern?: string
    Tier?: 'Standard' | 'Advanced' | 'Intelligent-Tiering'
    DataType?: string
    Policies?: string
  }): Promise<any> {
    return ssmRequest('PutParameter', params)
  }

  async deleteParameter(name: string): Promise<any> {
    return ssmRequest('DeleteParameter', { Name: name })
  }

  async describeParameters(options?: {
    ParameterFilters?: any[]
    NextToken?: string
    MaxResults?: number
  }): Promise<any> {
    return ssmRequest('DescribeParameters', options || {})
  }

  async getParameterHistory(name: string, options?: { WithDecryption?: boolean; MaxResults?: number }): Promise<any> {
    return ssmRequest('GetParameterHistory', { Name: name, ...options })
  }

  async listTagsForResource(resourceType: string, resourceId: string): Promise<any> {
    return ssmRequest('ListTagsForResource', { ResourceType: resourceType, ResourceId: resourceId })
  }

  async addTagsToResource(resourceType: string, resourceId: string, tags: Record<string, string>): Promise<any> {
    const tagArray = Object.entries(tags).map(([Key, Value]) => ({ Key, Value }))
    return ssmRequest('AddTagsToResource', { ResourceType: resourceType, ResourceId: resourceId, Tags: tagArray })
  }

  async removeTagsFromResource(resourceType: string, resourceId: string, keys: string[]): Promise<any> {
    return ssmRequest('RemoveTagsFromResource', { ResourceType: resourceType, ResourceId: resourceId, TagKeys: keys })
  }
}

export const ssmService = new SSMService()

export const getParameter = (name: string, options?: any) => ssmService.getParameter(name, options)
export const getParameters = (names: string[], options?: any) => ssmService.getParameters(names, options)
export const getParametersByPath = (path: string, options?: any) => ssmService.getParametersByPath(path, options)
export const putParameter = (params: any) => ssmService.putParameter(params)
export const deleteParameter = (name: string) => ssmService.deleteParameter(name)
export const describeParameters = (options?: any) => ssmService.describeParameters(options)
export const getParameterHistory = (name: string, options?: any) => ssmService.getParameterHistory(name, options)
export const listTagsForResource = (resourceType: string, resourceId: string) =>
  ssmService.listTagsForResource(resourceType, resourceId)
export const addTagsToResource = (resourceType: string, resourceId: string, tags: Record<string, string>) =>
  ssmService.addTagsToResource(resourceType, resourceId, tags)
export const removeTagsFromResource = (resourceType: string, resourceId: string, keys: string[]) =>
  ssmService.removeTagsFromResource(resourceType, resourceId, keys)

export default ssmService