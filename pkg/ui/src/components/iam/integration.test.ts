import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import {
  IAMCreateUserModal,
  IAMCreateRoleModal,
  IAMCreateGroupModal,
  IAMDeleteModal,
  IAMUserKeysModal,
} from './index'

vi.mock('@/composables/useIAM', () => ({
  useIAM: vi.fn(() => ({
    users: { value: [] },
    roles: { value: [] },
    policies: { value: [] },
    groups: { value: [] },
    loading: { value: false },
    userAccessKeysMap: { value: {} },
    createUser: vi.fn(),
    deleteUser: vi.fn(),
    createRole: vi.fn(),
    deleteRole: vi.fn(),
    createGroup: vi.fn(),
    deleteGroup: vi.fn(),
    loadUserAccessKeys: vi.fn(),
    createAccessKey: vi.fn(),
    deleteAccessKey: vi.fn(),
  })),
}))

vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
    notifyWarning: vi.fn(),
  })),
}))

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
    template: '<button @click="$emit(\'click\')" :loading="loading"><slot /></button>',
    props: ['loading', 'variant', 'size'],
  },
  FormInput: {
    template: '<input :type="type" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'label', 'type', 'placeholder', 'required'],
    emits: ['update:modelValue'],
  },
  FormTextarea: {
    template: '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'label', 'placeholder', 'rows'],
    emits: ['update:modelValue'],
  },
  FormSelect: {
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option>option</option></select>',
    props: ['modelValue', 'label', 'options'],
    emits: ['update:modelValue'],
  },
  FormCheckbox: {
    template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
  },
})

describe('IAM Components Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('IAMCreateUserModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(IAMCreateUserModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create User')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(IAMCreateUserModal, {
        props: { open: false },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('Create User')
    })

    it('emits update:open on cancel', async () => {
      const wrapper = mount(IAMCreateUserModal, {
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

    it('has inputs', () => {
      const wrapper = mount(IAMCreateUserModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const inputs = wrapper.findAll('input')
      expect(inputs.length).toBeGreaterThan(0)
    })
  })

  describe('IAMCreateRoleModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(IAMCreateRoleModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create Role')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(IAMCreateRoleModal, {
        props: { open: false },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('Create Role')
    })

    it('emits update:open on cancel', async () => {
      const wrapper = mount(IAMCreateRoleModal, {
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
  })

  describe('IAMCreateGroupModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(IAMCreateGroupModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create Group')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(IAMCreateGroupModal, {
        props: { open: false },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('Create Group')
    })

    it('emits create on confirm', async () => {
      const wrapper = mount(IAMCreateGroupModal, {
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

  describe('IAMDeleteModal', () => {
    it('renders when open with props', () => {
      const wrapper = mount(IAMDeleteModal, {
        props: { open: true, title: 'Delete User', message: 'Are you sure you want to delete', itemName: 'test-user' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Delete User')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(IAMDeleteModal, {
        props: { open: false, title: '', message: '', itemName: '' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('Delete User')
    })

    it('emits update:open on cancel', async () => {
      const wrapper = mount(IAMDeleteModal, {
        props: { open: true, title: 'Delete', message: 'Confirm', itemName: 'user' },
        global: { stubs: createStubs() },
      })
      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
      expect(cancelBtn).toBeTruthy()
      if (cancelBtn) {
        await cancelBtn.trigger('click')
        expect(wrapper.emitted('update:open')).toBeTruthy()
      }
    })

    it('emits confirm on delete click', async () => {
      const wrapper = mount(IAMDeleteModal, {
        props: { open: true, title: 'Delete', message: 'Confirm', itemName: 'user' },
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

  describe('IAMUserKeysModal', () => {
    it('renders when open with required props', () => {
      const wrapper = mount(IAMUserKeysModal, {
        props: {
          open: true,
          userName: 'test-user',
          accessKeys: [],
          formatDate: (d?: string) => d || '-',
        },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Access Keys')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(IAMUserKeysModal, {
        props: { open: false, userName: '', accessKeys: [], formatDate: () => '-' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('Access Keys')
    })

    it('emits update:open on close', async () => {
      const wrapper = mount(IAMUserKeysModal, {
        props: { open: true, userName: 'test', accessKeys: [], formatDate: () => '-' },
        global: { stubs: createStubs() },
      })
      const closeBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
      if (closeBtn) {
        await closeBtn.trigger('click')
        expect(wrapper.emitted('update:open')).toBeTruthy()
      }
    })
  })

  describe('Create Flow', () => {
    it('opens create user modal', () => {
      const wrapper = mount(IAMCreateUserModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create User')
    })
  })

  describe('Delete Flow', () => {
    it('opens delete modal', () => {
      const wrapper = mount(IAMDeleteModal, {
        props: { open: true, title: 'Delete', message: 'Confirm', itemName: 'user' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Delete')
    })
  })
})