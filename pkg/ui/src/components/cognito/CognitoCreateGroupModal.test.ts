import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { CognitoCreateGroupModal } from './index'

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

describe('CognitoCreateGroupModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(CognitoCreateGroupModal, { props: { open: true }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Create Group')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(CognitoCreateGroupModal, { props: { open: false }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('emits create with group name and description', async () => {
    const wrapper = mount(CognitoCreateGroupModal, { props: { open: true }, global: { stubs } })
    const inputs = wrapper.findAll('.form-input input')
    await inputs[0].setValue('admins')
    await inputs[1].setValue('Admin group')
    const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
    await createBtn!.trigger('click')
    expect(wrapper.emitted('create')![0]).toEqual([{ GroupName: 'admins', Description: 'Admin group' }])
  })

  it('emits create with undefined description when empty', async () => {
    const wrapper = mount(CognitoCreateGroupModal, { props: { open: true }, global: { stubs } })
    const inputs = wrapper.findAll('.form-input input')
    await inputs[0].setValue('devs')
    const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
    await createBtn!.trigger('click')
    expect(wrapper.emitted('create')![0]).toEqual([{ GroupName: 'devs', Description: undefined }])
  })

  it('emits create on form submit', async () => {
    const wrapper = mount(CognitoCreateGroupModal, { props: { open: true }, global: { stubs } })
    const inputs = wrapper.findAll('.form-input input')
    await inputs[0].setValue('ops')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('create')![0]).toEqual([{ GroupName: 'ops', Description: undefined }])
  })

  it('emits update:open false on cancel and resets form', async () => {
    const wrapper = mount(CognitoCreateGroupModal, { props: { open: true }, global: { stubs } })
    const inputs = wrapper.findAll('.form-input input')
    await inputs[0].setValue('temp')
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
    expect(wrapper.vm.newGroup.GroupName).toBe('')
  })
})
