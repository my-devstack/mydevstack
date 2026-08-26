/**
 * ECS Service API
 * REST HTTP client for ECS via Go proxy
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

const api = PROXY_BACKEND.replace(/\/$/, '')

// Types (matching the OpenAPI spec in pkg/proxy/api/services/ecs.yaml)
export interface ECSCluster {
  ClusterArn?: string
  ClusterName?: string
  Status?: string
  RegisteredContainerInstancesCount?: number
  RunningTasksCount?: number
  PendingTasksCount?: number
  ActiveServicesCount?: number
  CreatedAt?: string
  Tags?: Array<{ key: string; value: string }>
}

export interface ECSTaskDefinition {
  TaskDefinitionArn?: string
  Family?: string
  Revision?: number
  Status?: string
  ContainerDefinitions?: Array<{
    Name?: string
    Image?: string
    Cpu?: number
    Memory?: number
    Essential?: boolean
  }>
  RequiresCompatibilities?: string[]
  Cpu?: string
  Memory?: string
  RegisteredAt?: string
}

export interface ECSTask {
  TaskArn?: string
  ClusterArn?: string
  TaskDefinitionArn?: string
  LastStatus?: string
  DesiredStatus?: string
  StartedBy?: string
  Group?: string
  LaunchType?: string
  CreatedAt?: string
  StartedAt?: string
  StoppedAt?: string
  StoppedReason?: string
  Containers?: Array<{
    Name?: string
    Image?: string
    LastStatus?: string
    RuntimeId?: string
  }>
}

export interface ECSService {
  ServiceArn?: string
  ServiceName?: string
  ClusterArn?: string
  Status?: string
  DesiredCount?: number
  RunningCount?: number
  PendingCount?: number
  LaunchType?: string
  TaskDefinition?: string
  CreatedAt?: string
  SchedulingStrategy?: string
}

// Clusters
export async function listClusters(params?: {
  NextToken?: string
  MaxResults?: number
}): Promise<{ ClusterArns: string[]; NextToken?: string }> {
  const query = new URLSearchParams()
  if (params?.NextToken) query.set('NextToken', params.NextToken)
  if (params?.MaxResults !== undefined) query.set('MaxResults', String(params.MaxResults))
  const qs = query.toString()
  const res = await fetch(`${api}/ecs/clusters${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new APIError(`List clusters failed`, res.status, 'ecs')
  const data = await res.json()
  return {
    ClusterArns: data.ClusterArns || [],
    NextToken: data.NextToken,
  }
}

export async function createCluster(params: { ClusterName: string }): Promise<{ Cluster: ECSCluster }> {
  const res = await fetch(`${api}/ecs/clusters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new APIError(`Create cluster failed`, res.status, 'ecs')
  return res.json()
}

export async function describeClusters(clusterName: string): Promise<{ Clusters: ECSCluster[]; Failures?: unknown[] }> {
  const res = await fetch(`${api}/ecs/clusters/${encodeURIComponent(clusterName)}`)
  if (!res.ok) throw new APIError(`Describe cluster failed`, res.status, 'ecs')
  return res.json()
}

export async function deleteCluster(clusterName: string): Promise<{ Cluster: ECSCluster }> {
  const res = await fetch(`${api}/ecs/clusters/${encodeURIComponent(clusterName)}`, { method: 'DELETE' })
  if (!res.ok) throw new APIError(`Delete cluster failed`, res.status, 'ecs')
  return res.json()
}

// Task definitions
export async function listTaskDefinitions(params?: {
  FamilyPrefix?: string
  Status?: string
  Sort?: string
  NextToken?: string
  MaxResults?: number
}): Promise<{ TaskDefinitionArns: string[]; NextToken?: string }> {
  const query = new URLSearchParams()
  if (params?.FamilyPrefix) query.set('FamilyPrefix', params.FamilyPrefix)
  if (params?.Status) query.set('Status', params.Status)
  if (params?.Sort) query.set('Sort', params.Sort)
  if (params?.NextToken) query.set('NextToken', params.NextToken)
  if (params?.MaxResults !== undefined) query.set('MaxResults', String(params.MaxResults))
  const qs = query.toString()
  const res = await fetch(`${api}/ecs/task-definitions${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new APIError(`List task definitions failed`, res.status, 'ecs')
  const data = await res.json()
  return {
    TaskDefinitionArns: data.TaskDefinitionArns || [],
    NextToken: data.NextToken,
  }
}

export async function registerTaskDefinition(params: {
  Family: string
  ContainerDefinitions: Array<{
    Name: string
    Image: string
    Cpu?: number
    Memory?: number
    Essential?: boolean
  }>
  RequiresCompatibilities?: string[]
  Cpu?: string
  Memory?: string
}): Promise<{ TaskDefinition: ECSTaskDefinition }> {
  const res = await fetch(`${api}/ecs/task-definitions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new APIError(`Register task definition failed`, res.status, 'ecs')
  return res.json()
}

export async function describeTaskDefinition(taskDefinitionArn: string): Promise<{ TaskDefinition: ECSTaskDefinition }> {
  const res = await fetch(`${api}/ecs/task-definitions/${encodeURIComponent(taskDefinitionArn)}`)
  if (!res.ok) throw new APIError(`Describe task definition failed`, res.status, 'ecs')
  return res.json()
}

export async function deregisterTaskDefinition(taskDefinitionArn: string): Promise<{ TaskDefinition: ECSTaskDefinition }> {
  const res = await fetch(`${api}/ecs/task-definitions/${encodeURIComponent(taskDefinitionArn)}`, { method: 'DELETE' })
  if (!res.ok) throw new APIError(`Deregister task definition failed`, res.status, 'ecs')
  return res.json()
}

export async function listTaskDefinitionFamilies(params?: {
  FamilyPrefix?: string
  Status?: string
  NextToken?: string
  MaxResults?: number
}): Promise<{ Families: string[]; NextToken?: string }> {
  const query = new URLSearchParams()
  if (params?.FamilyPrefix) query.set('FamilyPrefix', params.FamilyPrefix)
  if (params?.Status) query.set('Status', params.Status)
  if (params?.NextToken) query.set('NextToken', params.NextToken)
  if (params?.MaxResults !== undefined) query.set('MaxResults', String(params.MaxResults))
  const qs = query.toString()
  const res = await fetch(`${api}/ecs/task-definition-families${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new APIError(`List task definition families failed`, res.status, 'ecs')
  const data = await res.json()
  return {
    Families: data.Families || [],
    NextToken: data.NextToken,
  }
}

// Tasks
export async function runTask(params: {
  Cluster?: string
  TaskDefinition: string
  Count?: number
  LaunchType?: string
  StartedBy?: string
  Group?: string
}): Promise<{ Tasks: ECSTask[]; Failures?: unknown[] }> {
  const res = await fetch(`${api}/ecs/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new APIError(`Run task failed`, res.status, 'ecs')
  return res.json()
}

export async function listTasks(params?: {
  Cluster?: string
  Family?: string
  ServiceName?: string
  Status?: string
  NextToken?: string
  MaxResults?: number
}): Promise<{ TaskArns: string[]; NextToken?: string }> {
  const query = new URLSearchParams()
  if (params?.Cluster) query.set('Cluster', params.Cluster)
  if (params?.Family) query.set('Family', params.Family)
  if (params?.ServiceName) query.set('ServiceName', params.ServiceName)
  if (params?.Status) query.set('Status', params.Status)
  if (params?.NextToken) query.set('NextToken', params.NextToken)
  if (params?.MaxResults !== undefined) query.set('MaxResults', String(params.MaxResults))
  const qs = query.toString()
  const res = await fetch(`${api}/ecs/tasks${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new APIError(`List tasks failed`, res.status, 'ecs')
  const data = await res.json()
  return {
    TaskArns: data.TaskArns || [],
    NextToken: data.NextToken,
  }
}

export async function describeTasks(taskArn: string, cluster?: string): Promise<{ Tasks: ECSTask[]; Failures?: unknown[] }> {
  const query = cluster ? `?Cluster=${encodeURIComponent(cluster)}` : ''
  const res = await fetch(`${api}/ecs/tasks/${encodeURIComponent(taskArn)}${query}`)
  if (!res.ok) throw new APIError(`Describe task failed`, res.status, 'ecs')
  return res.json()
}

export async function stopTask(taskArn: string, cluster?: string, reason?: string): Promise<{ Task: ECSTask }> {
  const body: Record<string, string> = { Task: taskArn }
  if (cluster) body.Cluster = cluster
  if (reason) body.Reason = reason
  const res = await fetch(`${api}/ecs/tasks/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new APIError(`Stop task failed`, res.status, 'ecs')
  return res.json()
}

// Services
export async function listServices(params?: {
  Cluster?: string
  NextToken?: string
  MaxResults?: number
}): Promise<{ ServiceArns: string[]; NextToken?: string }> {
  const query = new URLSearchParams()
  if (params?.Cluster) query.set('Cluster', params.Cluster)
  if (params?.NextToken) query.set('NextToken', params.NextToken)
  if (params?.MaxResults !== undefined) query.set('MaxResults', String(params.MaxResults))
  const qs = query.toString()
  const res = await fetch(`${api}/ecs/services${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new APIError(`List services failed`, res.status, 'ecs')
  const data = await res.json()
  return {
    ServiceArns: data.ServiceArns || [],
    NextToken: data.NextToken,
  }
}

export async function createService(params: {
  Cluster?: string
  ServiceName: string
  TaskDefinition: string
  DesiredCount?: number
  LaunchType?: string
  SchedulingStrategy?: string
}): Promise<{ Service: ECSService }> {
  const res = await fetch(`${api}/ecs/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new APIError(`Create service failed`, res.status, 'ecs')
  return res.json()
}

export async function describeServices(serviceName: string, cluster?: string): Promise<{ Services: ECSService[]; Failures?: unknown[] }> {
  const query = cluster ? `?Cluster=${encodeURIComponent(cluster)}` : ''
  const res = await fetch(`${api}/ecs/services/${encodeURIComponent(serviceName)}${query}`)
  if (!res.ok) throw new APIError(`Describe service failed`, res.status, 'ecs')
  return res.json()
}

export async function deleteService(serviceName: string, cluster?: string, force?: boolean): Promise<{ Service: ECSService }> {
  const res = await fetch(`${api}/ecs/services/${encodeURIComponent(serviceName)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Cluster: cluster, Force: force }),
  })
  if (!res.ok) throw new APIError(`Delete service failed`, res.status, 'ecs')
  return res.json()
}

export const ecs = {
  listClusters,
  createCluster,
  describeClusters,
  deleteCluster,
  listTaskDefinitions,
  registerTaskDefinition,
  describeTaskDefinition,
  deregisterTaskDefinition,
  listTaskDefinitionFamilies,
  runTask,
  listTasks,
  describeTasks,
  stopTask,
  listServices,
  createService,
  describeServices,
  deleteService,
}

export default ecs