import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CognitoDeleteResourceServerModal from './CognitoDeleteResourceServerModal.vue'

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
  identifier: 'api.example.com',
  name: 'API Server',
}

describe('CognitoDeleteResourceServerModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(CognitoDeleteResourceServerModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Delete Resource Server')
    expect(wrapper.text()).toContain('API Server')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(CognitoDeleteResourceServerModal, { props: { ...defaultProps, open: false }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('emits confirm on delete click', async () => {
    const wrapper = mount(CognitoDeleteResourceServerModal, { props: defaultProps, global: { stubs } })
    const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Delete'))
    await deleteBtn!.trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('emits update:open false on cancel', async () => {
    const wrapper = mount(CognitoDeleteResourceServerModal, { props: defaultProps, global: { stubs } })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})