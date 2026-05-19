import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import UniversalViewModal from './UniversalViewModal.vue'

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

describe('UniversalViewModal', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    setActivePinia(createPinia())
  })

  it('renders with default title', () => {
    const wrapper = mount(UniversalViewModal, {
      props: { open: true },
      global: { stubs: modalStubs },
    })
    expect(wrapper.text()).toContain('Details')
  })

  it('renders with custom title', () => {
    const wrapper = mount(UniversalViewModal, {
      props: { open: true, title: 'Bucket Details' },
      global: { stubs: modalStubs },
    })
    expect(wrapper.text()).toContain('Bucket Details')
  })

  it('does not render content when open is false', () => {
    const wrapper = mount(UniversalViewModal, {
      props: { open: false },
      global: { stubs: modalStubs },
    })
    expect(wrapper.text()).not.toContain('Details')
  })

  it('renders default slot content', () => {
    const wrapper = mount(UniversalViewModal, {
      props: { open: true },
      slots: { default: '<p>View content here</p>' },
      global: { stubs: modalStubs },
    })
    expect(wrapper.text()).toContain('View content here')
  })

  it('renders actions slot content', () => {
    const wrapper = mount(UniversalViewModal, {
      props: { open: true },
      slots: { actions: '<button>Edit</button>' },
      global: { stubs: modalStubs },
    })
    expect(wrapper.text()).toContain('Edit')
  })

  it('emits update:open on close button click', async () => {
    const wrapper = mount(UniversalViewModal, {
      props: { open: true },
      global: { stubs: modalStubs },
    })

    const closeBtn = wrapper.find('button[aria-label="Close modal"]')
    await closeBtn.trigger('click')

    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})
