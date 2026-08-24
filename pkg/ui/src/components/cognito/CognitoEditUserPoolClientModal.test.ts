import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CognitoEditUserPoolClientModal from './CognitoEditUserPoolClientModal.vue'

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
  clientId: '1abc2def3ghi4jkl5mno6pqr7',
  clientName: 'web-app',
  refreshTokenValidity: 30,
  accessTokenValidity: 60,
  idTokenValidity: 60,
}

describe('CognitoEditUserPoolClientModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(CognitoEditUserPoolClientModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Edit User Pool Client')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(CognitoEditUserPoolClientModal, { props: { ...defaultProps, open: false }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('populates form from props when opened', async () => {
    const wrapper = mount(CognitoEditUserPoolClientModal, { props: { ...defaultProps, open: false }, global: { stubs } })
    await wrapper.setProps({ open: true })
    const inputs = wrapper.findAll('.form-input input')
    expect((inputs[0].element as HTMLInputElement).value).toBe('web-app')
    expect((inputs[1].element as HTMLInputElement).value).toBe('30')
    expect((inputs[2].element as HTMLInputElement).value).toBe('60')
    expect((inputs[3].element as HTMLInputElement).value).toBe('60')
  })

  it('emits update with userPoolId, clientId and params on save', async () => {
    const wrapper = mount(CognitoEditUserPoolClientModal, { props: defaultProps, global: { stubs } })
    const input = wrapper.find('.form-input input')
    await input.setValue('renamed-app')
    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Save'))
    await saveBtn!.trigger('click')
    expect(wrapper.emitted('update')![0]).toEqual([
      'us-east-1_abc123',
      '1abc2def3ghi4jkl5mno6pqr7',
      {
        ClientName: 'renamed-app',
        RefreshTokenValidity: 30,
        AccessTokenValidity: 60,
        IdTokenValidity: 60,
      },
    ])
  })

  it('emits update:open false on cancel', async () => {
    const wrapper = mount(CognitoEditUserPoolClientModal, { props: defaultProps, global: { stubs } })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})