import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import {
  EC2CreateInstanceModal,
  EC2KeyPairModal,
  EC2SecurityGroupModal,
  EC2DeleteModal,
} from './index'

vi.mock('@/composables/useEC2', () => ({
  useEC2: vi.fn(() => ({
    instances: { value: [] },
    keyPairs: { value: [] },
    securityGroups: { value: [] },
    vpcs: { value: [] },
    subnets: { value: [] },
    loading: { value: false },
    expandedInstances: { value: new Set() },
    expandedKeyPairs: { value: new Set() },
    expandedSecurityGroups: { value: new Set() },
    showCreateModal: { value: false },
    creating: { value: false },
    showDeleteConfirm: { value: false },
    showKeyPairModal: { value: false },
    showSecurityGroupModal: { value: false },
    createForm: { value: {} },
    loadAll: vi.fn(),
    runInstance: vi.fn(),
    terminateInstance: vi.fn(),
    startInstance: vi.fn(),
    stopInstance: vi.fn(),
    createKeyPair: vi.fn(),
    importKeyPair: vi.fn(),
    deleteKeyPair: vi.fn(),
    createSecurityGroup: vi.fn(),
    deleteSecurityGroup: vi.fn(),
    authorizeIngress: vi.fn(),
    toggleInstances: vi.fn(),
    toggleKeyPairs: vi.fn(),
    toggleSecurityGroups: vi.fn(),
    confirmDelete: vi.fn(),
    getStatus: vi.fn(() => 'active'),
    resetForm: vi.fn(),
    codeExamples: { value: [] },
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
  FormSelect: {
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option>option</option></select>',
    props: ['modelValue', 'label', 'options'],
    emits: ['update:modelValue'],
  },
})

describe('EC2 Components Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('EC2CreateInstanceModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(EC2CreateInstanceModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Run Instance')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(EC2CreateInstanceModal, {
        props: { open: false },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('Run Instance')
    })

    it('emits update:open on cancel', async () => {
      const wrapper = mount(EC2CreateInstanceModal, {
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

    it('has form inputs', () => {
      const wrapper = mount(EC2CreateInstanceModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const inputs = wrapper.findAll('input')
      expect(inputs.length).toBeGreaterThan(0)
    })
  })

  describe('EC2KeyPairModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(EC2KeyPairModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Manage Key Pairs')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(EC2KeyPairModal, {
        props: { open: false },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('Manage Key Pairs')
    })

    it('emits update:open on cancel', async () => {
      const wrapper = mount(EC2KeyPairModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
      if (cancelBtn) {
        await cancelBtn.trigger('click')
        expect(wrapper.emitted('update:open')).toBeTruthy()
      }
    })
  })

  describe('EC2SecurityGroupModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(EC2SecurityGroupModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create Security Group')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(EC2SecurityGroupModal, {
        props: { open: false },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('Create Security Group')
    })

    it('emits create on confirm', async () => {
      const wrapper = mount(EC2SecurityGroupModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      // Fill form values via component internals
      ;(wrapper.vm as any).groupName = 'test-sg'
      ;(wrapper.vm as any).description = 'Test SG'
      await wrapper.vm.$nextTick()
      const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create Security Group'))
      if (createBtn) {
        await createBtn.trigger('click')
        expect(wrapper.emitted('create')).toBeTruthy()
      }
    })
  })

  describe('EC2DeleteModal', () => {
    it('renders when open with props', () => {
      const wrapper = mount(EC2DeleteModal, {
        props: { open: true, itemName: 'i-123', itemType: 'instance' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Delete Instance')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(EC2DeleteModal, {
        props: { open: false, itemName: '', itemType: 'instance' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('Delete')
    })

    it('emits update:open on cancel', async () => {
      const wrapper = mount(EC2DeleteModal, {
        props: { open: true, itemName: 'i-123', itemType: 'instance' },
        global: { stubs: createStubs() },
      })
      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
      if (cancelBtn) {
        await cancelBtn.trigger('click')
        expect(wrapper.emitted('update:open')).toBeTruthy()
      }
    })

    it('emits confirm on delete click', async () => {
      const wrapper = mount(EC2DeleteModal, {
        props: { open: true, itemName: 'i-123', itemType: 'instance' },
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
})
