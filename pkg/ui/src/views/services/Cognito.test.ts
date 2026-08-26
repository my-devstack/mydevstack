import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const {
  mockListUserPools,
  mockCreateUserPool,
  mockDeleteUserPool,
  mockUpdateUserPool,
  mockListUsers,
  mockCreateUser,
  mockDeleteUser,
  mockListGroups,
  mockCreateGroup,
  mockDeleteGroup,
  mockListUserPoolClients,
  mockCreateUserPoolClient,
  mockDeleteUserPoolClient,
  mockUpdateUserPoolClient,
  mockListResourceServers,
  mockCreateResourceServer,
  mockDeleteResourceServer,
  mockListUsersInGroup,
  mockAddUserToGroup,
  mockRemoveUserFromGroup,
  mockAdminSetUserPassword,
  mockAdminInitiateAuth,
  mockListTagsForResource,
  mockUpdateTags,
  mockToastSuccess,
  mockToastError,
  mockToastInfo,
} = vi.hoisted(() => ({
  mockListUserPools: vi.fn(),
  mockCreateUserPool: vi.fn(),
  mockDeleteUserPool: vi.fn(),
  mockUpdateUserPool: vi.fn(),
  mockListUsers: vi.fn(),
  mockCreateUser: vi.fn(),
  mockDeleteUser: vi.fn(),
  mockListGroups: vi.fn(),
  mockCreateGroup: vi.fn(),
  mockDeleteGroup: vi.fn(),
  mockListUserPoolClients: vi.fn(),
  mockCreateUserPoolClient: vi.fn(),
  mockDeleteUserPoolClient: vi.fn(),
  mockUpdateUserPoolClient: vi.fn(),
  mockListResourceServers: vi.fn(),
  mockCreateResourceServer: vi.fn(),
  mockDeleteResourceServer: vi.fn(),
  mockListUsersInGroup: vi.fn(),
  mockAddUserToGroup: vi.fn(),
  mockRemoveUserFromGroup: vi.fn(),
  mockAdminSetUserPassword: vi.fn(),
  mockAdminInitiateAuth: vi.fn(),
  mockListTagsForResource: vi.fn(),
  mockUpdateTags: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockToastInfo: vi.fn(),
}))

vi.mock('@/api/services/cognito', () => ({
  listUserPools: mockListUserPools,
  createUserPool: mockCreateUserPool,
  deleteUserPool: mockDeleteUserPool,
  updateUserPool: mockUpdateUserPool,
  listUsers: mockListUsers,
  createUser: mockCreateUser,
  deleteUser: mockDeleteUser,
  listGroups: mockListGroups,
  createGroup: mockCreateGroup,
  deleteGroup: mockDeleteGroup,
  listUserPoolClients: mockListUserPoolClients,
  createUserPoolClient: mockCreateUserPoolClient,
  deleteUserPoolClient: mockDeleteUserPoolClient,
  updateUserPoolClient: mockUpdateUserPoolClient,
  listResourceServers: mockListResourceServers,
  createResourceServer: mockCreateResourceServer,
  deleteResourceServer: mockDeleteResourceServer,
  listUsersInGroup: mockListUsersInGroup,
  addUserToGroup: mockAddUserToGroup,
  removeUserFromGroup: mockRemoveUserFromGroup,
  adminSetUserPassword: mockAdminSetUserPassword,
  adminInitiateAuth: mockAdminInitiateAuth,
  listTagsForResource: mockListTagsForResource,
  updateTags: mockUpdateTags,
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError, info: mockToastInfo }),
}))

vi.mock('@/composables/useContentReload', () => ({
  useContentReload: () => ({ reloadTrigger: 0 }),
}))

import CognitoView from './Cognito.vue'

const stubs = {
  Button: { template: '<button><slot /></button>' },
  LoadingSpinner: true,
  EmptyState: true,
  Tabs: true,
  CodeSnippet: true,
  CognitoUserPoolList: true,
  CognitoCreateUserPoolModal: true,
  CognitoDeleteUserPoolModal: true,
  CognitoEditUserPoolModal: true,
  CognitoUserList: true,
  CognitoCreateUserModal: true,
  CognitoDeleteUserModal: true,
  CognitoGroupList: true,
  CognitoCreateGroupModal: true,
  CognitoDeleteGroupModal: true,
  CognitoUserPoolClientList: true,
  CognitoCreateUserPoolClientModal: true,
  CognitoEditUserPoolClientModal: true,
  CognitoDeleteUserPoolClientModal: true,
  CognitoResourceServerList: true,
  CognitoCreateResourceServerModal: true,
  CognitoDeleteResourceServerModal: true,
  CognitoGroupMembersModal: true,
  CognitoResetPasswordModal: true,
  CognitoTestLoginModal: true,
  CloudIcon: true,
  UserIcon: true,
  UserGroupIcon: true,
  KeyIcon: true,
  ServerIcon: true,
  PlusIcon: true,
}

