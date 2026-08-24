import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CognitoEditUserModal from './CognitoEditUserModal.vue'

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
  userPoolId: 'us-east-1_abc123',
  username: 'alice',
  email: 'alice@example.com',
  phoneNumber: '+15551234567',
}

describe('CognitoEditUserModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(CognitoEditUserModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Edit User')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(CognitoEditUserModal, { props: { ...defaultProps, open: false }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('populates form from props when opened', async () => {
    const wrapper = mount(CognitoEditUserModal, { props: { ...defaultProps, open: false }, global: { stubs } })
    await wrapper.setProps({ open: true })
    const inputs = wrapper.findAll('.form-input input')
    expect((inputs[0].element as HTMLInputElement).value).toBe('alice@example.com')
    expect((inputs[1].element as HTMLInputElement).value).toBe('+15551234567')
  })

  it('emits update with userPoolId, username and UserAttributes on save', async () => {
    const wrapper = mount(CognitoEditUserModal, { props: defaultProps, global: { stubs } })
    const inputs = wrapper.findAll('.form-input input')
    await inputs[0].setValue('new@example.com')
    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Save'))
    await saveBtn!.trigger('click')
    expect(wrapper.emitted('update')![0]).toEqual([
      'us-east-1_abc123',
      'alice',
      [
        { Name: 'email', Value: 'new@example.com' },
        { Name: 'phone_number', Value: '+15551234567' },
      ],
    ])
  })

  it('emits update:open false on cancel', async () => {
    const wrapper = mount(CognitoEditUserModal, { props: defaultProps, global: { stubs } })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})