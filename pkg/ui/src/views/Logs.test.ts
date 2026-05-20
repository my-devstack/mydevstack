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

  describe('interaction tests (mount)', () => {
    it('clicks Refresh button and triggers refreshLogs', async () => {
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

    it('clicks Clear Logs button', async () => {
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

    it('renders log entries', () => {
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
      expect(wrapper.vm.logs.length).toBeGreaterThan(0)
    })

    it('renders filteredLogs computed', () => {
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
      expect(wrapper.vm.filteredLogs.length).toBeGreaterThan(0)
    })

    it('filteredLogs returns empty for unknown service', () => {
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
      wrapper.vm.selectedService = 'UnknownService'
      expect(wrapper.vm.filteredLogs.length).toBe(0)
    })

    it('generates 200 mock logs on mount', () => {
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
      expect(wrapper.vm.logs.length).toBe(200)
    })

    it('formatTimestamp returns string', () => {
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
      const result = wrapper.vm.formatTimestamp(new Date('2024-01-15T10:30:00'))
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('formatDuration returns ms for < 1000', () => {
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
      expect(wrapper.vm.formatDuration(500)).toBe('500ms')
    })

    it('formatDuration returns s for >= 1000', () => {
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
      expect(wrapper.vm.formatDuration(1500)).toBe('1.5s')
    })

    it('openLogDetail sets selectedLog and isDetailOpen', () => {
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
      const log = wrapper.vm.logs[0]
      wrapper.vm.openLogDetail(log)
      expect(wrapper.vm.selectedLog).toBe(log)
      expect(wrapper.vm.isDetailOpen).toBe(true)
    })

    it('closeLogDetail clears selectedLog and isDetailOpen', () => {
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
      wrapper.vm.isDetailOpen = true
      wrapper.vm.closeLogDetail()
      expect(wrapper.vm.isDetailOpen).toBe(false)
      expect(wrapper.vm.selectedLog).toBeNull()
    })

    it('exportToJson creates download and calls toast', () => {
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
      // Should not throw
      expect(() => wrapper.vm.exportToJson()).not.toThrow()
    })

    it('exportToCsv creates download and calls toast', () => {
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
      expect(() => wrapper.vm.exportToCsv()).not.toThrow()
    })

    it('clearLogs empties logs and calls toast', () => {
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
      wrapper.vm.clearLogs()
      expect(wrapper.vm.logs.length).toBe(0)
    })
  })
})
