/**
 * CloudFormation Service API Client
 * Simple HTTP client for CloudFormation via Go proxy
 * @module api/services/cloudformation
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'
import type { CloudFormationStack, CloudFormationOutput, CloudFormationStackResource } from '../types/aws'

async function cfRequest(action: string, body: object = {}): Promise<any> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')

  const url = `${endpoint}/cloudformation/`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': `cloudformation.${action}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`CloudFormation ${action} failed: ${errorText}`, response.status, 'cloudformation')
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error(`CloudFormation ${action} error:`, error)
    throw new APIError(`Failed to ${action}`, 500, 'cloudformation')
  }
}

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
  async listStacks(request?: ListStacksRequest): Promise<CloudFormationStack[]> {
    const params = request || {}
    const response = await cfRequest('ListStacks', params)
    return (response.StackSummaries || []).map((stack: any) => ({
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
    return cfRequest('CreateStack', request)
  }

  async deleteStack(request: DeleteStackRequest): Promise<void> {
    return cfRequest('DeleteStack', request)
  }

  async getStackDetails(request: GetStackDetailsRequest): Promise<CloudFormationStack> {
    const response = await cfRequest('DescribeStacks', { StackName: request.StackName })
    const stacks = response.Stacks || []
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
    const response = await cfRequest('ListStackResources', { StackName: request.StackName })
    return (response.StackResourceSummaries || []).map((resource: any) => ({
      LogicalResourceId: resource.LogicalResourceId || '',
      PhysicalResourceId: resource.PhysicalResourceId || '',
      ResourceType: resource.ResourceType || '',
      ResourceStatus: resource.ResourceStatus || '',
      ResourceStatusReason: resource.ResourceStatusReason || '',
      LastUpdatedTimestamp: resource.LastUpdatedTimestamp || '',
    }))
  }

  async getStackTemplate(stackName: string): Promise<string> {
    const response = await cfRequest('GetTemplate', { StackName: stackName })
    return response.TemplateBody || ''
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
