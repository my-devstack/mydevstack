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
