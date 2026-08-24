/**
 * Cognito Service API
 * REST HTTP client for Cognito via Go proxy
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

const api = PROXY_BACKEND.replace(/\/$/, '')

// Types (matching the OpenAPI spec in pkg/proxy/api/services/cognito.yaml)
export interface CognitoUserPool {
  Id: string
  Name: string
  Arn?: string
  Status?: 'Enabled' | 'Disabled'
  LastModifiedDate?: string
  CreationDate?: string
}

export interface CognitoUser {
  Username: string
  UserAttributes?: Array<{ Name: string; Value: string }>
  UserStatus?: string
  UserCreateDate?: string
  UserLastModifiedDate?: string
  Enabled?: boolean
}

export interface CognitoGroup {
  GroupName: string
  UserPoolId?: string
  Description?: string
  RoleArn?: string
  Precedence?: number
  LastModifiedDate?: string
  CreationDate?: string
}

export interface CognitoUserPoolClient {
  ClientId: string
  ClientName: string
  UserPoolId?: string
  ClientSecret?: string
  RefreshTokenValidity?: number
  AccessTokenValidity?: number
  IdTokenValidity?: number
  LastModifiedDate?: string
  CreationDate?: string
}

export interface CognitoResourceServer {
  Identifier: string
  Name: string
  UserPoolId?: string
  Scopes?: Array<{ ScopeName: string; ScopeDescription?: string }>
  LastModifiedDate?: string
}

export interface CognitoTag {
  Key: string
  Value: string
}

export interface CognitoAttribute {
  Name: string
  Value: string
}

// User pool operations
export async function listUserPools(): Promise<{ UserPools: CognitoUserPool[]; NextToken?: string }> {
  const res = await fetch(`${api}/cognito/user-pools`)
  if (!res.ok) throw new APIError(`List user pools failed`, res.status, 'cognito')
  const data = await res.json()
  return {
    UserPools: data.UserPools || [],
    NextToken: data.NextToken,
  }
}

export async function createUserPool(params: { PoolName: string }): Promise<{ UserPool: CognitoUserPool }> {
  const res = await fetch(`${api}/cognito/user-pools`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new APIError(`Create user pool failed`, res.status, 'cognito')
  return res.json()
}

export async function deleteUserPool(userPoolId: string): Promise<void> {
  const res = await fetch(`${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}`, { method: 'DELETE' })
  if (!res.ok) throw new APIError(`Delete user pool failed`, res.status, 'cognito')
}

export async function updateUserPool(
  userPoolId: string,
  params: { PoolName?: string; MfaConfiguration?: string; DeletionProtection?: string }
): Promise<void> {
  const res = await fetch(`${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new APIError(`Update user pool failed`, res.status, 'cognito')
}

// User operations
export async function listUsers(userPoolId: string): Promise<{ Users: CognitoUser[]; PaginationToken?: string }> {
  const res = await fetch(`${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/users`)
  if (!res.ok) throw new APIError(`List users failed`, res.status, 'cognito')
  const data = await res.json()
  return {
    Users: data.Users || [],
    PaginationToken: data.PaginationToken,
  }
}

export async function createUser(
  userPoolId: string,
  params: {
    Username: string
    TemporaryPassword?: string
    UserAttributes?: CognitoAttribute[]
  }
): Promise<{ User: CognitoUser }> {
  const res = await fetch(`${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new APIError(`Create user failed`, res.status, 'cognito')
  return res.json()
}

export async function deleteUser(userPoolId: string, username: string): Promise<void> {
  const res = await fetch(
    `${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/users/${encodeURIComponent(username)}`,
    { method: 'DELETE' }
  )
  if (!res.ok) throw new APIError(`Delete user failed`, res.status, 'cognito')
}

export async function updateUser(
  userPoolId: string,
  username: string,
  params: { UserAttributes: CognitoAttribute[] }
): Promise<void> {
  const res = await fetch(
    `${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/users/${encodeURIComponent(username)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }
  )
  if (!res.ok) throw new APIError(`Update user failed`, res.status, 'cognito')
}

// Group operations
export async function listGroups(userPoolId: string): Promise<{ Groups: CognitoGroup[]; NextToken?: string }> {
  const res = await fetch(`${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/groups`)
  if (!res.ok) throw new APIError(`List groups failed`, res.status, 'cognito')
  const data = await res.json()
  return {
    Groups: data.Groups || [],
    NextToken: data.NextToken,
  }
}

export async function createGroup(
  userPoolId: string,
  params: { GroupName: string; Description?: string }
): Promise<{ Group: CognitoGroup }> {
  const res = await fetch(`${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new APIError(`Create group failed`, res.status, 'cognito')
  return res.json()
}

export async function deleteGroup(userPoolId: string, groupName: string): Promise<void> {
  const res = await fetch(
    `${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/groups/${encodeURIComponent(groupName)}`,
    { method: 'DELETE' }
  )
  if (!res.ok) throw new APIError(`Delete group failed`, res.status, 'cognito')
}

export async function updateGroup(
  userPoolId: string,
  groupName: string,
  params: { Description?: string; RoleArn?: string; Precedence?: number }
): Promise<void> {
  const res = await fetch(
    `${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/groups/${encodeURIComponent(groupName)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }
  )
  if (!res.ok) throw new APIError(`Update group failed`, res.status, 'cognito')
}

// User pool client operations
export async function listUserPoolClients(
  userPoolId: string
): Promise<{ UserPoolClients: CognitoUserPoolClient[]; NextToken?: string }> {
  const res = await fetch(`${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/clients`)
  if (!res.ok) throw new APIError(`List user pool clients failed`, res.status, 'cognito')
  const data = await res.json()
  return {
    UserPoolClients: data.UserPoolClients || [],
    NextToken: data.NextToken,
  }
}

export async function createUserPoolClient(
  userPoolId: string,
  params: { ClientName: string; GenerateSecret?: boolean }
): Promise<{ UserPoolClient: CognitoUserPoolClient }> {
  const res = await fetch(`${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new APIError(`Create user pool client failed`, res.status, 'cognito')
  return res.json()
}

export async function deleteUserPoolClient(userPoolId: string, clientId: string): Promise<void> {
  const res = await fetch(
    `${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/clients/${encodeURIComponent(clientId)}`,
    { method: 'DELETE' }
  )
  if (!res.ok) throw new APIError(`Delete user pool client failed`, res.status, 'cognito')
}

export async function updateUserPoolClient(
  userPoolId: string,
  clientId: string,
  params: { ClientName?: string; RefreshTokenValidity?: number; AccessTokenValidity?: number; IdTokenValidity?: number }
): Promise<void> {
  const res = await fetch(
    `${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/clients/${encodeURIComponent(clientId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }
  )
  if (!res.ok) throw new APIError(`Update user pool client failed`, res.status, 'cognito')
}

// Group membership operations
export async function addUserToGroup(userPoolId: string, username: string, groupName: string): Promise<void> {
  const res = await fetch(
    `${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/users/${encodeURIComponent(username)}/groups`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ GroupName: groupName }),
    }
  )
  if (!res.ok) throw new APIError(`Add user to group failed`, res.status, 'cognito')
}

export async function removeUserFromGroup(userPoolId: string, username: string, groupName: string): Promise<void> {
  const res = await fetch(
    `${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/users/${encodeURIComponent(username)}/groups/${encodeURIComponent(groupName)}`,
    { method: 'DELETE' }
  )
  if (!res.ok) throw new APIError(`Remove user from group failed`, res.status, 'cognito')
}

export async function listGroupsForUser(
  userPoolId: string,
  username: string
): Promise<{ Groups: CognitoGroup[] }> {
  const res = await fetch(
    `${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/users/${encodeURIComponent(username)}/groups`
  )
  if (!res.ok) throw new APIError(`List groups for user failed`, res.status, 'cognito')
  const data = await res.json()
  return {
    Groups: data.Groups || [],
  }
}

export async function listUsersInGroup(
  userPoolId: string,
  groupName: string
): Promise<{ Users: CognitoUser[] }> {
  const res = await fetch(
    `${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/groups/${encodeURIComponent(groupName)}/users`
  )
  if (!res.ok) throw new APIError(`List users in group failed`, res.status, 'cognito')
  const data = await res.json()
  return {
    Users: data.Users || [],
  }
}

// Reset password
export async function adminSetUserPassword(
  userPoolId: string,
  username: string,
  password: string,
  permanent: boolean
): Promise<void> {
  const res = await fetch(
    `${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/users/${encodeURIComponent(username)}/password`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Password: password, Permanent: permanent }),
    }
  )
  if (!res.ok) throw new APIError(`Set user password failed`, res.status, 'cognito')
}

// Resource server operations
export async function listResourceServers(
  userPoolId: string
): Promise<{ ResourceServers: CognitoResourceServer[] }> {
  const res = await fetch(`${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/resource-servers`)
  if (!res.ok) throw new APIError(`List resource servers failed`, res.status, 'cognito')
  const data = await res.json()
  return {
    ResourceServers: data.ResourceServers || [],
  }
}

export async function createResourceServer(
  userPoolId: string,
  params: { Identifier: string; Name: string }
): Promise<{ ResourceServer: CognitoResourceServer }> {
  const res = await fetch(`${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/resource-servers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new APIError(`Create resource server failed`, res.status, 'cognito')
  return res.json()
}

export async function deleteResourceServer(userPoolId: string, identifier: string): Promise<void> {
  const res = await fetch(
    `${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/resource-servers/${encodeURIComponent(identifier)}`,
    { method: 'DELETE' }
  )
  if (!res.ok) throw new APIError(`Delete resource server failed`, res.status, 'cognito')
}

// Tags
export async function listTagsForResource(userPoolId: string): Promise<{ Tags: Record<string, string> }> {
  const res = await fetch(`${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/tags`)
  if (!res.ok) throw new APIError(`List tags failed`, res.status, 'cognito')
  const data = await res.json()
  return {
    Tags: data.Tags || {},
  }
}

export async function updateTags(
  userPoolId: string,
  tags: Record<string, string>,
  removedKeys: string[]
): Promise<void> {
  const res = await fetch(`${api}/cognito/user-pools/${encodeURIComponent(userPoolId)}/tags`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Tags: tags, RemovedKeys: removedKeys }),
  })
  if (!res.ok) throw new APIError(`Update tags failed`, res.status, 'cognito')
}

// Authentication
export async function adminInitiateAuth(
  userPoolId: string,
  clientId: string,
  authFlow: string,
  authParameters: Record<string, string>
): Promise<any> {
  const res = await fetch(`${api}/cognito/admin-initiate-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      UserPoolId: userPoolId,
      ClientId: clientId,
      AuthFlow: authFlow,
      AuthParameters: authParameters,
    }),
  })
  if (!res.ok) throw new APIError(`Admin initiate auth failed`, res.status, 'cognito')
  return res.json()
}