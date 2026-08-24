import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { CognitoCreateUserPoolModal } from './index'

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

describe('CognitoCreateUserPoolModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(CognitoCreateUserPoolModal, { props: { open: true }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Create User Pool')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(CognitoCreateUserPoolModal, { props: { open: false }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('emits create with pool name', async () => {
    const wrapper = mount(CognitoCreateUserPoolModal, { props: { open: true }, global: { stubs } })
    const input = wrapper.find('.form-input input')
    await input.setValue('my-user-pool')
    const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
    await createBtn!.trigger('click')
    expect(wrapper.emitted('create')![0]).toEqual([{ PoolName: 'my-user-pool' }])
  })

  it('emits create on form submit', async () => {
    const wrapper = mount(CognitoCreateUserPoolModal, { props: { open: true }, global: { stubs } })
    const input = wrapper.find('.form-input input')
    await input.setValue('submit-pool')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('create')![0]).toEqual([{ PoolName: 'submit-pool' }])
  })

  it('emits update:open false on cancel and resets name', async () => {
    const wrapper = mount(CognitoCreateUserPoolModal, { props: { open: true }, global: { stubs } })
    const input = wrapper.find('.form-input input')
    await input.setValue('temp-pool')
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
    expect(wrapper.vm.poolName).toBe('')
  })
})
