import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useIAM } from './useIAM'
import * as iamApi from '@/api/services/iam'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    region: 'us-east-1',
    accessKey: 'AKIA123',
    secretKey: 'secret123',
    emulator: '',
  })),
}))

vi.mock('@/api/services/iam')

describe('useIAM', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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

  describe('additional user operations', () => {
    it('loadUserAccessKeys handles error', async () => {
      vi.mocked(iamApi.listAccessKeys).mockRejectedValue(new Error('API error'))

      const { userAccessKeysMap, loadUserAccessKeys } = useIAM()
      const keys = await loadUserAccessKeys('testuser')

      expect(keys).toEqual([])
      expect(userAccessKeysMap.value['testuser']).toBeUndefined()
    })

    it('createAccessKey calls API and returns keys', async () => {
      const apiResult = { AccessKey: { AccessKeyId: 'AKIA123', SecretAccessKey: 'secret123' } }
      vi.mocked(iamApi.createAccessKey).mockResolvedValue(apiResult as any)
      vi.mocked(iamApi.listAccessKeys).mockResolvedValue({ AccessKeyMetadata: [] } as any)

      const { createAccessKey } = useIAM()
      const result = await createAccessKey('testuser')

      expect(result.AccessKeyId).toBe('AKIA123')
      expect(result.SecretAccessKey).toBe('secret123')
    })

    it('createAccessKey handles AccessKey at top level', async () => {
      const apiResult = { AccessKeyId: 'AKIA456', SecretAccessKey: 'secret456' }
      vi.mocked(iamApi.createAccessKey).mockResolvedValue(apiResult as any)
      vi.mocked(iamApi.listAccessKeys).mockResolvedValue({ AccessKeyMetadata: [] } as any)

      const { createAccessKey } = useIAM()
      const result = await createAccessKey('testuser')

      expect(result.AccessKeyId).toBe('AKIA456')
      expect(result.SecretAccessKey).toBe('secret456')
    })

    it('deleteAccessKey calls API', async () => {
      vi.mocked(iamApi.deleteAccessKey).mockResolvedValue(undefined)
      vi.mocked(iamApi.listAccessKeys).mockResolvedValue({ AccessKeyMetadata: [] } as any)

      const { deleteAccessKey } = useIAM()
      await deleteAccessKey('AKIA123', 'testuser')

      expect(iamApi.deleteAccessKey).toHaveBeenCalledWith('AKIA123', 'testuser')
    })
  })

  describe('additional role operations', () => {
    it('loadRoles handles error', async () => {
      vi.mocked(iamApi.listRoles).mockRejectedValue(new Error('API error'))

      const { roles, loadRoles, loading } = useIAM()
      await loadRoles()

      expect(roles.value).toEqual([])
      expect(loading.value).toBe(false)
    })

    it('createRole without description', async () => {
      vi.mocked(iamApi.createRole).mockResolvedValue({} as any)
      vi.mocked(iamApi.listRoles).mockResolvedValue({ Roles: [] } as any)

      const { createRole } = useIAM()
      await createRole('testrole', '{"Version":"2012-10-17","Statement":[]}')

      expect(iamApi.createRole).toHaveBeenCalledWith({
        RoleName: 'testrole',
        AssumeRolePolicyDocument: '{"Version":"2012-10-17","Statement":[]}',
        Description: undefined,
      })
    })

    it('deleteRole calls API', async () => {
      vi.mocked(iamApi.deleteRole).mockResolvedValue(undefined)
      vi.mocked(iamApi.listRoles).mockResolvedValue({ Roles: [] } as any)

      const { deleteRole } = useIAM()
      await deleteRole('testrole')

      expect(iamApi.deleteRole).toHaveBeenCalledWith('testrole')
    })

    it('loadRolePolicies handles error', async () => {
      vi.mocked(iamApi.listAttachedRolePolicies).mockRejectedValue(new Error('API error'))

      const { rolePoliciesMap, loadRolePolicies } = useIAM()
      const policies = await loadRolePolicies('testrole')

      expect(policies).toEqual([])
      expect(rolePoliciesMap.value['testrole']).toBeUndefined()
    })
  })

  describe('additional policy operations', () => {
    it('loadPolicies handles error', async () => {
      vi.mocked(iamApi.listPolicies).mockRejectedValue(new Error('API error'))

      const { policies, loadPolicies, loading } = useIAM()
      await loadPolicies()

      expect(policies.value).toEqual([])
      expect(loading.value).toBe(false)
    })

    it('loadAllPolicies returns policies', async () => {
      const mockPolicies = [{ PolicyName: 'policy1', Arn: 'arn:aws:iam::123:policy/policy1' }]
      vi.mocked(iamApi.listPolicies).mockResolvedValue({ Policies: mockPolicies } as any)

      const { loadAllPolicies } = useIAM()
      const result = await loadAllPolicies()

      expect(iamApi.listPolicies).toHaveBeenCalledWith({ Scope: 'All' })
      expect(result).toEqual(mockPolicies)
    })

    it('createPolicy calls API', async () => {
      vi.mocked(iamApi.createPolicy).mockResolvedValue({} as any)
      vi.mocked(iamApi.listPolicies).mockResolvedValue({ Policies: [] } as any)

      const { createPolicy } = useIAM()
      await createPolicy('my-policy', '{"Version":"2012-10-17","Statement":[]}', 'Test policy')

      expect(iamApi.createPolicy).toHaveBeenCalledWith({
        PolicyName: 'my-policy',
        PolicyDocument: '{"Version":"2012-10-17","Statement":[]}',
        Description: 'Test policy',
      })
    })

    it('loadPolicyDocument handles error', async () => {
      vi.mocked(iamApi.getPolicy).mockRejectedValue(new Error('Not found'))

      const { policyDocuments, loadPolicyDocument } = useIAM()
      await loadPolicyDocument('arn:aws:iam::123:policy/test')

      // Should not have cached it since error
      expect(policyDocuments.value['arn:aws:iam::123:policy/test']).toBeUndefined()
    })

    it('loadPolicyDocument does not fetch if already cached', async () => {
      vi.mocked(iamApi.getPolicy).mockResolvedValue({ Policy: { PolicyName: 'cached' } } as any)

      const { policyDocuments, loadPolicyDocument } = useIAM()
      // First call caches
      await loadPolicyDocument('arn:aws:iam::123:policy/cached')
      expect(iamApi.getPolicy).toHaveBeenCalledTimes(1)

      // Second call should not fetch
      vi.mocked(iamApi.getPolicy).mockClear()
      await loadPolicyDocument('arn:aws:iam::123:policy/cached')
      expect(iamApi.getPolicy).not.toHaveBeenCalled()
    })
  })

  describe('additional group operations', () => {
    it('loadGroups handles error', async () => {
      vi.mocked(iamApi.listGroups).mockRejectedValue(new Error('API error'))

      const { groups, loadGroups, loading } = useIAM()
      await loadGroups()

      expect(groups.value).toEqual([])
      expect(loading.value).toBe(false)
    })

    it('createGroup with path', async () => {
      vi.mocked(iamApi.createGroup).mockResolvedValue({} as any)
      vi.mocked(iamApi.listGroups).mockResolvedValue({ Groups: [] } as any)

      const { createGroup } = useIAM()
      await createGroup('dev-group', '/dev/')

      expect(iamApi.createGroup).toHaveBeenCalledWith('dev-group', '/dev/')
    })

    it('deleteGroup calls API', async () => {
      vi.mocked(iamApi.deleteGroup).mockResolvedValue(undefined)
      vi.mocked(iamApi.listGroups).mockResolvedValue({ Groups: [] } as any)

      const { expandedGroups, deleteGroup } = useIAM()
      expandedGroups.value.add('dev-group')

      await deleteGroup('dev-group')

      expect(iamApi.deleteGroup).toHaveBeenCalledWith('dev-group')
      expect(expandedGroups.value.has('dev-group')).toBe(false)
    })

    it('loadGroupUsers handles error', async () => {
      vi.mocked(iamApi.listUsersForGroup).mockRejectedValue(new Error('API error'))

      const { groupUsersMap, loadGroupUsers } = useIAM()
      const users = await loadGroupUsers('dev-group')

      expect(users).toEqual([])
      expect(groupUsersMap.value['dev-group']).toBeUndefined()
    })
  })

  describe('loadAll', () => {
    it('calls all load functions', async () => {
      vi.mocked(iamApi.listUsers).mockResolvedValue({ Users: [] } as any)
      vi.mocked(iamApi.listRoles).mockResolvedValue({ Roles: [] } as any)
      vi.mocked(iamApi.listPolicies).mockResolvedValue({ Policies: [] } as any)
      vi.mocked(iamApi.listGroups).mockResolvedValue({ Groups: [] } as any)

      const { loadAll } = useIAM()
      await loadAll()

      expect(iamApi.listUsers).toHaveBeenCalled()
      expect(iamApi.listRoles).toHaveBeenCalled()
      expect(iamApi.listPolicies).toHaveBeenCalledWith({ Scope: 'All' })
      expect(iamApi.listGroups).toHaveBeenCalled()
    })
  })

  describe('codeExamples', () => {
    it('returns code examples', () => {
      const { codeExamples } = useIAM()
      expect(codeExamples.value.length).toBeGreaterThan(0)
      expect(codeExamples.value[0].language).toBe('aws-cli')
      const jsExample = codeExamples.value.find(e => e.language === 'javascript')
      expect(jsExample).toBeDefined()
      expect(jsExample!.code).toContain('IAMClient')
    })

    it('includes settings values in examples', () => {
      const { codeExamples } = useIAM()
      const jsExample = codeExamples.value.find(e => e.language === 'javascript')
      expect(jsExample).toBeDefined()
      expect(jsExample!.code).toContain('us-east-1')
    })
  })
})