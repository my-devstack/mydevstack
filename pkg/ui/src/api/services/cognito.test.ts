import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function mockResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
    headers: new Headers({ 'content-type': 'application/json' }),
  }
}

import {
  listUserPools,
  createUserPool,
  deleteUserPool,
  updateUserPool,
  listUsers,
  createUser,
  deleteUser,
  updateUser,
  listGroups,
  createGroup,
  deleteGroup,
  updateGroup,
  listUserPoolClients,
  createUserPoolClient,
  deleteUserPoolClient,
  updateUserPoolClient,
  addUserToGroup,
  removeUserFromGroup,
  listGroupsForUser,
  listUsersInGroup,
  adminSetUserPassword,
  listResourceServers,
  createResourceServer,
  deleteResourceServer,
  listTagsForResource,
  updateTags,
  adminInitiateAuth,
} from './cognito'

describe('Cognito Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('User pool operations', () => {
    it('listUserPools sends GET to /cognito/user-pools and returns UserPools array', async () => {
      mockFetch.mockResolvedValue(mockResponse({ UserPools: [{ Id: 'us-east-1_abc', Name: 'pool1' }] }))
      const result = await listUserPools()
      expect(result.UserPools).toHaveLength(1)
      expect(result.UserPools[0].Name).toBe('pool1')
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools')
    })

    it('listUserPools handles empty response', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listUserPools()
      expect(result.UserPools).toEqual([])
    })

    it('createUserPool sends POST to /cognito/user-pools with body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ UserPool: { Id: 'us-east-1_abc', Name: 'pool1' } }))
      const result = await createUserPool({ PoolName: 'pool1' })
      expect(result.UserPool.Name).toBe('pool1')
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.PoolName).toBe('pool1')
    })

    it('deleteUserPool sends DELETE to /cognito/user-pools/{userPoolId}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteUserPool('us-east-1_abc')
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })

    it('throws APIError on failure', async () => {
      mockFetch.mockResolvedValue(mockResponse({ message: 'boom' }, 500))
      await expect(listUserPools()).rejects.toThrow('List user pools failed')
    })

    it('updateUserPool sends PUT to /cognito/user-pools/{userPoolId} with body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateUserPool('us-east-1_abc', { PoolName: 'renamed', MfaConfiguration: 'ON', DeletionProtection: 'ACTIVE' })
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc')
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.PoolName).toBe('renamed')
      expect(body.MfaConfiguration).toBe('ON')
      expect(body.DeletionProtection).toBe('ACTIVE')
    })

    it('updateUserPool throws APIError on failure', async () => {
      mockFetch.mockResolvedValue(mockResponse({ message: 'boom' }, 500))
      await expect(updateUserPool('us-east-1_abc', { PoolName: 'x' })).rejects.toThrow('Update user pool failed')
    })
  })

  describe('User operations', () => {
    it('listUsers sends GET to /cognito/user-pools/{id}/users', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Users: [{ Username: 'alice' }] }))
      const result = await listUsers('us-east-1_abc')
      expect(result.Users).toHaveLength(1)
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/users')
    })

    it('createUser sends POST with username and attributes', async () => {
      mockFetch.mockResolvedValue(mockResponse({ User: { Username: 'alice' } }))
      const result = await createUser('us-east-1_abc', {
        Username: 'alice',
        TemporaryPassword: 'Temp123!',
        UserAttributes: [{ Name: 'email', Value: 'alice@example.com' }],
      })
      expect(result.User.Username).toBe('alice')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Username).toBe('alice')
      expect(body.UserAttributes[0].Name).toBe('email')
    })

    it('deleteUser sends DELETE to /cognito/user-pools/{id}/users/{username}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteUser('us-east-1_abc', 'alice')
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/users/alice')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })

    it('updateUser sends PUT with UserAttributes', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateUser('us-east-1_abc', 'alice', {
        UserAttributes: [{ Name: 'email', Value: 'new@example.com' }],
      })
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/users/alice')
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.UserAttributes[0].Name).toBe('email')
      expect(body.UserAttributes[0].Value).toBe('new@example.com')
    })

    it('updateUser throws APIError on failure', async () => {
      mockFetch.mockResolvedValue(mockResponse({ message: 'boom' }, 500))
      await expect(updateUser('us-east-1_abc', 'alice', { UserAttributes: [] })).rejects.toThrow('Update user failed')
    })
  })

  describe('Group operations', () => {
    it('listGroups sends GET to /cognito/user-pools/{id}/groups', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Groups: [{ GroupName: 'admins' }] }))
      const result = await listGroups('us-east-1_abc')
      expect(result.Groups).toHaveLength(1)
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/groups')
    })

    it('createGroup sends POST with group name and description', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Group: { GroupName: 'admins' } }))
      const result = await createGroup('us-east-1_abc', { GroupName: 'admins', Description: 'Admin group' })
      expect(result.Group.GroupName).toBe('admins')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Description).toBe('Admin group')
    })

    it('deleteGroup sends DELETE to /cognito/user-pools/{id}/groups/{groupName}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteGroup('us-east-1_abc', 'admins')
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/groups/admins')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })

    it('updateGroup sends PUT with description, role arn and precedence', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateGroup('us-east-1_abc', 'admins', {
        Description: 'Updated group',
        RoleArn: 'arn:aws:iam::000000000000:role/admin',
        Precedence: 5,
      })
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/groups/admins')
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Description).toBe('Updated group')
      expect(body.RoleArn).toContain('role/admin')
      expect(body.Precedence).toBe(5)
    })

    it('updateGroup throws APIError on failure', async () => {
      mockFetch.mockResolvedValue(mockResponse({ message: 'boom' }, 500))
      await expect(updateGroup('us-east-1_abc', 'admins', {})).rejects.toThrow('Update group failed')
    })
  })

  describe('User pool client operations', () => {
    it('listUserPoolClients sends GET to /cognito/user-pools/{id}/clients', async () => {
      mockFetch.mockResolvedValue(mockResponse({ UserPoolClients: [{ ClientId: 'client-1', ClientName: 'web-app' }] }))
      const result = await listUserPoolClients('us-east-1_abc')
      expect(result.UserPoolClients).toHaveLength(1)
      expect(result.UserPoolClients[0].ClientName).toBe('web-app')
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/clients')
    })

    it('listUserPoolClients handles empty response', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listUserPoolClients('us-east-1_abc')
      expect(result.UserPoolClients).toEqual([])
    })

    it('createUserPoolClient sends POST with ClientName and GenerateSecret', async () => {
      mockFetch.mockResolvedValue(mockResponse({ UserPoolClient: { ClientId: 'client-1', ClientName: 'web-app' } }))
      const result = await createUserPoolClient('us-east-1_abc', { ClientName: 'web-app', GenerateSecret: true })
      expect(result.UserPoolClient.ClientName).toBe('web-app')
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/clients')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ClientName).toBe('web-app')
      expect(body.GenerateSecret).toBe(true)
    })

    it('deleteUserPoolClient sends DELETE to /cognito/user-pools/{id}/clients/{clientId}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteUserPoolClient('us-east-1_abc', 'client-1')
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/clients/client-1')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })

    it('updateUserPoolClient sends PUT to /cognito/user-pools/{id}/clients/{clientId}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateUserPoolClient('us-east-1_abc', 'client-1', {
        ClientName: 'web-app',
        RefreshTokenValidity: 30,
        AccessTokenValidity: 60,
        IdTokenValidity: 60,
      })
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/clients/client-1')
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ClientName).toBe('web-app')
      expect(body.RefreshTokenValidity).toBe(30)
      expect(body.AccessTokenValidity).toBe(60)
      expect(body.IdTokenValidity).toBe(60)
    })

    it('updateUserPoolClient throws APIError on failure', async () => {
      mockFetch.mockResolvedValue(mockResponse({ message: 'boom' }, 500))
      await expect(updateUserPoolClient('us-east-1_abc', 'client-1', {})).rejects.toThrow('Update user pool client failed')
    })
  })

  describe('Group membership operations', () => {
    it('addUserToGroup sends PUT with GroupName body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await addUserToGroup('us-east-1_abc', 'alice', 'admins')
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/users/alice/groups')
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.GroupName).toBe('admins')
    })

    it('removeUserFromGroup sends DELETE to /cognito/user-pools/{id}/users/{username}/groups/{groupName}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await removeUserFromGroup('us-east-1_abc', 'alice', 'admins')
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/users/alice/groups/admins')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })

    it('listGroupsForUser sends GET and returns Groups array', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Groups: [{ GroupName: 'admins' }] }))
      const result = await listGroupsForUser('us-east-1_abc', 'alice')
      expect(result.Groups).toHaveLength(1)
      expect(result.Groups[0].GroupName).toBe('admins')
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/users/alice/groups')
    })

    it('listGroupsForUser handles empty response', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listGroupsForUser('us-east-1_abc', 'alice')
      expect(result.Groups).toEqual([])
    })

    it('listUsersInGroup sends GET and returns Users array', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Users: [{ Username: 'alice' }] }))
      const result = await listUsersInGroup('us-east-1_abc', 'admins')
      expect(result.Users).toHaveLength(1)
      expect(result.Users[0].Username).toBe('alice')
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/groups/admins/users')
    })

    it('listUsersInGroup handles empty response', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listUsersInGroup('us-east-1_abc', 'admins')
      expect(result.Users).toEqual([])
    })
  })

  describe('Reset password', () => {
    it('adminSetUserPassword sends PUT with Password and Permanent', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await adminSetUserPassword('us-east-1_abc', 'alice', 'NewPass123!', true)
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/users/alice/password')
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Password).toBe('NewPass123!')
      expect(body.Permanent).toBe(true)
    })

    it('adminSetUserPassword throws APIError on failure', async () => {
      mockFetch.mockResolvedValue(mockResponse({ message: 'boom' }, 500))
      await expect(adminSetUserPassword('us-east-1_abc', 'alice', 'x', false)).rejects.toThrow('Set user password failed')
    })
  })

  describe('Resource server operations', () => {
    it('listResourceServers sends GET and returns ResourceServers array', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ResourceServers: [{ Identifier: 'api.example.com', Name: 'API Server' }] }))
      const result = await listResourceServers('us-east-1_abc')
      expect(result.ResourceServers).toHaveLength(1)
      expect(result.ResourceServers[0].Identifier).toBe('api.example.com')
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/resource-servers')
    })

    it('listResourceServers handles empty response', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listResourceServers('us-east-1_abc')
      expect(result.ResourceServers).toEqual([])
    })

    it('createResourceServer sends POST with Identifier and Name', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ResourceServer: { Identifier: 'api.example.com', Name: 'API Server' } }))
      const result = await createResourceServer('us-east-1_abc', { Identifier: 'api.example.com', Name: 'API Server' })
      expect(result.ResourceServer.Name).toBe('API Server')
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/resource-servers')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Identifier).toBe('api.example.com')
      expect(body.Name).toBe('API Server')
    })

    it('deleteResourceServer sends DELETE to /cognito/user-pools/{id}/resource-servers/{identifier}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteResourceServer('us-east-1_abc', 'api.example.com')
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/resource-servers/api.example.com')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('Tags', () => {
    it('listTagsForResource sends GET and returns Tags map', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Tags: { env: 'dev', team: 'platform' } }))
      const result = await listTagsForResource('us-east-1_abc')
      expect(result.Tags.env).toBe('dev')
      expect(result.Tags.team).toBe('platform')
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/tags')
    })

    it('listTagsForResource handles empty response', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listTagsForResource('us-east-1_abc')
      expect(result.Tags).toEqual({})
    })

    it('updateTags sends PUT with Tags and RemovedKeys', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateTags('us-east-1_abc', { env: 'prod' }, ['old-key'])
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/user-pools/us-east-1_abc/tags')
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Tags.env).toBe('prod')
      expect(body.RemovedKeys).toEqual(['old-key'])
    })
  })

  describe('Authentication', () => {
    it('adminInitiateAuth sends POST with auth params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ AuthenticationResult: { AccessToken: 'token' } }))
      const result = await adminInitiateAuth('us-east-1_abc', 'client-1', 'ADMIN_USER_PASSWORD_AUTH', {
        USERNAME: 'alice',
        PASSWORD: 'Pass123!',
      })
      expect(result.AuthenticationResult.AccessToken).toBe('token')
      expect(mockFetch.mock.calls[0][0]).toContain('/cognito/admin-initiate-auth')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.UserPoolId).toBe('us-east-1_abc')
      expect(body.ClientId).toBe('client-1')
      expect(body.AuthFlow).toBe('ADMIN_USER_PASSWORD_AUTH')
      expect(body.AuthParameters.USERNAME).toBe('alice')
    })

    it('adminInitiateAuth throws APIError on failure', async () => {
      mockFetch.mockResolvedValue(mockResponse({ message: 'boom' }, 500))
      await expect(adminInitiateAuth('us-east-1_abc', 'client-1', 'ADMIN_USER_PASSWORD_AUTH', {})).rejects.toThrow(
        'Admin initiate auth failed'
      )
    })
  })

  describe('Resource server operations - error branches', () => {
    it('deleteResourceServer throws APIError on failure', async () => {
      mockFetch.mockResolvedValue(mockResponse({ message: 'boom' }, 500))
      await expect(deleteResourceServer('us-east-1_abc', 'api.example.com')).rejects.toThrow('Delete resource server failed')
    })
  })

  describe('Tags - error branches', () => {
    it('updateTags throws APIError on failure', async () => {
      mockFetch.mockResolvedValue(mockResponse({ message: 'boom' }, 500))
      await expect(updateTags('us-east-1_abc', { env: 'prod' }, [])).rejects.toThrow('Update tags failed')
    })
  })
})