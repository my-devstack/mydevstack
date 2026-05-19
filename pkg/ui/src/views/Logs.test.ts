import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}))

import Logs from './Logs.vue'

describe('Logs.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(Logs, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          FormSelect: { template: '<select><slot /></select>' },
          EmptyState: { template: '<div><slot /></div>' },
          LoadingSpinner: true,
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders Logs heading', () => {
    const wrapper = shallowMount(Logs, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          FormSelect: { template: '<select><slot /></select>' },
          EmptyState: { template: '<div><slot /></div>' },
          LoadingSpinner: true,
        },
      },
    })
    expect(wrapper.text()).toContain('Logs')
  })

  it('renders description text', () => {
    const wrapper = shallowMount(Logs, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          FormSelect: { template: '<select><slot /></select>' },
          EmptyState: { template: '<div><slot /></div>' },
          LoadingSpinner: true,
        },
      },
    })
    expect(wrapper.text()).toContain('View and analyze application logs')
  })

  it('renders Refresh button', () => {
    const wrapper = shallowMount(Logs, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          FormSelect: { template: '<select><slot /></select>' },
          EmptyState: { template: '<div><slot /></div>' },
          LoadingSpinner: true,
        },
      },
    })
    const refreshBtn = wrapper.findAll('button').find(b => b.text() === 'Refresh')
    expect(refreshBtn).toBeDefined()
  })

  it('renders Export button', () => {
    const wrapper = shallowMount(Logs, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          FormSelect: { template: '<select><slot /></select>' },
          EmptyState: { template: '<div><slot /></div>' },
          LoadingSpinner: true,
        },
      },
    })
    const exportBtn = wrapper.findAll('button').find(b => b.text() === 'Export')
    expect(exportBtn).toBeDefined()
  })

  it('renders Clear Logs button', () => {
    const wrapper = shallowMount(Logs, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          FormSelect: { template: '<select><slot /></select>' },
          EmptyState: { template: '<div><slot /></div>' },
          LoadingSpinner: true,
        },
      },
    })
    const clearBtn = wrapper.findAll('button').find(b => b.text() === 'Clear Logs')
    expect(clearBtn).toBeDefined()
  })

  it('renders statistics cards', () => {
    const wrapper = shallowMount(Logs, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          FormSelect: { template: '<select><slot /></select>' },
          EmptyState: { template: '<div><slot /></div>' },
          LoadingSpinner: true,
        },
      },
    })
    expect(wrapper.text()).toContain('Total Requests')
    expect(wrapper.text()).toContain('Error Rate')
    expect(wrapper.text()).toContain('Avg Response Time')
    expect(wrapper.text()).toContain('Services Active')
  })

  it('renders search input', () => {
    const wrapper = shallowMount(Logs, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          FormSelect: { template: '<select><slot /></select>' },
          EmptyState: { template: '<div><slot /></div>' },
          LoadingSpinner: true,
        },
      },
    })
    const searchInput = wrapper.find('input[placeholder="Search logs..."]')
    expect(searchInput.exists()).toBe(true)
  })

  it('renders FormSelect components', () => {
    const wrapper = shallowMount(Logs, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          FormSelect: { template: '<select><slot /></select>' },
          EmptyState: { template: '<div><slot /></div>' },
          LoadingSpinner: true,
        },
      },
    })
    const selects = wrapper.findAll('select')
    expect(selects.length).toBeGreaterThanOrEqual(3)
  })
})
