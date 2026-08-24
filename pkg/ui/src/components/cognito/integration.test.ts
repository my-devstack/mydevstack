import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import {
  CognitoUserPoolList,
  CognitoCreateUserPoolModal,
  CognitoDeleteUserPoolModal,
  CognitoEditUserPoolModal,
  CognitoUserList,
  CognitoCreateUserModal,
  CognitoDeleteUserModal,
  CognitoEditUserModal,
  CognitoGroupList,
  CognitoCreateGroupModal,
  CognitoDeleteGroupModal,
  CognitoEditGroupModal,
  CognitoUserPoolClientList,
  CognitoCreateUserPoolClientModal,
  CognitoEditUserPoolClientModal,
  CognitoDeleteUserPoolClientModal,
  CognitoResourceServerList,
  CognitoCreateResourceServerModal,
  CognitoDeleteResourceServerModal,
  CognitoGroupMembersModal,
  CognitoResetPasswordModal,
  CognitoTestLoginModal,
  CognitoTagsSection,
} from './index'

const createStubs = () => ({
  Modal: {
    template: `
      <div v-if="open" class="modal">
        <div class="modal-title">{{ title }}</div>
        <div class="modal-body"><slot /></div>
        <div class="modal-footer"><slot name="footer" /></div>
      </div>
    `,
    props: ['open', 'title', 'size'],
    emits: ['update:open'],
  },
  Button: {
    template: '<button @click="$emit(\'click\', $event)" :loading="loading"><slot /></button>',
    props: ['loading', 'variant', 'size'],
  },
  FormInput: {
    template: '<input :type="type" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'label', 'type', 'placeholder', 'required'],
    emits: ['update:modelValue'],
  },
  LoadingSpinner: {
    template: '<div class="spinner" />',
    props: ['size'],
  },
  EmptyState: {
    template: '<div class="empty-state"><h3>{{ title }}</h3><p>{{ description }}</p><slot /><button v-if="actionLabel" @click="$emit(\'action\')">{{ actionLabel }}</button></div>',
    props: ['icon', 'title', 'description', 'actionLabel', 'compact'],
    emits: ['action'],
  },
  StatusBadge: {
    template: '<span class="status-badge">{{ label }}</span>',
    props: ['status', 'label', 'size'],
  },
})

const samplePools = [
  { Id: 'us-east-1_abc123', Name: 'my-user-pool', Status: 'Enabled', CreationDate: '2024-01-15T10:30:00Z' },
]

const sampleUsers = [
  {
    Username: 'alice',
    UserStatus: 'CONFIRMED',
    Enabled: true,
    UserAttributes: [{ Name: 'email', Value: 'alice@example.com' }],
  },
]

const sampleGroups = [
  { GroupName: 'admins', Description: 'Admin group', Precedence: 1 },
]

const sampleClients = [
  { ClientId: 'client-1', ClientName: 'web-app', RefreshTokenValidity: 30 },
]

const sampleResourceServers = [
  { Identifier: 'api.example.com', Name: 'API Server', Scopes: [{ ScopeName: 'read' }] },
]

