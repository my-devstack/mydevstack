import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useIAM } from './useIAM'
import * as iamApi from '@/api/services/iam'

vi.mock('@/stores/ui', () => ({
  useUIStore: () => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
  }),
}))

vi.mock('@/api/services/iam')

describe('useIAM', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('users', () => {
    it('loadUsers success', async () => {
      const mockUsers = [
        { UserName: 'user1', UserId: '123', Arn: 'arn:aws:iam::123:user/user1', CreateDate: '2024-01-01' },
      ]
      vi.mocked(iamApi.listUsers).mockResolvedValue({ Users: mockUsers, IsTruncated: false } as any)

      const { users, loading, loadUsers } = useIAM()

      expect(users.value).toEqual([])
      expect(loading.value).toBe(false)

      await loadUsers()

      expect(users.value).toEqual(mockUsers)
      expect(loading.value).toBe(false)
    })

    it('loadUsers error', async () => {
      vi.mocked(iamApi.listUsers).mockRejectedValue(new Error('API error'))

      const { users, loadUsers } = useIAM()
      await loadUsers()

      expect(users.value).toEqual([])
    })

    it('createUser calls API and reloads', async () => {
      vi.mocked(iamApi.createUser).mockResolvedValue({} as any)
      vi.mocked(iamApi.listUsers).mockResolvedValue({ Users: [], IsTruncated: false } as any)

      const { createUser } = useIAM()
      await createUser('testuser')

      expect(iamApi.createUser).toHaveBeenCalledWith({ UserName: 'testuser', Path: undefined })
      expect(iamApi.listUsers).toHaveBeenCalled()
    })

    it('deleteUser calls API and reloads', async () => {
      vi.mocked(iamApi.deleteUser).mockResolvedValue(undefined)
      vi.mocked(iamApi.listUsers).mockResolvedValue({ Users: [], IsTruncated: false } as any)

      const { deleteUser } = useIAM()
      await deleteUser('testuser')

      expect(iamApi.deleteUser).toHaveBeenCalledWith('testuser')
      expect(iamApi.listUsers).toHaveBeenCalled()
    })

    it('loadUserAccessKeys caches result', async () => {
      const mockKeys = [
        { AccessKeyId: 'AKIA123', Status: 'Active', CreateDate: '2024-01-01' },
      ]
      vi.mocked(iamApi.listAccessKeys).mockResolvedValue({ AccessKeyMetadata: mockKeys } as any)

      const { userAccessKeysMap, loadUserAccessKeys } = useIAM()
      const keys = await loadUserAccessKeys('testuser')

      expect(keys).toEqual(mockKeys)
      expect(userAccessKeysMap.value['testuser']).toEqual(mockKeys)
    })
  })

  describe('roles', () => {
    it('loadRoles success', async () => {
      const mockRoles = [
        { RoleName: 'role1', RoleId: '456', Arn: 'arn:aws:iam::123:role/role1', CreateDate: '2024-01-01' },
      ]
      vi.mocked(iamApi.listRoles).mockResolvedValue({ Roles: mockRoles, IsTruncated: false } as any)

      const { roles, loadRoles } = useIAM()
      await loadRoles()

      expect(roles.value).toEqual(mockRoles)
    })

    it('createRole with description', async () => {
      vi.mocked(iamApi.createRole).mockResolvedValue({} as any)
      vi.mocked(iamApi.listRoles).mockResolvedValue({ Roles: [], IsTruncated: false } as any)

      const { createRole } = useIAM()
      await createRole('testrole', '{"Version":"2012-10-17","Statement":[]}', 'Test role description')

      expect(iamApi.createRole).toHaveBeenCalledWith({
        RoleName: 'testrole',
        AssumeRolePolicyDocument: '{"Version":"2012-10-17","Statement":[]}',
        Description: 'Test role description',
      })
    })

    it('loadRolePolicies caches result', async () => {
      const mockPolicies = [
        { PolicyName: 'AmazonS3FullAccess', PolicyArn: 'arn:aws:iam::aws:policy/AmazonS3FullAccess' },
      ]
      vi.mocked(iamApi.listAttachedRolePolicies).mockResolvedValue({ AttachedPolicies: mockPolicies } as any)

      const { rolePoliciesMap, loadRolePolicies } = useIAM()
      const policies = await loadRolePolicies('testrole')

      expect(policies).toEqual(mockPolicies)
      expect(rolePoliciesMap.value['testrole']).toEqual(mockPolicies)
    })

    it('attachPolicy calls API', async () => {
      vi.mocked(iamApi.attachRolePolicy).mockResolvedValue(undefined)
      vi.mocked(iamApi.listAttachedRolePolicies).mockResolvedValue({ AttachedPolicies: [] } as any)

      const { attachPolicy } = useIAM()
      await attachPolicy('testrole', 'arn:aws:iam::123:policy/test')

      expect(iamApi.attachRolePolicy).toHaveBeenCalledWith('testrole', 'arn:aws:iam::123:policy/test')
    })

    it('detachPolicy calls API', async () => {
      vi.mocked(iamApi.detachRolePolicy).mockResolvedValue(undefined)
      vi.mocked(iamApi.listAttachedRolePolicies).mockResolvedValue({ AttachedPolicies: [] } as any)

      const { detachPolicy } = useIAM()
      await detachPolicy('testrole', 'arn:aws:iam::123:policy/test')

      expect(iamApi.detachRolePolicy).toHaveBeenCalledWith('testrole', 'arn:aws:iam::123:policy/test')
    })
  })

  describe('policies', () => {
    it('loadPolicies success', async () => {
      const mockPolicies = [
        { PolicyName: 'policy1', PolicyId: '789', Arn: 'arn:aws:iam::123:policy/policy1', IsAttachable: true },
      ]
      vi.mocked(iamApi.listPolicies).mockResolvedValue({ Policies: mockPolicies, IsTruncated: false } as any)

      const { policies, loadPolicies } = useIAM()
      await loadPolicies()

      expect(policies.value).toEqual(mockPolicies)
    })

    it('loadPolicyDocument caches result', async () => {
      const mockPolicy = { PolicyName: 'test', DefaultVersionId: 'v1' }
      vi.mocked(iamApi.getPolicy).mockResolvedValue({ Policy: mockPolicy })

      const { policyDocuments, loadPolicyDocument } = useIAM()
      await loadPolicyDocument('arn:aws:iam::123:policy/test')

      expect(policyDocuments.value['arn:aws:iam::123:policy/test']).toEqual(mockPolicy)

      vi.mocked(iamApi.getPolicy).mockClear()
      await loadPolicyDocument('arn:aws:iam::123:policy/test')
      expect(iamApi.getPolicy).not.toHaveBeenCalled()
    })

    it('deletePolicy removes from expanded', async () => {
      vi.mocked(iamApi.deletePolicy).mockResolvedValue(undefined)
      vi.mocked(iamApi.listPolicies).mockResolvedValue({ Policies: [], IsTruncated: false } as any)

      const { expandedPolicies, deletePolicy } = useIAM()
      expandedPolicies.value.add('arn:aws:iam::123:policy/test')

      await deletePolicy('arn:aws:iam::123:policy/test', 'test')

      expect(expandedPolicies.value.has('arn:aws:iam::123:policy/test')).toBe(false)
    })
  })

  describe('groups', () => {
    it('loadGroups success', async () => {
      const mockGroups = [
        { GroupName: 'group1', GroupId: '111', Arn: 'arn:aws:iam::123:group/group1', CreateDate: '2024-01-01' },
      ]
      vi.mocked(iamApi.listGroups).mockResolvedValue({ Groups: mockGroups, IsTruncated: false } as any)

      const { groups, loadGroups } = useIAM()
      await loadGroups()

      expect(groups.value).toEqual(mockGroups)
    })

    it('loadGroupUsers caches result', async () => {
      const mockUsers = [
        { UserName: 'user1', UserId: '123', Arn: 'arn:aws:iam::123:user/user1' },
      ]
      vi.mocked(iamApi.listUsersForGroup).mockResolvedValue({ Users: mockUsers, IsTruncated: false } as any)

      const { groupUsersMap, loadGroupUsers } = useIAM()
      const users = await loadGroupUsers('testgroup')

      expect(users).toEqual(mockUsers)
      expect(groupUsersMap.value['testgroup']).toEqual(mockUsers)
    })

    it('addUserToGroup calls API', async () => {
      vi.mocked(iamApi.addUserToGroup).mockResolvedValue(undefined)
      vi.mocked(iamApi.listUsersForGroup).mockResolvedValue({ Users: [], IsTruncated: false } as any)

      const { addUserToGroup } = useIAM()
      await addUserToGroup('testgroup', 'testuser')

      expect(iamApi.addUserToGroup).toHaveBeenCalledWith('testgroup', 'testuser')
    })

    it('removeUserFromGroup calls API', async () => {
      vi.mocked(iamApi.removeUserFromGroup).mockResolvedValue(undefined)
      vi.mocked(iamApi.listUsersForGroup).mockResolvedValue({ Users: [], IsTruncated: false } as any)

      const { removeUserFromGroup } = useIAM()
      await removeUserFromGroup('testgroup', 'testuser')

      expect(iamApi.removeUserFromGroup).toHaveBeenCalledWith('testgroup', 'testuser')
    })
  })

  describe('helpers', () => {
    it('formatDate handles undefined', () => {
      const { formatDate } = useIAM()
      expect(formatDate(undefined)).toBe('-')
    })

    it('formatDate formats date string', () => {
      const { formatDate } = useIAM()
      const result = formatDate('2024-06-15')
      expect(result).toContain('15')
      expect(result).toContain('2024')
    })
  })
})