/** Emit event on a stub component if it exists */
function emitOn(wrapper: any, componentName: string, event: string, ...args: any[]) {
  const comp = wrapper.findComponent({ name: componentName })
  if (comp.exists() && comp.vm) {
    comp.vm.$emit(event, ...args)
  }
}

describe('Cognito.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockListUserPools.mockResolvedValue({ UserPools: [] })
    mockUpdateUserPool.mockResolvedValue(undefined)
    mockListUsers.mockResolvedValue({ Users: [] })
    mockListGroups.mockResolvedValue({ Groups: [] })
    mockListUserPoolClients.mockResolvedValue({ UserPoolClients: [] })
    mockListResourceServers.mockResolvedValue({ ResourceServers: [] })
    mockListUsersInGroup.mockResolvedValue({ Users: [] })
    mockListTagsForResource.mockResolvedValue({ Tags: {} })
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(CognitoView, { global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders Cognito Management heading', () => {
    const wrapper = shallowMount(CognitoView, { global: { stubs } })
    expect(wrapper.text()).toContain('Cognito')
  })

  it('renders Tabs component', () => {
    const wrapper = shallowMount(CognitoView, { global: { stubs } })
    expect(wrapper.find('tabs-stub').exists()).toBe(true)
  })

  it('calls loadUserPools on mount', () => {
    shallowMount(CognitoView, { global: { stubs } })
    expect(mockListUserPools).toHaveBeenCalledTimes(1)
  })

  it('sets activeTab to pools by default', () => {
    const wrapper = shallowMount(CognitoView, { global: { stubs } })
    expect(wrapper.vm.activeTab).toBe('pools')
  })

  describe('user pools tab', () => {
    it('handles create user pool via modal emit', async () => {
      mockCreateUserPool.mockResolvedValue({})
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      emitOn(wrapper, 'CognitoCreateUserPoolModal', 'create', { PoolName: 'newpool' })
      await new Promise(process.nextTick)
      expect(mockCreateUserPool).toHaveBeenCalledWith({ PoolName: 'newpool' })
    })

    it('handles create user pool with empty name', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      emitOn(wrapper, 'CognitoCreateUserPoolModal', 'create', { PoolName: '' })
      await new Promise(process.nextTick)
      expect(mockCreateUserPool).not.toHaveBeenCalled()
    })

    it('handles delete user pool confirm via modal emit', async () => {
      mockDeleteUserPool.mockResolvedValue({})
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.poolToDelete = { Id: 'us-east-1_abc123', Name: 'my-pool' }
      await wrapper.vm.handleDeleteUserPool()
      expect(mockDeleteUserPool).toHaveBeenCalledWith('us-east-1_abc123')
    })

    it('handleDeleteUserPool without poolToDelete does nothing', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      await wrapper.vm.handleDeleteUserPool()
      expect(mockDeleteUserPool).not.toHaveBeenCalled()
    })

    it('openEditUserPoolModal loads tags and opens modal', async () => {
      mockListTagsForResource.mockResolvedValue({ Tags: { env: 'dev' } })
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      await wrapper.vm.openEditUserPoolModal({ Id: 'us-east-1_abc123', Name: 'my-pool' })
      expect(mockListTagsForResource).toHaveBeenCalledWith('us-east-1_abc123')
      expect(wrapper.vm.poolTags).toEqual({ env: 'dev' })
      expect(wrapper.vm.showEditUserPoolModal).toBe(true)
    })

    it('openEditUserPoolModal with API error keeps tags empty and opens modal', async () => {
      mockListTagsForResource.mockRejectedValue(new Error('Tags failed'))
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      await wrapper.vm.openEditUserPoolModal({ Id: 'us-east-1_abc123', Name: 'my-pool' })
      expect(wrapper.vm.poolTags).toEqual({})
      expect(wrapper.vm.showEditUserPoolModal).toBe(true)
      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('Tags failed'))
    })

    it('handleEditUserPool updates pool and tags', async () => {
      mockUpdateTags.mockResolvedValue({})
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.poolToEdit = { Id: 'us-east-1_abc123', Name: 'my-pool' }
      await wrapper.vm.handleEditUserPool('us-east-1_abc123', {
        PoolName: 'renamed',
        MfaConfiguration: 'ON',
        DeletionProtection: 'ACTIVE',
        Tags: { env: 'prod' },
        RemovedKeys: ['old-key'],
      })
      expect(mockUpdateTags).toHaveBeenCalledWith('us-east-1_abc123', { env: 'prod' }, ['old-key'])
      expect(wrapper.vm.showEditUserPoolModal).toBe(false)
    })

    it('handleEditUserPool without Tags skips updateTags', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.poolToEdit = { Id: 'us-east-1_abc123', Name: 'my-pool' }
      await wrapper.vm.handleEditUserPool('us-east-1_abc123', {
        PoolName: 'renamed',
        MfaConfiguration: 'ON',
        DeletionProtection: 'ACTIVE',
      })
      expect(mockUpdateUserPool).toHaveBeenCalledWith('us-east-1_abc123', {
        PoolName: 'renamed',
        MfaConfiguration: 'ON',
        DeletionProtection: 'ACTIVE',
      })
      expect(mockUpdateTags).not.toHaveBeenCalled()
      expect(wrapper.vm.showEditUserPoolModal).toBe(false)
    })

    it('handleEditUserPool with Tags but no RemovedKeys passes empty array', async () => {
      mockUpdateTags.mockResolvedValue({})
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.poolToEdit = { Id: 'us-east-1_abc123', Name: 'my-pool' }
      await wrapper.vm.handleEditUserPool('us-east-1_abc123', {
        PoolName: 'renamed',
        Tags: { env: 'prod' },
      })
      expect(mockUpdateTags).toHaveBeenCalledWith('us-east-1_abc123', { env: 'prod' }, [])
      expect(wrapper.vm.showEditUserPoolModal).toBe(false)
    })
  })

  describe('users tab', () => {
    it('loads users when tab changes with selected pool', async () => {
      mockListUserPools.mockResolvedValue({
        UserPools: [{ Id: 'us-east-1_abc123', Name: 'my-pool' }],
      })
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      await new Promise(process.nextTick)
      wrapper.vm.handleTabChange('users')
      await new Promise(process.nextTick)
      expect(wrapper.vm.selectedUserPoolId).toBe('us-east-1_abc123')
      expect(mockListUsers).toHaveBeenCalledWith('us-east-1_abc123')
    })

    it('handles create user via modal emit', async () => {
      mockCreateUser.mockResolvedValue({})
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'
      emitOn(wrapper, 'CognitoCreateUserModal', 'create', { Username: 'alice' })
      await new Promise(process.nextTick)
      expect(mockCreateUser).toHaveBeenCalledWith('us-east-1_abc123', {
        Username: 'alice',
        TemporaryPassword: undefined,
      })
    })

    it('handles create user with empty name', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'
      emitOn(wrapper, 'CognitoCreateUserModal', 'create', { Username: '' })
      await new Promise(process.nextTick)
      expect(mockCreateUser).not.toHaveBeenCalled()
    })

    it('handles create user without selected pool', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      emitOn(wrapper, 'CognitoCreateUserModal', 'create', { Username: 'alice' })
      await new Promise(process.nextTick)
      expect(mockCreateUser).not.toHaveBeenCalled()
    })

    it('handles delete user confirm', async () => {
      mockDeleteUser.mockResolvedValue({})
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'
      wrapper.vm.userToDelete = 'alice'
      await wrapper.vm.handleDeleteUser()
      expect(mockDeleteUser).toHaveBeenCalledWith('us-east-1_abc123', 'alice')
    })

    it('handleDeleteUser without userToDelete does nothing', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'
      await wrapper.vm.handleDeleteUser()
      expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    it('handleResetPassword calls adminSetUserPassword', async () => {
      mockAdminSetUserPassword.mockResolvedValue({})
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'
      wrapper.vm.userForPassword = 'alice'
      await wrapper.vm.handleResetPassword('NewPass123!', true)
      expect(mockAdminSetUserPassword).toHaveBeenCalledWith('us-east-1_abc123', 'alice', 'NewPass123!', true)
      expect(wrapper.vm.showResetPasswordModal).toBe(false)
    })

    it('handleTestLogin calls adminInitiateAuth and sets authResult', async () => {
      mockAdminInitiateAuth.mockResolvedValue({ AuthenticationResult: { AccessToken: 'token' } })
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'
      wrapper.vm.userForLogin = 'alice'
      await wrapper.vm.handleTestLogin('Pass123!', 'client-1')
      expect(mockAdminInitiateAuth).toHaveBeenCalledWith('us-east-1_abc123', 'client-1', 'ADMIN_USER_PASSWORD_AUTH', {
        USERNAME: 'alice',
        PASSWORD: 'Pass123!',
      })
      expect(wrapper.vm.authResult.AuthenticationResult.AccessToken).toBe('token')
    })

    it('handleTestLogin without clientId shows error and does not call API', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'
      wrapper.vm.userForLogin = 'alice'
      await wrapper.vm.handleTestLogin('Pass123!')
      expect(mockAdminInitiateAuth).not.toHaveBeenCalled()
    })

    it('handleTestLogin without userForLogin returns early', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'
      await wrapper.vm.handleTestLogin('Pass123!', 'client-1')
      expect(mockAdminInitiateAuth).not.toHaveBeenCalled()
    })
  })

  describe('groups tab', () => {
    it('loads groups when tab changes with selected pool', async () => {
      mockListUserPools.mockResolvedValue({
        UserPools: [{ Id: 'us-east-1_abc123', Name: 'my-pool' }],
      })
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      await new Promise(process.nextTick)
      wrapper.vm.handleTabChange('groups')
      await new Promise(process.nextTick)
      expect(mockListGroups).toHaveBeenCalledWith('us-east-1_abc123')
    })

    it('handles create group via modal emit', async () => {
      mockCreateGroup.mockResolvedValue({})
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'
      emitOn(wrapper, 'CognitoCreateGroupModal', 'create', { GroupName: 'developers' })
      await new Promise(process.nextTick)
      expect(mockCreateGroup).toHaveBeenCalledWith('us-east-1_abc123', {
        GroupName: 'developers',
        Description: undefined,
      })
    })

    it('handles create group with empty name', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'
      emitOn(wrapper, 'CognitoCreateGroupModal', 'create', { GroupName: '' })
      await new Promise(process.nextTick)
      expect(mockCreateGroup).not.toHaveBeenCalled()
    })

    it('handles delete group confirm', async () => {
      mockDeleteGroup.mockResolvedValue({})
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'
      wrapper.vm.groupToDelete = 'developers'
      await wrapper.vm.handleDeleteGroup()
      expect(mockDeleteGroup).toHaveBeenCalledWith('us-east-1_abc123', 'developers')
    })

    it('handleOpenMembers loads users in group and opens modal', async () => {
      mockListUsersInGroup.mockResolvedValue({ Users: [{ Username: 'alice' }] })
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'
      await wrapper.vm.handleOpenMembers({ GroupName: 'admins' })
      expect(mockListUsersInGroup).toHaveBeenCalledWith('us-east-1_abc123', 'admins')
      expect(wrapper.vm.groupMembers).toEqual([{ Username: 'alice' }])
      expect(wrapper.vm.showGroupMembersModal).toBe(true)
    })

    it('handleOpenMembers without selected pool returns early', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      await wrapper.vm.handleOpenMembers({ GroupName: 'admins' })
      expect(mockListUsersInGroup).not.toHaveBeenCalled()
      expect(wrapper.vm.showGroupMembersModal).toBe(false)
    })

    it('handleAddUserToGroup calls addUserToGroup and reloads members', async () => {
      mockAddUserToGroup.mockResolvedValue({})
      mockListUsersInGroup.mockResolvedValue({ Users: [] })
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'
      wrapper.vm.groupForMembers = { GroupName: 'admins' }
      await wrapper.vm.handleAddUserToGroup('alice')
      expect(mockAddUserToGroup).toHaveBeenCalledWith('us-east-1_abc123', 'alice', 'admins')
      expect(mockListUsersInGroup).toHaveBeenCalledWith('us-east-1_abc123', 'admins')
    })

    it('handleAddUserToGroup without pool or group returns early', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      await wrapper.vm.handleAddUserToGroup('alice')
      expect(mockAddUserToGroup).not.toHaveBeenCalled()
    })

    it('handleRemoveUserFromGroup calls removeUserFromGroup and reloads members', async () => {
      mockRemoveUserFromGroup.mockResolvedValue({})
      mockListUsersInGroup.mockResolvedValue({ Users: [] })
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'
      wrapper.vm.groupForMembers = { GroupName: 'admins' }
      await wrapper.vm.handleRemoveUserFromGroup('alice')
      expect(mockRemoveUserFromGroup).toHaveBeenCalledWith('us-east-1_abc123', 'alice', 'admins')
      expect(mockListUsersInGroup).toHaveBeenCalledWith('us-east-1_abc123', 'admins')
    })

    it('handleRemoveUserFromGroup without pool or group returns early', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      await wrapper.vm.handleRemoveUserFromGroup('alice')
      expect(mockRemoveUserFromGroup).not.toHaveBeenCalled()
    })
  })

  describe('clients tab', () => {
    it('loads clients when tab changes with selected pool', async () => {
      mockListUserPools.mockResolvedValue({
        UserPools: [{ Id: 'us-east-1_abc123', Name: 'my-pool' }],
      })
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      await new Promise(process.nextTick)
      wrapper.vm.handleTabChange('clients')
      await new Promise(process.nextTick)
      expect(mockListUserPoolClients).toHaveBeenCalledWith('us-east-1_abc123')
    })

    it('handles create client via modal emit', async () => {
      mockCreateUserPoolClient.mockResolvedValue({})
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'
      emitOn(wrapper, 'CognitoCreateUserPoolClientModal', 'create', { ClientName: 'web-app', GenerateSecret: true })
      await new Promise(process.nextTick)
      expect(mockCreateUserPoolClient).toHaveBeenCalledWith('us-east-1_abc123', {
        ClientName: 'web-app',
        GenerateSecret: true,
      })
    })

    it('handles delete client confirm', async () => {
      mockDeleteUserPoolClient.mockResolvedValue({})
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'
      wrapper.vm.clientToDelete = 'client-1'
      await wrapper.vm.handleDeleteUserPoolClient()
      expect(mockDeleteUserPoolClient).toHaveBeenCalledWith('us-east-1_abc123', 'client-1')
    })

    it('handles edit client', async () => {
      mockUpdateUserPoolClient.mockResolvedValue({})
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'
      await wrapper.vm.handleEditUserPoolClient('us-east-1_abc123', 'client-1', { ClientName: 'renamed' })
      expect(mockUpdateUserPoolClient).toHaveBeenCalledWith('us-east-1_abc123', 'client-1', { ClientName: 'renamed' })
    })
  })

  describe('resource servers tab', () => {
    it('loads resource servers when tab changes with selected pool', async () => {
      mockListUserPools.mockResolvedValue({
        UserPools: [{ Id: 'us-east-1_abc123', Name: 'my-pool' }],
      })
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      await new Promise(process.nextTick)
      wrapper.vm.handleTabChange('resource-servers')
      await new Promise(process.nextTick)
      expect(mockListResourceServers).toHaveBeenCalledWith('us-east-1_abc123')
    })

    it('handles create resource server via modal emit', async () => {
      mockCreateResourceServer.mockResolvedValue({})
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'
      emitOn(wrapper, 'CognitoCreateResourceServerModal', 'create', { Identifier: 'api.example.com', Name: 'API Server' })
      await new Promise(process.nextTick)
      expect(mockCreateResourceServer).toHaveBeenCalledWith('us-east-1_abc123', {
        Identifier: 'api.example.com',
        Name: 'API Server',
      })
    })

    it('handles delete resource server confirm', async () => {
      mockDeleteResourceServer.mockResolvedValue({})
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'
      wrapper.vm.resourceServerToDelete = 'api.example.com'
      await wrapper.vm.handleDeleteResourceServer()
      expect(mockDeleteResourceServer).toHaveBeenCalledWith('us-east-1_abc123', 'api.example.com')
    })
  })

  describe('tab switching and pool selection', () => {
    it('handleTabChange to pools does not load anything', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.handleTabChange('pools')
      expect(wrapper.vm.activeTab).toBe('pools')
      expect(mockListUsers).not.toHaveBeenCalled()
      expect(mockListGroups).not.toHaveBeenCalled()
      expect(mockListUserPoolClients).not.toHaveBeenCalled()
      expect(mockListResourceServers).not.toHaveBeenCalled()
    })

    it('handleTabChange to users with no pools does not load', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.handleTabChange('users')
      expect(wrapper.vm.activeTab).toBe('users')
      expect(mockListUsers).not.toHaveBeenCalled()
    })

    it('handleUserPoolSelect without selected pool returns early', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.activeTab = 'users'
      wrapper.vm.handleUserPoolSelect()
      expect(mockListUsers).not.toHaveBeenCalled()
      expect(mockListGroups).not.toHaveBeenCalled()
      expect(mockListUserPoolClients).not.toHaveBeenCalled()
      expect(mockListResourceServers).not.toHaveBeenCalled()
    })

    it('handleUserPoolSelect loads data for current tab', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.selectedUserPoolId = 'us-east-1_abc123'

      wrapper.vm.activeTab = 'users'
      wrapper.vm.handleUserPoolSelect()
      expect(mockListUsers).toHaveBeenCalledWith('us-east-1_abc123')

      wrapper.vm.activeTab = 'groups'
      wrapper.vm.handleUserPoolSelect()
      expect(mockListGroups).toHaveBeenCalledWith('us-east-1_abc123')

      wrapper.vm.activeTab = 'clients'
      wrapper.vm.handleUserPoolSelect()
      expect(mockListUserPoolClients).toHaveBeenCalledWith('us-east-1_abc123')

      wrapper.vm.activeTab = 'resource-servers'
      wrapper.vm.handleUserPoolSelect()
      expect(mockListResourceServers).toHaveBeenCalledWith('us-east-1_abc123')
    })
  })

  describe('load functions early returns', () => {
    it('loadUsers without selected pool returns early', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      await wrapper.vm.loadUsers()
      expect(mockListUsers).not.toHaveBeenCalled()
    })

    it('loadGroups without selected pool returns early', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      await wrapper.vm.loadGroups()
      expect(mockListGroups).not.toHaveBeenCalled()
    })

    it('loadUserPoolClients without selected pool returns early', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      await wrapper.vm.loadUserPoolClients()
      expect(mockListUserPoolClients).not.toHaveBeenCalled()
    })

    it('loadResourceServers without selected pool returns early', async () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      await wrapper.vm.loadResourceServers()
      expect(mockListResourceServers).not.toHaveBeenCalled()
    })
  })

  describe('create button', () => {
    it('openCreateModal opens correct modal per tab', () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.activeTab = 'pools'
      wrapper.vm.openCreateModal()
      expect(wrapper.vm.showCreateUserPoolModal).toBe(true)
      wrapper.vm.showCreateUserPoolModal = false
      wrapper.vm.activeTab = 'users'
      wrapper.vm.openCreateModal()
      expect(wrapper.vm.showCreateUserModal).toBe(true)
      wrapper.vm.showCreateUserModal = false
      wrapper.vm.activeTab = 'groups'
      wrapper.vm.openCreateModal()
      expect(wrapper.vm.showCreateGroupModal).toBe(true)
      wrapper.vm.showCreateGroupModal = false
      wrapper.vm.activeTab = 'clients'
      wrapper.vm.openCreateModal()
      expect(wrapper.vm.showCreateUserPoolClientModal).toBe(true)
      wrapper.vm.showCreateUserPoolClientModal = false
      wrapper.vm.activeTab = 'resource-servers'
      wrapper.vm.openCreateModal()
      expect(wrapper.vm.showCreateResourceServerModal).toBe(true)
    })
  })

  describe('computed counts', () => {
    it('computed counts are correct', () => {
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      wrapper.vm.userPools = [{ Id: 'p1', Name: 'pool1' }]
      wrapper.vm.users = [{ Username: 'u1' }, { Username: 'u2' }]
      wrapper.vm.groups = [{ GroupName: 'g1' }]
      wrapper.vm.userPoolClients = [{ ClientId: 'c1', ClientName: 'client1' }]
      wrapper.vm.resourceServers = [{ Identifier: 'r1', Name: 'server1' }]
      expect(wrapper.vm.userPoolCount).toBe(1)
      expect(wrapper.vm.userCount).toBe(2)
      expect(wrapper.vm.groupCount).toBe(1)
      expect(wrapper.vm.clientCount).toBe(1)
      expect(wrapper.vm.resourceServerCount).toBe(1)
    })
  })

  describe('error handling', () => {
    it('loadUserPools with API error shows error toast', async () => {
      mockListUserPools.mockRejectedValue(new Error('List failed'))
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      await new Promise(process.nextTick)
      expect(wrapper.vm.userPoolsError).toBe('List failed')
    })

    it('handleCreateUserPool with API error shows error toast', async () => {
      mockCreateUserPool.mockRejectedValue(new Error('Create failed'))
      const wrapper = shallowMount(CognitoView, { global: { stubs } })
      await wrapper.vm.handleCreateUserPool({ PoolName: 'newpool' })
      expect(mockCreateUserPool).toHaveBeenCalled()
    })
  })
})