import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CognitoResetPasswordModal from './CognitoResetPasswordModal.vue'

const modalStub = {
  template: '<div v-if="open" data-testid="modal">{{title}}<slot /><slot name="footer" /></div>',
  props: ['open', 'title'],
  emits: ['update:open', 'close'],
}
const buttonStub = {
  template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  props: ['variant', 'loading', 'disabled'],
  emits: ['click'],
}
const formInputStub = {
  template: '<div class="form-input">{{label}}<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /></div>',
  props: ['modelValue', 'label', 'placeholder', 'type'],
  emits: ['update:modelValue'],
}

const stubs = { Modal: modalStub, Button: buttonStub, FormInput: formInputStub }

const defaultProps = {
  open: true,
  username: 'alice',
}

describe('CognitoResetPasswordModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(CognitoResetPasswordModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Reset Password')
    expect(wrapper.text()).toContain('alice')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(CognitoResetPasswordModal, { props: { ...defaultProps, open: false }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('emits confirm with password and permanent', async () => {
    const wrapper = mount(CognitoResetPasswordModal, { props: defaultProps, global: { stubs } })
    const input = wrapper.find('.form-input input')
    await input.setValue('NewPass123!')
    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(true)
    const confirmBtn = wrapper.findAll('button').find(b => b.text().includes('Reset Password'))
    await confirmBtn!.trigger('click')
    expect(wrapper.emitted('confirm')![0]).toEqual(['NewPass123!', true])
  })

  it('emits confirm with permanent false by default', async () => {
    const wrapper = mount(CognitoResetPasswordModal, { props: defaultProps, global: { stubs } })
    const input = wrapper.find('.form-input input')
    await input.setValue('NewPass123!')
    const confirmBtn = wrapper.findAll('button').find(b => b.text().includes('Reset Password'))
    await confirmBtn!.trigger('click')
    expect(wrapper.emitted('confirm')![0]).toEqual(['NewPass123!', false])
  })

  it('emits update:open false on cancel', async () => {
    const wrapper = mount(CognitoResetPasswordModal, { props: defaultProps, global: { stubs } })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})