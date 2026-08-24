import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CognitoGroupMembersModal from './CognitoGroupMembersModal.vue'

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
const loadingStub = {
  template: '<div class="spinner" />',
  props: ['size'],
}

const stubs = { Modal: modalStub, Button: buttonStub, LoadingSpinner: loadingStub }

const defaultProps = {
  open: true,
  userPoolId: 'us-east-1_abc123',
  groupName: 'admins',
  users: [
    { Username: 'alice', UserStatus: 'CONFIRMED' },
    { Username: 'bob', UserStatus: 'CONFIRMED' },
  ],
  members: [{ Username: 'alice', UserStatus: 'CONFIRMED' }],
  loading: false,
}

describe('CognitoGroupMembersModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(CognitoGroupMembersModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('admins')
    expect(wrapper.text()).toContain('alice')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(CognitoGroupMembersModal, { props: { ...defaultProps, open: false }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('shows loading spinner when loading with no members', () => {
    const wrapper = mount(CognitoGroupMembersModal, {
      props: { ...defaultProps, members: [], loading: true },
      global: { stubs },
    })
    expect(wrapper.find('.spinner').exists()).toBe(true)
  })

  it('emits remove-user when remove button clicked', async () => {
    const wrapper = mount(CognitoGroupMembersModal, { props: defaultProps, global: { stubs } })
    const removeBtn = wrapper.findAll('button').find(b => b.text().includes('Remove'))
    await removeBtn!.trigger('click')
    expect(wrapper.emitted('remove-user')![0]).toEqual(['alice'])
  })

  it('emits add-user with selected username', async () => {
    const wrapper = mount(CognitoGroupMembersModal, { props: defaultProps, global: { stubs } })
    const select = wrapper.find('select')
    await select.setValue('bob')
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add'))
    await addBtn!.trigger('click')
    expect(wrapper.emitted('add-user')![0]).toEqual(['bob'])
  })

  it('does not emit add-user when no user selected', async () => {
    const wrapper = mount(CognitoGroupMembersModal, { props: defaultProps, global: { stubs } })
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add'))
    await addBtn!.trigger('click')
    expect(wrapper.emitted('add-user')).toBeFalsy()
  })

  it('emits update:open false on close', async () => {
    const wrapper = mount(CognitoGroupMembersModal, { props: defaultProps, global: { stubs } })
    const closeBtn = wrapper.findAll('button').find(b => b.text().includes('Close'))
    await closeBtn!.trigger('click')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})