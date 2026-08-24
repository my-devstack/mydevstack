import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { LambdaDeleteModal } from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
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
})

describe('LambdaDeleteModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(LambdaDeleteModal, {
      props: { open: true, functionName: 'test-function', loading: false },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Delete Function')
    expect(wrapper.html()).toContain('test-function')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(LambdaDeleteModal, {
      props: { open: false, functionName: '', loading: false },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).not.toContain('Delete Function')
  })

  it('shows warning message', () => {
    const wrapper = mount(LambdaDeleteModal, {
      props: { open: true, functionName: 'test-function', loading: false },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('permanently delete')
    expect(wrapper.html()).toContain('cannot be undone')
  })

  it('shows loading state when deleting', () => {
    const wrapper = mount(LambdaDeleteModal, {
      props: { open: true, functionName: 'test-function', loading: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Deleting...')
  })

  it('emits delete when delete clicked', async () => {
    const wrapper = mount(LambdaDeleteModal, {
      props: { open: true, functionName: 'test-function', loading: false },
      global: { stubs: createStubs() },
    })
    const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Delete'))
    await deleteBtn!.trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('emits update:open false on cancel', async () => {
    const wrapper = mount(LambdaDeleteModal, {
      props: { open: true, functionName: 'test-function', loading: false },
      global: { stubs: createStubs() },
    })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })

})
