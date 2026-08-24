import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { CognitoDeleteUserPoolModal } from './index'

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

describe('CognitoDeleteUserPoolModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open with props', () => {
    const wrapper = mount(CognitoDeleteUserPoolModal, {
      props: { open: true, userPoolId: 'us-east-1_abc123', userPoolName: 'my-user-pool' },
      global: { stubs },
    })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Delete User Pool')
    expect(wrapper.text()).toContain('my-user-pool')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(CognitoDeleteUserPoolModal, {
      props: { open: false, userPoolId: 'us-east-1_abc123' },
      global: { stubs },
    })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('falls back to userPoolId when name missing', () => {
    const wrapper = mount(CognitoDeleteUserPoolModal, {
      props: { open: true, userPoolId: 'us-east-1_abc123' },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('us-east-1_abc123')
  })

  it('emits confirm on delete click', async () => {
    const wrapper = mount(CognitoDeleteUserPoolModal, {
      props: { open: true, userPoolId: 'us-east-1_abc123', userPoolName: 'my-user-pool' },
      global: { stubs },
    })
    const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Delete'))
    await deleteBtn!.trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('emits update:open false on cancel', async () => {
    const wrapper = mount(CognitoDeleteUserPoolModal, {
      props: { open: true, userPoolId: 'us-east-1_abc123' },
      global: { stubs },
    })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})
