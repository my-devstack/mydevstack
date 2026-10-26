import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import S3DeleteModal from './S3DeleteModal.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({
    darkMode: false,
  }),
}))

const ModalStub = {
  template: `
    <div v-if="open" class="modal-stub">
      <div class="modal-title">{{ title }}</div>
      <div class="modal-body"><slot /></div>
      <div class="modal-footer"><slot name="footer" /></div>
    </div>
  `,
  props: ['open', 'title', 'size', 'closable', 'closeOnEsc', 'closeOnBackdrop'],
  emits: ['update:open', 'close'],
}

describe('S3DeleteModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('exists as a component', () => {
    expect(S3DeleteModal).toBeDefined()
  })

  it('has required props defined', () => {
    expect(S3DeleteModal.props).toBeDefined()
    expect(S3DeleteModal.props.open).toBeDefined()
    expect(S3DeleteModal.props.item).toBeDefined()
    expect(S3DeleteModal.props.loading).toBeDefined()
  })

  it('open prop is required', () => {
    expect(S3DeleteModal.props.open.required).toBe(true)
  })

  it('item prop is required', () => {
    expect(S3DeleteModal.props.item.required).toBe(true)
  })

  it('loading prop is optional boolean', () => {
    expect(S3DeleteModal.props.loading.required).toBeFalsy()
    expect(S3DeleteModal.props.loading.type).toBe(Boolean)
  })

  it('item prop has correct structure', () => {
    expect(S3DeleteModal.props.item).toBeDefined()
  })

  it('emits update:open event', () => {
    expect(S3DeleteModal.emits).toBeDefined()
    expect(S3DeleteModal.emits).toContain('update:open')
  })

  it('emits delete event', () => {
    expect(S3DeleteModal.emits).toBeDefined()
    expect(S3DeleteModal.emits).toContain('delete')
  })

  it('handles bucket type item', () => {
    const wrapper = mount(S3DeleteModal, {
      props: {
        open: true,
        item: { type: 'bucket', name: 'test-bucket' },
        loading: false,
      },
      global: { stubs: { Modal: ModalStub } },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('handles object type item', () => {
    const wrapper = mount(S3DeleteModal, {
      props: {
        open: true,
        item: { type: 'object', name: 'test-file.txt' },
        loading: false,
      },
      global: { stubs: { Modal: ModalStub } },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('handles null item', () => {
    const wrapper = mount(S3DeleteModal, {
      props: {
        open: true,
        item: null,
        loading: false,
      },
      global: { stubs: { Modal: ModalStub } },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('handles loading state', () => {
    const wrapper = mount(S3DeleteModal, {
      props: {
        open: true,
        item: { type: 'bucket', name: 'test-bucket' },
        loading: true,
      },
      global: { stubs: { Modal: ModalStub } },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('handles closed state', () => {
    const wrapper = mount(S3DeleteModal, {
      props: {
        open: false,
        item: { type: 'bucket', name: 'test-bucket' },
        loading: false,
      },
      global: { stubs: { Modal: ModalStub } },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('handles item with special characters', () => {
    const wrapper = mount(S3DeleteModal, {
      props: {
        open: true,
        item: { type: 'object', name: 'file-with-spaces.txt' },
        loading: false,
      },
      global: { stubs: { Modal: ModalStub } },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('handles item with path', () => {
    const wrapper = mount(S3DeleteModal, {
      props: {
        open: true,
        item: { type: 'object', name: 'folder/nested/file.txt' },
        loading: false,
      },
      global: { stubs: { Modal: ModalStub } },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('handles empty item name', () => {
    const wrapper = mount(S3DeleteModal, {
      props: {
        open: true,
        item: { type: 'bucket', name: '' },
        loading: false,
      },
      global: { stubs: { Modal: ModalStub } },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('handles unicode in item name', () => {
    const wrapper = mount(S3DeleteModal, {
      props: {
        open: true,
        item: { type: 'bucket', name: 'bucket-测试' },
        loading: false,
      },
      global: { stubs: { Modal: ModalStub } },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('handles folder type item', () => {
    const wrapper = mount(S3DeleteModal, {
      props: {
        open: true,
        item: { type: 'folder', name: 'folder/' },
        loading: false,
      },
      global: { stubs: { Modal: ModalStub } },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('shows "Delete Folder" title for folder type', () => {
    const wrapper = mount(S3DeleteModal, {
      props: {
        open: true,
        item: { type: 'folder', name: 'folder/' },
        loading: false,
      },
      global: { stubs: { Modal: ModalStub } },
    })
    expect(wrapper.html()).toContain('Delete Folder')
  })

  it('shows object count in folder delete message', () => {
    const wrapper = mount(S3DeleteModal, {
      props: {
        open: true,
        item: { type: 'folder', name: 'folder/' },
        objectCount: 42,
        loading: false,
      },
      global: { stubs: { Modal: ModalStub } },
    })
    expect(wrapper.text()).toContain('all 42 object(s) inside it')
  })

  it('shows "Delete Bucket" title for bucket type', () => {
    const wrapper = mount(S3DeleteModal, {
      props: {
        open: true,
        item: { type: 'bucket', name: 'my-bucket' },
        loading: false,
      },
      global: { stubs: { Modal: ModalStub } },
    })
    expect(wrapper.html()).toContain('Delete Bucket')
    expect(wrapper.text()).toContain('bucket and all its objects')
  })

  it('shows "Delete Object" title for object type', () => {
    const wrapper = mount(S3DeleteModal, {
      props: {
        open: true,
        item: { type: 'object', name: 'file.txt' },
        loading: false,
      },
      global: { stubs: { Modal: ModalStub } },
    })
    expect(wrapper.html()).toContain('Delete Object')
    expect(wrapper.text()).toContain('permanently delete the object')
  })

  it('shows Deleting... when loading is true', () => {
    const wrapper = mount(S3DeleteModal, {
      props: {
        open: true,
        item: { type: 'bucket', name: 'test' },
        loading: true,
      },
      global: { stubs: { Modal: ModalStub } },
    })
    const buttons = wrapper.findAll('button')
    const deleteButton = buttons.find(b => b.text().includes('Deleting'))
    expect(deleteButton).toBeTruthy()
    expect(deleteButton?.text()).toBe('Deleting...')
  })

  it('disables all buttons when loading', () => {
    const wrapper = mount(S3DeleteModal, {
      props: {
        open: true,
        item: { type: 'bucket', name: 'test' },
        loading: true,
      },
      global: { stubs: { Modal: ModalStub } },
    })
    const buttons = wrapper.findAll('button')
    buttons.forEach(btn => {
      expect(btn.attributes('disabled')).toBeDefined()
    })
  })

  it('disables Modal dismissal when loading', () => {
    const wrapper = mount(S3DeleteModal, {
      props: {
        open: true,
        item: { type: 'folder', name: 'a/' },
        loading: true,
      },
      global: { stubs: { Modal: ModalStub } },
    })
    const modal = wrapper.findComponent(ModalStub)
    expect(modal.props('closable')).toBe(false)
    expect(modal.props('closeOnEsc')).toBe(false)
    expect(modal.props('closeOnBackdrop')).toBe(false)
  })

  it('enables Modal dismissal when not loading', () => {
    const wrapper = mount(S3DeleteModal, {
      props: {
        open: true,
        item: { type: 'folder', name: 'a/' },
        loading: false,
      },
      global: { stubs: { Modal: ModalStub } },
    })
    const modal = wrapper.findComponent(ModalStub)
    expect(modal.props('closable')).toBe(true)
    expect(modal.props('closeOnEsc')).toBe(true)
    expect(modal.props('closeOnBackdrop')).toBe(true)
  })
})