import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CognitoCreateUserPoolClientModal from './CognitoCreateUserPoolClientModal.vue'

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

describe('CognitoCreateUserPoolClientModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(CognitoCreateUserPoolClientModal, { props: { open: true }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Create User Pool Client')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(CognitoCreateUserPoolClientModal, { props: { open: false }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('emits create with client name and secret flag', async () => {
    const wrapper = mount(CognitoCreateUserPoolClientModal, { props: { open: true }, global: { stubs } })
    const input = wrapper.find('.form-input input')
    await input.setValue('web-app')
    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(true)
    const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
    await createBtn!.trigger('click')
    expect(wrapper.emitted('create')![0]).toEqual([
      { ClientName: 'web-app', GenerateSecret: true },
    ])
  })

  it('emits create without secret flag when unchecked', async () => {
    const wrapper = mount(CognitoCreateUserPoolClientModal, { props: { open: true }, global: { stubs } })
    const input = wrapper.find('.form-input input')
    await input.setValue('mobile-app')
    const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
    await createBtn!.trigger('click')
    expect(wrapper.emitted('create')![0]).toEqual([
      { ClientName: 'mobile-app', GenerateSecret: undefined },
    ])
  })

  it('emits update:open false on cancel', async () => {
    const wrapper = mount(CognitoCreateUserPoolClientModal, { props: { open: true }, global: { stubs } })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})