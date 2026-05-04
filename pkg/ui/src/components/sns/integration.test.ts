import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { SNSCreateTopicModal, SNSDeleteModal } from './index'

vi.mock('@/composables/useSNS', () => ({
  useSNS: vi.fn(() => ({
    createForm: {
      value: {
        name: '',
        displayName: '',
      }
    },
    showCreateModal: { value: false },
    showDeleteConfirm: { value: false },
    topicToDelete: { value: null },
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
})

describe('SNS Components Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('SNSCreateTopicModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(SNSCreateTopicModal, {
        props: {
          open: true,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('Create SNS Topic')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(SNSCreateTopicModal, {
        props: {
          open: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).not.toContain('Create SNS Topic')
    })

    it('emits update:open when cancel clicked', async () => {
      const wrapper = mount(SNSCreateTopicModal, {
        props: {
          open: true,
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
      const wrapper = mount(SNSCreateTopicModal, {
        props: {
          open: true,
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
      const wrapper = mount(SNSCreateTopicModal, {
        props: {
          open: true,
        },
        global: {
          stubs: createStubs(),
        },
      })

      const inputs = wrapper.findAll('input')
      expect(inputs.length).toBeGreaterThan(0)
    })
  })

  describe('SNSDeleteModal', () => {
    const mockTopic = { TopicName: 'test-topic' }

    it('renders when open is true', () => {
      const wrapper = mount(SNSDeleteModal, {
        props: {
          open: true,
          topic: mockTopic,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('test-topic')
      expect(wrapper.html()).toContain('Delete SNS Topic')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(SNSDeleteModal, {
        props: {
          open: false,
          topic: null,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).not.toContain('test-topic')
    })

    it('emits update:open when cancel clicked', async () => {
      const wrapper = mount(SNSDeleteModal, {
        props: {
          open: true,
          topic: mockTopic,
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
      const wrapper = mount(SNSDeleteModal, {
        props: {
          open: true,
          topic: mockTopic,
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
      const wrapper = mount(SNSDeleteModal, {
        props: {
          open: true,
          topic: mockTopic,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('subscriptions')
    })

    it('handles null topic', () => {
      const wrapper = mount(SNSDeleteModal, {
        props: {
          open: true,
          topic: null,
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
      const wrapper = mount(SNSCreateTopicModal, {
        props: {
          open: true,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('Create SNS Topic')

      const createButton = wrapper.findAll('button').find(btn => btn.text().includes('Create'))
      if (createButton) {
        await createButton.trigger('click')
        expect(wrapper.emitted('create')).toBeTruthy()
      }
    })
  })

  describe('Delete Flow', () => {
    it('opens delete modal and can delete', async () => {
      const topic = { TopicName: 'topic-to-delete' }

      const wrapper = mount(SNSDeleteModal, {
        props: {
          open: true,
          topic: topic,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('topic-to-delete')

      const deleteButton = wrapper.findAll('button').find(btn => btn.text().includes('Delete'))
      if (deleteButton) {
        await deleteButton.trigger('click')
        expect(wrapper.emitted('delete')).toBeTruthy()
      }
    })
  })
})