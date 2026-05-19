import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import DeleteSecretModal from './DeleteSecretModal.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

const teleportStub = { template: '<div><slot /></div>' }

const defaultProps = {
  open: true,
  loading: false,
  secretToDelete: 'my-test-secret',
}

const global = { stubs: { Teleport: teleportStub } }

describe('DeleteSecretModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mount(DeleteSecretModal, { props: defaultProps, global })
    expect(wrapper.find('.fixed').exists()).toBe(true)
  })

  it('does not render when open is false', () => {
    const wrapper = mount(DeleteSecretModal, { props: { ...defaultProps, open: false }, global })
    expect(wrapper.find('.fixed').exists()).toBe(false)
  })

  it('renders title', () => {
    const wrapper = mount(DeleteSecretModal, { props: defaultProps, global })
    expect(wrapper.text()).toContain('Delete Secret')
  })

  it('displays secret name', () => {
    const wrapper = mount(DeleteSecretModal, { props: defaultProps, global })
    expect(wrapper.text()).toContain('my-test-secret')
  })

  it('shows confirmation message', () => {
    const wrapper = mount(DeleteSecretModal, { props: defaultProps, global })
    expect(wrapper.text()).toContain('Are you sure')
  })

  it('shows undo warning', () => {
    const wrapper = mount(DeleteSecretModal, { props: defaultProps, global })
    expect(wrapper.text()).toContain('cannot be undone')
  })

  it('renders cancel and delete buttons', () => {
    const wrapper = mount(DeleteSecretModal, { props: defaultProps, global })
    const texts = wrapper.findAll('button').map(b => b.text())
    expect(texts).toContain('Cancel')
    expect(texts).toContain('Delete')
  })

  it('shows deleting text when loading', () => {
    const wrapper = mount(DeleteSecretModal, { props: { ...defaultProps, loading: true }, global })
    expect(wrapper.text()).toContain('Deleting...')
  })

  it('disables delete button when loading', () => {
    const wrapper = mount(DeleteSecretModal, { props: { ...defaultProps, loading: true }, global })
    const deleteBtn = wrapper.findAll('button').find(b => b.text() === 'Deleting...')
    expect(deleteBtn?.attributes('disabled')).toBeDefined()
  })

  it('emits confirm on delete click', async () => {
    const wrapper = mount(DeleteSecretModal, { props: defaultProps, global })
    const deleteBtn = wrapper.findAll('button').find(b => b.text() === 'Delete')
    await deleteBtn?.trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('emits update:open false on cancel click', async () => {
    const wrapper = mount(DeleteSecretModal, { props: defaultProps, global })
    const cancelBtn = wrapper.findAll('button').find(b => b.text() === 'Cancel')
    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
  })
})
