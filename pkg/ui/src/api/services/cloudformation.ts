/**
 * CloudFormation Service API Client
 * RESTful HTTP client for CloudFormation via Go proxy
 * @module api/services/cloudformation
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'
import type { CloudFormationStack, CloudFormationStackResource } from '../types/aws'

export interface ListStacksRequest {
  StackStatusFilter?: string[]
  NextToken?: string
}

export interface CreateStackRequest {
  StackName: string
  TemplateBody?: string
  TemplateURL?: string
  Parameters?: Array<{ ParameterKey: string; ParameterValue: string }>
  DisableRollback?: boolean
  TimeoutInMinutes?: number
  NotificationARNs?: string[]
  Capabilities?: string[]
  ResourceTypes?: string[]
  RoleARN?: string
  OnFailure?: 'DO_NOTHING' | 'ROLLBACK' | 'DELETE'
  StackPolicyBody?: string
  StackPolicyURL?: string
  Tags?: Array<{ Key: string; Value: string }>
}

export interface DeleteStackRequest {
  StackName: string
  RetainResources?: string[]
  RoleARN?: string
}

export interface ListStackResourcesRequest {
  StackName: string
}

export interface GetStackDetailsRequest {
  StackName: string
}

export interface ListStacksResponse {
  StackSummaries?: CloudFormationStack[]
  NextToken?: string
}

export class CloudFormationService {
  private baseUrl: string

  constructor() {
    this.baseUrl = PROXY_BACKEND.replace(/\/$/, '')
  }

  private async request(method: string, path: string, options?: { body?: unknown; label?: string }): Promise<any> {
    const url = `${this.baseUrl}${path}`
    const label = options?.label || `${method} ${path}`
    const fetchOptions: RequestInit = { method }

    if (options?.body !== undefined) {
      fetchOptions.headers = { 'Content-Type': 'application/json' }
      fetchOptions.body = JSON.stringify(options.body)
    }

    try {
      const response = await fetch(url, fetchOptions)

      if (!response.ok) {
        const errorText = await response.text()
        throw new APIError(`CloudFormation ${label} failed: ${errorText}`, response.status, 'cloudformation')
      }

      const text = await response.text()
      if (!text) return {}
      return JSON.parse(text)
    } catch (error) {
      if (error instanceof APIError) throw error
      console.error(`CloudFormation ${label} error:`, error)
      throw new APIError(`Failed to ${label}`, 500, 'cloudformation')
    }
  }

  async listStacks(request?: ListStacksRequest): Promise<CloudFormationStack[]> {
    const data = await this.request('GET', '/cloudformation/stacks', { body: request, label: 'ListStacks' })
    return (data.StackSummaries || []).map((stack: any) => ({
      StackName: stack.StackName || '',
      StackId: stack.StackId || '',
      StackStatus: stack.StackStatus || '',
      StackStatusReason: stack.StackStatusReason || '',
      Description: stack.Description || '',
      CreationTime: stack.CreationTime || '',
      LastUpdatedTime: stack.LastUpdatedTime || '',
      DeletionTime: stack.DeletionTime || '',
      NotificationARNs: stack.NotificationARNs || [],
      TimeoutInMinutes: stack.TimeoutInMinutes || 0,
      Capabilities: stack.Capabilities || [],
      Outputs: stack.Outputs || [],
      EnableTerminationProtection: stack.EnableTerminationProtection || false,
      Tags: stack.Tags || [],
      RoleARN: stack.RoleARN || '',
      ParentId: stack.ParentId || '',
      RootId: stack.RootId || '',
      DriftInformation: stack.DriftInformation || {},
    }))
  }

  async createStack(request: CreateStackRequest): Promise<{ StackId: string }> {
    return this.request('POST', '/cloudformation/stacks', { body: request, label: 'CreateStack' })
  }

  async deleteStack(request: DeleteStackRequest): Promise<void> {
    return this.request('DELETE', `/cloudformation/stacks/${encodeURIComponent(request.StackName)}`, { label: 'DeleteStack' })
  }

  async getStackDetails(request: GetStackDetailsRequest): Promise<CloudFormationStack> {
    const data = await this.request('GET', `/cloudformation/stacks/${encodeURIComponent(request.StackName)}`, { label: 'DescribeStacks' })
    const stacks = data.Stacks || []
    if (stacks.length === 0) {
      throw new APIError(`Stack ${request.StackName} not found`, 404, 'cloudformation', 'StackNotFound')
    }
    const stack = stacks[0]
    return {
      StackName: stack.StackName || '',
      StackId: stack.StackId || '',
      StackStatus: stack.StackStatus || '',
      StackStatusReason: stack.StackStatusReason || '',
      Description: stack.Description || '',
      CreationTime: stack.CreationTime || '',
      LastUpdatedTime: stack.LastUpdatedTime || '',
      DeletionTime: stack.DeletionTime || '',
      NotificationARNs: stack.NotificationARNs || [],
      TimeoutInMinutes: stack.TimeoutInMinutes || 0,
      Capabilities: stack.Capabilities || [],
      Outputs: stack.Outputs || [],
      EnableTerminationProtection: stack.EnableTerminationProtection || false,
      Tags: stack.Tags || [],
      RoleARN: stack.RoleARN || '',
      ParentId: stack.ParentId || '',
      RootId: stack.RootId || '',
      DriftInformation: stack.DriftInformation || {},
    }
  }

  async listStackResources(request: ListStackResourcesRequest): Promise<CloudFormationStackResource[]> {
    const data = await this.request('GET', `/cloudformation/stacks/${encodeURIComponent(request.StackName)}/resources`, { body: request, label: 'ListStackResources' })
    return (data.StackResourceSummaries || []).map((resource: any) => ({
      LogicalResourceId: resource.LogicalResourceId || '',
      PhysicalResourceId: resource.PhysicalResourceId || '',
      ResourceType: resource.ResourceType || '',
      ResourceStatus: resource.ResourceStatus || '',
      ResourceStatusReason: resource.ResourceStatusReason || '',
      LastUpdatedTimestamp: resource.LastUpdatedTimestamp || '',
    }))
  }

  async getStackTemplate(stackName: string): Promise<string> {
    const data = await this.request('GET', `/cloudformation/stacks/${encodeURIComponent(stackName)}/template`, { label: 'GetTemplate' })
    return data.TemplateBody || ''
  }
}

export const cloudFormationService = new CloudFormationService()

export const listStacks = (request?: ListStacksRequest) => cloudFormationService.listStacks(request)
export const createStack = (request: CreateStackRequest) => cloudFormationService.createStack(request)
export const deleteStack = (request: DeleteStackRequest) => cloudFormationService.deleteStack(request)
export const getStackDetails = (request: GetStackDetailsRequest) => cloudFormationService.getStackDetails(request)
export const getStackTemplate = (stackName: string) => cloudFormationService.getStackTemplate(stackName)
export const listStackResources = (request: ListStackResourcesRequest) => cloudFormationService.listStackResources(request)

export default cloudFormationService
