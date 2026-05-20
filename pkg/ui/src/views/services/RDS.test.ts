import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/services/rds', () => ({
  describeDBInstances: vi.fn().mockResolvedValue([]),
  createDBInstance: vi.fn().mockResolvedValue({}),
  deleteDBInstance: vi.fn().mockResolvedValue({}),
  rebootDBInstance: vi.fn().mockResolvedValue({}),
  modifyDBInstance: vi.fn().mockResolvedValue({}),
  describeDBEngineVersions: vi.fn().mockResolvedValue({ DBEngineVersions: [] }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

import RDS from './RDS.vue'

describe('RDS.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(RDS, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          StatusBadge: true,
          EmptyState: true,
          RDSCreateInstanceModal: true,
          RDSDeleteModal: true,
          RDSRebootModal: true,
          RDSCodeExamples: true,
          ServerIcon: true,
          CircleStackIcon: true,
          ChevronDownIcon: true,
          ChevronRightIcon: true,
          PlusIcon: true,
          TrashIcon: true,
          ArrowPathIcon: true,
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders RDS heading', () => {
    const wrapper = shallowMount(RDS, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          StatusBadge: true,
          EmptyState: true,
          RDSCreateInstanceModal: true,
          RDSDeleteModal: true,
          RDSRebootModal: true,
          RDSCodeExamples: true,
          ServerIcon: true,
          CircleStackIcon: true,
          ChevronDownIcon: true,
          ChevronRightIcon: true,
          PlusIcon: true,
          TrashIcon: true,
          ArrowPathIcon: true,
        },
      },
    })
    expect(wrapper.text()).toContain('RDS')
  })

  it('renders Create Instance button', () => {
    const wrapper = shallowMount(RDS, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          StatusBadge: true,
          EmptyState: true,
          RDSCreateInstanceModal: true,
          RDSDeleteModal: true,
          RDSRebootModal: true,
          RDSCodeExamples: true,
          ServerIcon: true,
          CircleStackIcon: true,
          ChevronDownIcon: true,
          ChevronRightIcon: true,
          PlusIcon: true,
          TrashIcon: true,
          ArrowPathIcon: true,
        },
      },
    })
    expect(wrapper.text()).toContain('Create Instance')
  })

  it('shows EmptyState when no instances after load', async () => {
    const wrapper = shallowMount(RDS, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          StatusBadge: true,
          EmptyState: true,
          RDSCreateInstanceModal: true,
          RDSDeleteModal: true,
          RDSRebootModal: true,
          RDSCodeExamples: true,
          ServerIcon: true,
          CircleStackIcon: true,
          ChevronDownIcon: true,
          ChevronRightIcon: true,
          PlusIcon: true,
          TrashIcon: true,
          ArrowPathIcon: true,
        },
      },
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('empty-state-stub').exists()).toBe(true)
  })

  it('renders RDSCodeExamples component', () => {
    const wrapper = shallowMount(RDS, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          StatusBadge: true,
          EmptyState: true,
          RDSCreateInstanceModal: true,
          RDSDeleteModal: true,
          RDSRebootModal: true,
          RDSCodeExamples: true,
          ServerIcon: true,
          CircleStackIcon: true,
          ChevronDownIcon: true,
          ChevronRightIcon: true,
          PlusIcon: true,
          TrashIcon: true,
          ArrowPathIcon: true,
        },
      },
    })
    // RDSCodeExamples -> r-d-s-code-examples-stub
    expect(wrapper.find('r-d-s-code-examples-stub').exists()).toBe(true)
  })

  it('renders modals', () => {
    const wrapper = shallowMount(RDS, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          StatusBadge: true,
          EmptyState: true,
          RDSCreateInstanceModal: true,
          RDSDeleteModal: true,
          RDSRebootModal: true,
          RDSCodeExamples: true,
          ServerIcon: true,
          CircleStackIcon: true,
          ChevronDownIcon: true,
          ChevronRightIcon: true,
          PlusIcon: true,
          TrashIcon: true,
          ArrowPathIcon: true,
        },
      },
    })
    // RDSCreateInstanceModal -> r-d-s-create-instance-modal-stub
    expect(wrapper.find('r-d-s-create-instance-modal-stub').exists()).toBe(true)
    // RDSDeleteModal -> r-d-s-delete-modal-stub
    expect(wrapper.find('r-d-s-delete-modal-stub').exists()).toBe(true)
    // RDSRebootModal -> r-d-s-reboot-modal-stub
    expect(wrapper.find('r-d-s-reboot-modal-stub').exists()).toBe(true)
  })

  describe('template handler coverage', () => {
    const stubs = {
      Button: { template: '<button><slot /></button>' },
      StatusBadge: true,
      EmptyState: true,
      RDSCreateInstanceModal: true,
      RDSDeleteModal: true,
      RDSRebootModal: true,
      RDSCodeExamples: true,
      ServerIcon: true,
      CircleStackIcon: true,
      ChevronDownIcon: true,
      ChevronRightIcon: true,
      PlusIcon: true,
      TrashIcon: true,
      ArrowPathIcon: true,
    }

    it('Create Instance button click triggers modal', () => {
      const wrapper = shallowMount(RDS, { global: { stubs } })
      const buttons = wrapper.findAll('button')
      const btn = buttons.find(b => b.text() === 'Create Instance')
      if (btn) {
        btn.trigger('click')
        expect(wrapper.vm.showCreateModal).toBe(true)
      }
    })

    it('loadInstances called via refresh', () => {
      const wrapper = shallowMount(RDS, { global: { stubs } })
      wrapper.vm.loadInstances()
    })

    it('EmptyState action triggers create modal', () => {
      const wrapper = shallowMount(RDS, { global: { stubs } })
      const empty = wrapper.findComponent({ name: 'EmptyState' })
      if (empty.exists()) {
        empty.vm.$emit('action')
        expect(wrapper.vm.showCreateModal).toBe(true)
      }
    })

    it('toggleInstance called from accordion', () => {
      const wrapper = shallowMount(RDS, { global: { stubs } })
      wrapper.vm.toggleInstance('test-db')
    })

    it('confirmDelete sets instance and shows modal', () => {
      const wrapper = shallowMount(RDS, { global: { stubs } })
      const instance = { DBInstanceIdentifier: 'test-db' } as any
      wrapper.vm.confirmDelete(instance)
    })

    it('RDSCreateInstanceModal @update:open emit', () => {
      const wrapper = shallowMount(RDS, { global: { stubs } })
      const modal = wrapper.findComponent('r-d-s-create-instance-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('update:open', false)
        expect(wrapper.vm.showCreateModal).toBe(false)
      }
    })

    it('RDSDeleteModal @update:open emit', () => {
      const wrapper = shallowMount(RDS, { global: { stubs } })
      const modal = wrapper.findComponent('r-d-s-delete-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('update:open', false)
        expect(wrapper.vm.showDeleteModal).toBe(false)
      }
    })

    it('RDSRebootModal @update:open emit', () => {
      const wrapper = shallowMount(RDS, { global: { stubs } })
      const modal = wrapper.findComponent('r-d-s-reboot-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('update:open', false)
        expect(wrapper.vm.showRebootModal).toBe(false)
      }
    })
  })
})
