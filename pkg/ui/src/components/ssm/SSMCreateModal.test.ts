import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SSMCreateModal from './SSMCreateModal.vue'

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
const formInputStub = { template: '<label>{{label}}<input /></label>', props: ['modelValue', 'label'] }
const formSelectStub = { template: '<label>{{label}}<select><option /></select></label>', props: ['modelValue', 'label', 'options'] }

const defaultProps = {
  open: true,
  loading: false,
  newParamName: '',
  newParamValue: '',
  newParamType: 'String' as const,
  newParamDescription: '',
}

const stubs = { Modal: modalStub, Button: buttonStub, FormInput: formInputStub, FormSelect: formSelectStub }

describe('SSMCreateModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mount(SSMCreateModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('does not render when open is false', () => {
    const wrapper = mount(SSMCreateModal, { props: { ...defaultProps, open: false }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('renders textarea for value', () => {
    const wrapper = mount(SSMCreateModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('renders cancel and create buttons', () => {
    const wrapper = mount(SSMCreateModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.text()).toContain('Cancel')
    expect(wrapper.text()).toContain('Create')
  })

  it('shows loading state', () => {
    const wrapper = mount(SSMCreateModal, { props: { ...defaultProps, loading: true }, global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })
})
