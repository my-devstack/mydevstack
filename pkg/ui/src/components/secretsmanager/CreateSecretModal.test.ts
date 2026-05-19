import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CreateSecretModal from './CreateSecretModal.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

const teleportStub = {
  template: '<div><slot /></div>',
}

const defaultProps = {
  open: true,
  creating: false,
  newSecretName: '',
  newSecretValue: '',
  newSecretDescription: '',
}

const global = { stubs: { Teleport: teleportStub } }

describe('CreateSecretModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mount(CreateSecretModal, { props: defaultProps, global })
    const inner = wrapper.find('.fixed')
    expect(inner.exists()).toBe(true)
  })

  it('does not render when open is false', () => {
    const wrapper = mount(CreateSecretModal, { props: { ...defaultProps, open: false }, global })
    expect(wrapper.find('.fixed').exists()).toBe(false)
  })

  it('renders title', () => {
    const wrapper = mount(CreateSecretModal, { props: defaultProps, global })
    expect(wrapper.text()).toContain('Create Secret')
  })

  it('renders input fields', () => {
    const wrapper = mount(CreateSecretModal, { props: defaultProps, global })
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('renders cancel and create buttons', () => {
    const wrapper = mount(CreateSecretModal, { props: defaultProps, global })
    const texts = wrapper.findAll('button').map(b => b.text())
    expect(texts).toContain('Cancel')
    expect(texts).toContain('Create')
  })

  it('create button is disabled when name is empty', () => {
    const wrapper = mount(CreateSecretModal, { props: defaultProps, global })
    const createBtn = wrapper.findAll('button').find(b => b.text() === 'Create')
    expect(createBtn?.attributes('disabled')).toBeDefined()
  })

  it('create button is disabled when value is empty even with name', () => {
    const wrapper = mount(CreateSecretModal, {
      props: { ...defaultProps, newSecretName: 'my-secret' }, global,
    })
    const createBtn = wrapper.findAll('button').find(b => b.text() === 'Create')
    expect(createBtn?.attributes('disabled')).toBeDefined()
  })

  it('create button is enabled when name and value are filled', () => {
    const wrapper = mount(CreateSecretModal, {
      props: { ...defaultProps, newSecretName: 'my-secret', newSecretValue: 'value123' }, global,
    })
    const createBtn = wrapper.findAll('button').find(b => b.text() === 'Create')
    expect(createBtn?.attributes('disabled')).toBeUndefined()
  })

  it('shows creating text when creating is true', () => {
    const wrapper = mount(CreateSecretModal, {
      props: { ...defaultProps, creating: true }, global,
    })
    expect(wrapper.text()).toContain('Creating...')
  })

  it('emits update:open false on cancel click', async () => {
    const wrapper = mount(CreateSecretModal, { props: defaultProps, global })
    const cancelBtn = wrapper.findAll('button').find(b => b.text() === 'Cancel')
    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
  })

  it('emits create on create button click', async () => {
    const wrapper = mount(CreateSecretModal, {
      props: { ...defaultProps, newSecretName: 'my-secret', newSecretValue: 'value123' }, global,
    })
    const createBtn = wrapper.findAll('button').find(b => b.text() === 'Create')
    await createBtn?.trigger('click')
    expect(wrapper.emitted('create')).toBeTruthy()
  })
})
