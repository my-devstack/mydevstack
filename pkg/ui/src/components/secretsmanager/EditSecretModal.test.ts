import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import EditSecretModal from './EditSecretModal.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

const teleportStub = { template: '<div><slot /></div>' }

const defaultProps = {
  open: true,
  loading: false,
  secretName: 'my-secret',
  secretValue: '{"key": "value"}',
  isEditing: false,
  editSecretValue: '{"key": "value"}',
}

const global = { stubs: { Teleport: teleportStub } }

describe('EditSecretModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mount(EditSecretModal, { props: defaultProps, global })
    expect(wrapper.find('.fixed').exists()).toBe(true)
  })

  it('does not render when open is false', () => {
    const wrapper = mount(EditSecretModal, { props: { ...defaultProps, open: false }, global })
    expect(wrapper.find('.fixed').exists()).toBe(false)
  })

  it('renders secret name in title', () => {
    const wrapper = mount(EditSecretModal, { props: defaultProps, global })
    expect(wrapper.text()).toContain('my-secret')
  })

  it('shows View mode by default', () => {
    const wrapper = mount(EditSecretModal, { props: defaultProps, global })
    expect(wrapper.text()).toContain('View:')
  })

  it('shows Edit mode when isEditing is true', () => {
    const wrapper = mount(EditSecretModal, { props: { ...defaultProps, isEditing: true }, global })
    expect(wrapper.text()).toContain('Edit:')
  })

  it('renders secret value in view mode', () => {
    const wrapper = mount(EditSecretModal, { props: defaultProps, global })
    expect(wrapper.text()).toContain('key')
    expect(wrapper.text()).toContain('value')
  })

  it('shows JSON badge for valid JSON', () => {
    const wrapper = mount(EditSecretModal, { props: defaultProps, global })
    expect(wrapper.text()).toContain('JSON')
  })

  it('shows Edit Value button in view mode', () => {
    const wrapper = mount(EditSecretModal, { props: defaultProps, global })
    expect(wrapper.text()).toContain('Edit Value')
  })

  it('shows Save Changes button in edit mode', () => {
    const wrapper = mount(EditSecretModal, { props: { ...defaultProps, isEditing: true }, global })
    expect(wrapper.text()).toContain('Save Changes')
  })

  it('shows Cancel button in edit mode', () => {
    const wrapper = mount(EditSecretModal, { props: { ...defaultProps, isEditing: true }, global })
    expect(wrapper.text()).toContain('Cancel')
  })

  it('shows Close button in view mode', () => {
    const wrapper = mount(EditSecretModal, { props: defaultProps, global })
    expect(wrapper.text()).toContain('Close')
  })

  it('emits toggle-edit on Edit Value click', async () => {
    const wrapper = mount(EditSecretModal, { props: defaultProps, global })
    const editBtn = wrapper.findAll('button').find(b => b.text() === 'Edit Value')
    await editBtn?.trigger('click')
    expect(wrapper.emitted('toggle-edit')).toBeTruthy()
  })

  it('emits save on Save Changes click', async () => {
    const wrapper = mount(EditSecretModal, { props: { ...defaultProps, isEditing: true }, global })
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Save Changes')
    await saveBtn?.trigger('click')
    expect(wrapper.emitted('save')).toBeTruthy()
  })

  it('renders textarea in edit mode', () => {
    const wrapper = mount(EditSecretModal, { props: { ...defaultProps, isEditing: true }, global })
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('does not show JSON badge for non-JSON', () => {
    const wrapper = mount(EditSecretModal, {
      props: { ...defaultProps, secretValue: 'plain text', editSecretValue: 'plain text' }, global,
    })
    expect(wrapper.text()).not.toContain('JSON')
  })
})
