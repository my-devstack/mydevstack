import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

import Settings from './Settings.vue'

describe('Settings.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(Settings, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders Settings heading', () => {
    const wrapper = shallowMount(Settings, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
        },
      },
    })
    expect(wrapper.text()).toContain('Settings')
  })

  it('renders connection description text', () => {
    const wrapper = shallowMount(Settings, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
        },
      },
    })
    expect(wrapper.text()).toContain('Configure AWS credentials')
  })

  it('renders Advanced tab content by default', () => {
    const wrapper = shallowMount(Settings, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
        },
      },
    })
    expect(wrapper.text()).toContain('Request Timeout')
    expect(wrapper.text()).toContain('Max Retries')
    expect(wrapper.text()).toContain('Debug Mode')
  })

  it('renders Danger Zone section', () => {
    const wrapper = shallowMount(Settings, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
        },
      },
    })
    expect(wrapper.text()).toContain('Danger Zone')
    expect(wrapper.text()).toContain('Clear All Settings')
  })

  it('renders Save Advanced button', () => {
    const wrapper = shallowMount(Settings, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
        },
      },
    })
    expect(wrapper.text()).toContain('Save Advanced')
  })

  it('renders About tab content on click', async () => {
    const wrapper = shallowMount(Settings, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
        },
      },
    })
    const aboutBtn = wrapper.findAll('button').find(b => b.text() === 'About')
    expect(aboutBtn).toBeDefined()
    if (aboutBtn) {
      await aboutBtn.trigger('click')
      expect(wrapper.text()).toContain('About MyDevStack')
      expect(wrapper.text()).toContain('Supported Services')
    }
  })

  it('shows version info after switching to About tab', async () => {
    const wrapper = shallowMount(Settings, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
        },
      },
    })
    const aboutBtn = wrapper.findAll('button').find(b => b.text() === 'About')
    expect(aboutBtn).toBeDefined()
    if (aboutBtn) {
      await aboutBtn.trigger('click')
      expect(wrapper.text()).toContain('MyDevStack')
      expect(wrapper.text()).toContain('AWS Service Manager')
    }
  })
})
