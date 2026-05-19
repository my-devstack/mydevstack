import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SSMDeleteModal from './SSMDeleteModal.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

const modalStub = {
  template: '<div v-if="open" data-testid="modal"><slot /><slot name="footer" /></div>',
  props: ['open', 'title', 'size'],
}
const buttonStub = {
  template: '<button :disabled="loading"><slot /></button>',
  props: ['variant', 'loading'],
}

const mockParam = {
  Name: '/test/param',
  Type: 'String',
  Value: 'test-value',
  Version: 1,
}

const defaultProps = {
  open: true,
  loading: false,
  parameterToDelete: mockParam,
}

const stubs = { Modal: modalStub, Button: buttonStub }

describe('SSMDeleteModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mount(SSMDeleteModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('does not render when open is false', () => {
    const wrapper = mount(SSMDeleteModal, { props: { ...defaultProps, open: false }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('displays parameter name', () => {
    const wrapper = mount(SSMDeleteModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.text()).toContain('/test/param')
  })

  it('shows confirmation message', () => {
    const wrapper = mount(SSMDeleteModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.text()).toContain('Are you sure')
    expect(wrapper.text()).toContain('cannot be undone')
  })

  it('renders cancel and delete buttons', () => {
    const wrapper = mount(SSMDeleteModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.text()).toContain('Cancel')
    expect(wrapper.text()).toContain('Delete')
  })

  it('handles null parameterToDelete gracefully', () => {
    const wrapper = mount(SSMDeleteModal, { props: { open: true, loading: false, parameterToDelete: null }, global: { stubs } })
    expect(wrapper.text()).not.toContain('Version')
  })
})
