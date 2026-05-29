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
  createUser,
  getUser,
  listUsers,
  deleteUser,
  createRole,
  getRole,
  listRoles,
  deleteRole,
  listPolicies,
  getPolicy,
  createAccessKey,
  listAccessKeys,
  deleteAccessKey,
  updateAccessKeyStatus,
  attachRolePolicy,
  detachRolePolicy,
  listAttachedRolePolicies,
  createGroup,
  getGroup,
  listGroups,
  deleteGroup,
  addUserToGroup,
  removeUserFromGroup,
  listGroupsForUser,
  listUsersForGroup,
  listUserPolicies,
  listRolePolicies,
  getRolePolicy,
  deletePolicy,
  createPolicy,
} from './iam'

describe('IAM Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('User operations', () => {
    it('createUser sends POST to /iam/users with body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ UserName: 'testuser', UserId: 'uid1' }))
      const result = await createUser({ UserName: 'testuser' })
      expect(result.UserName).toBe('testuser')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/users')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.UserName).toBe('testuser')
    })

    it('getUser sends GET to /iam/users/{userName}', async () => {
      mockFetch.mockResolvedValue(mockResponse({ UserName: 'testuser' }))
      const result = await getUser('testuser')
      expect(result.UserName).toBe('testuser')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/users/testuser')
    })

    it('listUsers sends GET to /iam/users and returns Users array', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Users: [{ UserName: 'user1' }] }))
      const result = await listUsers()
      expect(result.Users).toHaveLength(1)
      expect(result.IsTruncated).toBe(false)
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/users')
    })

    it('listUsers handles empty users', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listUsers()
      expect(result.Users).toEqual([])
    })

    it('deleteUser sends DELETE to /iam/users/{userName}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteUser('testuser')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/users/testuser')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('Role operations', () => {
    it('createRole sends POST to /iam/roles with body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ RoleName: 'testrole' }))
      await createRole({ RoleName: 'testrole', AssumeRolePolicyDocument: '{}' })
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/roles')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.RoleName).toBe('testrole')
    })

    it('getRole sends GET to /iam/roles/{roleName}', async () => {
      mockFetch.mockResolvedValue(mockResponse({ RoleName: 'testrole' }))
      const result = await getRole('testrole')
      expect(result.RoleName).toBe('testrole')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/roles/testrole')
    })

    it('listRoles sends GET to /iam/roles and returns Roles array', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Roles: [{ RoleName: 'role1' }] }))
      const result = await listRoles()
      expect(result.Roles).toHaveLength(1)
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/roles')
    })

    it('deleteRole sends DELETE to /iam/roles/{roleName}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteRole('testrole')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/roles/testrole')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('Policy operations', () => {
    it('listPolicies sends GET to /iam/policies and maps PolicyArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Policies: [{ PolicyName: 'AdminPolicy', Arn: 'arn:aws:iam::policy/Admin' }],
      }))
      const result = await listPolicies()
      expect(result.Policies).toHaveLength(1)
      expect(result.Policies[0].PolicyArn).toBe('arn:aws:iam::policy/Admin')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/policies')
    })

    it('listPolicies handles string argument as Scope query param', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Policies: [] }))
      await listPolicies('All')
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('/iam/policies')
      expect(url).toContain('Scope=All')
    })

    it('listPolicies handles object argument as query params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Policies: [] }))
      await listPolicies({ Scope: 'Local' })
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('/iam/policies')
      expect(url).toContain('Scope=Local')
    })

    it('listPolicies handles lowercase policies key', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        policies: [{ PolicyName: 'test', Arn: 'arn:test' }],
      }))
      const result = await listPolicies()
      expect(result.Policies[0].PolicyArn).toBe('arn:test')
    })

    it('getPolicy sends POST to /iam/policies/get with PolicyArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Policy: {} }))
      await getPolicy('arn:aws:iam::policy/Admin')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/policies/get')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.PolicyArn).toBe('arn:aws:iam::policy/Admin')
    })
  })

  describe('Access Key operations', () => {
    it('createAccessKey sends POST to /iam/access-keys with UserName', async () => {
      mockFetch.mockResolvedValue(mockResponse({ AccessKey: {} }))
      await createAccessKey('testuser')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/access-keys')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.UserName).toBe('testuser')
    })

    it('listAccessKeys sends GET to /iam/access-keys with UserName query param', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await listAccessKeys('testuser')
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('/iam/access-keys')
      expect(url).toContain('UserName=testuser')
    })

    it('deleteAccessKey sends DELETE to /iam/access-keys/{accessKeyId}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteAccessKey('AKIA123', 'testuser')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/access-keys/AKIA123')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })

    it('updateAccessKeyStatus sends PUT to /iam/access-keys/{accessKeyId} with body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateAccessKeyStatus('AKIA123', 'Active', 'testuser')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/access-keys/AKIA123')
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Status).toBe('Active')
      expect(body.UserName).toBe('testuser')
    })
  })

  describe('Role Policy operations', () => {
    it('attachRolePolicy sends POST to /iam/roles/{roleName}/policies with PolicyArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await attachRolePolicy('testrole', 'arn:aws:iam::policy/Admin')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/roles/testrole/policies')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.PolicyArn).toBe('arn:aws:iam::policy/Admin')
    })

    it('detachRolePolicy sends POST to /iam/roles/{roleName}/detach-policy', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await detachRolePolicy('testrole', 'arn:aws:iam::policy/Admin')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/roles/testrole/detach-policy')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })

    it('listAttachedRolePolicies sends GET to /iam/roles/{roleName}/policies', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await listAttachedRolePolicies('testrole')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/roles/testrole/policies')
    })
  })

  describe('Group operations', () => {
    it('createGroup sends POST to /iam/groups with body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ GroupName: 'admins' }))
      const result = await createGroup('admins')
      expect(result.GroupName).toBe('admins')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/groups')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })

    it('getGroup sends GET to /iam/groups/{groupName}', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Group: { GroupName: 'admins' }, IsTruncated: false }))
      const result = await getGroup('admins')
      expect(result.Group.GroupName).toBe('admins')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/groups/admins')
    })

    it('listGroups sends GET to /iam/groups and returns Groups array', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Groups: [{ GroupName: 'admins' }] }))
      const result = await listGroups()
      expect(result.Groups).toHaveLength(1)
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/groups')
    })

    it('deleteGroup sends DELETE to /iam/groups/{groupName}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteGroup('admins')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/groups/admins')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })

    it('addUserToGroup sends POST to /iam/groups/{groupName}/users with UserName', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await addUserToGroup('admins', 'testuser')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/groups/admins/users')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.UserName).toBe('testuser')
    })

    it('removeUserFromGroup sends DELETE to /iam/groups/{groupName}/users/{userName}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await removeUserFromGroup('admins', 'testuser')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/groups/admins/users/testuser')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })

    it('listGroupsForUser sends GET to /iam/users/{userName}/groups', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Groups: [{ GroupName: 'admins' }] }))
      const result = await listGroupsForUser('testuser')
      expect(result.Groups[0].GroupName).toBe('admins')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/users/testuser/groups')
    })

    it('listUsersForGroup sends GET to /iam/groups/{groupName}/users', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Users: [{ UserName: 'user1' }] }))
      const result = await listUsersForGroup('admins')
      expect(result.Users).toHaveLength(1)
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/groups/admins/users')
    })
  })

  describe('Inline Policy operations', () => {
    it('listUserPolicies sends GET to /iam/users/{userName}/policies', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await listUserPolicies('testuser')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/users/testuser/policies')
    })

    it('listRolePolicies sends GET to /iam/roles/{roleName}/inline-policies', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await listRolePolicies('testrole')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/roles/testrole/inline-policies')
    })

    it('getRolePolicy sends GET to /iam/roles/{roleName}/policies/{policyName}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await getRolePolicy('testrole', 'inline-policy')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/roles/testrole/policies/inline-policy')
    })

    it('createPolicy sends POST to /iam/policies with input', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Policy: {} }))
      await createPolicy({ PolicyName: 'MyPolicy', PolicyDocument: '{}' })
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/policies')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.PolicyName).toBe('MyPolicy')
    })

    it('deletePolicy sends POST to /iam/policies/delete with PolicyArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deletePolicy('arn:aws:iam::policy/mypolicy')
      expect(mockFetch.mock.calls[0][0]).toContain('/iam/policies/delete')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.PolicyArn).toBe('arn:aws:iam::policy/mypolicy')
    })
  })

  describe('Error handling', () => {
    const methods: [string, () => Promise<any>][] = [
      ['listUsers', () => listUsers()],
      ['getUser', () => getUser('testuser')],
      ['createUser', () => createUser('testuser')],
      ['deleteUser', () => deleteUser('testuser')],
      ['createAccessKey', () => createAccessKey()],
      ['listAccessKeys', () => listAccessKeys()],
      ['deleteAccessKey', () => deleteAccessKey('AKIA123')],
      ['updateAccessKeyStatus', () => updateAccessKeyStatus('AKIA123', 'Active')],
      ['listRoles', () => listRoles()],
      ['createRole', () => createRole('testrole')],
      ['getRole', () => getRole('testrole')],
      ['deleteRole', () => deleteRole('testrole')],
      ['attachRolePolicy', () => attachRolePolicy('testrole', 'arn:aws:iam::policy/Admin')],
      ['detachRolePolicy', () => detachRolePolicy('testrole', 'arn:aws:iam::policy/Admin')],
      ['listAttachedRolePolicies', () => listAttachedRolePolicies('testrole')],
      ['createGroup', () => createGroup('admins')],
      ['getGroup', () => getGroup('admins')],
      ['listGroups', () => listGroups()],
      ['deleteGroup', () => deleteGroup('admins')],
      ['addUserToGroup', () => addUserToGroup('admins', 'testuser')],
      ['removeUserFromGroup', () => removeUserFromGroup('admins', 'testuser')],
      ['listGroupsForUser', () => listGroupsForUser('testuser')],
      ['listUsersForGroup', () => listUsersForGroup('admins')],
      ['listUserPolicies', () => listUserPolicies('testuser')],
      ['getRolePolicy', () => getRolePolicy('testrole', 'mypolicy')],
      ['createPolicy', () => createPolicy({ PolicyName: 'MyPolicy', PolicyDocument: '{}' })],
      ['deletePolicy', () => deletePolicy('arn:aws:iam::policy/mypolicy')],
    ]

    for (const [name, fn] of methods) {
      it(`throws APIError on server error - ${name}`, async () => {
        mockFetch.mockResolvedValue(mockResponse('Error', 500))
        await expect(fn()).rejects.toThrow(/failed/)
      })
    }

    it('propagates network error as-is', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listUsers()).rejects.toThrow('Network error')
    })
  })
})
