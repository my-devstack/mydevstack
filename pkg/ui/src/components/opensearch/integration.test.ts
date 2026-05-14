import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { OpenSearchCreateDomainModal, OpenSearchDeleteModal } from './index'

vi.mock('@/composables/useOpenSearch', () => ({
  useOpenSearch: vi.fn(() => ({
    createForm: {
      value: {
        DomainName: '',
        EngineVersion: 'OpenSearch_2.13',
        ClusterConfig: {
          InstanceType: 't3.medium.search',
          InstanceCount: 1,
          DedicatedMasterEnabled: false,
          ZoneAwarenessEnabled: false,
        },
        EBSOptions: {
          EBSEnabled: true,
          VolumeType: 'gp2',
          VolumeSize: 10,
        },
      }
    },
    showCreateModal: { value: false },
    showDeleteConfirm: { value: false },
    domainToDelete: { value: null },
    creating: { value: false },
    confirmDelete: vi.fn(),
    resetForm: vi.fn(),
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
    props: ['loading', 'variant'],
  },
  FormInput: {
    template: '<input :type="type" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'label', 'type', 'placeholder', 'required'],
    emits: ['update:modelValue'],
  },
  FormSelect: {
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="t3.medium.search">t3.medium.search</option></select>',
    props: ['modelValue', 'label', 'options'],
    emits: ['update:modelValue'],
  },
})

describe('OpenSearch Components Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('OpenSearchCreateDomainModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(OpenSearchCreateDomainModal, {
        props: {
          open: true,
          creating: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('Create Domain')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(OpenSearchCreateDomainModal, {
        props: {
          open: false,
          creating: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).not.toContain('Create Domain')
    })

    it('emits update:open when cancel clicked', async () => {
      const wrapper = mount(OpenSearchCreateDomainModal, {
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
      const wrapper = mount(OpenSearchCreateDomainModal, {
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
      const wrapper = mount(OpenSearchCreateDomainModal, {
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

    it('has select elements', () => {
      const wrapper = mount(OpenSearchCreateDomainModal, {
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
  })

  describe('OpenSearchDeleteModal', () => {
    const mockDomain = { DomainName: 'test-domain' }

    it('renders when open is true', () => {
      const wrapper = mount(OpenSearchDeleteModal, {
        props: {
          open: true,
          domain: mockDomain,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('test-domain')
      expect(wrapper.html()).toContain('Delete Domain')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(OpenSearchDeleteModal, {
        props: {
          open: false,
          domain: null,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).not.toContain('test-domain')
    })

    it('emits update:open when cancel clicked', async () => {
      const wrapper = mount(OpenSearchDeleteModal, {
        props: {
          open: true,
          domain: mockDomain,
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
      const wrapper = mount(OpenSearchDeleteModal, {
        props: {
          open: true,
          domain: mockDomain,
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
      const wrapper = mount(OpenSearchDeleteModal, {
        props: {
          open: true,
          domain: mockDomain,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('permanently remove')
    })

    it('handles null domain', () => {
      const wrapper = mount(OpenSearchDeleteModal, {
        props: {
          open: true,
          domain: null,
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
      const wrapper = mount(OpenSearchCreateDomainModal, {
        props: {
          open: true,
          creating: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('Create Domain')

      const createButton = wrapper.findAll('button').find(btn => btn.text().includes('Create'))
      if (createButton) {
        await createButton.trigger('click')
        expect(wrapper.emitted('create')).toBeTruthy()
      }
    })
  })

  describe('Delete Flow', () => {
    it('opens delete modal and can delete', async () => {
      const domain = { DomainName: 'domain-to-delete' }

      const wrapper = mount(OpenSearchDeleteModal, {
        props: {
          open: true,
          domain: domain,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('domain-to-delete')

      const deleteButton = wrapper.findAll('button').find(btn => btn.text().includes('Delete'))
      if (deleteButton) {
        await deleteButton.trigger('click')
        expect(wrapper.emitted('delete')).toBeTruthy()
      }
    })
  })
})
