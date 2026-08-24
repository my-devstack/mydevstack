import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCognito } from './useCognito'
import * as cognitoApi from '@/api/services/cognito'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    region: 'us-east-1',
    accessKey: 'AKIA123',
    secretKey: 'secret123',
    emulator: '',
  })),
}))

vi.mock('@/api/services/cognito')

describe('useCognito', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('user pools', () => {
    it('loadUserPools success', async () => {
      const mockPools = [
        { Id: 'us-east-1_abc', Name: 'pool1', Status: 'Enabled' },
      ]
      vi.mocked(cognitoApi.listUserPools).mockResolvedValue({ UserPools: mockPools } as any)

      const { userPools, loading, loadUserPools } = useCognito()

      expect(userPools.value).toEqual([])
      expect(loading.value).toBe(false)

      await loadUserPools()

      expect(userPools.value).toEqual(mockPools)
      expect(loading.value).toBe(false)
    })

    it('loadUserPools error', async () => {
      vi.mocked(cognitoApi.listUserPools).mockRejectedValue(new Error('API error'))

      const { userPools, loadUserPools } = useCognito()
      await loadUserPools()

      expect(userPools.value).toEqual([])
    })

    it('createUserPool calls API and reloads', async () => {
      vi.mocked(cognitoApi.createUserPool).mockResolvedValue({} as any)
      vi.mocked(cognitoApi.listUserPools).mockResolvedValue({ UserPools: [] } as any)

      const { createUserPool } = useCognito()
      await createUserPool('my-pool')

      expect(cognitoApi.createUserPool).toHaveBeenCalledWith({ PoolName: 'my-pool' })
      expect(cognitoApi.listUserPools).toHaveBeenCalled()
    })

    it('deleteUserPool calls API and reloads', async () => {
      vi.mocked(cognitoApi.deleteUserPool).mockResolvedValue(undefined)
      vi.mocked(cognitoApi.listUserPools).mockResolvedValue({ UserPools: [] } as any)

      const { deleteUserPool } = useCognito()
      await deleteUserPool('us-east-1_abc')

      expect(cognitoApi.deleteUserPool).toHaveBeenCalledWith('us-east-1_abc')
      expect(cognitoApi.listUserPools).toHaveBeenCalled()
    })

    it('updateUserPool calls API and reloads', async () => {
      vi.mocked(cognitoApi.updateUserPool).mockResolvedValue(undefined)
      vi.mocked(cognitoApi.listUserPools).mockResolvedValue({ UserPools: [] } as any)

      const { updateUserPool } = useCognito()
      await updateUserPool('us-east-1_abc', { PoolName: 'renamed', MfaConfiguration: 'ON', DeletionProtection: 'ACTIVE' })

      expect(cognitoApi.updateUserPool).toHaveBeenCalledWith('us-east-1_abc', {
        PoolName: 'renamed',
        MfaConfiguration: 'ON',
        DeletionProtection: 'ACTIVE',
      })
      expect(cognitoApi.listUserPools).toHaveBeenCalled()
    })
  })

  describe('users', () => {
    it('loadUsers success', async () => {
      const mockUsers = [
        { Username: 'alice', UserStatus: 'CONFIRMED', Enabled: true },
      ]
      vi.mocked(cognitoApi.listUsers).mockResolvedValue({ Users: mockUsers } as any)

      const { users, loading, loadUsers } = useCognito()
      await loadUsers('us-east-1_abc')

      expect(users.value).toEqual(mockUsers)
      expect(loading.value).toBe(false)
    })

    it('loadUsers error', async () => {
      vi.mocked(cognitoApi.listUsers).mockRejectedValue(new Error('API error'))

      const { users, loadUsers } = useCognito()
      await loadUsers('us-east-1_abc')

      expect(users.value).toEqual([])
    })

    it('createUser calls API and reloads', async () => {
      vi.mocked(cognitoApi.createUser).mockResolvedValue({} as any)
      vi.mocked(cognitoApi.listUsers).mockResolvedValue({ Users: [] } as any)

      const { createUser } = useCognito()
      await createUser('us-east-1_abc', 'alice', 'Temp123!', [{ Name: 'email', Value: 'alice@example.com' }])

      expect(cognitoApi.createUser).toHaveBeenCalledWith('us-east-1_abc', {
        Username: 'alice',
        TemporaryPassword: 'Temp123!',
        UserAttributes: [{ Name: 'email', Value: 'alice@example.com' }],
      })
      expect(cognitoApi.listUsers).toHaveBeenCalledWith('us-east-1_abc')
    })

    it('createUser without optional params', async () => {
      vi.mocked(cognitoApi.createUser).mockResolvedValue({} as any)
      vi.mocked(cognitoApi.listUsers).mockResolvedValue({ Users: [] } as any)

      const { createUser } = useCognito()
      await createUser('us-east-1_abc', 'bob')

      expect(cognitoApi.createUser).toHaveBeenCalledWith('us-east-1_abc', {
        Username: 'bob',
        TemporaryPassword: undefined,
        UserAttributes: undefined,
      })
    })

    it('deleteUser calls API and reloads', async () => {
      vi.mocked(cognitoApi.deleteUser).mockResolvedValue(undefined)
      vi.mocked(cognitoApi.listUsers).mockResolvedValue({ Users: [] } as any)

      const { deleteUser } = useCognito()
      await deleteUser('us-east-1_abc', 'alice')

      expect(cognitoApi.deleteUser).toHaveBeenCalledWith('us-east-1_abc', 'alice')
      expect(cognitoApi.listUsers).toHaveBeenCalledWith('us-east-1_abc')
    })

    it('updateUser calls API and reloads', async () => {
      vi.mocked(cognitoApi.updateUser).mockResolvedValue(undefined)
      vi.mocked(cognitoApi.listUsers).mockResolvedValue({ Users: [] } as any)

      const { updateUser } = useCognito()
      await updateUser('us-east-1_abc', 'alice', [{ Name: 'email', Value: 'new@example.com' }])

      expect(cognitoApi.updateUser).toHaveBeenCalledWith('us-east-1_abc', 'alice', {
        UserAttributes: [{ Name: 'email', Value: 'new@example.com' }],
      })
      expect(cognitoApi.listUsers).toHaveBeenCalledWith('us-east-1_abc')
    })
  })

  describe('groups', () => {
    it('loadGroups success', async () => {
      const mockGroups = [
        { GroupName: 'admins', UserPoolId: 'us-east-1_abc', Description: 'Admin group' },
      ]
      vi.mocked(cognitoApi.listGroups).mockResolvedValue({ Groups: mockGroups } as any)

      const { groups, loading, loadGroups } = useCognito()
      await loadGroups('us-east-1_abc')

      expect(groups.value).toEqual(mockGroups)
      expect(loading.value).toBe(false)
    })

    it('loadGroups error', async () => {
      vi.mocked(cognitoApi.listGroups).mockRejectedValue(new Error('API error'))

      const { groups, loadGroups } = useCognito()
      await loadGroups('us-east-1_abc')

      expect(groups.value).toEqual([])
    })

    it('createGroup calls API and reloads', async () => {
      vi.mocked(cognitoApi.createGroup).mockResolvedValue({} as any)
      vi.mocked(cognitoApi.listGroups).mockResolvedValue({ Groups: [] } as any)

      const { createGroup } = useCognito()
      await createGroup('us-east-1_abc', 'admins', 'Admin group')

      expect(cognitoApi.createGroup).toHaveBeenCalledWith('us-east-1_abc', {
        GroupName: 'admins',
        Description: 'Admin group',
      })
      expect(cognitoApi.listGroups).toHaveBeenCalledWith('us-east-1_abc')
    })

    it('createGroup without description', async () => {
      vi.mocked(cognitoApi.createGroup).mockResolvedValue({} as any)
      vi.mocked(cognitoApi.listGroups).mockResolvedValue({ Groups: [] } as any)

      const { createGroup } = useCognito()
      await createGroup('us-east-1_abc', 'devs')

      expect(cognitoApi.createGroup).toHaveBeenCalledWith('us-east-1_abc', {
        GroupName: 'devs',
        Description: undefined,
      })
    })

    it('deleteGroup calls API and reloads', async () => {
      vi.mocked(cognitoApi.deleteGroup).mockResolvedValue(undefined)
      vi.mocked(cognitoApi.listGroups).mockResolvedValue({ Groups: [] } as any)

      const { deleteGroup } = useCognito()
      await deleteGroup('us-east-1_abc', 'admins')

      expect(cognitoApi.deleteGroup).toHaveBeenCalledWith('us-east-1_abc', 'admins')
      expect(cognitoApi.listGroups).toHaveBeenCalledWith('us-east-1_abc')
    })

    it('updateGroup calls API and reloads', async () => {
      vi.mocked(cognitoApi.updateGroup).mockResolvedValue(undefined)
      vi.mocked(cognitoApi.listGroups).mockResolvedValue({ Groups: [] } as any)

      const { updateGroup } = useCognito()
      await updateGroup('us-east-1_abc', 'admins', { Description: 'Updated', RoleArn: 'arn:aws:iam::000000000000:role/admin', Precedence: 5 })

      expect(cognitoApi.updateGroup).toHaveBeenCalledWith('us-east-1_abc', 'admins', {
        Description: 'Updated',
        RoleArn: 'arn:aws:iam::000000000000:role/admin',
        Precedence: 5,
      })
      expect(cognitoApi.listGroups).toHaveBeenCalledWith('us-east-1_abc')
    })
  })

  describe('user pool clients', () => {
    it('loadUserPoolClients success', async () => {
      const mockClients = [
        { ClientId: 'client-1', ClientName: 'web-app' },
      ]
      vi.mocked(cognitoApi.listUserPoolClients).mockResolvedValue({ UserPoolClients: mockClients } as any)

      const { userPoolClients, loading, loadUserPoolClients } = useCognito()
      await loadUserPoolClients('us-east-1_abc')

      expect(userPoolClients.value).toEqual(mockClients)
      expect(loading.value).toBe(false)
    })

    it('loadUserPoolClients error', async () => {
      vi.mocked(cognitoApi.listUserPoolClients).mockRejectedValue(new Error('API error'))

      const { userPoolClients, loadUserPoolClients } = useCognito()
      await loadUserPoolClients('us-east-1_abc')

      expect(userPoolClients.value).toEqual([])
    })

    it('createUserPoolClient calls API and reloads', async () => {
      vi.mocked(cognitoApi.createUserPoolClient).mockResolvedValue({} as any)
      vi.mocked(cognitoApi.listUserPoolClients).mockResolvedValue({ UserPoolClients: [] } as any)

      const { createUserPoolClient } = useCognito()
      await createUserPoolClient('us-east-1_abc', 'web-app', true)

      expect(cognitoApi.createUserPoolClient).toHaveBeenCalledWith('us-east-1_abc', {
        ClientName: 'web-app',
        GenerateSecret: true,
      })
      expect(cognitoApi.listUserPoolClients).toHaveBeenCalledWith('us-east-1_abc')
    })

    it('deleteUserPoolClient calls API and reloads', async () => {
      vi.mocked(cognitoApi.deleteUserPoolClient).mockResolvedValue(undefined)
      vi.mocked(cognitoApi.listUserPoolClients).mockResolvedValue({ UserPoolClients: [] } as any)

      const { deleteUserPoolClient } = useCognito()
      await deleteUserPoolClient('us-east-1_abc', 'client-1')

      expect(cognitoApi.deleteUserPoolClient).toHaveBeenCalledWith('us-east-1_abc', 'client-1')
      expect(cognitoApi.listUserPoolClients).toHaveBeenCalledWith('us-east-1_abc')
    })

    it('updateUserPoolClient calls API and reloads', async () => {
      vi.mocked(cognitoApi.updateUserPoolClient).mockResolvedValue(undefined)
      vi.mocked(cognitoApi.listUserPoolClients).mockResolvedValue({ UserPoolClients: [] } as any)

      const { updateUserPoolClient } = useCognito()
      await updateUserPoolClient('us-east-1_abc', 'client-1', {
        ClientName: 'web-app',
        RefreshTokenValidity: 30,
        AccessTokenValidity: 60,
        IdTokenValidity: 60,
      })

      expect(cognitoApi.updateUserPoolClient).toHaveBeenCalledWith('us-east-1_abc', 'client-1', {
        ClientName: 'web-app',
        RefreshTokenValidity: 30,
        AccessTokenValidity: 60,
        IdTokenValidity: 60,
      })
      expect(cognitoApi.listUserPoolClients).toHaveBeenCalledWith('us-east-1_abc')
    })
  })

  describe('group membership', () => {
    it('addUserToGroup calls API', async () => {
      vi.mocked(cognitoApi.addUserToGroup).mockResolvedValue(undefined)

      const { addUserToGroup } = useCognito()
      await addUserToGroup('us-east-1_abc', 'alice', 'admins')

      expect(cognitoApi.addUserToGroup).toHaveBeenCalledWith('us-east-1_abc', 'alice', 'admins')
    })

    it('removeUserFromGroup calls API', async () => {
      vi.mocked(cognitoApi.removeUserFromGroup).mockResolvedValue(undefined)

      const { removeUserFromGroup } = useCognito()
      await removeUserFromGroup('us-east-1_abc', 'alice', 'admins')

      expect(cognitoApi.removeUserFromGroup).toHaveBeenCalledWith('us-east-1_abc', 'alice', 'admins')
    })

    it('listGroupsForUser returns groups', async () => {
      const mockGroups = [{ GroupName: 'admins' }]
      vi.mocked(cognitoApi.listGroupsForUser).mockResolvedValue({ Groups: mockGroups } as any)

      const { listGroupsForUser } = useCognito()
      const result = await listGroupsForUser('us-east-1_abc', 'alice')

      expect(cognitoApi.listGroupsForUser).toHaveBeenCalledWith('us-east-1_abc', 'alice')
      expect(result).toEqual(mockGroups)
    })

    it('listUsersInGroup returns users', async () => {
      const mockUsers = [{ Username: 'alice' }]
      vi.mocked(cognitoApi.listUsersInGroup).mockResolvedValue({ Users: mockUsers } as any)

      const { listUsersInGroup } = useCognito()
      const result = await listUsersInGroup('us-east-1_abc', 'admins')

      expect(cognitoApi.listUsersInGroup).toHaveBeenCalledWith('us-east-1_abc', 'admins')
      expect(result).toEqual(mockUsers)
    })
  })

  describe('reset password', () => {
    it('resetUserPassword calls API', async () => {
      vi.mocked(cognitoApi.adminSetUserPassword).mockResolvedValue(undefined)

      const { resetUserPassword } = useCognito()
      await resetUserPassword('us-east-1_abc', 'alice', 'NewPass123!', true)

      expect(cognitoApi.adminSetUserPassword).toHaveBeenCalledWith('us-east-1_abc', 'alice', 'NewPass123!', true)
    })
  })

  describe('resource servers', () => {
    it('loadResourceServers success', async () => {
      const mockServers = [
        { Identifier: 'api.example.com', Name: 'API Server' },
      ]
      vi.mocked(cognitoApi.listResourceServers).mockResolvedValue({ ResourceServers: mockServers } as any)

      const { resourceServers, loading, loadResourceServers } = useCognito()
      await loadResourceServers('us-east-1_abc')

      expect(resourceServers.value).toEqual(mockServers)
      expect(loading.value).toBe(false)
    })

    it('loadResourceServers error', async () => {
      vi.mocked(cognitoApi.listResourceServers).mockRejectedValue(new Error('API error'))

      const { resourceServers, loadResourceServers } = useCognito()
      await loadResourceServers('us-east-1_abc')

      expect(resourceServers.value).toEqual([])
    })

    it('createResourceServer calls API and reloads', async () => {
      vi.mocked(cognitoApi.createResourceServer).mockResolvedValue({} as any)
      vi.mocked(cognitoApi.listResourceServers).mockResolvedValue({ ResourceServers: [] } as any)

      const { createResourceServer } = useCognito()
      await createResourceServer('us-east-1_abc', 'api.example.com', 'API Server')

      expect(cognitoApi.createResourceServer).toHaveBeenCalledWith('us-east-1_abc', {
        Identifier: 'api.example.com',
        Name: 'API Server',
      })
      expect(cognitoApi.listResourceServers).toHaveBeenCalledWith('us-east-1_abc')
    })

    it('deleteResourceServer calls API and reloads', async () => {
      vi.mocked(cognitoApi.deleteResourceServer).mockResolvedValue(undefined)
      vi.mocked(cognitoApi.listResourceServers).mockResolvedValue({ ResourceServers: [] } as any)

      const { deleteResourceServer } = useCognito()
      await deleteResourceServer('us-east-1_abc', 'api.example.com')

      expect(cognitoApi.deleteResourceServer).toHaveBeenCalledWith('us-east-1_abc', 'api.example.com')
      expect(cognitoApi.listResourceServers).toHaveBeenCalledWith('us-east-1_abc')
    })
  })

  describe('tags', () => {
    it('loadTags returns tags map', async () => {
      vi.mocked(cognitoApi.listTagsForResource).mockResolvedValue({ Tags: { env: 'dev' } } as any)

      const { loadTags } = useCognito()
      const result = await loadTags('us-east-1_abc')

      expect(cognitoApi.listTagsForResource).toHaveBeenCalledWith('us-east-1_abc')
      expect(result).toEqual({ env: 'dev' })
    })

    it('updateTags calls API', async () => {
      vi.mocked(cognitoApi.updateTags).mockResolvedValue(undefined)

      const { updateTags } = useCognito()
      await updateTags('us-east-1_abc', { env: 'prod' }, ['old-key'])

      expect(cognitoApi.updateTags).toHaveBeenCalledWith('us-east-1_abc', { env: 'prod' }, ['old-key'])
    })
  })

  describe('test login', () => {
    it('testUserLogin calls adminInitiateAuth with auth params', async () => {
      const mockResult = { AuthenticationResult: { AccessToken: 'token' } }
      vi.mocked(cognitoApi.adminInitiateAuth).mockResolvedValue(mockResult)

      const { testUserLogin } = useCognito()
      const result = await testUserLogin('us-east-1_abc', 'alice', 'Pass123!', 'client-1')

      expect(cognitoApi.adminInitiateAuth).toHaveBeenCalledWith('us-east-1_abc', 'client-1', 'ADMIN_USER_PASSWORD_AUTH', {
        USERNAME: 'alice',
        PASSWORD: 'Pass123!',
      })
      expect(result).toEqual(mockResult)
    })

    it('testUserLogin throws when clientId missing', async () => {
      const { testUserLogin } = useCognito()
      await expect(testUserLogin('us-east-1_abc', 'alice', 'Pass123!')).rejects.toThrow('A client ID is required')
    })
  })

  describe('helpers', () => {
    it('formatDate handles undefined', () => {
      const { formatDate } = useCognito()
      expect(formatDate(undefined)).toBe('-')
    })

    it('formatDate formats date string', () => {
      const { formatDate } = useCognito()
      const result = formatDate('2024-06-15')
      expect(result).toContain('15')
      expect(result).toContain('2024')
    })
  })

  describe('loadAll', () => {
    it('calls loadUserPools', async () => {
      vi.mocked(cognitoApi.listUserPools).mockResolvedValue({ UserPools: [] } as any)

      const { loadAll } = useCognito()
      await loadAll()

      expect(cognitoApi.listUserPools).toHaveBeenCalled()
    })
  })

  describe('codeExamples', () => {
    it('returns code examples', () => {
      const { codeExamples } = useCognito()
      expect(codeExamples.value.length).toBeGreaterThan(0)
      expect(codeExamples.value[0].language).toBe('aws-cli')
      const jsExample = codeExamples.value.find(e => e.language === 'javascript')
      expect(jsExample).toBeDefined()
      expect(jsExample!.code).toContain('CognitoIdentityProviderClient')
    })

    it('includes settings values in examples', () => {
      const { codeExamples } = useCognito()
      const jsExample = codeExamples.value.find(e => e.language === 'javascript')
      expect(jsExample).toBeDefined()
      expect(jsExample!.code).toContain('us-east-1')
    })

    it('includes new commands in examples', () => {
      const { codeExamples } = useCognito()
      const cliExample = codeExamples.value.find(e => e.language === 'aws-cli')
      expect(cliExample).toBeDefined()
      expect(cliExample!.code).toContain('admin-add-user-to-group')
      expect(cliExample!.code).toContain('admin-set-user-password')
      expect(cliExample!.code).toContain('list-resource-servers')
      expect(cliExample!.code).toContain('admin-initiate-auth')
      expect(cliExample!.code).not.toContain('list-identity-providers')
    })
  })
})