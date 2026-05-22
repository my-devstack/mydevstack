/**
 * SSM Parameter Store Service API Client
 * REST HTTP client for SSM via Go proxy
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

const api = PROXY_BACKEND.replace(/\/$/, '')

export class SSMService {
  async getParameter(name: string, options?: { WithDecryption?: boolean }): Promise<any> {
    const url = `${api}/ssm/parameters/${encodeURIComponent(name)}`
    const qs = options?.WithDecryption ? '?WithDecryption=true' : ''
    const res = await fetch(url + qs)
    if (!res.ok) throw new APIError(`GetParameter failed`, res.status, 'ssm')
    return res.json()
  }

  async getParameters(names: string[], options?: { WithDecryption?: boolean }): Promise<any> {
    const res = await fetch(`${api}/ssm/parameters/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Names: names, ...options }),
    })
    if (!res.ok) throw new APIError(`GetParameters failed`, res.status, 'ssm')
    return res.json()
  }

  async getParametersByPath(path: string, options?: {
    WithDecryption?: boolean
    Recursive?: boolean
    NextToken?: string
  }): Promise<any> {
    const params = new URLSearchParams()
    if (options?.WithDecryption) params.set('WithDecryption', 'true')
    if (options?.Recursive) params.set('Recursive', 'true')
    if (options?.NextToken) params.set('NextToken', options.NextToken)
    const qs = params.toString()
    const url = qs ? `${api}/ssm/parameters-by-path/${encodeURIComponent(path)}?${qs}` : `${api}/ssm/parameters-by-path/${encodeURIComponent(path)}`
    const res = await fetch(url)
    if (!res.ok) throw new APIError(`GetParametersByPath failed`, res.status, 'ssm')
    return res.json()
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
    const res = await fetch(`${api}/ssm/parameters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) throw new APIError(`PutParameter failed`, res.status, 'ssm')
    return res.json()
  }

  async deleteParameter(name: string): Promise<any> {
    const res = await fetch(`${api}/ssm/parameters/${encodeURIComponent(name)}`, { method: 'DELETE' })
    if (!res.ok) throw new APIError(`DeleteParameter failed`, res.status, 'ssm')
    return res.json()
  }

  async describeParameters(options?: {
    ParameterFilters?: any[]
    NextToken?: string
    MaxResults?: number
  }): Promise<any> {
    const res = await fetch(`${api}/ssm/parameters`)
    if (!res.ok) throw new APIError(`DescribeParameters failed`, res.status, 'ssm')
    return res.json()
  }

  async getParameterHistory(name: string, options?: { WithDecryption?: boolean; MaxResults?: number }): Promise<any> {
    const params = new URLSearchParams()
    if (options?.WithDecryption) params.set('WithDecryption', 'true')
    if (options?.MaxResults) params.set('MaxResults', String(options.MaxResults))
    const qs = params.toString()
    const url = qs ? `${api}/ssm/parameters/${encodeURIComponent(name)}/history?${qs}` : `${api}/ssm/parameters/${encodeURIComponent(name)}/history`
    const res = await fetch(url)
    if (!res.ok) throw new APIError(`GetParameterHistory failed`, res.status, 'ssm')
    return res.json()
  }

  async listTagsForResource(resourceType: string, resourceId: string): Promise<any> {
    const res = await fetch(`${api}/ssm/tags/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ResourceType: resourceType, ResourceId: resourceId }),
    })
    if (!res.ok) throw new APIError(`ListTagsForResource failed`, res.status, 'ssm')
    return res.json()
  }

  async addTagsToResource(resourceType: string, resourceId: string, tags: Record<string, string>): Promise<any> {
    const tagArray = Object.entries(tags).map(([Key, Value]) => ({ Key, Value }))
    const res = await fetch(`${api}/ssm/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ResourceType: resourceType, ResourceId: resourceId, Tags: tagArray }),
    })
    if (!res.ok) throw new APIError(`AddTagsToResource failed`, res.status, 'ssm')
    return res.json()
  }

  async removeTagsFromResource(resourceType: string, resourceId: string, keys: string[]): Promise<any> {
    const res = await fetch(`${api}/ssm/tags/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ResourceType: resourceType, ResourceId: resourceId, TagKeys: keys }),
    })
    if (!res.ok) throw new APIError(`RemoveTagsFromResource failed`, res.status, 'ssm')
    return res.json()
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
