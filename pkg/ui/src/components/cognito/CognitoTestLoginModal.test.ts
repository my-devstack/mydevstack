import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CognitoTestLoginModal from './CognitoTestLoginModal.vue'

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
  userPoolId: 'us-east-1_abc123',
  clients: [
    { ClientId: 'client-1', ClientName: 'web-app' },
    { ClientId: 'client-2', ClientName: 'mobile-app' },
  ],
}

describe('CognitoTestLoginModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(CognitoTestLoginModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Login')
    expect(wrapper.text()).toContain('alice')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(CognitoTestLoginModal, { props: { ...defaultProps, open: false }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('emits test with password and selected clientId', async () => {
    const wrapper = mount(CognitoTestLoginModal, { props: defaultProps, global: { stubs } })
    const input = wrapper.find('.form-input input')
    await input.setValue('Pass123!')
    const select = wrapper.find('select')
    await select.setValue('client-1')
    const testBtn = wrapper.findAll('button').find(b => b.text().includes('Test Login'))
    await testBtn!.trigger('click')
    expect(wrapper.emitted('test')![0]).toEqual(['Pass123!', 'client-1'])
  })

  it('emits test without clientId when none selected', async () => {
    const wrapper = mount(CognitoTestLoginModal, { props: defaultProps, global: { stubs } })
    const input = wrapper.find('.form-input input')
    await input.setValue('Pass123!')
    const testBtn = wrapper.findAll('button').find(b => b.text().includes('Test Login'))
    await testBtn!.trigger('click')
    expect(wrapper.emitted('test')![0]).toEqual(['Pass123!', undefined])
  })

  it('displays auth result when provided', () => {
    const wrapper = mount(CognitoTestLoginModal, {
      props: { ...defaultProps, authResult: { AuthenticationResult: { AccessToken: 'token123' } } },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Authentication Result')
    expect(wrapper.text()).toContain('token123')
  })

  it('emits update:open false on close', async () => {
    const wrapper = mount(CognitoTestLoginModal, { props: defaultProps, global: { stubs } })
    const closeBtn = wrapper.findAll('button').find(b => b.text().includes('Close'))
    await closeBtn!.trigger('click')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})