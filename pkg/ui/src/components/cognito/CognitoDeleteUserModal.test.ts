import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { CognitoDeleteUserModal } from './index'
import Button from '@/components/common/Button.vue'
import { useSettingsStore } from '@/stores/settings'

const modalStub = {
  template: '<div v-if="open" data-testid="modal">{{title}}<slot /><slot name="footer" /></div>',
  props: ['open', 'title'],
  emits: ['update:open', 'close'],
}
const buttonStub = {
  name: 'Button',
  template: '<button :disabled="disabled" :data-mutating="mutating ? \'true\' : undefined" :variant="variant" :size="size" :type="type" :fullWidth="fullWidth" :ariaLabel="ariaLabel" :loading="loading" @click="$emit(\'click\')"><span><slot /></span></button>',
  props: {
    variant: {}, size: {}, loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false }, type: {}, fullWidth: { type: Boolean, default: false },
    ariaLabel: {}, mutating: { type: Boolean, default: false },
  },
  emits: ['click'],
}

const stubs = { Modal: modalStub, Button: buttonStub }
const stubsWithRealButton = {
  Modal: modalStub,
  LoadingSpinner: { template: '<span data-testid="loading-spinner" />' },
}

describe('CognitoDeleteUserModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open with props', () => {
    const wrapper = mount(CognitoDeleteUserModal, {
      props: { open: true, username: 'alice' },
      global: { stubs },
    })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Delete User')
    expect(wrapper.text()).toContain('alice')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(CognitoDeleteUserModal, {
      props: { open: false, username: 'alice' },
      global: { stubs },
    })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('emits confirm on delete click', async () => {
    const wrapper = mount(CognitoDeleteUserModal, {
      props: { open: true, username: 'alice' },
      global: { stubs },
    })
    const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Delete'))
    await deleteBtn!.trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('emits update:open false on cancel', async () => {
    const wrapper = mount(CognitoDeleteUserModal, {
      props: { open: true, username: 'alice' },
      global: { stubs },
    })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })

  it('delete Button receives mutating prop', () => {
    const wrapper = mount(CognitoDeleteUserModal, {
      props: { open: true, username: 'alice' },
      global: { stubs },
    })
    const deleteBtn = wrapper.findAllComponents({ name: 'Button' }).find(b => /delete/i.test(b.text()))
    expect(deleteBtn).toBeTruthy()
    expect(deleteBtn!.props('mutating')).toBe(true)
    expect(deleteBtn!.attributes('data-mutating')).toBe('true')
  })

  it('delete Button disabled when store readOnly true (real Button)', async () => {
    const wrapper = mount(CognitoDeleteUserModal, {
      props: { open: true, username: 'alice' },
      global: { stubs: stubsWithRealButton },
    })
    const store = useSettingsStore()
    store.readOnly = true
    await wrapper.vm.$nextTick()
    const deleteBtn = wrapper.findAll('button').find(b => /delete/i.test(b.text()) || b.text().trim() === 'Delete')
    expect(deleteBtn).toBeTruthy()
    expect(deleteBtn!.attributes('disabled')).toBeDefined()
    expect(deleteBtn!.attributes('title')).toContain('Read-only')
  })

  it('delete Button enabled when store readOnly false (real Button)', async () => {
    const wrapper = mount(CognitoDeleteUserModal, {
      props: { open: true, username: 'alice' },
      global: { stubs: stubsWithRealButton },
    })
    const store = useSettingsStore()
    store.readOnly = false
    await wrapper.vm.$nextTick()
    const deleteBtn = wrapper.findAll('button').find(b => /delete/i.test(b.text()) || b.text().trim() === 'Delete')
    expect(deleteBtn).toBeTruthy()
    expect(deleteBtn!.attributes('disabled')).toBeUndefined()
  })
})
