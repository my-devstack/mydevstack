import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CognitoDeleteUserPoolClientModal from './CognitoDeleteUserPoolClientModal.vue'

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

const stubs = { Modal: modalStub, Button: buttonStub }

const defaultProps = {
  open: true,
  clientId: 'client-1',
  clientName: 'web-app',
}

describe('CognitoDeleteUserPoolClientModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(CognitoDeleteUserPoolClientModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Delete User Pool Client')
    expect(wrapper.text()).toContain('web-app')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(CognitoDeleteUserPoolClientModal, { props: { ...defaultProps, open: false }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('emits confirm on delete click', async () => {
    const wrapper = mount(CognitoDeleteUserPoolClientModal, { props: defaultProps, global: { stubs } })
    const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Delete'))
    await deleteBtn!.trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('emits update:open false on cancel', async () => {
    const wrapper = mount(CognitoDeleteUserPoolClientModal, { props: defaultProps, global: { stubs } })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})