/**
 * IAM Service API
 * Simple HTTP client for IAM via Go proxy
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

async function iamRequest(action: string, body: object = {}): Promise<any> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')

  const url = `${endpoint}/iam/`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': `iam.${action}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`IAM ${action} failed: ${errorText}`, response.status, 'iam')
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error(`IAM ${action} error:`, error)
    throw new APIError(`Failed to ${action}`, 500, 'iam')
  }
}

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
  return iamRequest('CreateUser', params)
}

export async function getUser(UserName?: string): Promise<IAMUser> {
  return iamRequest('GetUser', { UserName })
}

export async function listUsers(): Promise<{ Users: IAMUser[]; IsTruncated: boolean; Marker?: string }> {
  const response = await iamRequest('ListUsers', {})
  return {
    Users: response.Users || [],
    IsTruncated: response.IsTruncated || false,
    Marker: response.Marker,
  }
}

export async function deleteUser(UserName: string): Promise<void> {
  return iamRequest('DeleteUser', { UserName })
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
  return iamRequest('CreateRole', params)
}

export async function getRole(RoleName: string): Promise<IAMRole> {
  return iamRequest('GetRole', { RoleName })
}

export async function listRoles(): Promise<{ Roles: IAMRole[]; IsTruncated: boolean; Marker?: string }> {
  const response = await iamRequest('ListRoles', {})
  return {
    Roles: response.Roles || [],
    IsTruncated: response.IsTruncated || false,
    Marker: response.Marker,
  }
}

export async function deleteRole(RoleName: string): Promise<void> {
  return iamRequest('DeleteRole', { RoleName })
}

// Policy operations
export async function listPolicies(param1?: string | { Scope?: string; OnlyAttached?: boolean }, param2?: boolean): Promise<{
  Policies: IAMPolicy[]
  IsTruncated: boolean
  Marker?: string
}> {
  const body: any = {}
  
  // Handle both calling conventions: listPolicies('All') or listPolicies({ Scope: 'All' })
  if (typeof param1 === 'string') {
    body.Scope = param1
    if (param2 !== undefined) body.OnlyAttached = param2
  } else if (param1 && typeof param1 === 'object') {
    if (param1.Scope) body.Scope = param1.Scope
    if (param1.OnlyAttached !== undefined) body.OnlyAttached = param1.OnlyAttached
  }
  
  const response = await iamRequest('ListPolicies', body)
  return {
    Policies: response.Policies || [],
    IsTruncated: response.IsTruncated || false,
    Marker: response.Marker,
  }
}

export async function getPolicy(PolicyArn: string): Promise<any> {
  return iamRequest('GetPolicy', { PolicyArn })
}

// Access Key operations
export async function createAccessKey(UserName: string): Promise<any> {
  return iamRequest('CreateAccessKey', { UserName })
}

export async function listAccessKeys(UserName?: string): Promise<any> {
  return iamRequest('ListAccessKeys', { UserName })
}

export async function deleteAccessKey(AccessKeyId: string, UserName?: string): Promise<void> {
  return iamRequest('DeleteAccessKey', { AccessKeyId, UserName })
}

export async function updateAccessKeyStatus(AccessKeyId: string, Status: 'Active' | 'Inactive', UserName?: string): Promise<void> {
  return iamRequest('UpdateAccessKeyStatus', { AccessKeyId, Status, UserName })
}

// Role policy operations
export async function attachRolePolicy(RoleName: string, PolicyArn: string): Promise<void> {
  return iamRequest('AttachRolePolicy', { RoleName, PolicyArn })
}

export async function detachRolePolicy(RoleName: string, PolicyArn: string): Promise<void> {
  return iamRequest('DetachRolePolicy', { RoleName, PolicyArn })
}

export async function listAttachedRolePolicies(RoleName: string): Promise<any> {
  return iamRequest('ListAttachedRolePolicies', { RoleName })
}

// Group operations
export async function createGroup(GroupName: string, Path?: string): Promise<IAMGroup> {
  return iamRequest('CreateGroup', { GroupName, Path })
}

export async function getGroup(GroupName: string): Promise<{ Group: IAMGroup; Users?: IAMUser[]; IsTruncated: boolean }> {
  return iamRequest('GetGroup', { GroupName })
}

export async function listGroups(): Promise<{ Groups: IAMGroup[]; IsTruncated: boolean }> {
  const response = await iamRequest('ListGroups', {})
  return {
    Groups: response.Groups || [],
    IsTruncated: response.IsTruncated || false,
  }
}

export async function deleteGroup(GroupName: string): Promise<void> {
  return iamRequest('DeleteGroup', { GroupName })
}

export async function addUserToGroup(GroupName: string, UserName: string): Promise<void> {
  return iamRequest('AddUserToGroup', { GroupName, UserName })
}

export async function removeUserFromGroup(GroupName: string, UserName: string): Promise<void> {
  return iamRequest('RemoveUserFromGroup', { GroupName, UserName })
}

export async function listGroupsForUser(UserName: string): Promise<{ Groups: IAMGroup[]; IsTruncated: boolean }> {
  const response = await iamRequest('ListGroupsForUser', { UserName })
  return {
    Groups: response.Groups || [],
    IsTruncated: response.IsTruncated || false,
  }
}

export async function listUsersForGroup(GroupName: string): Promise<{ Users: any[]; IsTruncated: boolean }> {
  const result = await iamRequest('GetGroup', { GroupName })
  return {
    Users: result.Users || [],
    IsTruncated: result.IsTruncated || false,
  }
}

// Inline policy operations
export async function listUserPolicies(UserName: string): Promise<any> {
  return iamRequest('ListUserPolicies', { UserName })
}

export async function listRolePolicies(RoleName: string): Promise<any> {
  return iamRequest('ListRolePolicies', { RoleName })
}

export async function getRolePolicy(RoleName: string, PolicyName: string): Promise<any> {
  return iamRequest('GetRolePolicy', { RoleName, PolicyName })
}

export async function deletePolicy(PolicyArn: string): Promise<void> {
  return iamRequest('DeletePolicy', { PolicyArn })
}

export interface CreatePolicyInput {
  PolicyName: string
  PolicyDocument: string
  Description?: string
}

export async function createPolicy(input: CreatePolicyInput): Promise<any> {
  return iamRequest('CreatePolicy', input)
}