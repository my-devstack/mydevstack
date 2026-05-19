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
    it('createUser sends correct params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ UserName: 'testuser', UserId: 'uid1' }))
      const result = await createUser({ UserName: 'testuser' })
      expect(result.UserName).toBe('testuser')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.UserName).toBe('testuser')
    })

    it('getUser sends UserName param', async () => {
      mockFetch.mockResolvedValue(mockResponse({ UserName: 'testuser' }))
      const result = await getUser('testuser')
      expect(result.UserName).toBe('testuser')
    })

    it('listUsers returns Users array', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Users: [{ UserName: 'user1' }] }))
      const result = await listUsers()
      expect(result.Users).toHaveLength(1)
      expect(result.IsTruncated).toBe(false)
    })

    it('listUsers handles empty users', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listUsers()
      expect(result.Users).toEqual([])
    })

    it('deleteUser sends UserName', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteUser('testuser')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.UserName).toBe('testuser')
    })
  })

  describe('Role operations', () => {
    it('createRole sends params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ RoleName: 'testrole' }))
      await createRole({ RoleName: 'testrole', AssumeRolePolicyDocument: '{}' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.RoleName).toBe('testrole')
    })

    it('getRole sends RoleName', async () => {
      mockFetch.mockResolvedValue(mockResponse({ RoleName: 'testrole' }))
      const result = await getRole('testrole')
      expect(result.RoleName).toBe('testrole')
    })

    it('listRoles returns Roles array', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Roles: [{ RoleName: 'role1' }] }))
      const result = await listRoles()
      expect(result.Roles).toHaveLength(1)
    })

    it('deleteRole sends RoleName', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteRole('testrole')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.RoleName).toBe('testrole')
    })
  })

  describe('Policy operations', () => {
    it('listPolicies returns policies with PolicyArn mapped', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Policies: [{ PolicyName: 'AdminPolicy', Arn: 'arn:aws:iam::policy/Admin' }],
      }))
      const result = await listPolicies()
      expect(result.Policies).toHaveLength(1)
      expect(result.Policies[0].PolicyArn).toBe('arn:aws:iam::policy/Admin')
    })

    it('listPolicies handles string argument as Scope', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Policies: [] }))
      await listPolicies('All')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Scope).toBe('All')
    })

    it('listPolicies handles object argument', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Policies: [] }))
      await listPolicies({ Scope: 'Local' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Scope).toBe('Local')
    })

    it('listPolicies handles lowercase policies key', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        policies: [{ PolicyName: 'test', Arn: 'arn:test' }],
      }))
      const result = await listPolicies()
      expect(result.Policies[0].PolicyArn).toBe('arn:test')
    })

    it('getPolicy sends PolicyArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Policy: {} }))
      await getPolicy('arn:aws:iam::policy/Admin')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.PolicyArn).toBe('arn:aws:iam::policy/Admin')
    })
  })

  describe('Access Key operations', () => {
    it('createAccessKey sends UserName', async () => {
      mockFetch.mockResolvedValue(mockResponse({ AccessKey: {} }))
      await createAccessKey('testuser')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.UserName).toBe('testuser')
    })

    it('listAccessKeys sends UserName', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await listAccessKeys('testuser')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.UserName).toBe('testuser')
    })

    it('deleteAccessKey sends params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteAccessKey('AKIA123', 'testuser')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.AccessKeyId).toBe('AKIA123')
      expect(body.UserName).toBe('testuser')
    })

    it('updateAccessKeyStatus sends params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateAccessKeyStatus('AKIA123', 'Active', 'testuser')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Status).toBe('Active')
    })
  })

  describe('Role Policy operations', () => {
    it('attachRolePolicy sends params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await attachRolePolicy('testrole', 'arn:aws:iam::policy/Admin')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.RoleName).toBe('testrole')
      expect(body.PolicyArn).toBe('arn:aws:iam::policy/Admin')
    })

    it('detachRolePolicy sends params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await detachRolePolicy('testrole', 'arn:aws:iam::policy/Admin')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('listAttachedRolePolicies sends RoleName', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await listAttachedRolePolicies('testrole')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.RoleName).toBe('testrole')
    })
  })

  describe('Group operations', () => {
    it('createGroup sends params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ GroupName: 'admins' }))
      const result = await createGroup('admins')
      expect(result.GroupName).toBe('admins')
    })

    it('getGroup sends GroupName', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Group: { GroupName: 'admins' }, IsTruncated: false }))
      const result = await getGroup('admins')
      expect(result.Group.GroupName).toBe('admins')
    })

    it('listGroups returns Groups array', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Groups: [{ GroupName: 'admins' }] }))
      const result = await listGroups()
      expect(result.Groups).toHaveLength(1)
    })

    it('deleteGroup sends GroupName', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteGroup('admins')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.GroupName).toBe('admins')
    })

    it('addUserToGroup sends params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await addUserToGroup('admins', 'testuser')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.GroupName).toBe('admins')
      expect(body.UserName).toBe('testuser')
    })

    it('removeUserFromGroup sends params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await removeUserFromGroup('admins', 'testuser')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('listGroupsForUser returns Groups', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Groups: [{ GroupName: 'admins' }] }))
      const result = await listGroupsForUser('testuser')
      expect(result.Groups[0].GroupName).toBe('admins')
    })

    it('listUsersForGroup returns Users from GetGroup', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Users: [{ UserName: 'user1' }] }))
      const result = await listUsersForGroup('admins')
      expect(result.Users).toHaveLength(1)
    })
  })

  describe('Inline Policy operations', () => {
    it('listUserPolicies sends UserName', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await listUserPolicies('testuser')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.UserName).toBe('testuser')
    })

    it('listRolePolicies sends RoleName', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await listRolePolicies('testrole')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.RoleName).toBe('testrole')
    })

    it('getRolePolicy sends params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await getRolePolicy('testrole', 'inline-policy')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.RoleName).toBe('testrole')
      expect(body.PolicyName).toBe('inline-policy')
    })

    it('createPolicy sends input', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Policy: {} }))
      await createPolicy({ PolicyName: 'MyPolicy', PolicyDocument: '{}' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.PolicyName).toBe('MyPolicy')
    })

    it('deletePolicy sends PolicyArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deletePolicy('arn:aws:iam::policy/mypolicy')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.PolicyArn).toBe('arn:aws:iam::policy/mypolicy')
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(listUsers()).rejects.toThrow(/IAM ListUsers failed/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listUsers()).rejects.toThrow(/Failed to ListUsers/)
    })
  })

  describe('X-Amz-Target header', () => {
    it('uses iam prefix', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await listUsers()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('iam.ListUsers')
    })
  })
})
