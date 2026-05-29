/**
 * IAM Service API
 * REST HTTP client for IAM via Go proxy
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

const api = PROXY_BACKEND.replace(/\/$/, '')

// Types (matching the existing type definitions)
export interface IAMUser {
  UserName: string
  UserId: string
  Arn: string
  CreateDate: string
  Path?: string
}

export interface IAMRole {
  RoleName: string
  RoleId: string
  Arn: string
  CreateDate: string
  Path?: string
}

export interface IAMPolicy {
  PolicyName: string
  PolicyId: string
  Arn: string
  Path: string
  DefaultVersionId?: string
  AttachmentCount?: number
  PermissionsBoundaryUsageCount?: number
  IsAttachable: boolean
  Description?: string
  CreateDate: string
  UpdateDate: string
}

export interface IAMGroup {
  GroupName: string
  GroupId: string
  Arn: string
  CreateDate: string
  Path?: string
}

// User operations
export async function createUser(params: {
  UserName: string
  Path?: string
  PermissionsBoundary?: string
  Tags?: Array<{ Key: string; Value: string }>
}): Promise<IAMUser> {
  const res = await fetch(`${api}/iam/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new APIError(`Create user failed`, res.status, 'iam')
  return res.json()
}

export async function getUser(UserName?: string): Promise<IAMUser> {
  if (!UserName) throw new APIError('UserName is required for getUser', 400, 'iam')
  const res = await fetch(`${api}/iam/users/${encodeURIComponent(UserName)}`)
  if (!res.ok) throw new APIError(`Get user failed`, res.status, 'iam')
  return res.json()
}

export async function listUsers(): Promise<{ Users: IAMUser[]; IsTruncated: boolean; Marker?: string }> {
  const res = await fetch(`${api}/iam/users`)
  if (!res.ok) throw new APIError(`List users failed`, res.status, 'iam')
  const data = await res.json()
  return {
    Users: data.Users || [],
    IsTruncated: data.IsTruncated || false,
    Marker: data.Marker,
  }
}

export async function deleteUser(UserName: string): Promise<void> {
  const res = await fetch(`${api}/iam/users/${encodeURIComponent(UserName)}`, { method: 'DELETE' })
  if (!res.ok) throw new APIError(`Delete user failed`, res.status, 'iam')
}

// Role operations
export async function createRole(params: {
  RoleName: string
  AssumeRolePolicyDocument: string
  Description?: string
  MaxSessionDuration?: number
  PermissionsBoundary?: string
  Tags?: Array<{ Key: string; Value: string }>
}): Promise<IAMRole> {
  const res = await fetch(`${api}/iam/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new APIError(`Create role failed`, res.status, 'iam')
  return res.json()
}

export async function getRole(RoleName: string): Promise<IAMRole> {
  const res = await fetch(`${api}/iam/roles/${encodeURIComponent(RoleName)}`)
  if (!res.ok) throw new APIError(`Get role failed`, res.status, 'iam')
  return res.json()
}

export async function listRoles(): Promise<{ Roles: IAMRole[]; IsTruncated: boolean; Marker?: string }> {
  const res = await fetch(`${api}/iam/roles`)
  if (!res.ok) throw new APIError(`List roles failed`, res.status, 'iam')
  const data = await res.json()
  return {
    Roles: data.Roles || [],
    IsTruncated: data.IsTruncated || false,
    Marker: data.Marker,
  }
}

export async function deleteRole(RoleName: string): Promise<void> {
  const res = await fetch(`${api}/iam/roles/${encodeURIComponent(RoleName)}`, { method: 'DELETE' })
  if (!res.ok) throw new APIError(`Delete role failed`, res.status, 'iam')
}

// Policy operations
export async function listPolicies(param1?: string | { Scope?: string; OnlyAttached?: boolean }, param2?: boolean): Promise<{
  Policies: IAMPolicy[]
  IsTruncated: boolean
  Marker?: string
}> {
  const params = new URLSearchParams()

  // Handle both calling conventions: listPolicies('All') or listPolicies({ Scope: 'All' })
  if (typeof param1 === 'string') {
    params.set('Scope', param1)
    if (param2 !== undefined) params.set('OnlyAttached', String(param2))
  } else if (param1 && typeof param1 === 'object') {
    if (param1.Scope) params.set('Scope', param1.Scope)
    if (param1.OnlyAttached !== undefined) params.set('OnlyAttached', String(param1.OnlyAttached))
  }

  const qs = params.toString()
  const url = qs ? `${api}/iam/policies?${qs}` : `${api}/iam/policies`
  const res = await fetch(url)
  if (!res.ok) throw new APIError(`List policies failed`, res.status, 'iam')

  const data = await res.json()
  const policies = (data.Policies || data.policies || []).map((p: any) => ({
    ...p,
    PolicyArn: p.Arn || p.PolicyArn,
  }))
  return {
    Policies: policies,
    IsTruncated: data.IsTruncated || data.isTruncated || false,
    Marker: data.Marker || data.marker,
  }
}

export async function getPolicy(PolicyArn: string): Promise<any> {
  const res = await fetch(`${api}/iam/policies/get`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ PolicyArn }),
  })
  if (!res.ok) throw new APIError(`Get policy failed`, res.status, 'iam')
  return res.json()
}

export async function createPolicy(input: CreatePolicyInput): Promise<any> {
  const res = await fetch(`${api}/iam/policies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new APIError(`Create policy failed`, res.status, 'iam')
  return res.json()
}

export async function deletePolicy(PolicyArn: string): Promise<void> {
  const res = await fetch(`${api}/iam/policies/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ PolicyArn }),
  })
  if (!res.ok) throw new APIError(`Delete policy failed`, res.status, 'iam')
}

// Access Key operations
export async function createAccessKey(UserName: string): Promise<any> {
  const res = await fetch(`${api}/iam/access-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ UserName }),
  })
  if (!res.ok) throw new APIError(`Create access key failed`, res.status, 'iam')
  return res.json()
}

export async function listAccessKeys(UserName?: string): Promise<any> {
  const url = UserName
    ? `${api}/iam/access-keys?UserName=${encodeURIComponent(UserName)}`
    : `${api}/iam/access-keys`
  const res = await fetch(url)
  if (!res.ok) throw new APIError(`List access keys failed`, res.status, 'iam')
  return res.json()
}

export async function deleteAccessKey(AccessKeyId: string, UserName?: string): Promise<void> {
  const res = await fetch(`${api}/iam/access-keys/${encodeURIComponent(AccessKeyId)}`, { method: 'DELETE' })
  if (!res.ok) throw new APIError(`Delete access key failed`, res.status, 'iam')
}

export async function updateAccessKeyStatus(AccessKeyId: string, Status: 'Active' | 'Inactive', UserName?: string): Promise<void> {
  const res = await fetch(`${api}/iam/access-keys/${encodeURIComponent(AccessKeyId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Status, UserName }),
  })
  if (!res.ok) throw new APIError(`Update access key status failed`, res.status, 'iam')
}

// Role policy operations
export async function attachRolePolicy(RoleName: string, PolicyArn: string): Promise<void> {
  const res = await fetch(`${api}/iam/roles/${encodeURIComponent(RoleName)}/policies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ PolicyArn }),
  })
  if (!res.ok) throw new APIError(`Attach role policy failed`, res.status, 'iam')
}

export async function detachRolePolicy(RoleName: string, PolicyArn: string): Promise<void> {
  const res = await fetch(`${api}/iam/roles/${encodeURIComponent(RoleName)}/detach-policy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ PolicyArn }),
  })
  if (!res.ok) throw new APIError(`Detach role policy failed`, res.status, 'iam')
}

export async function listAttachedRolePolicies(RoleName: string): Promise<any> {
  const res = await fetch(`${api}/iam/roles/${encodeURIComponent(RoleName)}/policies`)
  if (!res.ok) throw new APIError(`List attached role policies failed`, res.status, 'iam')
  return res.json()
}

// Group operations
export async function createGroup(GroupName: string, Path?: string): Promise<IAMGroup> {
  const res = await fetch(`${api}/iam/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ GroupName, Path }),
  })
  if (!res.ok) throw new APIError(`Create group failed`, res.status, 'iam')
  return res.json()
}

export async function getGroup(GroupName: string): Promise<{ Group: IAMGroup; Users?: IAMUser[]; IsTruncated: boolean }> {
  const res = await fetch(`${api}/iam/groups/${encodeURIComponent(GroupName)}`)
  if (!res.ok) throw new APIError(`Get group failed`, res.status, 'iam')
  return res.json()
}

export async function listGroups(): Promise<{ Groups: IAMGroup[]; IsTruncated: boolean }> {
  const res = await fetch(`${api}/iam/groups`)
  if (!res.ok) throw new APIError(`List groups failed`, res.status, 'iam')
  const data = await res.json()
  return {
    Groups: data.Groups || [],
    IsTruncated: data.IsTruncated || false,
  }
}

export async function deleteGroup(GroupName: string): Promise<void> {
  const res = await fetch(`${api}/iam/groups/${encodeURIComponent(GroupName)}`, { method: 'DELETE' })
  if (!res.ok) throw new APIError(`Delete group failed`, res.status, 'iam')
}

export async function addUserToGroup(GroupName: string, UserName: string): Promise<void> {
  const res = await fetch(`${api}/iam/groups/${encodeURIComponent(GroupName)}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ UserName }),
  })
  if (!res.ok) throw new APIError(`Add user to group failed`, res.status, 'iam')
}

export async function removeUserFromGroup(GroupName: string, UserName: string): Promise<void> {
  const res = await fetch(`${api}/iam/groups/${encodeURIComponent(GroupName)}/users/${encodeURIComponent(UserName)}`, { method: 'DELETE' })
  if (!res.ok) throw new APIError(`Remove user from group failed`, res.status, 'iam')
}

export async function listGroupsForUser(UserName: string): Promise<{ Groups: IAMGroup[]; IsTruncated: boolean }> {
  const res = await fetch(`${api}/iam/users/${encodeURIComponent(UserName)}/groups`)
  if (!res.ok) throw new APIError(`List groups for user failed`, res.status, 'iam')
  const data = await res.json()
  return {
    Groups: data.Groups || [],
    IsTruncated: data.IsTruncated || false,
  }
}

export async function listUsersForGroup(GroupName: string): Promise<{ Users: any[]; IsTruncated: boolean }> {
  const res = await fetch(`${api}/iam/groups/${encodeURIComponent(GroupName)}/users`)
  if (!res.ok) throw new APIError(`List users for group failed`, res.status, 'iam')
  const data = await res.json()
  return {
    Users: data.Users || [],
    IsTruncated: data.IsTruncated || false,
  }
}

// Inline policy operations
export async function listUserPolicies(UserName: string): Promise<any> {
  const res = await fetch(`${api}/iam/users/${encodeURIComponent(UserName)}/policies`)
  if (!res.ok) throw new APIError(`List user policies failed`, res.status, 'iam')
  return res.json()
}

export async function listRolePolicies(RoleName: string): Promise<any> {
  const res = await fetch(`${api}/iam/roles/${encodeURIComponent(RoleName)}/inline-policies`)
  if (!res.ok) throw new APIError(`List role policies failed`, res.status, 'iam')
  return res.json()
}

export async function getRolePolicy(RoleName: string, PolicyName: string): Promise<any> {
  const res = await fetch(`${api}/iam/roles/${encodeURIComponent(RoleName)}/policies/${encodeURIComponent(PolicyName)}`)
  if (!res.ok) throw new APIError(`Get role policy failed`, res.status, 'iam')
  return res.json()
}

export interface CreatePolicyInput {
  PolicyName: string
  PolicyDocument: string
  Description?: string
}
