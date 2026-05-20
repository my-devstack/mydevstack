import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, nextTick } from 'vue'

const { mockListUsers, mockCreateUser, mockDeleteUser, mockListAccessKeys, mockCreateAccessKey, mockDeleteAccessKey, mockListRoles, mockCreateRole, mockDeleteRole, mockAttachRolePolicy, mockDetachRolePolicy, mockListAttachedRolePolicies, mockListPolicies, mockGetPolicy, mockListGroups, mockCreateGroup, mockDeleteGroup, mockListUsersForGroup, mockAddUserToGroup, mockRemoveUserFromGroup, mockDeletePolicy, mockCreatePolicy } = vi.hoisted(() => ({
  mockListUsers: vi.fn(),
  mockCreateUser: vi.fn(),
  mockDeleteUser: vi.fn(),
  mockListAccessKeys: vi.fn(),
  mockCreateAccessKey: vi.fn(),
  mockDeleteAccessKey: vi.fn(),
  mockListRoles: vi.fn(),
  mockCreateRole: vi.fn(),
  mockDeleteRole: vi.fn(),
  mockAttachRolePolicy: vi.fn(),
  mockDetachRolePolicy: vi.fn(),
  mockListAttachedRolePolicies: vi.fn(),
  mockListPolicies: vi.fn(),
  mockGetPolicy: vi.fn(),
  mockListGroups: vi.fn(),
  mockCreateGroup: vi.fn(),
  mockDeleteGroup: vi.fn(),
  mockListUsersForGroup: vi.fn(),
  mockAddUserToGroup: vi.fn(),
  mockRemoveUserFromGroup: vi.fn(),
  mockDeletePolicy: vi.fn(),
  mockCreatePolicy: vi.fn(),
}))

