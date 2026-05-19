import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ConfirmModal from './ConfirmModal.vue'

const teleportStub = {
  Teleport: true,
}

describe('ConfirmModal', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    setActivePinia(createPinia())
  })

  it('renders when open is true', () => {
    const wrapper = mount(ConfirmModal, {
      props: { open: true, title: 'Confirm Delete', message: 'Are you sure?' },
      global: { stubs: teleportStub },
    })
    expect(wrapper.text()).toContain('Confirm Delete')
    expect(wrapper.text()).toContain('Are you sure?')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(ConfirmModal, {
      props: { open: false, title: 'Confirm Delete', message: 'Are you sure?' },
      global: { stubs: teleportStub },
    })
    expect(wrapper.find('.fixed').exists()).toBe(false)
  })

  it('renders default button texts', () => {
    const wrapper = mount(ConfirmModal, {
      props: { open: true, title: 'Test', message: 'Test msg' },
      global: { stubs: teleportStub },
    })
    expect(wrapper.text()).toContain('Confirm')
    expect(wrapper.text()).toContain('Cancel')
  })

  it('renders custom button texts', () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        open: true,
        title: 'Test',
        message: 'Test msg',
        confirmText: 'Yes, delete',
        cancelText: 'No, keep',
      },
      global: { stubs: teleportStub },
    })
    expect(wrapper.text()).toContain('Yes, delete')
    expect(wrapper.text()).toContain('No, keep')
  })

  it('emits confirm on confirm button click', async () => {
    const wrapper = mount(ConfirmModal, {
      props: { open: true, title: 'Test', message: 'Test msg' },
      global: { stubs: teleportStub },
    })
    const buttons = wrapper.findAll('button')
    // Confirm button is the second button
    const confirmBtn = buttons[1]
    await confirmBtn.trigger('click')

    expect(wrapper.emitted('confirm')).toBeTruthy()
    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })

  it('emits cancel on cancel button click', async () => {
    const wrapper = mount(ConfirmModal, {
      props: { open: true, title: 'Test', message: 'Test msg' },
      global: { stubs: teleportStub },
    })
    const buttons = wrapper.findAll('button')
    // Cancel button is the first button
    const cancelBtn = buttons[0]
    await cancelBtn.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })

  it('renders with danger variant by default', () => {
    const wrapper = mount(ConfirmModal, {
      props: { open: true, title: 'Test', message: 'Test msg' },
      global: { stubs: teleportStub },
    })
    expect(wrapper.props('confirmVariant')).toBe('danger')
  })

  it('renders confirm button with danger variant classes', () => {
    const wrapper = mount(ConfirmModal, {
      props: { open: true, title: 'Test', message: 'Test msg' },
      global: { stubs: teleportStub },
    })
    const buttons = wrapper.findAll('button')
    const confirmBtn = buttons[1]
    expect(confirmBtn.classes()).toContain('bg-red-500')
  })

  it('renders confirm button with blue classes for primary variant', () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        open: true,
        title: 'Test',
        message: 'Test msg',
        confirmVariant: 'primary',
      },
      global: { stubs: teleportStub },
    })
    const buttons = wrapper.findAll('button')
    const confirmBtn = buttons[1]
    expect(confirmBtn.classes()).toContain('bg-blue-500')
  })

  it('renders message with v-html', async () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        open: true,
        title: 'Test',
        message: 'Delete <strong>important</strong> file?',
      },
      global: { stubs: teleportStub },
    })
    // v-html renders raw HTML
    expect(wrapper.html()).toContain('<strong>important</strong>')
  })
})
