/**
 * CloudFormation Service API
 * Handles all AWS CloudFormation operations via the API client
 */

import { api } from '../client'

// Response types
interface CreateStackResponse {
  StackId: string
}

interface ListStacksResponse {
  StackSummaries: Array<{
    StackId: string
    StackName: string
    StackStatus: string
    StackStatusReason?: string
    Description?: string
    CreationTime: string
    LastUpdatedTime?: string
    DeletionTime?: string
    Tags?: Array<{ Key: string; Value: string }>
  }>
  NextToken?: string
}

interface DescribeStacksResponse {
  Stacks: Array<{
    StackId: string
    StackName: string
    ChangeSetId?: string
    Description?: string
    CreationTime: string
    DeletionTime?: string
    LastUpdatedTime?: string
    RollbackConfiguration?: {
      RollbackTriggers?: Array<{ Arn: string; Type: string }>
      MonitoringTimeInMinutes?: number
    }
    StackStatus: string
    StackStatusReason?: string
    DisableRollback?: boolean
    NotificationARNs?: string[]
    TimeoutInMinutes?: number
    Capabilities?: string[]
    Outputs?: Array<{
      OutputKey: string
      OutputValue?: string
      Description?: string
      ExportName?: string
    }>
    Tags?: Array<{ Key: string; Value: string }>
    EnableTerminationProtection?: boolean
    ParentId?: string
    RootId?: string
  }>
}

interface DescribeStackResourcesResponse {
  StackResources: Array<{
    StackName: string
    StackId: string
    LogicalResourceId: string
    PhysicalResourceId?: string
    ResourceType: string
    Timestamp: string
    ResourceStatus: string
    ResourceStatusReason?: string
    DriftInformation?: {
      StackResourceDriftStatus: string
      LastCheckTimestamp?: string
    }
  }>
}

interface UpdateStackResponse {
  StackId: string
}

interface DescribeStackEventsResponse {
  StackEvents: Array<{
    StackId: string
    EventId: string
    StackName: string
    LogicalResourceId: string
    PhysicalResourceId?: string
    ResourceType: string
    Timestamp: string
    ResourceStatus: string
    ResourceStatusReason?: string
    ResourceProperties: string
    ClientRequestToken?: string
  }>
  NextToken?: string
}

interface DescribeStackResourceResponse {
  StackResourceDetail: {
    StackName: string
    StackId: string
    LogicalResourceId: string
    PhysicalResourceId?: string
    ResourceType: string
    LastUpdatedTimestamp: string
    ResourceStatus: string
    ResourceStatusReason?: string
    Description?: string
    Metadata?: string
    DriftInformation?: {
      StackResourceDriftStatus: string
      LastCheckTimestamp?: string
    }
  }
}

interface EstimateTemplateCostResponse {
  Url: string
}

interface ValidateTemplateResponse {
  Parameters: Array<{
    ParameterKey: string
    Description?: string
    DefaultValue?: string
  }>
  Description?: string
  Capabilities?: string[]
  CapabilitiesReason?: string
  TemplateSummary?: Record<string, unknown>
}

interface GetTemplateResponse {
  TemplateBody: string
  StagesAvailable?: string[]
}

interface GetTemplateSummaryResponse {
  Parameters?: Array<{
    ParameterKey: string
    Description?: string
    DefaultValue?: string
    NoEcho?: boolean
    Type?: string
    ConstraintDescription?: string
  }>
  Description?: string
  Capabilities?: string[]
  CapabilitiesReason?: string
  ResourceTypes?: string[]
  Version?: string
  Metadata?: Record<string, unknown>
  TransformMetadata?: Record<string, unknown>
}

interface DescribeChangeSetResponse {
  ChangeSetName: string
  ChangeSetId: string
  StackId: string
  StackName: string
  Description?: string
  Parameters?: Array<{ ParameterKey: string; ParameterValue: string }>
  Capabilities?: string[]
  Tags?: Array<{ Key: string; Value: string }>
  Changes?: Array<{
    Type: string
    Hook?: {
      HookType: string
      HookFailureMode: string
    }
    ResourceChange: {
      Action: string
      LogicalResourceId: string
      PhysicalResourceId?: string
      ResourceType: string
      Scope?: string[]
      BeforeContext?: string
      AfterContext?: string
      ChangeSetId?: string
      Replacement?: string
      Details?: Array<{
        Target: {
          Attribute: string
          Name?: string
          RequiresRecreation?: string
        }
        Evaluation: string
        ChangeSource: string
        CausingEntity?: string
      }>
    }
  }>
  CreationTime: string
  ExecutionStatus: string
  Status: string
  StatusReason?: string
  NotificationARNs?: string[]
  ParentChangeSetId?: string
  RootChangeSetId?: string
}

