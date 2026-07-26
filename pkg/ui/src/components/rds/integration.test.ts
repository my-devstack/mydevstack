import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { h } from 'vue'
import RDSCreateInstanceModal from './RDSCreateInstanceModal.vue'
import RDSDeleteModal from './RDSDeleteModal.vue'
import RDSRebootModal from './RDSRebootModal.vue'

// Mock useRDS composable
const mockUseRDS = {
  instances: { value: [] },
  loading: { value: false },
  expandedInstances: { value: new Set() },
  showCreateModal: { value: false },
  showDeleteModal: { value: false },
  showRebootModal: { value: false },
  creating: { value: false },
  rebooting: { value: false },
  createForm: {
    value: {
      instanceId: '',
      dbEngine: 'mysql',
      dbVersion: '8.0.36',
      masterUsername: 'root',
      masterPassword: '',
      instanceClass: 'db.t3.micro',
      port: '3306',
      allocatedStorage: '20',
    }
  },
  instanceToDelete: { value: null },
  instanceToReboot: { value: null },
  loadInstances: vi.fn(),
  createInstance: vi.fn(),
  deleteInstance: vi.fn(),
  rebootInstance: vi.fn(),
  toggleInstance: vi.fn(),
  confirmDelete: vi.fn(),
  confirmReboot: vi.fn(),
  resetForm: vi.fn(),
  getStatus: vi.fn(() => 'active'),
  setupReloadWatcher: vi.fn(),
}

vi.mock('@/composables/useRDS', () => ({
  useRDS: vi.fn(() => mockUseRDS),
}))

// Mock UI store
vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
    notifyWarning: vi.fn(),
  })),
}))

// Create proper stubs for child components
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
    props: ['loading', 'variant'],
  },
  FormInput: {
    template: '<input :type="type" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'label', 'type', 'placeholder', 'required'],
    emits: ['update:modelValue'],
  },
  FormSelect: {
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="mysql">MySQL</option><option value="postgres">PostgreSQL</option></select>',
    props: ['modelValue', 'label', 'options'],
    emits: ['update:modelValue'],
  },
  VpcSelector: {
    template: '<div class="vpc-selector-stub" :data-resource-type="resourceType"><span>VPC Configuration</span></div>',
    props: ['modelValue', 'resourceType', 'required', 'showSubnet', 'showSecurityGroup'],
  },
})

