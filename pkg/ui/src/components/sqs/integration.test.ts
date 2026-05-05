import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { SQSCreateQueueModal, SQSMessagesModal } from './index'

vi.mock('@/composables/useSQS', () => ({
  useSQS: vi.fn(() => ({
    queues: { value: [] },
    loading: { value: false },
    messages: { value: [] },
    loadingMessages: { value: false },
    expandedQueues: { value: new Set() },
    queueAttributesMap: { value: {} },
    loadQueues: vi.fn(),
    createQueue: vi.fn(),
    deleteQueue: vi.fn(),
    loadMessages: vi.fn(),
    deleteMessageFromQueue: vi.fn(),
    formatBody: vi.fn(),
  })),
}))

vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
    notifyWarning: vi.fn(),
  })),
}))

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    theme: 'light',
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
    emits: ['update:open', 'close'],
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
  FormCheckbox: {
    template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
  },
  LoadingSpinner: {
    template: '<div class="spinner">Loading...</div>',
  },
  EmptyState: {
    template: '<div class="empty-state"><slot /></div>',
    props: ['icon', 'title'],
  },
})

describe('SQS Components Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('SQSCreateQueueModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(SQSCreateQueueModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create Queue')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(SQSCreateQueueModal, {
        props: { open: false },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('Create Queue')
    })

    it('emits update:open on cancel', async () => {
      const wrapper = mount(SQSCreateQueueModal, {
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

    it('has queue name input', () => {
      const wrapper = mount(SQSCreateQueueModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const inputs = wrapper.findAll('input')
      expect(inputs.length).toBeGreaterThan(0)
    })

    it('has FIFO checkbox', () => {
      const wrapper = mount(SQSCreateQueueModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      expect(checkboxes.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('SQSMessagesModal', () => {
    it('renders when open with required props', () => {
      const wrapper = mount(SQSMessagesModal, {
        props: { open: true, queueName: 'test-queue', messages: [], loading: false },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('test-queue')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(SQSMessagesModal, {
        props: { open: false, queueName: '', messages: [], loading: false },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('test-queue')
    })

    it('shows message count', () => {
      const wrapper = mount(SQSMessagesModal, {
        props: { open: true, queueName: 'my-queue', messages: [], loading: false },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('0 message(s)')
    })

    it('shows messages when present', () => {
      const wrapper = mount(SQSMessagesModal, {
        props: {
          open: true,
          queueName: 'my-queue',
          messages: [{ MessageId: '123', Body: 'test' }],
          loading: false,
        },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('123')
    })
  })

  describe('Create Queue Flow', () => {
    it('opens create modal', () => {
      const wrapper = mount(SQSCreateQueueModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create Queue')
    })

    it('has name and FIFO options', () => {
      const wrapper = mount(SQSCreateQueueModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const inputs = wrapper.findAll('input')
      expect(inputs.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('View Messages Flow', () => {
    it('opens messages modal', () => {
      const wrapper = mount(SQSMessagesModal, {
        props: { open: true, queueName: 'my-queue', messages: [], loading: false },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('my-queue')
    })
  })
})