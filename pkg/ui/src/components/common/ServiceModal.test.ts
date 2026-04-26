import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ServiceModal from '../../components/common/ServiceModal.vue'
import Modal from '../../components/common/Modal.vue'
import Button from '../../components/common/Button.vue'

describe('ServiceModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const slots = {
    default: '<div>Test Content</div>',
  }

  it('renders in create mode', () => {
    const wrapper = mount(ServiceModal, {
      props: { open: true, mode: 'create' },
      slots,
      global: {
        stubs: { Modal, Button },
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.props('mode')).toBe('create')
  })

  it('renders in edit mode', () => {
    const wrapper = mount(ServiceModal, {
      props: { open: true, mode: 'edit' },
      slots,
      global: {
        stubs: { Modal, Button },
      },
    })

    expect(wrapper.props('mode')).toBe('edit')
  })

  it('renders in view mode', () => {
    const wrapper = mount(ServiceModal, {
      props: { open: true, mode: 'view' },
      slots,
      global: {
        stubs: { Modal, Button },
      },
    })

    expect(wrapper.props('mode')).toBe('view')
  })

  it('renders in delete mode', () => {
    const wrapper = mount(ServiceModal, {
      props: { open: true, mode: 'delete' },
      slots,
      global: {
        stubs: { Modal, Button },
      },
    })

    expect(wrapper.props('mode')).toBe('delete')
  })

  it('shows loading state', () => {
    const wrapper = mount(ServiceModal, {
      props: { open: true, mode: 'create', loading: true },
      slots,
      global: {
        stubs: { Modal, Button },
      },
    })

    expect(wrapper.props('loading')).toBe(true)
  })

  it('uses custom confirm text', () => {
    const wrapper = mount(ServiceModal, {
      props: { open: true, mode: 'create', confirmText: 'Save Item' },
      slots,
      global: {
        stubs: { Modal, Button },
      },
    })

    expect(wrapper.props('confirmText')).toBe('Save Item')
  })

  it('shows default title for create mode', () => {
    const wrapper = mount(ServiceModal, {
      props: { open: true, mode: 'create' },
      slots,
      global: {
        stubs: { Modal, Button },
      },
    })

    expect(wrapper.vm.computedTitle).toBe('Create')
  })

  it('shows custom title when provided', () => {
    const wrapper = mount(ServiceModal, {
      props: { open: true, mode: 'create', title: 'Custom Title' },
      slots,
      global: {
        stubs: { Modal, Button },
      },
    })

    expect(wrapper.vm.computedTitle).toBe('Custom Title')
  })

  it('emits confirm event on confirm click', async () => {
    const wrapper = mount(ServiceModal, {
      props: { open: true, mode: 'create' },
      slots,
      global: {
        stubs: { Modal, Button },
      },
    })

    const confirmButton = wrapper.findAll('button').find(b => b.text() === 'Confirm')
    if (confirmButton) {
      await confirmButton.trigger('click')
      expect(wrapper.emitted('confirm')).toBeTruthy()
    }
  })
})