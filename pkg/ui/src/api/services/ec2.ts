/**
 * EC2 Service API Client
 * REST client for EC2 via Go proxy
 * EC2 uses AWS JSON protocol — proxy returns raw AWS SDK JSON responses
 * @module api/services/ec2
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'
import type { EC2Instance, EC2KeyPair, EC2SecurityGroup } from '@/api/types/aws'

const BASE_URL = `${PROXY_BACKEND.replace(/\/$/, '')}/ec2`

async function request<T>(method: string, path: string, body?: object): Promise<T> {
  const url = `${BASE_URL}${path}`
  const fetchOptions: RequestInit = { method }

  if (body !== undefined) {
    fetchOptions.headers = { 'Content-Type': 'application/json' }
    fetchOptions.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, fetchOptions)
    const responseText = await response.text()

    if (!response.ok) {
      throw new APIError(`EC2 request failed: ${responseText}`, response.status, 'ec2')
    }

    if (!responseText) {
      return {} as T
    }

    return JSON.parse(responseText) as T
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error('EC2 request error:', error)
    throw new APIError(`Failed to ${method} ${path}`, 500, 'ec2')
  }
}

// Instances

export interface DescribeInstancesResponse {
  Reservations?: Array<{
    Groups?: Array<{ GroupId: string; GroupName: string }>
    Instances?: EC2Instance[]
    OwnerId?: string
    RequesterId?: string
    ReservationId?: string
  }>
  NextToken?: string
}

export async function describeInstances(params?: {
  InstanceIds?: string[]
  MaxResults?: number
  NextToken?: string
}): Promise<DescribeInstancesResponse> {
  const queryParts: string[] = []
  if (params?.InstanceIds?.length) {
    params.InstanceIds.forEach((id) => queryParts.push(`InstanceId=${encodeURIComponent(id)}`))
  }
  if (params?.MaxResults) queryParts.push(`MaxResults=${params.MaxResults}`)
  if (params?.NextToken) queryParts.push(`NextToken=${encodeURIComponent(params.NextToken)}`)
  const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
  return request<DescribeInstancesResponse>('GET', `/instances${qs}`)
}

export async function runInstances(params: {
  ImageId: string
  InstanceType: string
  KeyName?: string
  SecurityGroupIds?: string[]
  SubnetId?: string
  MinCount?: number
  MaxCount?: number
}): Promise<{ Instances: EC2Instance[] }> {
  return request<{ Instances: EC2Instance[] }>('POST', '/instances', params)
}

export async function terminateInstance(instanceId: string): Promise<{ Instances: EC2Instance[] }> {
  return request<{ Instances: EC2Instance[] }>('DELETE', `/instances/${encodeURIComponent(instanceId)}`)
}

export async function startInstance(instanceId: string): Promise<{ Instances: EC2Instance[] }> {
  return request<{ Instances: EC2Instance[] }>('POST', `/instances/${encodeURIComponent(instanceId)}/start`)
}

export async function stopInstance(instanceId: string): Promise<{ Instances: EC2Instance[] }> {
  return request<{ Instances: EC2Instance[] }>('POST', `/instances/${encodeURIComponent(instanceId)}/stop`)
}

// Key Pairs

export interface DescribeKeyPairsResponse {
  KeyPairs: EC2KeyPair[]
}

export async function describeKeyPairs(): Promise<DescribeKeyPairsResponse> {
  return request<DescribeKeyPairsResponse>('GET', '/key-pairs')
}

export async function createKeyPair(keyName: string): Promise<EC2KeyPair & { KeyMaterial?: string }> {
  return request<EC2KeyPair & { KeyMaterial?: string }>('POST', '/key-pairs', { KeyName: keyName })
}

export async function importKeyPair(keyName: string, publicKeyMaterial: string): Promise<EC2KeyPair> {
  return request<EC2KeyPair>('POST', '/key-pairs/import', { KeyName: keyName, PublicKeyMaterial: publicKeyMaterial })
}

export async function deleteKeyPair(keyName: string): Promise<void> {
  await request<Record<string, never>>('DELETE', `/key-pairs/${encodeURIComponent(keyName)}`)
}

// Security Groups

export interface DescribeSecurityGroupsResponse {
  SecurityGroups: EC2SecurityGroup[]
}

export async function describeSecurityGroups(): Promise<DescribeSecurityGroupsResponse> {
  return request<DescribeSecurityGroupsResponse>('GET', '/security-groups')
}

export async function createSecurityGroup(params: {
  GroupName: string
  Description: string
  VpcId?: string
}): Promise<{ GroupId: string }> {
  return request<{ GroupId: string }>('POST', '/security-groups', params)
}

export async function deleteSecurityGroup(groupId: string): Promise<void> {
  await request<Record<string, never>>('DELETE', `/security-groups/${encodeURIComponent(groupId)}`)
}

export async function authorizeSecurityGroupIngress(
  groupId: string,
  params: {
    IpProtocol: string
    FromPort?: number
    ToPort?: number
    CidrIp?: string
  },
): Promise<void> {
  await request<Record<string, never>>('POST', `/security-groups/${encodeURIComponent(groupId)}/ingress`, params)
}

export default {
  describeInstances,
  runInstances,
  terminateInstance,
  startInstance,
  stopInstance,
  describeKeyPairs,
  createKeyPair,
  importKeyPair,
  deleteKeyPair,
  describeSecurityGroups,
  createSecurityGroup,
  deleteSecurityGroup,
  authorizeSecurityGroupIngress,
}
