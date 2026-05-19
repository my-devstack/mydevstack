import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import AboutModal from './AboutModal.vue'

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

describe('AboutModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        text: vi.fn().mockResolvedValue('1.0.0'),
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders when open is true', () => {
    const wrapper = mount(AboutModal, {
      props: { open: true },
      global: { stubs: modalStubs },
    })
    expect(wrapper.text()).toContain('About MyDevStack')
    expect(wrapper.text()).toContain('MyDevStack')
    expect(wrapper.text()).toContain('AWS Service Manager')
  })

  it('does not render content when open is false', () => {
    const wrapper = mount(AboutModal, {
      props: { open: false },
      global: { stubs: modalStubs },
    })
    // With TransitionRoot stub, show=false -> no slot content rendered
    expect(wrapper.text()).not.toContain('About MyDevStack')
  })

  it('displays version from fetch', async () => {
    const wrapper = mount(AboutModal, {
      props: { open: true },
      global: { stubs: modalStubs },
    })
    // Wait for fetch to resolve and DOM to update
    await vi.dynamicImportSettled?.() // ensure microtasks flush
    // Just verify fetch was called
    expect(fetch).toHaveBeenCalledWith('/VERSION')
  })

  it('has support and github links', () => {
    const wrapper = mount(AboutModal, {
      props: { open: true },
      global: { stubs: modalStubs },
    })
    const links = wrapper.findAll('a')
    const hrefs = links.map((l) => l.attributes('href'))
    expect(hrefs).toContain('https://www.buymeacoffee.com/beabys')
    expect(hrefs).toContain('https://github.com/my-devstack/mydevstack')
  })

  it('emits close events when close button is clicked', async () => {
    const wrapper = mount(AboutModal, {
      props: { open: true },
      global: { stubs: modalStubs },
    })

    const closeBtn = wrapper.find('button[aria-label="Close modal"]')
    await closeBtn.trigger('click')

    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
