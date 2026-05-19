import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import TopBar from './TopBar.vue'

// Mock config
vi.mock('@/config', () => ({
  PROXY_BACKEND: 'http://127.0.0.1:8081',
}))

// Mutable mock settings store for per-test configuration
const mockSettingsStore = vi.hoisted(() => ({
  darkMode: false,
  emulator: '',
  region: 'us-east-1',
  toggleDarkMode: vi.fn(),
}))

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => mockSettingsStore),
}))

// Mutable mock route
const mockRoute = vi.hoisted(() => ({
  meta: {} as Record<string, unknown>,
}))

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => mockRoute),
}))

// Mock composables
vi.mock('@/composables/useConnectionStatus', () => ({
  useConnectionStatus: vi.fn(),
}))

vi.mock('@/composables/useContentReload', () => ({
  useContentReload: vi.fn(() => ({
    triggerReload: vi.fn(),
  })),
}))

// Mock API
vi.mock('@/api/services/region', () => ({
  setRegion: vi.fn(),
}))

import { useConnectionStatus } from '@/composables/useConnectionStatus'

function createWrapper() {
  return mount(TopBar, {
    global: {
      stubs: {
        AboutModal: true,
      },
    },
  })
}

describe('TopBar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // Reset mutable mocks to defaults
    mockSettingsStore.darkMode = false
    mockSettingsStore.emulator = ''
    mockSettingsStore.region = 'us-east-1'
    mockRoute.meta = {}
    vi.mocked(useConnectionStatus).mockReturnValue({
      isReachable: true,
      isConnected: true,
      checkConnection: vi.fn(),
    })
  })

  describe('Page Title', () => {
    it('renders default page title when no route meta title', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('MyDevStack')
      wrapper.unmount()
    })

    it('renders custom page title from route meta', () => {
      mockRoute.meta = { title: 'Services' }
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Services')
      expect(wrapper.text()).not.toContain('MyDevStack')
      wrapper.unmount()
    })
  })

  describe('Connection Status', () => {
    it('shows Connected text when backend is reachable', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Connected')
      wrapper.unmount()
    })

    it('shows Disconnected text when backend is not reachable', () => {
      vi.mocked(useConnectionStatus).mockReturnValue({
        isReachable: false,
        isConnected: false,
        checkConnection: vi.fn(),
      })
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Disconnected')
      wrapper.unmount()
    })

    it('renders refresh connection button', () => {
      const wrapper = createWrapper()
      const refreshBtn = wrapper.find('button[title="Refresh connection status"]')
      expect(refreshBtn.exists()).toBe(true)
      wrapper.unmount()
    })

    it('calls checkConnection when refresh button clicked', async () => {
      const checkConnection = vi.fn()
      vi.mocked(useConnectionStatus).mockReturnValue({
        isReachable: true,
        isConnected: true,
        checkConnection,
      })
      const wrapper = createWrapper()
      const refreshBtn = wrapper.find('button[title="Refresh connection status"]')
      await refreshBtn.trigger('click')
      expect(checkConnection).toHaveBeenCalledTimes(1)
      wrapper.unmount()
    })
  })

  describe('Region', () => {
    it('shows region select dropdown when not in emulator mode', () => {
      mockSettingsStore.emulator = ''
      const wrapper = createWrapper()
      const select = wrapper.find('select')
      expect(select.exists()).toBe(true)
      wrapper.unmount()
    })

    it('shows region display text in emulator mode', () => {
      mockSettingsStore.emulator = 'MINISTACK'
      mockSettingsStore.region = 'eu-west-1'
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('eu-west-1')
      expect(wrapper.find('select').exists()).toBe(false)
      wrapper.unmount()
    })
  })

  describe('Dark Mode Toggle', () => {
    it('renders dark mode toggle button', () => {
      const wrapper = createWrapper()
      const btn = wrapper.find('button[title="Switch to dark mode"]')
      expect(btn.exists()).toBe(true)
      wrapper.unmount()
    })

    it('calls toggleDarkMode when dark mode button clicked', async () => {
      const wrapper = createWrapper()
      const btn = wrapper.find('button[title="Switch to dark mode"]')
      await btn.trigger('click')
      expect(mockSettingsStore.toggleDarkMode).toHaveBeenCalledTimes(1)
      wrapper.unmount()
    })

    it('shows light mode tooltip when dark mode is enabled', () => {
      mockSettingsStore.darkMode = true
      const wrapper = createWrapper()
      const btn = wrapper.find('button[title="Switch to light mode"]')
      expect(btn.exists()).toBe(true)
      wrapper.unmount()
    })

    it('calls toggleDarkMode when light mode button clicked', async () => {
      mockSettingsStore.darkMode = true
      const wrapper = createWrapper()
      const btn = wrapper.find('button[title="Switch to light mode"]')
      await btn.trigger('click')
      expect(mockSettingsStore.toggleDarkMode).toHaveBeenCalledTimes(1)
      wrapper.unmount()
    })
  })

  describe('About Button', () => {
    it('renders About button', () => {
      const wrapper = createWrapper()
      const btn = wrapper.find('button[title="About"]')
      expect(btn.exists()).toBe(true)
      wrapper.unmount()
    })

    it('opens AboutModal when clicked (does not throw)', async () => {
      const wrapper = createWrapper()
      const btn = wrapper.find('button[title="About"]')
      await btn.trigger('click')
      // Component sets showAboutModal ref = true internally; AboutModal stub renders nothing.
      // Test passes if no error thrown.
      expect(wrapper.findComponent({ name: 'AboutModal' }).exists()).toBe(true)
      wrapper.unmount()
    })
  })
})