describe('Cognito Components Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('CognitoUserPoolList', () => {
    it('renders user pools', () => {
      const wrapper = mount(CognitoUserPoolList, {
        props: { userPools: samplePools },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('my-user-pool')
    })

    it('shows empty state when no pools', () => {
      const wrapper = mount(CognitoUserPoolList, {
        props: { userPools: [] },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('No user pools')
    })

    it('shows loading spinner when loading with no data', () => {
      const wrapper = mount(CognitoUserPoolList, {
        props: { userPools: [], loading: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.find('.spinner').exists()).toBe(true)
    })

    it('shows error message', () => {
      const wrapper = mount(CognitoUserPoolList, {
        props: { userPools: [], error: 'List user pools failed' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('List user pools failed')
    })

    it('emits create from empty state action', async () => {
      const wrapper = mount(CognitoUserPoolList, {
        props: { userPools: [] },
        global: { stubs: createStubs() },
      })
      const empty = wrapper.find('.empty-state')
      const actionBtn = empty.find('button')
      await actionBtn.trigger('click')
      expect(wrapper.emitted('create')).toBeTruthy()
    })

    it('emits delete when delete button clicked', async () => {
      const wrapper = mount(CognitoUserPoolList, {
        props: { userPools: samplePools },
        global: { stubs: createStubs() },
      })
      const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Delete'))
      if (deleteBtn) {
        await deleteBtn.trigger('click')
        expect(wrapper.emitted('delete')).toBeTruthy()
      }
    })

    it('emits edit when edit button clicked', async () => {
      const wrapper = mount(CognitoUserPoolList, {
        props: { userPools: samplePools },
        global: { stubs: createStubs() },
      })
      // Row action buttons: [edit, delete] — edit is first
      const editBtn = wrapper.findAll('button')[0]
      await editBtn.trigger('click')
      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('edit')![0]).toEqual([samplePools[0]])
    })

    it('expands and collapses on row click (reactive)', async () => {
      const wrapper = mount(CognitoUserPoolList, {
        props: { userPools: samplePools },
        global: { stubs: createStubs() },
      })
      // Initially collapsed — detail section hidden
      expect(wrapper.text()).not.toContain('ARN')
      const row = wrapper.find('.cursor-pointer')
      await row.trigger('click')
      expect(wrapper.text()).toContain('ARN')
      await row.trigger('click')
      expect(wrapper.text()).not.toContain('ARN')
    })
  })

  describe('CognitoCreateUserPoolModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(CognitoCreateUserPoolModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create User Pool')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(CognitoCreateUserPoolModal, {
        props: { open: false },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('Create User Pool')
    })

    it('emits update:open on cancel', async () => {
      const wrapper = mount(CognitoCreateUserPoolModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
      expect(cancelBtn).toBeTruthy()
      if (cancelBtn) {
        await cancelBtn.trigger('click')
        expect(wrapper.emitted('update:open')).toBeTruthy()
      }
    })

    it('emits create on create click', async () => {
      const wrapper = mount(CognitoCreateUserPoolModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
      if (createBtn) {
        await createBtn.trigger('click')
        expect(wrapper.emitted('create')).toBeTruthy()
      }
    })
  })

  describe('CognitoDeleteUserPoolModal', () => {
    it('renders when open with props', () => {
      const wrapper = mount(CognitoDeleteUserPoolModal, {
        props: { open: true, userPoolId: 'us-east-1_abc123', userPoolName: 'my-user-pool' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Delete User Pool')
    })

    it('emits confirm on delete click', async () => {
      const wrapper = mount(CognitoDeleteUserPoolModal, {
        props: { open: true, userPoolId: 'us-east-1_abc123', userPoolName: 'my-user-pool' },
        global: { stubs: createStubs() },
      })
      const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Delete'))
      expect(deleteBtn).toBeTruthy()
      if (deleteBtn) {
        await deleteBtn.trigger('click')
        expect(wrapper.emitted('confirm')).toBeTruthy()
      }
    })
  })

  describe('CognitoUserList', () => {
    it('renders users', () => {
      const wrapper = mount(CognitoUserList, {
        props: { users: sampleUsers },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('alice')
    })

    it('shows empty state when no users', () => {
      const wrapper = mount(CognitoUserList, {
        props: { users: [] },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('No users')
    })

    it('shows loading spinner when loading with no data', () => {
      const wrapper = mount(CognitoUserList, {
        props: { users: [], loading: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.find('.spinner').exists()).toBe(true)
    })

    it('shows error message', () => {
      const wrapper = mount(CognitoUserList, {
        props: { users: [], error: 'List users failed' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('List users failed')
    })

    it('emits delete when delete button clicked', async () => {
      const wrapper = mount(CognitoUserList, {
        props: { users: sampleUsers },
        global: { stubs: createStubs() },
      })
      const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Delete'))
      if (deleteBtn) {
        await deleteBtn.trigger('click')
        expect(wrapper.emitted('delete')).toBeTruthy()
      }
    })

    it('emits edit when edit button clicked', async () => {
      const wrapper = mount(CognitoUserList, {
        props: { users: sampleUsers },
        global: { stubs: createStubs() },
      })
      // Row action buttons: [edit, delete] — edit is first
      const editBtn = wrapper.findAll('button')[0]
      await editBtn.trigger('click')
      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('edit')![0]).toEqual([sampleUsers[0]])
    })

    it('emits reset-password when reset password button clicked', async () => {
      const wrapper = mount(CognitoUserList, {
        props: { users: sampleUsers },
        global: { stubs: createStubs() },
      })
      // Row action buttons: [edit, reset-password, test-login, delete]
      const resetBtn = wrapper.findAll('button')[1]
      await resetBtn.trigger('click')
      expect(wrapper.emitted('reset-password')).toBeTruthy()
      expect(wrapper.emitted('reset-password')![0]).toEqual([sampleUsers[0]])
    })

    it('emits test-login when test login button clicked', async () => {
      const wrapper = mount(CognitoUserList, {
        props: { users: sampleUsers },
        global: { stubs: createStubs() },
      })
      const testBtn = wrapper.findAll('button')[2]
      await testBtn.trigger('click')
      expect(wrapper.emitted('test-login')).toBeTruthy()
      expect(wrapper.emitted('test-login')![0]).toEqual([sampleUsers[0]])
    })

    it('expands and collapses on row click (reactive)', async () => {
      const wrapper = mount(CognitoUserList, {
        props: { users: sampleUsers },
        global: { stubs: createStubs() },
      })
      // Initially collapsed — detail section hidden
      expect(wrapper.text()).not.toContain('Last Modified')
      const row = wrapper.find('.cursor-pointer')
      await row.trigger('click')
      expect(wrapper.text()).toContain('Last Modified')
      await row.trigger('click')
      expect(wrapper.text()).not.toContain('Last Modified')
    })
  })

  describe('CognitoCreateUserModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(CognitoCreateUserModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create User')
    })

    it('emits create on create click', async () => {
      const wrapper = mount(CognitoCreateUserModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
      if (createBtn) {
        await createBtn.trigger('click')
        expect(wrapper.emitted('create')).toBeTruthy()
      }
    })
  })

  describe('CognitoDeleteUserModal', () => {
    it('renders when open with props', () => {
      const wrapper = mount(CognitoDeleteUserModal, {
        props: { open: true, username: 'alice' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Delete User')
    })

    it('emits confirm on delete click', async () => {
      const wrapper = mount(CognitoDeleteUserModal, {
        props: { open: true, username: 'alice' },
        global: { stubs: createStubs() },
      })
      const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Delete'))
      expect(deleteBtn).toBeTruthy()
      if (deleteBtn) {
        await deleteBtn.trigger('click')
        expect(wrapper.emitted('confirm')).toBeTruthy()
      }
    })
  })

  describe('CognitoGroupList', () => {
    it('renders groups', () => {
      const wrapper = mount(CognitoGroupList, {
        props: { groups: sampleGroups },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('admins')
    })

    it('shows empty state when no groups', () => {
      const wrapper = mount(CognitoGroupList, {
        props: { groups: [] },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('No groups')
    })

    it('shows loading spinner when loading with no data', () => {
      const wrapper = mount(CognitoGroupList, {
        props: { groups: [], loading: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.find('.spinner').exists()).toBe(true)
    })

    it('shows error message', () => {
      const wrapper = mount(CognitoGroupList, {
        props: { groups: [], error: 'List groups failed' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('List groups failed')
    })

    it('emits delete when delete button clicked', async () => {
      const wrapper = mount(CognitoGroupList, {
        props: { groups: sampleGroups },
        global: { stubs: createStubs() },
      })
      const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Delete'))
      if (deleteBtn) {
        await deleteBtn.trigger('click')
        expect(wrapper.emitted('delete')).toBeTruthy()
      }
    })

    it('emits edit when edit button clicked', async () => {
      const wrapper = mount(CognitoGroupList, {
        props: { groups: sampleGroups },
        global: { stubs: createStubs() },
      })
      // Row action buttons: [edit, members, delete] — edit is first
      const editBtn = wrapper.findAll('button')[0]
      await editBtn.trigger('click')
      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('edit')![0]).toEqual([sampleGroups[0]])
    })

    it('emits members when members button clicked', async () => {
      const wrapper = mount(CognitoGroupList, {
        props: { groups: sampleGroups },
        global: { stubs: createStubs() },
      })
      // Row action buttons: [edit, members, delete] — members is second
      const membersBtn = wrapper.findAll('button')[1]
      await membersBtn.trigger('click')
      expect(wrapper.emitted('members')).toBeTruthy()
      expect(wrapper.emitted('members')![0]).toEqual([sampleGroups[0]])
    })

    it('expands and collapses on row click (reactive)', async () => {
      const wrapper = mount(CognitoGroupList, {
        props: { groups: sampleGroups },
        global: { stubs: createStubs() },
      })
      // Initially collapsed — detail section hidden
      expect(wrapper.text()).not.toContain('Role ARN')
      const row = wrapper.find('.cursor-pointer')
      await row.trigger('click')
      expect(wrapper.text()).toContain('Role ARN')
      await row.trigger('click')
      expect(wrapper.text()).not.toContain('Role ARN')
    })
  })

  describe('CognitoCreateGroupModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(CognitoCreateGroupModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create Group')
    })

    it('emits create on create click', async () => {
      const wrapper = mount(CognitoCreateGroupModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
      if (createBtn) {
        await createBtn.trigger('click')
        expect(wrapper.emitted('create')).toBeTruthy()
      }
    })
  })

  describe('CognitoDeleteGroupModal', () => {
    it('renders when open with props', () => {
      const wrapper = mount(CognitoDeleteGroupModal, {
        props: { open: true, groupName: 'admins' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Delete Group')
    })

    it('emits confirm on delete click', async () => {
      const wrapper = mount(CognitoDeleteGroupModal, {
        props: { open: true, groupName: 'admins' },
        global: { stubs: createStubs() },
      })
      const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Delete'))
      expect(deleteBtn).toBeTruthy()
      if (deleteBtn) {
        await deleteBtn.trigger('click')
        expect(wrapper.emitted('confirm')).toBeTruthy()
      }
    })
  })

  describe('CognitoUserPoolClientList', () => {
    it('renders clients', () => {
      const wrapper = mount(CognitoUserPoolClientList, {
        props: { clients: sampleClients },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('web-app')
      expect(wrapper.text()).toContain('client-1')
    })

    it('shows empty state when no clients', () => {
      const wrapper = mount(CognitoUserPoolClientList, {
        props: { clients: [] },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('No user pool clients')
    })

    it('shows loading spinner when loading with no data', () => {
      const wrapper = mount(CognitoUserPoolClientList, {
        props: { clients: [], loading: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.find('.spinner').exists()).toBe(true)
    })

    it('shows error message', () => {
      const wrapper = mount(CognitoUserPoolClientList, {
        props: { clients: [], error: 'List user pool clients failed' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('List user pool clients failed')
    })

    it('emits delete when delete button clicked', async () => {
      const wrapper = mount(CognitoUserPoolClientList, {
        props: { clients: sampleClients },
        global: { stubs: createStubs() },
      })
      // Row action buttons: [edit, delete] — delete is second
      const deleteBtn = wrapper.findAll('button')[1]
      await deleteBtn.trigger('click')
      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('delete')![0]).toEqual(['client-1'])
    })

    it('emits edit when edit button clicked', async () => {
      const wrapper = mount(CognitoUserPoolClientList, {
        props: { clients: sampleClients },
        global: { stubs: createStubs() },
      })
      const editBtn = wrapper.findAll('button')[0]
      await editBtn.trigger('click')
      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('edit')![0]).toEqual([sampleClients[0]])
    })
  })

  describe('CognitoCreateUserPoolClientModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(CognitoCreateUserPoolClientModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create User Pool Client')
    })

    it('emits create on create click', async () => {
      const wrapper = mount(CognitoCreateUserPoolClientModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      await wrapper.find('input').setValue('web-app')
      const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
      if (createBtn) {
        await createBtn.trigger('click')
        expect(wrapper.emitted('create')).toBeTruthy()
      }
    })
  })

  describe('CognitoEditUserPoolClientModal', () => {
    it('renders when open with props', () => {
      const wrapper = mount(CognitoEditUserPoolClientModal, {
        props: { open: true, userPoolId: 'us-east-1_abc123', clientId: 'client-1', clientName: 'web-app' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Edit User Pool Client')
    })

    it('emits update with params on save', async () => {
      const wrapper = mount(CognitoEditUserPoolClientModal, {
        props: { open: true, userPoolId: 'us-east-1_abc123', clientId: 'client-1', clientName: 'web-app', refreshTokenValidity: 30 },
        global: { stubs: createStubs() },
      })
      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('renamed-app')
      const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Save'))
      await saveBtn!.trigger('click')
      expect(wrapper.emitted('update')![0]).toEqual([
        'us-east-1_abc123',
        'client-1',
        { ClientName: 'renamed-app', RefreshTokenValidity: 30, AccessTokenValidity: 60, IdTokenValidity: 60 },
      ])
    })
  })

  describe('CognitoDeleteUserPoolClientModal', () => {
    it('renders when open with props', () => {
      const wrapper = mount(CognitoDeleteUserPoolClientModal, {
        props: { open: true, clientId: 'client-1', clientName: 'web-app' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Delete User Pool Client')
    })

    it('emits confirm on delete click', async () => {
      const wrapper = mount(CognitoDeleteUserPoolClientModal, {
        props: { open: true, clientId: 'client-1', clientName: 'web-app' },
        global: { stubs: createStubs() },
      })
      const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Delete'))
      expect(deleteBtn).toBeTruthy()
      if (deleteBtn) {
        await deleteBtn.trigger('click')
        expect(wrapper.emitted('confirm')).toBeTruthy()
      }
    })
  })

  describe('CognitoResourceServerList', () => {
    it('renders resource servers', () => {
      const wrapper = mount(CognitoResourceServerList, {
        props: { resourceServers: sampleResourceServers },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('API Server')
      expect(wrapper.text()).toContain('api.example.com')
    })

    it('shows empty state when no resource servers', () => {
      const wrapper = mount(CognitoResourceServerList, {
        props: { resourceServers: [] },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('No resource servers')
    })

    it('shows loading spinner when loading with no data', () => {
      const wrapper = mount(CognitoResourceServerList, {
        props: { resourceServers: [], loading: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.find('.spinner').exists()).toBe(true)
    })

    it('shows error message', () => {
      const wrapper = mount(CognitoResourceServerList, {
        props: { resourceServers: [], error: 'List resource servers failed' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('List resource servers failed')
    })

    it('emits delete when delete button clicked', async () => {
      const wrapper = mount(CognitoResourceServerList, {
        props: { resourceServers: sampleResourceServers },
        global: { stubs: createStubs() },
      })
      const deleteBtn = wrapper.findAll('button')[0]
      await deleteBtn.trigger('click')
      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('delete')![0]).toEqual(['api.example.com'])
    })
  })

  describe('CognitoCreateResourceServerModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(CognitoCreateResourceServerModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create Resource Server')
    })

    it('emits create on create click', async () => {
      const wrapper = mount(CognitoCreateResourceServerModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('api.example.com')
      await inputs[1].setValue('API Server')
      const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
      if (createBtn) {
        await createBtn.trigger('click')
        expect(wrapper.emitted('create')).toBeTruthy()
      }
    })
  })

  describe('CognitoDeleteResourceServerModal', () => {
    it('renders when open with props', () => {
      const wrapper = mount(CognitoDeleteResourceServerModal, {
        props: { open: true, identifier: 'api.example.com', name: 'API Server' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Delete Resource Server')
    })

    it('emits confirm on delete click', async () => {
      const wrapper = mount(CognitoDeleteResourceServerModal, {
        props: { open: true, identifier: 'api.example.com', name: 'API Server' },
        global: { stubs: createStubs() },
      })
      const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Delete'))
      expect(deleteBtn).toBeTruthy()
      if (deleteBtn) {
        await deleteBtn.trigger('click')
        expect(wrapper.emitted('confirm')).toBeTruthy()
      }
    })
  })

  describe('CognitoGroupMembersModal', () => {
    it('renders when open with props', () => {
      const wrapper = mount(CognitoGroupMembersModal, {
        props: {
          open: true,
          userPoolId: 'us-east-1_abc123',
          groupName: 'admins',
          users: sampleUsers,
          members: sampleUsers,
          loading: false,
        },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('admins')
      expect(wrapper.text()).toContain('alice')
    })

    it('emits remove-user when remove button clicked', async () => {
      const wrapper = mount(CognitoGroupMembersModal, {
        props: {
          open: true,
          userPoolId: 'us-east-1_abc123',
          groupName: 'admins',
          users: sampleUsers,
          members: sampleUsers,
          loading: false,
        },
        global: { stubs: createStubs() },
      })
      const removeBtn = wrapper.findAll('button').find(b => b.text().includes('Remove'))
      await removeBtn!.trigger('click')
      expect(wrapper.emitted('remove-user')![0]).toEqual(['alice'])
    })

    it('emits add-user when add button clicked', async () => {
      const wrapper = mount(CognitoGroupMembersModal, {
        props: {
          open: true,
          userPoolId: 'us-east-1_abc123',
          groupName: 'admins',
          users: sampleUsers,
          members: [],
          loading: false,
        },
        global: { stubs: createStubs() },
      })
      const select = wrapper.find('select')
      await select.setValue('alice')
      const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add'))
      await addBtn!.trigger('click')
      expect(wrapper.emitted('add-user')![0]).toEqual(['alice'])
    })
  })

  describe('CognitoResetPasswordModal', () => {
    it('renders when open with props', () => {
      const wrapper = mount(CognitoResetPasswordModal, {
        props: { open: true, username: 'alice' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Reset Password')
    })

    it('emits confirm with password and permanent on reset', async () => {
      const wrapper = mount(CognitoResetPasswordModal, {
        props: { open: true, username: 'alice' },
        global: { stubs: createStubs() },
      })
      const input = wrapper.find('input[type="password"]')
      await input.setValue('NewPass123!')
      const checkbox = wrapper.find('input[type="checkbox"]')
      await checkbox.setValue(true)
      const resetBtn = wrapper.findAll('button').find(b => b.text().includes('Reset Password'))
      await resetBtn!.trigger('click')
      expect(wrapper.emitted('confirm')![0]).toEqual(['NewPass123!', true])
    })
  })

  describe('CognitoTestLoginModal', () => {
    it('renders when open with props', () => {
      const wrapper = mount(CognitoTestLoginModal, {
        props: { open: true, username: 'alice', userPoolId: 'us-east-1_abc123', clients: sampleClients },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Test Login')
    })

    it('emits test with password and clientId', async () => {
      const wrapper = mount(CognitoTestLoginModal, {
        props: { open: true, username: 'alice', userPoolId: 'us-east-1_abc123', clients: sampleClients },
        global: { stubs: createStubs() },
      })
      const input = wrapper.find('input[type="password"]')
      await input.setValue('Pass123!')
      const select = wrapper.find('select')
      await select.setValue('client-1')
      const testBtn = wrapper.findAll('button').find(b => b.text().includes('Test Login'))
      await testBtn!.trigger('click')
      expect(wrapper.emitted('test')![0]).toEqual(['Pass123!', 'client-1'])
    })

    it('displays auth result when provided', () => {
      const wrapper = mount(CognitoTestLoginModal, {
        props: {
          open: true,
          username: 'alice',
          userPoolId: 'us-east-1_abc123',
          clients: sampleClients,
          authResult: { AuthenticationResult: { AccessToken: 'token123' } },
        },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('Authentication Result')
      expect(wrapper.text()).toContain('token123')
    })
  })

  describe('CognitoTagsSection', () => {
    it('renders existing tags', () => {
      const wrapper = mount(CognitoTagsSection, {
        props: { tags: { env: 'dev' } },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('Tags')
    })

    it('shows empty message when no tags', () => {
      const wrapper = mount(CognitoTagsSection, {
        props: { tags: {} },
        global: { stubs: createStubs() },
      })
      expect(wrapper.text()).toContain('No tags configured')
    })

    it('emits update when adding a new tag', async () => {
      const wrapper = mount(CognitoTagsSection, {
        props: { tags: {} },
        global: { stubs: createStubs() },
      })
      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('env')
      await inputs[1].setValue('prod')
      const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add'))
      await addBtn!.trigger('click')
      expect(wrapper.emitted('update')).toBeTruthy()
      const [tags] = wrapper.emitted('update')![0] as [Record<string, string>, string[]]
      expect(tags.env).toBe('prod')
    })
  })

  describe('CognitoEditUserPoolModal', () => {
    it('renders when open with props', () => {
      const wrapper = mount(CognitoEditUserPoolModal, {
        props: { open: true, userPoolId: 'us-east-1_abc123', poolName: 'my-user-pool' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Edit User Pool')
    })

    it('renders pool name input disabled and emits update on save', async () => {
      const wrapper = mount(CognitoEditUserPoolModal, {
        props: { open: true, userPoolId: 'us-east-1_abc123', poolName: 'my-user-pool', mfaConfiguration: 'ON', deletionProtection: 'ACTIVE', tags: { env: 'dev' } },
        global: { stubs: createStubs() },
      })
      const input = wrapper.find('input')
      expect(input.attributes('disabled')).toBeDefined()
      const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Save'))
      await saveBtn!.trigger('click')
      expect(wrapper.emitted('update')![0]).toEqual([
        'us-east-1_abc123',
        { PoolName: 'my-user-pool', MfaConfiguration: 'ON', DeletionProtection: 'ACTIVE', Tags: { env: 'dev' }, RemovedKeys: [] },
      ])
    })

    it('emits update:open false on cancel', async () => {
      const wrapper = mount(CognitoEditUserPoolModal, {
        props: { open: true, userPoolId: 'us-east-1_abc123', poolName: 'my-user-pool' },
        global: { stubs: createStubs() },
      })
      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
      await cancelBtn!.trigger('click')
      expect(wrapper.emitted('update:open')).toBeTruthy()
    })
  })

  describe('CognitoEditUserModal', () => {
    it('renders when open with props', () => {
      const wrapper = mount(CognitoEditUserModal, {
        props: { open: true, userPoolId: 'us-east-1_abc123', username: 'alice', email: 'alice@example.com' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Edit User')
    })

    it('emits update with UserAttributes on save', async () => {
      const wrapper = mount(CognitoEditUserModal, {
        props: { open: true, userPoolId: 'us-east-1_abc123', username: 'alice', email: 'alice@example.com', phoneNumber: '+15551234567' },
        global: { stubs: createStubs() },
      })
      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('new@example.com')
      const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Save'))
      await saveBtn!.trigger('click')
      expect(wrapper.emitted('update')![0]).toEqual([
        'us-east-1_abc123',
        'alice',
        [
          { Name: 'email', Value: 'new@example.com' },
          { Name: 'phone_number', Value: '+15551234567' },
        ],
      ])
    })
  })

  describe('CognitoEditGroupModal', () => {
    it('renders when open with props', () => {
      const wrapper = mount(CognitoEditGroupModal, {
        props: { open: true, userPoolId: 'us-east-1_abc123', groupName: 'admins', description: 'Admin group' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Edit Group')
    })

    it('emits update with params on save', async () => {
      const wrapper = mount(CognitoEditGroupModal, {
        props: { open: true, userPoolId: 'us-east-1_abc123', groupName: 'admins', description: 'Admin group', precedence: 5 },
        global: { stubs: createStubs() },
      })
      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('Updated group')
      const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Save'))
      await saveBtn!.trigger('click')
      expect(wrapper.emitted('update')![0]).toEqual([
        'us-east-1_abc123',
        'admins',
        { Description: 'Updated group', RoleArn: '', Precedence: 5 },
      ])
    })
  })
})