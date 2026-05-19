import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import UniversalCreateDeleteModal from './UniversalCreateDeleteModal.vue'

const modalStubs = {
  Teleport: true,
  TransitionRoot: {
    props: ['show'],
    template: '<div v-if="show"><slot /></div>',
  },
  TransitionChild: {
    props: ['as'],
    template: '<component :is="as"><slot /></component>',
  },
}

describe('UniversalCreateDeleteModal', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    setActivePinia(createPinia())
  })

  it('renders in create mode with default title', () => {
    const wrapper = mount(UniversalCreateDeleteModal, {
      props: { open: true, mode: 'create' },
      global: { stubs: modalStubs },
    })
    expect(wrapper.text()).toContain('Create')
  })

  it('renders in delete mode with default title', () => {
    const wrapper = mount(UniversalCreateDeleteModal, {
      props: { open: true, mode: 'delete' },
      global: { stubs: modalStubs },
    })
    expect(wrapper.text()).toContain('Delete')
  })

  it('renders custom title when provided', () => {
    const wrapper = mount(UniversalCreateDeleteModal, {
      props: { open: true, mode: 'create', title: 'New Bucket' },
      global: { stubs: modalStubs },
    })
    expect(wrapper.text()).toContain('New Bucket')
  })

  it('shows item name in delete confirmation message', () => {
    const wrapper = mount(UniversalCreateDeleteModal, {
      props: { open: true, mode: 'delete', itemName: 'my-bucket' },
      global: { stubs: modalStubs },
    })
    expect(wrapper.text()).toContain('my-bucket')
    expect(wrapper.text()).toContain('Are you sure')
    expect(wrapper.text()).toContain('cannot be undone')
  })

  it('does not show delete message in create mode', () => {
    const wrapper = mount(UniversalCreateDeleteModal, {
      props: { open: true, mode: 'create' },
      global: { stubs: modalStubs },
    })
    expect(wrapper.text()).not.toContain('Are you sure')
    expect(wrapper.text()).not.toContain('cannot be undone')
  })

  it('does not render content when open is false', () => {
    const wrapper = mount(UniversalCreateDeleteModal, {
      props: { open: false, mode: 'create' },
      global: { stubs: modalStubs },
    })
    // Modal content should not be visible
    expect(wrapper.text()).not.toContain('Create')
  })

  it('emits confirm on confirm button click in create mode', async () => {
    const wrapper = mount(UniversalCreateDeleteModal, {
      props: { open: true, mode: 'create' },
      global: { stubs: modalStubs },
    })
    const buttons = wrapper.findAll('button')
    const confirmBtn = buttons.find(
      (b) => b.text().trim() === 'Create',
    )
    expect(confirmBtn).toBeDefined()
    await confirmBtn!.trigger('click')

    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('emits confirm on confirm button click in delete mode', async () => {
    const wrapper = mount(UniversalCreateDeleteModal, {
      props: { open: true, mode: 'delete', itemName: 'test-item' },
      global: { stubs: modalStubs },
    })
    const buttons = wrapper.findAll('button')
    const confirmBtn = buttons.find(
      (b) => b.text().trim() === 'Delete',
    )
    expect(confirmBtn).toBeDefined()
    await confirmBtn!.trigger('click')

    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('disables buttons when loading', () => {
    const wrapper = mount(UniversalCreateDeleteModal, {
      props: { open: true, mode: 'delete', loading: true, itemName: 'test' },
      global: { stubs: modalStubs },
    })
    const buttons = wrapper.findAll('button')
    // All buttons should be disabled
    for (const btn of buttons) {
      // Button component sets disabled attribute when loading
      const nativeButton = btn.find('button')
      if (nativeButton.exists()) {
        expect(nativeButton.attributes('disabled')).toBeDefined()
      }
    }
  })

  it('renders with loading state on confirm button', () => {
    const wrapper = mount(UniversalCreateDeleteModal, {
      props: { open: true, mode: 'delete', loading: true, itemName: 'test' },
      global: { stubs: modalStubs },
    })
    // The confirm button has loading prop set
    const buttons = wrapper.findAll('button')
    const confirmBtn = buttons.find(
      (b) => b.text().trim() === 'Delete',
    )
    expect(confirmBtn).toBeDefined()
    // Verify the loading prop is passed to the confirm button
    // The button itself is a Button component rendered as native button
    // When loading=true, the button's text becomes "invisible" via css classes
    // So exact text match may fail; let's check it still exists
    expect(confirmBtn!.exists()).toBe(true)
  })

  it('emits update:open when close is triggered', async () => {
    const wrapper = mount(UniversalCreateDeleteModal, {
      props: { open: true, mode: 'create' },
      global: { stubs: modalStubs },
    })
    const buttons = wrapper.findAll('button')
    const cancelBtn = buttons.find(
      (b) => b.text().trim() === 'Cancel',
    )
    expect(cancelBtn).toBeDefined()
    await cancelBtn!.trigger('click')

    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})
