import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CognitoCreateResourceServerModal from './CognitoCreateResourceServerModal.vue'

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

describe('CognitoCreateResourceServerModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(CognitoCreateResourceServerModal, { props: { open: true }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Create Resource Server')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(CognitoCreateResourceServerModal, { props: { open: false }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('emits create with identifier and name', async () => {
    const wrapper = mount(CognitoCreateResourceServerModal, { props: { open: true }, global: { stubs } })
    const inputs = wrapper.findAll('.form-input input')
    await inputs[0].setValue('api.example.com')
    await inputs[1].setValue('API Server')
    const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
    await createBtn!.trigger('click')
    expect(wrapper.emitted('create')![0]).toEqual([
      { Identifier: 'api.example.com', Name: 'API Server' },
    ])
  })

  it('emits update:open false on cancel', async () => {
    const wrapper = mount(CognitoCreateResourceServerModal, { props: { open: true }, global: { stubs } })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})