describe('RDS Components Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('RDSCreateInstanceModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(RDSCreateInstanceModal, {
        props: {
          open: true,
          creating: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('Create DB Instance')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(RDSCreateInstanceModal, {
        props: {
          open: false,
          creating: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).not.toContain('Create DB Instance')
    })

    it('emits update:open when cancel clicked', async () => {
      const wrapper = mount(RDSCreateInstanceModal, {
        props: {
          open: true,
          creating: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      const cancelButton = wrapper.findAll('button').find(btn => btn.text().includes('Cancel'))
      expect(cancelButton).toBeTruthy()

      if (cancelButton) {
        await cancelButton.trigger('click')
        expect(wrapper.emitted('update:open')).toBeTruthy()
      }
    })

    it('emits create event when create clicked', async () => {
      const wrapper = mount(RDSCreateInstanceModal, {
        props: {
          open: true,
          creating: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      const createButton = wrapper.findAll('button').find(btn => btn.text().includes('Create'))
      expect(createButton).toBeTruthy()

      if (createButton) {
        await createButton.trigger('click')
        expect(wrapper.emitted('create')).toBeTruthy()
      }
    })

    it('has form inputs', () => {
      const wrapper = mount(RDSCreateInstanceModal, {
        props: {
          open: true,
          creating: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      const inputs = wrapper.findAll('input')
      expect(inputs.length).toBeGreaterThan(0)
    })

    it('has password input', () => {
      const wrapper = mount(RDSCreateInstanceModal, {
        props: {
          open: true,
          creating: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      const passwordInput = wrapper.find('input[type="password"]')
      expect(passwordInput.exists()).toBe(true)
    })

    it('has select elements', () => {
      const wrapper = mount(RDSCreateInstanceModal, {
        props: {
          open: true,
          creating: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      const selects = wrapper.findAll('select')
      expect(selects.length).toBeGreaterThanOrEqual(2)
    })

    it('renders VpcSelector with resourceType=rds', () => {
      const wrapper = mount(RDSCreateInstanceModal, {
        props: {
          open: true,
          creating: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      const vpcSelector = wrapper.find('.vpc-selector-stub')
      expect(vpcSelector.exists()).toBe(true)
      expect(vpcSelector.attributes('data-resource-type')).toBe('rds')
    })

    it('renders VPC Configuration collapsible section', () => {
      const wrapper = mount(RDSCreateInstanceModal, {
        props: {
          open: true,
          creating: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.find('details').exists()).toBe(true)
      expect(wrapper.text()).toContain('VPC Configuration')
      expect(wrapper.text()).toContain('optional')
    })
  })

  describe('RDSDeleteModal', () => {
    const mockInstance = { DBInstanceIdentifier: 'test-db' }

    it('renders when open is true', () => {
      const wrapper = mount(RDSDeleteModal, {
        props: {
          open: true,
          instance: mockInstance,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('test-db')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(RDSDeleteModal, {
        props: {
          open: false,
          instance: null,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).not.toContain('test-db')
    })

    it('emits update:open when cancel clicked', async () => {
      const wrapper = mount(RDSDeleteModal, {
        props: {
          open: true,
          instance: mockInstance,
        },
        global: {
          stubs: createStubs(),
        },
      })

      const cancelButton = wrapper.findAll('button').find(btn => btn.text().includes('Cancel'))
      expect(cancelButton).toBeTruthy()

      if (cancelButton) {
        await cancelButton.trigger('click')
        expect(wrapper.emitted('update:open')).toBeTruthy()
      }
    })

    it('emits delete event when delete clicked', async () => {
      const wrapper = mount(RDSDeleteModal, {
        props: {
          open: true,
          instance: mockInstance,
        },
        global: {
          stubs: createStubs(),
        },
      })

      const deleteButton = wrapper.findAll('button').find(btn => btn.text().includes('Delete'))
      expect(deleteButton).toBeTruthy()

      if (deleteButton) {
        await deleteButton.trigger('click')
        expect(wrapper.emitted('delete')).toBeTruthy()
      }
    })

    it('shows warning message', () => {
      const wrapper = mount(RDSDeleteModal, {
        props: {
          open: true,
          instance: mockInstance,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('cannot be undone')
    })

    it('handles null instance', () => {
      const wrapper = mount(RDSDeleteModal, {
        props: {
          open: true,
          instance: null,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Create Flow', () => {
    it('opens create modal and can submit', async () => {
      const wrapper = mount(RDSCreateInstanceModal, {
        props: {
          open: true,
          creating: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('Create DB Instance')

      // Simulate create click
      const createButton = wrapper.findAll('button').find(btn => btn.text().includes('Create'))
      if (createButton) {
        await createButton.trigger('click')
        expect(wrapper.emitted('create')).toBeTruthy()
      }
    })
  })

  describe('Delete Flow', () => {
    it('opens delete modal and can delete', async () => {
      const instance = { DBInstanceIdentifier: 'db-to-delete' }

      const wrapper = mount(RDSDeleteModal, {
        props: {
          open: true,
          instance: instance,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('db-to-delete')

      const deleteButton = wrapper.findAll('button').find(btn => btn.text().includes('Delete'))
      if (deleteButton) {
        await deleteButton.trigger('click')
        expect(wrapper.emitted('delete')).toBeTruthy()
      }
    })
  })

  describe('RDSRebootModal', () => {
    const mockInstance = { DBInstanceIdentifier: 'test-db', Engine: 'mysql' }

    it('renders when open is true', () => {
      const wrapper = mount(RDSRebootModal, {
        props: {
          open: true,
          instance: mockInstance,
          rebooting: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('test-db')
      expect(wrapper.html()).toContain('Reboot DB Instance')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(RDSRebootModal, {
        props: {
          open: false,
          instance: null,
          rebooting: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).not.toContain('test-db')
    })

    it('emits update:open when cancel clicked', async () => {
      const wrapper = mount(RDSRebootModal, {
        props: {
          open: true,
          instance: mockInstance,
          rebooting: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      const cancelButton = wrapper.findAll('button').find(btn => btn.text().includes('Cancel'))
      expect(cancelButton).toBeTruthy()

      if (cancelButton) {
        await cancelButton.trigger('click')
        expect(wrapper.emitted('update:open')).toBeTruthy()
      }
    })

    it('emits reboot event when reboot clicked', async () => {
      const wrapper = mount(RDSRebootModal, {
        props: {
          open: true,
          instance: mockInstance,
          rebooting: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      const rebootButton = wrapper.findAll('button').find(btn => btn.text().includes('Reboot'))
      expect(rebootButton).toBeTruthy()

      if (rebootButton) {
        await rebootButton.trigger('click')
        expect(wrapper.emitted('reboot')).toBeTruthy()
      }
    })

    it('shows engine info', () => {
      const wrapper = mount(RDSRebootModal, {
        props: {
          open: true,
          instance: mockInstance,
          rebooting: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('mysql')
    })

    it('handles null instance', () => {
      const wrapper = mount(RDSRebootModal, {
        props: {
          open: true,
          instance: null,
          rebooting: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Reboot Flow', () => {
    it('opens reboot modal and can reboot', async () => {
      const instance = { DBInstanceIdentifier: 'db-to-reboot', Engine: 'postgres' }

      const wrapper = mount(RDSRebootModal, {
        props: {
          open: true,
          instance: instance,
          rebooting: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('db-to-reboot')

      const rebootButton = wrapper.findAll('button').find(btn => btn.text().includes('Reboot'))
      if (rebootButton) {
        await rebootButton.trigger('click')
        expect(wrapper.emitted('reboot')).toBeTruthy()
      }
    })
  })
})
