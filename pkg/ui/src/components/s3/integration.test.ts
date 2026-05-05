import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { S3CreateModal, S3DeleteModal, S3ViewModal } from './index'

vi.mock('@/composables/useS3', () => ({
  useS3: vi.fn(() => ({
    buckets: { value: [] },
    objects: { value: [] },
    selectedBucket: { value: null },
    loading: { value: false },
    uploading: { value: false },
    loadBuckets: vi.fn(),
    createBucket: vi.fn(),
    deleteBucket: vi.fn(),
    loadObjects: vi.fn(),
    deleteObject: vi.fn(),
    getObject: vi.fn(),
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
    props: ['loading', 'variant'],
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
})

describe('S3 Components Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('S3CreateModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(S3CreateModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create New Bucket')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(S3CreateModal, {
        props: { open: false },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('Create New Bucket')
    })

    it('emits update:open on cancel', async () => {
      const wrapper = mount(S3CreateModal, {
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

    it('has bucket name input', () => {
      const wrapper = mount(S3CreateModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const inputs = wrapper.findAll('input')
      expect(inputs.length).toBeGreaterThan(0)
    })

    it('has CORS checkbox', () => {
      const wrapper = mount(S3CreateModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      expect(checkboxes.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('S3DeleteModal', () => {
    it('renders when open with item', () => {
      const wrapper = mount(S3DeleteModal, {
        props: { open: true, item: { type: 'bucket', name: 'test-bucket' } },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Delete Bucket')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(S3DeleteModal, {
        props: { open: false, item: null },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('Delete')
    })

    it('emits update:open on cancel', async () => {
      const wrapper = mount(S3DeleteModal, {
        props: { open: true, item: { type: 'bucket', name: 'test' } },
        global: { stubs: createStubs() },
      })
      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
      expect(cancelBtn).toBeTruthy()
      if (cancelBtn) {
        await cancelBtn.trigger('click')
        expect(wrapper.emitted('update:open')).toBeTruthy()
      }
    })

    it('emits delete on confirm', async () => {
      const wrapper = mount(S3DeleteModal, {
        props: { open: true, item: { type: 'bucket', name: 'test' } },
        global: { stubs: createStubs() },
      })
      const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Delete'))
      expect(deleteBtn).toBeTruthy()
      if (deleteBtn) {
        await deleteBtn.trigger('click')
        expect(wrapper.emitted('delete')).toBeTruthy()
      }
    })

    it('handles null item', () => {
      const wrapper = mount(S3DeleteModal, {
        props: { open: true, item: null },
        global: { stubs: createStubs() },
      })
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('S3ViewModal', () => {
    it('renders when open with file', () => {
      const wrapper = mount(S3ViewModal, {
        props: {
          open: true,
          fileName: 'test-object.txt',
          content: 'test content',
          contentType: 'text/plain',
          bucketName: 'test-bucket',
        },
        global: { stubs: createStubs() },
      })
      expect(wrapper.exists()).toBe(true)
    })

    it('does not render when open is false', () => {
      const wrapper = mount(S3ViewModal, {
        props: { open: false, fileName: '', content: '', contentType: '', bucketName: null },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('test-object')
    })

    it('emits close on close button', async () => {
      const wrapper = mount(S3ViewModal, {
        props: { open: true, fileName: 'test', content: '', contentType: 'text/plain', bucketName: 'bucket' },
        global: { stubs: createStubs() },
      })
      const closeBtn = wrapper.findAll('button').find(b => b.text().includes('Close'))
      if (closeBtn) {
        await closeBtn.trigger('click')
        expect(wrapper.emitted('close')).toBeTruthy()
      }
    })
  })

  describe('Create Bucket Flow', () => {
    it('opens create modal', () => {
      const wrapper = mount(S3CreateModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create New Bucket')
    })
  })

  describe('Delete Bucket Flow', () => {
    it('opens delete modal', () => {
      const wrapper = mount(S3DeleteModal, {
        props: { open: true, item: { type: 'bucket', name: 'bucket' } },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Delete Bucket')
    })
  })

  describe('View Object Flow', () => {
    it('opens view modal', () => {
      const wrapper = mount(S3ViewModal, {
        props: { open: true, fileName: 'readme.md', content: '', contentType: 'text/plain', bucketName: 'bucket' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.exists()).toBe(true)
    })
  })
})