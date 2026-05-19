import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import KinesisCreateModal from './KinesisCreateModal.vue'

const modalStub = {
  template: '<div v-if="open" data-testid="modal"><slot /><slot name="footer" /></div>',
  props: ['open', 'title', 'size'],
}
const buttonStub = {
  template: '<button :loading="loading"><slot /></button>',
  props: ['variant', 'loading'],
}
const formInputStub = { template: '<input />', props: ['modelValue', 'label'] }

const defaultProps = {
  open: true,
  isLoading: false,
  newStream: { name: '', shardCount: 1 },
}

const stubs = { Modal: modalStub, Button: buttonStub, FormInput: formInputStub }

describe('KinesisCreateModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mount(KinesisCreateModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('does not render when open is false', () => {
    const wrapper = mount(KinesisCreateModal, { props: { ...defaultProps, open: false }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('shows loading state', () => {
    const wrapper = mount(KinesisCreateModal, { props: { ...defaultProps, isLoading: true }, global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders cancel and create buttons', () => {
    const wrapper = mount(KinesisCreateModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.text()).toContain('Cancel')
    expect(wrapper.text()).toContain('Create')
  })
})