interface CreateChangeSetResponse {
  Id: string
  Arn: string
}

interface ListChangeSetsResponse {
  Summaries: Array<{
    ChangeSetName: string
    ChangeSetId: string
    StackName: string
    StackId: string
    Description?: string
    CreationTime: string
    ExecutionStatus: string
    Status: string
    StatusReason?: string
  }>
}

/**
 * Create a CloudFormation stack
 */
export async function createStack(params: {
  StackName: string
  TemplateBody?: string
  TemplateURL?: string
  Parameters?: Array<{
    ParameterKey: string
    ParameterValue: string
    UsePreviousValue?: boolean
  }>
  DisableRollback?: boolean
  RollbackConfiguration?: {
    RollbackTriggers?: Array<{
      Arn: string
      Type: string
    }>
    MonitoringTimeInMinutes?: number
  }
  TimeoutInMinutes?: number
  Capabilities?: ('CAPABILITY_IAM' | 'CAPABILITY_NAMED_IAM' | 'CAPABILITY_AUTO_EXPAND')[]
  ResourceTypes?: string[]
  NotificationARNs?: string[]
  Tags?: Array<{ Key: string; Value: string }>
  OnFailure?: 'ROLLBACK' | 'DELETE' | 'DO_NOTHING'
  StackPolicyBody?: string
  StackPolicyURL?: string
  EnableTerminationProtection?: boolean
}): Promise<CreateStackResponse> {
  try {
    const response = await api.post<CreateStackResponse>('/cloudformation', new URLSearchParams({
      Action: 'CreateStack',
      StackName: params.StackName,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error creating stack:', error)
    throw error
  }
}

/**
 * Delete a CloudFormation stack
 */
export async function deleteStack(StackName: string, params?: {
  RetainResources?: string[]
  RoleARN?: string
}): Promise<void> {
  try {
    const body = new URLSearchParams({
      Action: 'DeleteStack',
      StackName,
    })
    if (params?.RoleARN) body.append('RoleARN', params.RoleARN)
    if (params?.RetainResources) {
      params.RetainResources.forEach((arn, index) => {
        body.append(`RetainResources.member.${index + 1}`, arn)
      })
    }

    await api.post('/cloudformation', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  } catch (error) {
    console.error('Error deleting stack:', error)
    throw error
  }
}

/**
 * List CloudFormation stacks
 */
export async function listStacks(params?: {
  NextToken?: string
  StackStatusFilter?: Array<
    'CREATE_IN_PROGRESS' | 'CREATE_FAILED' | 'CREATE_COMPLETE' | 'ROLLBACK_IN_PROGRESS' |
    'ROLLBACK_FAILED' | 'ROLLBACK_COMPLETE' | 'DELETE_IN_PROGRESS' | 'DELETE_FAILED' |
    'DELETE_COMPLETE' | 'UPDATE_IN_PROGRESS' | 'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS' |
    'UPDATE_COMPLETE' | 'UPDATE_FAILED' | 'UPDATE_ROLLBACK_IN_PROGRESS' |
    'UPDATE_ROLLBACK_FAILED' | 'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS' |
    'UPDATE_ROLLBACK_COMPLETE' | 'REVIEW_IN_PROGRESS'
  >
}): Promise<ListStacksResponse> {
  try {
    const body = new URLSearchParams({ Action: 'ListStacks' })
    if (params?.NextToken) body.append('NextToken', params.NextToken)
    if (params?.StackStatusFilter) {
      params.StackStatusFilter.forEach((status, index) => {
        body.append(`StackStatusFilter.member.${index + 1}`, status)
      })
    }

    const response = await api.post<ListStacksResponse>('/cloudformation', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error listing stacks:', error)
    throw error
  }
}

/**
 * Describe CloudFormation stacks
 */
export async function describeStacks(StackName?: string): Promise<DescribeStacksResponse> {
  try {
    const body = new URLSearchParams({ Action: 'DescribeStacks' })
    if (StackName) body.append('StackName', StackName)

    const response = await api.post<DescribeStacksResponse>('/cloudformation', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error describing stacks:', error)
    throw error
  }
}

/**
 * Describe stack resources
 */
export async function describeStackResources(StackName?: string, params?: {
  LogicalResourceId?: string
  PhysicalResourceId?: string
}): Promise<DescribeStackResourcesResponse> {
  try {
    const body = new URLSearchParams({ Action: 'DescribeStackResources' })
    if (StackName) body.append('StackName', StackName)
    if (params?.LogicalResourceId) body.append('LogicalResourceId', params.LogicalResourceId)
    if (params?.PhysicalResourceId) body.append('PhysicalResourceId', params.PhysicalResourceId)

    const response = await api.post<DescribeStackResourcesResponse>('/cloudformation', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error describing stack resources:', error)
    throw error
  }
}

/**
 * Update a CloudFormation stack
 */
export async function updateStack(params: {
  StackName: string
  TemplateBody?: string
  TemplateURL?: string
  UsePreviousTemplate?: boolean
  Parameters?: Array<{
    ParameterKey: string
    ParameterValue?: string
    UsePreviousValue?: boolean
  }>
  Capabilities?: ('CAPABILITY_IAM' | 'CAPABILITY_NAMED_IAM' | 'CAPABILITY_AUTO_EXPAND')[]
  ResourceTypes?: string[]
  RoleARN?: string
  RollbackConfiguration?: {
    RollbackTriggers?: Array<{ Arn: string; Type: string }>
    MonitoringTimeInMinutes?: number
  }
  StackPolicyBody?: string
  StackPolicyURL?: string
  NotificationARNs?: string[]
  Tags?: Array<{ Key: string; Value: string }>
}): Promise<UpdateStackResponse> {
  try {
    const body = new URLSearchParams({
      Action: 'UpdateStack',
      StackName: params.StackName,
    })
    if (params.RoleARN) body.append('RoleARN', params.RoleARN)
    if (params.Capabilities) {
      params.Capabilities.forEach((cap, index) => {
        body.append(`Capabilities.member.${index + 1}`, cap)
      })
    }

    const response = await api.post<UpdateStackResponse>('/cloudformation', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error updating stack:', error)
    throw error
  }
}

/**
 * Cancel update stack
 */
export async function cancelUpdateStack(StackName: string): Promise<void> {
  try {
    await api.post('/cloudformation', new URLSearchParams({
      Action: 'CancelUpdateStack',
      StackName,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  } catch (error) {
    console.error('Error canceling update stack:', error)
    throw error
  }
}

/**
 * Get stack events
 */
export async function describeStackEvents(StackName?: string, params?: {
  NextToken?: string
}): Promise<DescribeStackEventsResponse> {
  try {
    const body = new URLSearchParams({ Action: 'DescribeStackEvents' })
    if (StackName) body.append('StackName', StackName)
    if (params?.NextToken) body.append('NextToken', params.NextToken)

    const response = await api.post<DescribeStackEventsResponse>('/cloudformation', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error describing stack events:', error)
    throw error
  }
}

/**
 * Get stack resource
 */
export async function describeStackResource(StackName: string, LogicalResourceId: string): Promise<DescribeStackResourceResponse> {
  try {
    const response = await api.post<DescribeStackResourceResponse>('/cloudformation', new URLSearchParams({
      Action: 'DescribeStackResource',
      StackName,
      LogicalResourceId,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error describing stack resource:', error)
    throw error
  }
}

/**
 * Estimate template cost
 */
export async function estimateTemplateCost(params?: {
  TemplateBody?: string
  TemplateURL?: string
  Parameters?: Array<{ ParameterKey: string; ParameterValue: string }>
}): Promise<EstimateTemplateCostResponse> {
  try {
    const body = new URLSearchParams({ Action: 'EstimateTemplateCost' })
    if (params?.TemplateBody) body.append('TemplateBody', params.TemplateBody)
    if (params?.Parameters) {
      params.Parameters.forEach((param, index) => {
        body.append(`Parameters.member.${index + 1}.ParameterKey`, param.ParameterKey)
        body.append(`Parameters.member.${index + 1}.ParameterValue`, param.ParameterValue)
      })
    }

    const response = await api.post<EstimateTemplateCostResponse>('/cloudformation', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error estimating template cost:', error)
    throw error
  }
}

/**
 * Validate template
 */
export async function validateTemplate(params?: {
  TemplateBody?: string
  TemplateURL?: string
}): Promise<ValidateTemplateResponse> {
  try {
    const body = new URLSearchParams({ Action: 'ValidateTemplate' })
    if (params?.TemplateBody) body.append('TemplateBody', params.TemplateBody)
    if (params?.TemplateURL) body.append('TemplateURL', params.TemplateURL)

    const response = await api.post<ValidateTemplateResponse>('/cloudformation', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error validating template:', error)
    throw error
  }
}

/**
 * Get template
 */
export async function getTemplate(StackName: string, params?: {
  TemplateStage?: 'Original' | 'Processed'
  ChangeSetName?: string
}): Promise<GetTemplateResponse> {
  try {
    const body = new URLSearchParams({
      Action: 'GetTemplate',
      StackName,
    })
    if (params?.TemplateStage) body.append('TemplateStage', params.TemplateStage)
    if (params?.ChangeSetName) body.append('ChangeSetName', params.ChangeSetName)

    const response = await api.post<GetTemplateResponse>('/cloudformation', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error getting template:', error)
    throw error
  }
}

/**
 * Get template summary
 */
export async function getTemplateSummary(params?: {
  TemplateBody?: string
  TemplateURL?: string
  StackName?: string
}): Promise<GetTemplateSummaryResponse> {
  try {
    const body = new URLSearchParams({ Action: 'GetTemplateSummary' })
    if (params?.TemplateBody) body.append('TemplateBody', params.TemplateBody)
    if (params?.TemplateURL) body.append('TemplateURL', params.TemplateURL)
    if (params?.StackName) body.append('StackName', params.StackName)

    const response = await api.post<GetTemplateSummaryResponse>('/cloudformation', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error getting template summary:', error)
    throw error
  }
}

/**
 * Describe change set
 */
export async function describeChangeSet(ChangeSetName: string, params?: {
  StackName?: string
}): Promise<DescribeChangeSetResponse> {
  try {
    const body = new URLSearchParams({
      Action: 'DescribeChangeSet',
      ChangeSetName,
    })
    if (params?.StackName) body.append('StackName', params.StackName)

    const response = await api.post<DescribeChangeSetResponse>('/cloudformation', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error describing change set:', error)
    throw error
  }
}

/**
 * Create change set
 */
export async function createChangeSet(params: {
  StackName: string
  ChangeSetName: string
  TemplateBody?: string
  TemplateURL?: string
  UsePreviousTemplate?: boolean
  Parameters?: Array<{ ParameterKey: string; ParameterValue: string }>
  Capabilities?: ('CAPABILITY_IAM' | 'CAPABILITY_NAMED_IAM' | 'CAPABILITY_AUTO_EXPAND')[]
  ResourceTypes?: string[]
  RoleARN?: string
  RollbackConfiguration?: {
    RollbackTriggers?: Array<{ Arn: string; Type: string }>
    MonitoringTimeInMinutes?: number
  }
  NotificationARNs?: string[]
  Tags?: Array<{ Key: string; Value: string }>
  ExecuteChangeset?: boolean
}): Promise<CreateChangeSetResponse> {
  try {
    const body = new URLSearchParams({
      Action: 'CreateChangeSet',
      StackName: params.StackName,
      ChangeSetName: params.ChangeSetName,
    })
    if (params.RoleARN) body.append('RoleARN', params.RoleARN)

    const response = await api.post<CreateChangeSetResponse>('/cloudformation', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error creating change set:', error)
    throw error
  }
}

/**
 * List change sets
 */
export async function listChangeSets(StackName: string): Promise<ListChangeSetsResponse> {
  try {
    const response = await api.post<ListChangeSetsResponse>('/cloudformation', new URLSearchParams({
      Action: 'ListChangeSets',
      StackName,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error listing change sets:', error)
    throw error
  }
}

/**
 * Delete change set
 */
export async function deleteChangeSet(ChangeSetName: string, params?: { StackName?: string }): Promise<void> {
  try {
    const body = new URLSearchParams({
      Action: 'DeleteChangeSet',
      ChangeSetName,
    })
    if (params?.StackName) body.append('StackName', params.StackName)

    await api.post('/cloudformation', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  } catch (error) {
    console.error('Error deleting change set:', error)
    throw error
  }
}

/**
 * Execute change set
 */
export async function executeChangeSet(ChangeSetName: string, params?: { StackName?: string }): Promise<void> {
  try {
    const body = new URLSearchParams({
      Action: 'ExecuteChangeSet',
      ChangeSetName,
    })
    if (params?.StackName) body.append('StackName', params.StackName)

    await api.post('/cloudformation', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  } catch (error) {
    console.error('Error executing change set:', error)
    throw error
  }
}