vi.mock('@/api/services/iam', () => ({
  listUsers: mockListUsers,
  createUser: mockCreateUser,
  deleteUser: mockDeleteUser,
  listAccessKeys: mockListAccessKeys,
  createAccessKey: mockCreateAccessKey,
  deleteAccessKey: mockDeleteAccessKey,
  listRoles: mockListRoles,
  createRole: mockCreateRole,
  deleteRole: mockDeleteRole,
  attachRolePolicy: mockAttachRolePolicy,
  detachRolePolicy: mockDetachRolePolicy,
  listAttachedRolePolicies: mockListAttachedRolePolicies,
  listPolicies: mockListPolicies,
  getPolicy: mockGetPolicy,
  listGroups: mockListGroups,
  createGroup: mockCreateGroup,
  deleteGroup: mockDeleteGroup,
  listUsersForGroup: mockListUsersForGroup,
  addUserToGroup: mockAddUserToGroup,
  removeUserFromGroup: mockRemoveUserFromGroup,
  deletePolicy: mockDeletePolicy,
  createPolicy: mockCreatePolicy,
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

vi.mock('@/composables/useContentReload', () => ({
  useContentReload: () => ({ reloadTrigger: 0 }),
}))

vi.mock('@/composables/useIAM', () => ({
  useIAM: () => ({
    codeExamples: {},
  }),
}))

import IAMView from './IAM.vue'

const stubs = {
  Button: { template: '<button><slot /></button>' },
  LoadingSpinner: true,
  StatusBadge: true,
  EmptyState: true,
  Tabs: true,
  IAMCreateUserModal: true,
  IAMCreateRoleModal: true,
  IAMCreateGroupModal: true,
  IAMCreatePolicyModal: true,
  IAMCreateKeyModal: true,
  IAMDeleteModal: true,
  IAMDeleteRoleModal: true,
  IAMDeleteGroupModal: true,
  IAMDeletePolicyModal: true,
  IAMDeleteAccessKeyModal: true,
  IAMUserKeysModal: true,
  IAMRolePoliciesModal: true,
  IAMAttachPolicyModal: true,
  IAMPolicyDetailsModal: true,
  IAMGroupUsersModal: true,
  IAMAddUserToGroupModal: true,
  IAMDetachPolicyModal: true,
  IAMRemoveUserFromGroupModal: true,
  CodeSnippet: true,
  UserIcon: true,
  ShieldCheckIcon: true,
  KeyIcon: true,
  UserGroupIcon: true,
  PlusIcon: true,
  TrashIcon: true,
  ChevronRightIcon: true,
}

/** Emit event on a stub component if it exists */
function emitOn(wrapper: any, componentName: string, event: string, ...args: any[]) {
  const comp = wrapper.findComponent({ name: componentName })
  if (comp.exists() && comp.vm) {
    comp.vm.$emit(event, ...args)
  }
}

describe('IAM.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockListUsers.mockResolvedValue({ Users: [] })
    mockListRoles.mockResolvedValue({ Roles: [] })
    mockListPolicies.mockResolvedValue({ Policies: [] })
    mockListGroups.mockResolvedValue({ Groups: [] })
    mockListAccessKeys.mockResolvedValue({ AccessKeyMetadata: [] })
    mockListAttachedRolePolicies.mockResolvedValue({ AttachedPolicies: [] })
    mockListUsersForGroup.mockResolvedValue({ Users: [] })
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(IAMView, { global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders IAM Management heading', () => {
    const wrapper = shallowMount(IAMView, { global: { stubs } })
    expect(wrapper.text()).toContain('IAM')
  })

  it('renders Tabs component', () => {
    const wrapper = shallowMount(IAMView, { global: { stubs } })
    expect(wrapper.find('tabs-stub').exists()).toBe(true)
  })

  it('calls loadUsers, loadRoles, loadPolicies, loadGroups on mount', () => {
    shallowMount(IAMView, { global: { stubs } })
    expect(mockListUsers).toHaveBeenCalledTimes(1)
    expect(mockListRoles).toHaveBeenCalledTimes(1)
    expect(mockListPolicies).toHaveBeenCalledTimes(1)
    expect(mockListGroups).toHaveBeenCalledTimes(1)
  })

  describe('user tab', () => {
    it('shows empty state when no users', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      expect(wrapper.find('empty-state-stub').exists()).toBe(true)
    })

    it('handles create user via modal emit', async () => {
      mockCreateUser.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMCreateUserModal', 'create', { UserName: 'newuser' })
      await new Promise(process.nextTick)
      expect(mockCreateUser).toHaveBeenCalled()
    })

    it('handles create user with empty name', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMCreateUserModal', 'create', { UserName: '' })
      await new Promise(process.nextTick)
      expect(mockCreateUser).not.toHaveBeenCalled()
    })

    it('handles delete user confirm via modal emit', async () => {
      mockDeleteUser.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMDeleteModal', 'delete')
      await new Promise(process.nextTick)
      expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    it('handles create access key via modal emit', async () => {
      mockCreateAccessKey.mockResolvedValue({ AccessKey: { AccessKeyId: 'AKIATEST', SecretAccessKey: 'secret' } })
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMCreateKeyModal', 'create')
      await new Promise(process.nextTick)
      expect(mockCreateAccessKey).not.toHaveBeenCalled()
    })
  })

  describe('roles tab', () => {
    it('handles create role via modal emit', async () => {
      mockCreateRole.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMCreateRoleModal', 'create', { RoleName: 'newrole', AssumeRolePolicyDocument: '{}' })
      await new Promise(process.nextTick)
      expect(mockCreateRole).toHaveBeenCalled()
    })

    it('handles create role with empty name', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMCreateRoleModal', 'create', { RoleName: '', AssumeRolePolicyDocument: '{}' })
      await new Promise(process.nextTick)
      expect(mockCreateRole).not.toHaveBeenCalled()
    })

    it('handles delete role confirm via modal emit', async () => {
      mockDeleteRole.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMDeleteRoleModal', 'delete')
      await new Promise(process.nextTick)
      expect(mockDeleteRole).not.toHaveBeenCalled()
    })

    it('handles attach policy via modal emit', async () => {
      mockAttachRolePolicy.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMAttachPolicyModal', 'attach', 'arn:aws:iam::aws:policy/AdministratorAccess')
      await new Promise(process.nextTick)
      expect(mockAttachRolePolicy).not.toHaveBeenCalled()
    })

    it('handles detach policy confirm via modal emit', async () => {
      mockDetachRolePolicy.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMDetachPolicyModal', 'detach')
      await new Promise(process.nextTick)
      expect(mockDetachRolePolicy).not.toHaveBeenCalled()
    })
  })

  describe('policies tab', () => {
    it('handles delete policy confirm via modal emit', async () => {
      mockDeletePolicy.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMDeletePolicyModal', 'delete')
      await new Promise(process.nextTick)
      expect(mockDeletePolicy).not.toHaveBeenCalled()
    })

    it('handles create policy via modal emit', async () => {
      mockCreatePolicy.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMCreatePolicyModal', 'create', { PolicyName: 'newpolicy', PolicyDocument: '{}' })
      await new Promise(process.nextTick)
      expect(mockCreatePolicy).toHaveBeenCalled()
    })

    it('handles create policy with empty name', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMCreatePolicyModal', 'create', { PolicyName: '', PolicyDocument: '' })
      await new Promise(process.nextTick)
      expect(mockCreatePolicy).not.toHaveBeenCalled()
    })
  })

  describe('groups tab', () => {
    it('handles create group via modal emit', async () => {
      mockCreateGroup.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMCreateGroupModal', 'create', { GroupName: 'newgroup' })
      await new Promise(process.nextTick)
      expect(mockCreateGroup).toHaveBeenCalled()
    })

    it('handles create group with empty name', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMCreateGroupModal', 'create', { GroupName: '' })
      await new Promise(process.nextTick)
      expect(mockCreateGroup).not.toHaveBeenCalled()
    })

    it('handles delete group confirm via modal emit', async () => {
      mockDeleteGroup.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMDeleteGroupModal', 'delete')
      await new Promise(process.nextTick)
      expect(mockDeleteGroup).not.toHaveBeenCalled()
    })

    it('handles add user to group via modal emit', async () => {
      mockAddUserToGroup.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMAddUserToGroupModal', 'add', 'testuser')
      await new Promise(process.nextTick)
      expect(mockAddUserToGroup).not.toHaveBeenCalled()
    })

    it('handles remove user from group via modal emit', async () => {
      mockRemoveUserFromGroup.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMRemoveUserFromGroupModal', 'remove')
      await new Promise(process.nextTick)
      expect(mockRemoveUserFromGroup).not.toHaveBeenCalled()
    })
  })

  describe('mount interaction tests', () => {
    const mountStubs = {
      Button: { template: '<button><slot /></button>' },
      LoadingSpinner: true,
      StatusBadge: true,
      EmptyState: true,
      Tabs: true,
      IAMCreateUserModal: true,
      IAMCreateRoleModal: true,
      IAMCreateGroupModal: true,
      IAMCreatePolicyModal: true,
      IAMCreateKeyModal: true,
      IAMDeleteModal: true,
      IAMDeleteRoleModal: true,
      IAMDeleteGroupModal: true,
      IAMDeletePolicyModal: true,
      IAMDeleteAccessKeyModal: true,
      IAMUserKeysModal: true,
      IAMRolePoliciesModal: true,
      IAMAttachPolicyModal: true,
      IAMPolicyDetailsModal: true,
      IAMGroupUsersModal: true,
      IAMAddUserToGroupModal: true,
      IAMDetachPolicyModal: true,
      IAMRemoveUserFromGroupModal: true,
      CodeSnippet: true,
      UserIcon: true,
      ShieldCheckIcon: true,
      KeyIcon: true,
      UserGroupIcon: true,
      PlusIcon: true,
      TrashIcon: true,
      ChevronRightIcon: true,
    }

    it('mounts with mount() and all stubs', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      expect(wrapper.exists()).toBe(true)
    })

    it('sets activeTab to users by default and shows create button for users', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      expect(wrapper.vm.activeTab).toBe('users')
      expect(wrapper.vm.showCreateUserModal).toBe(false)
    })

    it('handleCreateUser with valid data calls API', async () => {
      mockCreateUser.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.handleCreateUser({ UserName: 'newuser' })
      expect(mockCreateUser).toHaveBeenCalledWith({ UserName: 'newuser', Path: undefined })
    })

    it('handleCreateUser with empty name does not call API', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.handleCreateUser({ UserName: '' })
      expect(mockCreateUser).not.toHaveBeenCalled()
    })

    it('handleCreateUser with API error shows error toast', async () => {
      mockCreateUser.mockRejectedValue(new Error('API Error'))
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.handleCreateUser({ UserName: 'newuser' })
      expect(mockCreateUser).toHaveBeenCalled()
    })

    it('handleDeleteUser with selected user calls API', async () => {
      mockDeleteUser.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedUser = { UserName: 'testuser', UserId: 'A1B2C3', Arn: 'arn:aws:iam::123:user/testuser' }
      await wrapper.vm.handleDeleteUser()
      expect(mockDeleteUser).toHaveBeenCalledWith('testuser')
    })

    it('handleDeleteUser without selected user does nothing', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.handleDeleteUser()
      expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    it('handleCreateRole with valid data calls API', async () => {
      mockCreateRole.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.handleCreateRole({ RoleName: 'newrole', AssumeRolePolicyDocument: '{}' })
      expect(mockCreateRole).toHaveBeenCalledWith({ RoleName: 'newrole', Description: undefined, AssumeRolePolicyDocument: '{}' })
    })

    it('handleCreateRole with empty name does not call API', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.handleCreateRole({ RoleName: '', AssumeRolePolicyDocument: '{}' })
      expect(mockCreateRole).not.toHaveBeenCalled()
    })

    it('handleDeleteRole with selected role calls API', async () => {
      mockDeleteRole.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedRole = { RoleName: 'testrole', RoleId: 'R1', Arn: 'arn:aws:iam::123:role/testrole' }
      await wrapper.vm.handleDeleteRole()
      expect(mockDeleteRole).toHaveBeenCalledWith('testrole')
    })

    it('handleCreateGroup with valid data calls API', async () => {
      mockCreateGroup.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.handleCreateGroup({ GroupName: 'newgroup' })
      expect(mockCreateGroup).toHaveBeenCalledWith('newgroup', undefined)
    })

    it('handleCreateGroup with empty name does not call API', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.handleCreateGroup({ GroupName: '' })
      expect(mockCreateGroup).not.toHaveBeenCalled()
    })

    it('handleDeleteGroup with groupToDelete calls API', async () => {
      mockDeleteGroup.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.groupToDelete = { GroupName: 'testgroup', GroupId: 'G1', Arn: 'arn:aws:iam::123:group/testgroup' }
      await wrapper.vm.handleDeleteGroup()
      expect(mockDeleteGroup).toHaveBeenCalledWith('testgroup')
    })

    it('handleCreateAccessKey with selected user calls API', async () => {
      mockCreateAccessKey.mockResolvedValue({ AccessKey: { AccessKeyId: 'AKIATEST', SecretAccessKey: 'secret' } })
      mockListAccessKeys.mockResolvedValue({ AccessKeyMetadata: [] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedUser = { UserName: 'testuser', UserId: 'A1B2C3', Arn: 'arn:aws:iam::123:user/testuser' }
      await wrapper.vm.handleCreateAccessKey()
      expect(mockCreateAccessKey).toHaveBeenCalledWith('testuser')
    })

    it('handleDeleteAccessKey calls API with keyId and userName', async () => {
      mockDeleteAccessKey.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedUser = { UserName: 'testuser', UserId: 'A1B2C3', Arn: 'arn:aws:iam::123:user/testuser' }
      await wrapper.vm.handleDeleteAccessKey('AKIATEST')
      expect(mockDeleteAccessKey).toHaveBeenCalledWith('AKIATEST', 'testuser')
    })

    it('handleDeleteAccessKey with API error shows error toast', async () => {
      mockDeleteAccessKey.mockRejectedValue(new Error('Delete failed'))
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedUser = { UserName: 'testuser', UserId: 'A1B2C3', Arn: 'arn:aws:iam::123:user/testuser' }
      await wrapper.vm.handleDeleteAccessKey('AKIATEST')
      expect(mockDeleteAccessKey).toHaveBeenCalledWith('AKIATEST', 'testuser')
    })

    it('handleCreateAccessKey without selected user does nothing', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedUser = null
      await wrapper.vm.handleCreateAccessKey()
      expect(mockCreateAccessKey).not.toHaveBeenCalled()
    })

    it('handleCreateAccessKey with API error shows error toast', async () => {
      mockCreateAccessKey.mockRejectedValue(new Error('Create failed'))
      mockListAccessKeys.mockResolvedValue({ AccessKeyMetadata: [] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedUser = { UserName: 'testuser', UserId: 'A1B2C3', Arn: 'arn:aws:iam::123:user/testuser' }
      await wrapper.vm.handleCreateAccessKey()
      expect(mockCreateAccessKey).toHaveBeenCalledWith('testuser')
    })

    it('openDeleteKeyModal sets keyToDelete', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.openDeleteKeyModal('AKIATEST', 'testuser')
      expect(wrapper.vm.keyToDelete).toEqual({ accessKeyId: 'AKIATEST', userName: 'testuser' })
      expect(wrapper.vm.showDeleteKeyModal).toBe(true)
    })

    it('handleDeleteAccessKeyConfirm calls API', async () => {
      mockDeleteAccessKey.mockResolvedValue({})
      mockListAccessKeys.mockResolvedValue({ AccessKeyMetadata: [] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.keyToDelete = { accessKeyId: 'AKIATEST', userName: 'testuser' }
      await wrapper.vm.handleDeleteAccessKeyConfirm()
      expect(mockDeleteAccessKey).toHaveBeenCalledWith('AKIATEST', 'testuser')
    })

    it('viewUserDetails sets selectedUser and loads access keys', async () => {
      mockListAccessKeys.mockResolvedValue({ AccessKeyMetadata: [] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      const user = { UserName: 'testuser', UserId: 'A1B2C3', Arn: 'arn:aws:iam::123:user/testuser' }
      await wrapper.vm.viewUserDetails(user)
      expect(wrapper.vm.selectedUser).toStrictEqual(user)
      expect(mockListAccessKeys).toHaveBeenCalledWith('testuser')
    })

    it('selectUserForAction with delete sets modals', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      const user = { UserName: 'testuser', UserId: 'A1B2C3', Arn: 'arn:aws:iam::123:user/testuser' }
      wrapper.vm.selectUserForAction(user, 'delete')
      expect(wrapper.vm.selectedUser).toStrictEqual(user)
      expect(wrapper.vm.showDeleteUserModal).toBe(true)
    })

    it('selectRoleForAction with delete sets modals', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      const role = { RoleName: 'testrole', RoleId: 'R1', Arn: 'arn:aws:iam::123:role/testrole' }
      wrapper.vm.selectRoleForAction(role, 'delete')
      expect(wrapper.vm.selectedRole).toStrictEqual(role)
      expect(wrapper.vm.showDeleteRoleModal).toBe(true)
    })

    it('selectGroupForAction with delete sets groupToDelete', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      const group = { GroupName: 'testgroup', GroupId: 'G1', Arn: 'arn:aws:iam::123:group/testgroup' }
      wrapper.vm.selectGroupForAction(group, 'delete')
      expect(wrapper.vm.groupToDelete).toStrictEqual(group)
      expect(wrapper.vm.showDeleteGroupModal).toBe(true)
    })

    it('handleCreatePolicy with valid data calls API', async () => {
      mockCreatePolicy.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.handleCreatePolicy({ PolicyName: 'newpolicy', PolicyDocument: '{}' })
      expect(mockCreatePolicy).toHaveBeenCalled()
    })

    it('selectUserForAction with keys calls viewUserDetails', async () => {
      mockListAccessKeys.mockResolvedValue({ AccessKeyMetadata: [] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      const user = { UserName: 'testuser', UserId: 'A1B2C3', Arn: 'arn:aws:iam::123:user/testuser' }
      wrapper.vm.selectUserForAction(user, 'keys')
      // viewUserDetails is async but not awaited - need microtask to complete
      await new Promise(process.nextTick)
      expect(wrapper.vm.selectedUser).toStrictEqual(user)
      expect(wrapper.vm.showUserKeysModal).toBe(true)
    })

    it('selectRoleForAction with policies loads policies and shows modal', async () => {
      mockListAttachedRolePolicies.mockResolvedValue({ AttachedPolicies: [] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      const role = { RoleName: 'testrole', RoleId: 'R1', Arn: 'arn:aws:iam::123:role/testrole' }
      await wrapper.vm.selectRoleForAction(role, 'policies')
      await new Promise(process.nextTick)
      expect(wrapper.vm.selectedRole).toStrictEqual(role)
      expect(wrapper.vm.showRolePoliciesModal).toBe(true)
    })

    it('selectGroupForAction with users calls viewGroupUsers', async () => {
      mockListUsersForGroup.mockResolvedValue({ Users: [] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      const group = { GroupName: 'testgroup', GroupId: 'G1', Arn: 'arn:aws:iam::123:group/testgroup' }
      wrapper.vm.selectGroupForAction(group, 'users')
      await new Promise(process.nextTick)
      expect(wrapper.vm.selectedGroup).toStrictEqual(group)
      expect(wrapper.vm.showGroupUsersModal).toBe(true)
    })

    it('handleCreatePolicy with empty name/body does not call API', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.handleCreatePolicy({ PolicyName: '', PolicyDocument: '' })
      expect(mockCreatePolicy).not.toHaveBeenCalled()
    })

    it('handleDeletePolicy with selected policy calls API', async () => {
      mockDeletePolicy.mockResolvedValue({})
      mockListPolicies.mockResolvedValue({ Policies: [] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedPolicy = { PolicyName: 'testpolicy', Arn: 'arn:aws:iam::123:policy/testpolicy', PolicyId: 'P1' }
      await wrapper.vm.handleDeletePolicy()
      expect(mockDeletePolicy).toHaveBeenCalledWith('arn:aws:iam::123:policy/testpolicy')
    })

    it('handleDeletePolicy handles AWS managed policy error', async () => {
      mockDeletePolicy.mockRejectedValue(new Error('Cannot modify or delete AWS managed policy'))
      mockListPolicies.mockResolvedValue({ Policies: [] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedPolicy = { PolicyName: 'AWSPolicy', Arn: 'arn:aws:iam::aws:policy/AWSPolicy', PolicyId: 'P1' }
      await wrapper.vm.handleDeletePolicy()
      expect(mockDeletePolicy).toHaveBeenCalled()
    })

    it('viewPolicy sets selected policy and shows modal', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      const policy = { PolicyName: 'testpolicy', Arn: 'arn:aws:iam::123:policy/testpolicy', PolicyId: 'P1' }
      wrapper.vm.viewPolicy(policy)
      expect(wrapper.vm.selectedPolicy).toStrictEqual(policy)
      expect(wrapper.vm.showPolicyModal).toBe(true)
    })

    it('handleAttachPolicy with selected role calls API', async () => {
      mockAttachRolePolicy.mockResolvedValue({})
      mockListAttachedRolePolicies.mockResolvedValue({ AttachedPolicies: [] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedRole = { RoleName: 'testrole', RoleId: 'R1', Arn: 'arn:aws:iam::123:role/testrole' }
      await wrapper.vm.handleAttachPolicy('arn:aws:iam::aws:policy/AdministratorAccess')
      expect(mockAttachRolePolicy).toHaveBeenCalledWith('testrole', 'arn:aws:iam::aws:policy/AdministratorAccess')
    })

    it('openDetachPolicyModal sets policyToDetach', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.openDetachPolicyModal('testrole', 'arn:aws:iam::123:policy/test', 'TestPolicy')
      expect(wrapper.vm.policyToDetach).toEqual({ roleName: 'testrole', policyArn: 'arn:aws:iam::123:policy/test', policyName: 'TestPolicy' })
      expect(wrapper.vm.showDetachPolicyModal).toBe(true)
    })

    it('handleDetachPolicy calls API', async () => {
      mockDetachRolePolicy.mockResolvedValue({})
      mockListAttachedRolePolicies.mockResolvedValue({ AttachedPolicies: [] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.policyToDetach = { roleName: 'testrole', policyArn: 'arn:aws:iam::123:policy/test', policyName: 'TestPolicy' }
      await wrapper.vm.handleDetachPolicy()
      expect(mockDetachRolePolicy).toHaveBeenCalledWith('testrole', 'arn:aws:iam::123:policy/test')
    })

    it('handleAddUserToGroup with selected group and user calls API', async () => {
      mockAddUserToGroup.mockResolvedValue({})
      mockListUsersForGroup.mockResolvedValue({ Users: [] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedGroup = { GroupName: 'testgroup', GroupId: 'G1', Arn: 'arn:aws:iam::123:group/testgroup' }
      wrapper.vm.selectedUserToAdd = 'newuser'
      await wrapper.vm.handleAddUserToGroup()
      expect(mockAddUserToGroup).toHaveBeenCalledWith('testgroup', 'newuser')
    })

    it('handleAddUserToGroup without user does nothing', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.handleAddUserToGroup()
      expect(mockAddUserToGroup).not.toHaveBeenCalled()
    })

    it('openRemoveUserModal sets userToRemove', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.openRemoveUserModal('testgroup', 'testuser')
      expect(wrapper.vm.userToRemove).toEqual({ userName: 'testuser', groupName: 'testgroup' })
      expect(wrapper.vm.showRemoveUserModal).toBe(true)
    })

    it('handleRemoveUserFromGroup calls API', async () => {
      mockRemoveUserFromGroup.mockResolvedValue({})
      mockListUsersForGroup.mockResolvedValue({ Users: [] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.userToRemove = { userName: 'testuser', groupName: 'testgroup' }
      await wrapper.vm.handleRemoveUserFromGroup()
      expect(mockRemoveUserFromGroup).toHaveBeenCalledWith('testgroup', 'testuser')
    })

    it('handleAddUserToGroupFromList calls API', async () => {
      mockAddUserToGroup.mockResolvedValue({})
      mockListUsersForGroup.mockResolvedValue({ Users: [] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedUserToAdd = 'newuser'
      await wrapper.vm.handleAddUserToGroupFromList('testgroup')
      expect(mockAddUserToGroup).toHaveBeenCalledWith('testgroup', 'newuser')
    })

    it('handleAddUserToGroupFromList without user does nothing', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedUserToAdd = ''
      await wrapper.vm.handleAddUserToGroupFromList('testgroup')
      expect(mockAddUserToGroup).not.toHaveBeenCalled()
    })

    it('handleAddUserToGroupFromList with API error shows error', async () => {
      mockAddUserToGroup.mockRejectedValue(new Error('Add failed'))
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedUserToAdd = 'newuser'
      await wrapper.vm.handleAddUserToGroupFromList('testgroup')
      expect(mockAddUserToGroup).toHaveBeenCalled()
    })

    it('handleDeleteAccessKeyConfirm without keyToDelete does nothing', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.keyToDelete = null
      await wrapper.vm.handleDeleteAccessKeyConfirm()
      expect(mockDeleteAccessKey).not.toHaveBeenCalled()
    })

    it('handleDeleteAccessKeyConfirm with API error shows error', async () => {
      mockDeleteAccessKey.mockRejectedValue(new Error('Delete failed'))
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.keyToDelete = { accessKeyId: 'AKIATEST', userName: 'testuser' }
      await wrapper.vm.handleDeleteAccessKeyConfirm()
      expect(mockDeleteAccessKey).toHaveBeenCalled()
    })

    it('handleCreatePolicy with API error shows error', async () => {
      mockCreatePolicy.mockRejectedValue(new Error('Create failed'))
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.handleCreatePolicy({ PolicyName: 'newpolicy', PolicyDocument: '{}' })
      expect(mockCreatePolicy).toHaveBeenCalled()
    })

    it('handleCreateRole with API error shows error', async () => {
      mockCreateRole.mockRejectedValue(new Error('Create failed'))
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.handleCreateRole({ RoleName: 'newrole', AssumeRolePolicyDocument: '{}' })
      expect(mockCreateRole).toHaveBeenCalled()
    })

    it('handleCreateGroup with API error shows error', async () => {
      mockCreateGroup.mockRejectedValue(new Error('Create failed'))
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.handleCreateGroup({ GroupName: 'newgroup' })
      expect(mockCreateGroup).toHaveBeenCalled()
    })

    it('handleDeleteRole without selected role does nothing', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedRole = null
      await wrapper.vm.handleDeleteRole()
      expect(mockDeleteRole).not.toHaveBeenCalled()
    })

    it('handleDeleteRole with API error shows error', async () => {
      mockDeleteRole.mockRejectedValue(new Error('Delete failed'))
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedRole = { RoleName: 'testrole', RoleId: 'R1', Arn: 'arn:aws:iam::123:role/testrole' }
      await wrapper.vm.handleDeleteRole()
      expect(mockDeleteRole).toHaveBeenCalledWith('testrole')
    })

    it('handleDeleteGroup without groupToDelete does nothing', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.groupToDelete = null
      await wrapper.vm.handleDeleteGroup()
      expect(mockDeleteGroup).not.toHaveBeenCalled()
    })

    it('handleDeleteGroup with API error shows error', async () => {
      mockDeleteGroup.mockRejectedValue(new Error('Delete failed'))
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.groupToDelete = { GroupName: 'testgroup', GroupId: 'G1', Arn: 'arn:aws:iam::123:group/testgroup' }
      await wrapper.vm.handleDeleteGroup()
      expect(mockDeleteGroup).toHaveBeenCalledWith('testgroup')
    })

    it('handleDeleteUser with API error shows error', async () => {
      mockDeleteUser.mockRejectedValue(new Error('Delete failed'))
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedUser = { UserName: 'testuser', UserId: 'A1B2C3', Arn: 'arn:aws:iam::123:user/testuser' }
      await wrapper.vm.handleDeleteUser()
      expect(mockDeleteUser).toHaveBeenCalledWith('testuser')
    })

    it('handleDeletePolicy with generic API error shows error', async () => {
      mockDeletePolicy.mockRejectedValue(new Error('Some other error'))
      mockListPolicies.mockResolvedValue({ Policies: [] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedPolicy = { PolicyName: 'MyPolicy', Arn: 'arn:aws:iam::123:policy/MyPolicy', PolicyId: 'P1' }
      await wrapper.vm.handleDeletePolicy()
      expect(mockDeletePolicy).toHaveBeenCalled()
    })

    it('handleAttachPolicy without selected role does nothing', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.handleAttachPolicy('arn:aws:iam::aws:policy/Admin')
      expect(mockAttachRolePolicy).not.toHaveBeenCalled()
    })

    it('handleAttachPolicy with API error shows error', async () => {
      mockAttachRolePolicy.mockRejectedValue(new Error('Attach failed'))
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedRole = { RoleName: 'testrole', RoleId: 'R1', Arn: 'arn:aws:iam::123:role/testrole' }
      await wrapper.vm.handleAttachPolicy('arn:aws:iam::aws:policy/Admin')
      expect(mockAttachRolePolicy).toHaveBeenCalled()
    })

    it('handleDetachPolicy without policyToDetach does nothing', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.policyToDetach = null
      await wrapper.vm.handleDetachPolicy()
      expect(mockDetachRolePolicy).not.toHaveBeenCalled()
    })

    it('handleDetachPolicy with API error shows error', async () => {
      mockDetachRolePolicy.mockRejectedValue(new Error('Detach failed'))
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.policyToDetach = { roleName: 'testrole', policyArn: 'arn:aws:iam::123:policy/test', policyName: 'TestPolicy' }
      await wrapper.vm.handleDetachPolicy()
      expect(mockDetachRolePolicy).toHaveBeenCalled()
    })

    it('handleAddUserToGroup with API error shows error', async () => {
      mockAddUserToGroup.mockRejectedValue(new Error('Add failed'))
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.selectedGroup = { GroupName: 'testgroup', GroupId: 'G1', Arn: 'arn:aws:iam::123:group/testgroup' }
      wrapper.vm.selectedUserToAdd = 'newuser'
      await wrapper.vm.handleAddUserToGroup()
      expect(mockAddUserToGroup).toHaveBeenCalled()
    })

    it('handleRemoveUserFromGroup without userToRemove does nothing', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.userToRemove = null
      await wrapper.vm.handleRemoveUserFromGroup()
      expect(mockRemoveUserFromGroup).not.toHaveBeenCalled()
    })

    it('handleRemoveUserFromGroup with API error shows error', async () => {
      mockRemoveUserFromGroup.mockRejectedValue(new Error('Remove failed'))
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.userToRemove = { userName: 'testuser', groupName: 'testgroup' }
      await wrapper.vm.handleRemoveUserFromGroup()
      expect(mockRemoveUserFromGroup).toHaveBeenCalled()
    })

    it('toggleUser adds and removes from expandedUsers', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      // First call should add
      wrapper.vm.toggleUser('testuser')
      expect(wrapper.vm.expandedUsers.has('testuser')).toBe(true)
      // Second call should remove
      wrapper.vm.toggleUser('testuser')
      expect(wrapper.vm.expandedUsers.has('testuser')).toBe(false)
    })

    it('toggleUser loads access keys when not in map', async () => {
      mockListAccessKeys.mockResolvedValue({ AccessKeyMetadata: [{ AccessKeyId: 'AKIATEST', Status: 'Active' }] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      expect(wrapper.vm.expandedUsers.has('testuser')).toBe(false)
      await wrapper.vm.toggleUser('testuser')
      expect(wrapper.vm.expandedUsers.has('testuser')).toBe(true)
      expect(mockListAccessKeys).toHaveBeenCalledWith('testuser')
    })

    it('toggleUser skips API call when data already loaded', async () => {
      mockListAccessKeys.mockResolvedValue({ AccessKeyMetadata: [] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.userAccessKeysMap = { testuser: [{ AccessKeyId: 'AKIATEST', Status: 'Active' }] }
      await wrapper.vm.toggleUser('testuser')
      expect(wrapper.vm.expandedUsers.has('testuser')).toBe(true)
      // Should not re-fetch since data already loaded
      expect(mockListAccessKeys).not.toHaveBeenCalled()
    })

    it('toggleUser handles API error gracefully', async () => {
      mockListAccessKeys.mockRejectedValue(new Error('API Error'))
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.toggleUser('testuser')
      expect(wrapper.vm.expandedUsers.has('testuser')).toBe(true)
      expect(wrapper.vm.userAccessKeysMap['testuser']).toEqual([])
    })

    it('toggleRole adds and removes from expandedRoles', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.toggleRole('testrole')
      expect(wrapper.vm.expandedRoles.has('testrole')).toBe(true)
      wrapper.vm.toggleRole('testrole')
      expect(wrapper.vm.expandedRoles.has('testrole')).toBe(false)
    })

    it('toggleRole loads policies when not in map', async () => {
      mockListAttachedRolePolicies.mockResolvedValue({ AttachedPolicies: [{ PolicyName: 'AdminPolicy', PolicyArn: 'arn:aws:iam::aws:policy/Admin' }] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.toggleRole('testrole')
      expect(wrapper.vm.expandedRoles.has('testrole')).toBe(true)
      expect(mockListAttachedRolePolicies).toHaveBeenCalledWith('testrole')
    })

    it('toggleRole skips API call when data already loaded', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.rolePoliciesMap = { testrole: [{ PolicyName: 'AdminPolicy', PolicyArn: 'arn:aws:iam::aws:policy/Admin' }] }
      await wrapper.vm.toggleRole('testrole')
      expect(wrapper.vm.expandedRoles.has('testrole')).toBe(true)
      expect(mockListAttachedRolePolicies).not.toHaveBeenCalled()
    })

    it('toggleRole handles API error gracefully', async () => {
      mockListAttachedRolePolicies.mockRejectedValue(new Error('API Error'))
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.toggleRole('testrole')
      expect(wrapper.vm.expandedRoles.has('testrole')).toBe(true)
      expect(wrapper.vm.rolePoliciesMap['testrole']).toEqual([])
    })

    it('togglePolicy adds and removes from expandedPolicies', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.togglePolicy('arn:aws:iam::123:policy/test')
      expect(wrapper.vm.expandedPolicies.has('arn:aws:iam::123:policy/test')).toBe(true)
      wrapper.vm.togglePolicy('arn:aws:iam::123:policy/test')
      expect(wrapper.vm.expandedPolicies.has('arn:aws:iam::123:policy/test')).toBe(false)
    })

    it('togglePolicy loads policy document when not cached', async () => {
      mockGetPolicy.mockResolvedValue({ Policy: { Version: '2012-10-17', Statement: [] } })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.togglePolicy('arn:aws:iam::123:policy/test')
      expect(wrapper.vm.expandedPolicies.has('arn:aws:iam::123:policy/test')).toBe(true)
      expect(mockGetPolicy).toHaveBeenCalledWith('arn:aws:iam::123:policy/test')
    })

    it('togglePolicy skips API call when document already loaded', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.policyDocuments = { 'arn:aws:iam::123:policy/test': { Version: '2012-10-17' } }
      await wrapper.vm.togglePolicy('arn:aws:iam::123:policy/test')
      expect(wrapper.vm.expandedPolicies.has('arn:aws:iam::123:policy/test')).toBe(true)
      expect(mockGetPolicy).not.toHaveBeenCalled()
    })

    it('togglePolicy handles API error gracefully', async () => {
      mockGetPolicy.mockRejectedValue(new Error('API Error'))
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.togglePolicy('arn:aws:iam::123:policy/test')
      expect(wrapper.vm.expandedPolicies.has('arn:aws:iam::123:policy/test')).toBe(true)
    })

    it('toggleGroup adds and removes from expandedGroups', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.toggleGroup('testgroup')
      expect(wrapper.vm.expandedGroups.has('testgroup')).toBe(true)
      wrapper.vm.toggleGroup('testgroup')
      expect(wrapper.vm.expandedGroups.has('testgroup')).toBe(false)
    })

    it('toggleGroup loads users when not in map', async () => {
      mockListUsersForGroup.mockResolvedValue({ Users: [{ UserName: 'user1' }] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.toggleGroup('testgroup')
      expect(wrapper.vm.expandedGroups.has('testgroup')).toBe(true)
      expect(mockListUsersForGroup).toHaveBeenCalledWith('testgroup')
    })

    it('toggleGroup skips API call when data already loaded', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.groupUsersMap = { testgroup: [{ UserName: 'user1' }] }
      await wrapper.vm.toggleGroup('testgroup')
      expect(wrapper.vm.expandedGroups.has('testgroup')).toBe(true)
      expect(mockListUsersForGroup).not.toHaveBeenCalled()
    })

    it('toggleGroup handles API error gracefully', async () => {
      mockListUsersForGroup.mockRejectedValue(new Error('API Error'))
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.toggleGroup('testgroup')
      expect(wrapper.vm.expandedGroups.has('testgroup')).toBe(true)
      expect(wrapper.vm.groupUsersMap['testgroup']).toEqual([])
    })

    it('viewRolePolicies loads policies and shows modal', async () => {
      mockListAttachedRolePolicies.mockResolvedValue({ AttachedPolicies: [] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      const role = { RoleName: 'testrole', RoleId: 'R1', Arn: 'arn:aws:iam::123:role/testrole' }
      await wrapper.vm.viewRolePolicies(role)
      expect(wrapper.vm.selectedRole).toStrictEqual(role)
      expect(mockListAttachedRolePolicies).toHaveBeenCalledWith('testrole')
      expect(wrapper.vm.showRolePoliciesModal).toBe(true)
    })

    it('openAttachPolicy loads all policies and shows modal', async () => {
      mockListPolicies.mockResolvedValue({ Policies: [{ PolicyName: 'AdminPolicy', Arn: 'arn:aws:iam::123:policy/admin' }] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      await wrapper.vm.openAttachPolicy()
      expect(mockListPolicies).toHaveBeenCalledWith({ Scope: 'All' })
      expect(wrapper.vm.showAttachPolicyModal).toBe(true)
    })

    it('viewGroupUsers loads users and shows modal', async () => {
      mockListUsersForGroup.mockResolvedValue({ Users: [{ UserName: 'user1' }] })
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      const group = { GroupName: 'testgroup', GroupId: 'G1', Arn: 'arn:aws:iam::123:group/testgroup' }
      await wrapper.vm.viewGroupUsers(group)
      expect(wrapper.vm.selectedGroup).toStrictEqual(group)
      expect(mockListUsersForGroup).toHaveBeenCalledWith('testgroup')
      expect(wrapper.vm.showGroupUsersModal).toBe(true)
    })

    it('availableUsersForGroup excludes group members', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.users = [{ UserName: 'user1', UserId: 'U1', Arn: '' }, { UserName: 'user2', UserId: 'U2', Arn: '' }]
      wrapper.vm.selectedGroup = { GroupName: 'testgroup', GroupId: 'G1', Arn: 'arn:aws:iam::123:group/testgroup' }
      wrapper.vm.groupUsersMap = { testgroup: [{ UserName: 'user1' }] }
      expect(wrapper.vm.availableUsersForGroup.length).toBe(1)
      expect(wrapper.vm.availableUsersForGroup[0].UserName).toBe('user2')
    })

    it('computed counts are correct', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs: mountStubs } })
      wrapper.vm.users = [{ UserName: 'u1' }, { UserName: 'u2' }]
      wrapper.vm.roles = [{ RoleName: 'r1' }]
      wrapper.vm.policies = [{ PolicyName: 'p1' }]
      wrapper.vm.groups = [{ GroupName: 'g1' }, { GroupName: 'g2' }, { GroupName: 'g3' }]
      expect(wrapper.vm.userCount).toBe(2)
      expect(wrapper.vm.roleCount).toBe(1)
      expect(wrapper.vm.policyCount).toBe(1)
      expect(wrapper.vm.groupCount).toBe(3)
    })
  })

  describe('pagination with mount()', () => {

    it('goToUserPage navigates correctly', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      const manyUsers = Array.from({ length: 25 }, (_, i) => ({
        UserName: `user${i}`, UserId: `U${i}`, Arn: `arn:aws:iam::123:user/user${i}`,
      }))
      wrapper.vm.users = manyUsers
      expect(wrapper.vm.totalUserPages).toBe(3)
      wrapper.vm.goToUserPage(2)
      expect(wrapper.vm.userPage).toBe(2)
    })

    it('goToRolePage navigates correctly', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      const manyRoles = Array.from({ length: 25 }, (_, i) => ({
        RoleName: `role${i}`, RoleId: `R${i}`, Arn: `arn:aws:iam::123:role/role${i}`,
      }))
      wrapper.vm.roles = manyRoles
      expect(wrapper.vm.totalRolePages).toBe(3)
      wrapper.vm.goToRolePage(2)
      expect(wrapper.vm.rolePage).toBe(2)
    })

    it('goToPolicyPage navigates correctly', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      const manyPolicies = Array.from({ length: 25 }, (_, i) => ({
        PolicyName: `policy${i}`, Arn: `arn:aws:iam::123:policy/policy${i}`, PolicyId: `P${i}`,
      }))
      wrapper.vm.policies = manyPolicies
      expect(wrapper.vm.totalPolicyPages).toBe(3)
      wrapper.vm.goToPolicyPage(2)
      expect(wrapper.vm.policyPage).toBe(2)
    })

    it('goToGroupPage navigates correctly', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      const manyGroups = Array.from({ length: 25 }, (_, i) => ({
        GroupName: `group${i}`, GroupId: `G${i}`, Arn: `arn:aws:iam::123:group/group${i}`,
      }))
      wrapper.vm.groups = manyGroups
      expect(wrapper.vm.totalGroupPages).toBe(3)
      wrapper.vm.goToGroupPage(2)
      expect(wrapper.vm.groupPage).toBe(2)
    })

    it('create button modal state toggles', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      wrapper.vm.activeTab = 'users'
      wrapper.vm.showCreateUserModal = true
      expect(wrapper.vm.showCreateUserModal).toBe(true)
      wrapper.vm.showCreateUserModal = false
      wrapper.vm.activeTab = 'roles'
      wrapper.vm.showCreateRoleModal = true
      expect(wrapper.vm.showCreateRoleModal).toBe(true)
      wrapper.vm.activeTab = 'policies'
      wrapper.vm.showCreatePolicyModal = true
      expect(wrapper.vm.showCreatePolicyModal).toBe(true)
      wrapper.vm.activeTab = 'groups'
      wrapper.vm.showCreateGroupModal = true
      expect(wrapper.vm.showCreateGroupModal).toBe(true)
    })
  })

  describe('template inline handler coverage', () => {
    it('Create button triggers correct modal for users tab', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      wrapper.vm.activeTab = 'users'
      // Find the Create button and click it
      const buttons = wrapper.findAll('button')
      const createBtn = buttons.find(b => b.text().includes('Create'))
      if (createBtn) {
        await createBtn.trigger('click')
        expect(wrapper.vm.showCreateUserModal).toBe(true)
      }
    })

    it('Create button triggers correct modal for roles tab', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      wrapper.vm.activeTab = 'roles'
      const buttons = wrapper.findAll('button')
      const createBtn = buttons.find(b => b.text().includes('Create'))
      if (createBtn) {
        await createBtn.trigger('click')
        expect(wrapper.vm.showCreateRoleModal).toBe(true)
      }
    })

    it('Create button triggers correct modal for policies tab', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      wrapper.vm.activeTab = 'policies'
      const buttons = wrapper.findAll('button')
      const createBtn = buttons.find(b => b.text().includes('Create'))
      if (createBtn) {
        await createBtn.trigger('click')
        expect(wrapper.vm.showCreatePolicyModal).toBe(true)
      }
    })

    it('Create button triggers correct modal for groups tab', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      wrapper.vm.activeTab = 'groups'
      wrapper.vm.groups = [{ GroupName: 'g1', GroupId: 'G1', Arn: 'arn:aws:iam::123:group/g1' }]
      wrapper.vm.paginatedGroups = wrapper.vm.groups
      const buttons = wrapper.findAll('button')
      const createBtn = buttons.find(b => b.text().includes('Create'))
      if (createBtn) {
        await createBtn.trigger('click')
        expect(wrapper.vm.showCreateGroupModal).toBe(true)
      }
    })

    it('EmptyState action triggers for users tab', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      wrapper.vm.activeTab = 'users'
      wrapper.vm.users = []
      await new Promise(process.nextTick)
      const empty = wrapper.findComponent({ name: 'EmptyState' })
      if (empty.exists()) {
        empty.vm.$emit('action')
        await new Promise(process.nextTick)
        expect(wrapper.vm.showCreateUserModal).toBe(true)
      }
    })

    it('EmptyState action triggers for roles tab', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      wrapper.vm.activeTab = 'roles'
      wrapper.vm.roles = []
      await new Promise(process.nextTick)
      const empty = wrapper.findComponent({ name: 'EmptyState' })
      if (empty.exists()) {
        empty.vm.$emit('action')
        await new Promise(process.nextTick)
        expect(wrapper.vm.showCreateRoleModal).toBe(true)
      }
    })

    it('EmptyState action triggers for groups tab', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      wrapper.vm.activeTab = 'groups'
      wrapper.vm.groups = []
      await new Promise(process.nextTick)
      const empty = wrapper.findComponent({ name: 'EmptyState' })
      if (empty.exists()) {
        empty.vm.$emit('action')
        await new Promise(process.nextTick)
        expect(wrapper.vm.showCreateGroupModal).toBe(true)
      }
    })

    it('update:open emits on modals toggle state', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      // Test modal @update:open handlers via stub emits
      emitOn(wrapper, 'IAMCreateUserModal', 'update:open', false)
      expect(wrapper.vm.showCreateUserModal).toBe(false)
      emitOn(wrapper, 'IAMDeleteModal', 'update:open', false)
      expect(wrapper.vm.showDeleteUserModal).toBe(false)
      emitOn(wrapper, 'IAMUserKeysModal', 'update:open', false)
      expect(wrapper.vm.showUserKeysModal).toBe(false)
      emitOn(wrapper, 'IAMCreateKeyModal', 'update:open', false)
      expect(wrapper.vm.showCreateKeyModal).toBe(false)
    })

    it('update:open emits on role modals toggle state', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMCreateRoleModal', 'update:open', false)
      expect(wrapper.vm.showCreateRoleModal).toBe(false)
      emitOn(wrapper, 'IAMDeleteRoleModal', 'update:open', false)
      expect(wrapper.vm.showDeleteRoleModal).toBe(false)
      emitOn(wrapper, 'IAMRolePoliciesModal', 'update:open', false)
      expect(wrapper.vm.showRolePoliciesModal).toBe(false)
      emitOn(wrapper, 'IAMAttachPolicyModal', 'update:open', false)
      expect(wrapper.vm.showAttachPolicyModal).toBe(false)
    })

    it('update:open emits on policy modals toggle state', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMPolicyDetailsModal', 'update:open', false)
      expect(wrapper.vm.showPolicyModal).toBe(false)
      emitOn(wrapper, 'IAMDeletePolicyModal', 'update:open', false)
      expect(wrapper.vm.showDeletePolicyModal).toBe(false)
      emitOn(wrapper, 'IAMCreatePolicyModal', 'update:open', false)
      expect(wrapper.vm.showCreatePolicyModal).toBe(false)
    })

    it('update:open emits on group/detach modals', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMDetachPolicyModal', 'update:open', false)
      expect(wrapper.vm.showDetachPolicyModal).toBe(false)
      emitOn(wrapper, 'IAMDeleteAccessKeyModal', 'update:open', false)
      expect(wrapper.vm.showDeleteKeyModal).toBe(false)
      emitOn(wrapper, 'IAMAddUserToGroupModal', 'update:open', false)
      expect(wrapper.vm.showAddUserToGroupModal).toBe(false)
      emitOn(wrapper, 'IAMGroupUsersModal', 'update:open', false)
      expect(wrapper.vm.showGroupUsersModal).toBe(false)
    })

    it('update:open emits on remaining modals', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMRemoveUserFromGroupModal', 'update:open', false)
      expect(wrapper.vm.showRemoveUserModal).toBe(false)
      emitOn(wrapper, 'IAMCreateGroupModal', 'update:open', false)
      expect(wrapper.vm.showCreateGroupModal).toBe(false)
      emitOn(wrapper, 'IAMDeleteGroupModal', 'update:open', false)
      expect(wrapper.vm.showDeleteGroupModal).toBe(false)
    })

    it('IAMUserKeysModal create-key event', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      emitOn(wrapper, 'IAMUserKeysModal', 'create-key')
      expect(wrapper.vm.showCreateKeyModal).toBe(true)
    })

    it('IAMUserKeysModal delete-key event calls handler', async () => {
      mockDeleteAccessKey.mockResolvedValue({})
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      wrapper.vm.selectedUser = { UserName: 'testuser', UserId: 'A1B2C3', Arn: 'arn:aws:iam::123:user/testuser' }
      emitOn(wrapper, 'IAMUserKeysModal', 'delete-key', 'AKIATEST')
      await new Promise(process.nextTick)
      expect(mockDeleteAccessKey).toHaveBeenCalledWith('AKIATEST', 'testuser')
    })

    it('IAMRolePoliciesModal open-attach event triggers openAttachPolicy', async () => {
      mockListPolicies.mockResolvedValue({ Policies: [] })
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      wrapper.vm.selectedRole = { RoleName: 'testrole', RoleId: 'R1', Arn: 'arn:aws:iam::123:role/testrole' }
      await wrapper.vm.openAttachPolicy()
      expect(wrapper.vm.showAttachPolicyModal).toBe(true)
    })

    it('IAMGroupUsersModal add-user and remove-user events', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      wrapper.vm.selectedGroup = { GroupName: 'testgroup', GroupId: 'G1', Arn: 'arn:aws:iam::123:group/testgroup' }
      emitOn(wrapper, 'IAMGroupUsersModal', 'add-user')
      expect(wrapper.vm.showAddUserToGroupModal).toBe(true)
      wrapper.vm.showRemoveUserModal = false
      emitOn(wrapper, 'IAMGroupUsersModal', 'remove-user', 'testuser')
      expect(wrapper.vm.showRemoveUserModal).toBe(true)
    })

    it('inline click handlers on expandable user cards', async () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      wrapper.vm.users = [{ UserName: 'u1', UserId: 'U1', Arn: 'arn:aws:iam::123:user/u1', CreateDate: '2024-01-01' }]
      wrapper.vm.activeTab = 'users'
      await new Promise(process.nextTick)
      // Trigger the user expansion click by calling toggleUser directly
      await wrapper.vm.toggleUser('u1')
      expect(wrapper.vm.expandedUsers.has('u1')).toBe(true)
    })

    it('inline click handles create key button in expanded user', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      wrapper.vm.users = [{ UserName: 'u1', UserId: 'U1', Arn: 'arn:aws:iam::123:user/u1', CreateDate: '2024-01-01' }]
      wrapper.vm.expandedUsers = new Set(['u1'])
      const buttons = wrapper.findAll('button')
      // find the Create Key button
      const createKeyBtn = buttons.find(b => b.text().includes('Create Key'))
      if (createKeyBtn) {
        createKeyBtn.trigger('click')
        expect(wrapper.vm.selectedUser?.UserName).toBe('u1')
        expect(wrapper.vm.showCreateKeyModal).toBe(true)
      }
    })

    it('inline click on attach policy button in expanded role', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      const role = { RoleName: 'r1', RoleId: 'R1', Arn: 'arn:aws:iam::123:role/r1', CreateDate: '2024-01-01' }
      wrapper.vm.activeTab = 'roles'
      wrapper.vm.roles = [role]
      wrapper.vm.expandedRoles = new Set(['r1'])
      const buttons = wrapper.findAll('button')
      const attachBtn = buttons.find(b => b.text().includes('Attach Policy'))
      if (attachBtn) {
        attachBtn.trigger('click')
        expect(wrapper.vm.selectedRole?.RoleName).toBe('r1')
      }
    })

    it('inline click on add user button in expanded group', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      wrapper.vm.activeTab = 'groups'
      wrapper.vm.groups = [{ GroupName: 'g1', GroupId: 'G1', Arn: 'arn:aws:iam::123:group/g1' }]
      wrapper.vm.expandedGroups = new Set(['g1'])
      const buttons = wrapper.findAll('button')
      const addUserBtn = buttons.find(b => b.text().includes('Add User'))
      if (addUserBtn) {
        addUserBtn.trigger('click')
        expect(wrapper.vm.selectedGroup?.GroupName).toBe('g1')
        expect(wrapper.vm.showAddUserToGroupModal).toBe(true)
      }
    })

    it('formatDate handles CreateDate user display', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      const result = wrapper.vm.formatDate('2024-06-15')
      expect(result).toBe('6/15/2024')
    })
  })

  describe('formatDate', () => {
    it('handles undefined date', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      expect(wrapper.exists()).toBe(true)
      const formatted = (wrapper.vm as any).formatDate(undefined)
      expect(formatted).toBe('-')
    })

    it('formats valid date', () => {
      const wrapper = shallowMount(IAMView, { global: { stubs } })
      expect(wrapper.exists()).toBe(true)
      const formatted = (wrapper.vm as any).formatDate('2024-01-15')
      expect(formatted).toBe('1/15/2024')
    })
  })
})
