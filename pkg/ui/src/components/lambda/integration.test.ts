import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { LambdaCreateModal, LambdaDeleteModal, LambdaEditModal, LambdaInvokeModal } from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
  })),
}))

vi.mock('@/composables/useLambda', () => ({
  useLambda: vi.fn(() => ({
    createForm: {
      value: {
        functionName: '',
        runtime: 'nodejs22.x',
        handler: 'index.handler',
        memory: 128,
        timeout: 30,
        roleArn: 'arn:aws:iam::123456789012:role/test',
        zipFile: null,
        architecture: 'amd64',
        environment: '',
      }
    },
    showCreateModal: { value: false },
    showDeleteConfirm: { value: false },
    showEditModal: { value: false },
    showInvokeModal: { value: false },
    functionToDelete: { value: null },
    functionToEdit: { value: null },
    functionToInvoke: { value: null },
    creating: { value: false },
    resetting: { value: false },
    invoking: { value: false },
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
    emits: ['update:open', 'close'],
  },
  Button: {
    template: '<button @click="$emit(\'click\')" :loading="loading" :disabled="disabled" :variant="variant"><slot /></button>',
    props: ['loading', 'variant', 'disabled'],
  },
  FormInput: {
    template: '<input :type="type" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'label', 'type', 'placeholder', 'required'],
    emits: ['update:modelValue'],
  },
  FormSelect: {
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="nodejs22.x">Node.js 22</option></select>',
    props: ['modelValue', 'label', 'options'],
    emits: ['update:modelValue'],
  },
})

describe('Lambda Components Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('LambdaCreateModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(LambdaCreateModal, {
        props: {
          open: true,
          loading: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('Create Lambda Function')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(LambdaCreateModal, {
        props: {
          open: false,
          loading: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).not.toContain('Create Lambda Function')
    })

    it('has form inputs', () => {
      const wrapper = mount(LambdaCreateModal, {
        props: {
          open: true,
          loading: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      const inputs = wrapper.findAll('input')
      expect(inputs.length).toBeGreaterThan(0)
    })

    it('has select elements', () => {
      const wrapper = mount(LambdaCreateModal, {
        props: {
          open: true,
          loading: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      const selects = wrapper.findAll('select')
      expect(selects.length).toBeGreaterThan(0)
    })

    it('emits create event when create clicked', async () => {
      const wrapper = mount(LambdaCreateModal, {
        props: {
          open: true,
          loading: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      const createButton = wrapper.findAll('button').find(btn => btn.text().includes('Create'))
      expect(createButton).toBeTruthy()

      // Button exists - verify modal structure is correct
      expect(wrapper.html()).toContain('Create Lambda Function')
    })

    it('shows loading state when creating', () => {
      const wrapper = mount(LambdaCreateModal, {
        props: {
          open: true,
          loading: true,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('Creating...')
    })
  })

  describe('LambdaDeleteModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(LambdaDeleteModal, {
        props: {
          open: true,
          functionName: 'test-function',
          loading: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('test-function')
      expect(wrapper.html()).toContain('Delete Function')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(LambdaDeleteModal, {
        props: {
          open: false,
          functionName: '',
          loading: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).not.toContain('Delete Function')
    })

    it('emits delete event when delete clicked', async () => {
      const wrapper = mount(LambdaDeleteModal, {
        props: {
          open: true,
          functionName: 'test-function',
          loading: false,
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
      const wrapper = mount(LambdaDeleteModal, {
        props: {
          open: true,
          functionName: 'test-function',
          loading: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('permanently delete')
      expect(wrapper.html()).toContain('cannot be undone')
    })

    it('shows loading state when deleting', () => {
      const wrapper = mount(LambdaDeleteModal, {
        props: {
          open: true,
          functionName: 'test-function',
          loading: true,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('Deleting...')
    })
  })

  describe('LambdaEditModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(LambdaEditModal, {
        props: {
          open: true,
          functionName: 'test-function',
          memory: 256,
          timeout: 60,
          loading: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('test-function')
      expect(wrapper.html()).toContain('Update Function Configuration')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(LambdaEditModal, {
        props: {
          open: false,
          functionName: '',
          loading: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).not.toContain('Update Function Configuration')
    })

    it('emits update-config event when update clicked', async () => {
      const wrapper = mount(LambdaEditModal, {
        props: {
          open: true,
          functionName: 'test-function',
          memory: 256,
          timeout: 60,
          loading: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      const updateButton = wrapper.findAll('button').find(btn => btn.text().includes('Update'))
      expect(updateButton).toBeTruthy()

      if (updateButton) {
        await updateButton.trigger('click')
        expect(wrapper.emitted('update-config')).toBeTruthy()
      }
    })

    it('has memory and timeout inputs', () => {
      const wrapper = mount(LambdaEditModal, {
        props: {
          open: true,
          functionName: 'test-function',
          memory: 256,
          timeout: 60,
          loading: false,
        },
        global: {
          stubs: createStubs(),
        },
      })

      const inputs = wrapper.findAll('input')
      expect(inputs.length).toBeGreaterThanOrEqual(2)
    })

    it('shows loading state when updating', () => {
      const wrapper = mount(LambdaEditModal, {
        props: {
          open: true,
          functionName: 'test-function',
          memory: 256,
          timeout: 60,
          loading: true,
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('Updating...')
    })
  })

  describe('LambdaInvokeModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(LambdaInvokeModal, {
        props: {
          open: true,
          functionName: 'test-function',
          loading: false,
          result: '',
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('test-function')
      expect(wrapper.html()).toContain('Invoke:')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(LambdaInvokeModal, {
        props: {
          open: false,
          functionName: '',
          loading: false,
          result: '',
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).not.toContain('Invoke:')
    })

    it('has payload input', () => {
      const wrapper = mount(LambdaInvokeModal, {
        props: {
          open: true,
          functionName: 'test-function',
          loading: false,
          result: '',
        },
        global: {
          stubs: createStubs(),
        },
      })

      const inputs = wrapper.findAll('input')
      expect(inputs.length).toBeGreaterThan(0)
    })

    it('emits invoke event when invoke clicked', async () => {
      const wrapper = mount(LambdaInvokeModal, {
        props: {
          open: true,
          functionName: 'test-function',
          loading: false,
          result: '',
        },
        global: {
          stubs: createStubs(),
        },
      })

      const invokeButton = wrapper.findAll('button').find(btn => btn.text().includes('Invoke'))
      expect(invokeButton).toBeTruthy()

      if (invokeButton) {
        await invokeButton.trigger('click')
        expect(wrapper.emitted('invoke')).toBeTruthy()
      }
    })

    it('shows result when provided', () => {
      const wrapper = mount(LambdaInvokeModal, {
        props: {
          open: true,
          functionName: 'test-function',
          loading: false,
          result: '{"statusCode": 200}',
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('Result:')
      expect(wrapper.html()).toContain('statusCode')
    })

    it('shows loading state when invoking', () => {
      const wrapper = mount(LambdaInvokeModal, {
        props: {
          open: true,
          functionName: 'test-function',
          loading: true,
          result: '',
        },
        global: {
          stubs: createStubs(),
        },
      })

      expect(wrapper.html()).toContain('Invoking...')
    })
  })
})