import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

describe('Settings Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    // Reset matchMedia mock
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  it('should have default endpoint', () => {
    const store = useSettingsStore()
    expect(store.endpoint).toBe('http://127.0.0.1:8081')
  })

  it('should have default region', () => {
    const store = useSettingsStore()
    expect(store.region).toBe('us-east-1')
  })

  it('should have default credentials', () => {
    const store = useSettingsStore()
    expect(store.accessKey).toBe('test')
    expect(store.secretKey).toBe('test')
  })

  it('should default to system theme', () => {
    const store = useSettingsStore()
    expect(store.theme).toBe('system')
  })

  describe('isDarkMode computed', () => {
    it('returns darkMode when theme is system', () => {
      const store = useSettingsStore()
      store.theme = 'system'
      store.darkMode = true
      expect(store.isDarkMode).toBe(true)
    })

    it('returns true when theme is dark', () => {
      const store = useSettingsStore()
      store.theme = 'dark'
      expect(store.isDarkMode).toBe(true)
    })

    it('returns false when theme is light', () => {
      const store = useSettingsStore()
      store.theme = 'light'
      expect(store.isDarkMode).toBe(false)
    })
  })

  describe('setRegion', () => {
    it('should update region', () => {
      const store = useSettingsStore()
      store.setRegion('eu-west-1')
      expect(store.region).toBe('eu-west-1')
    })

    it('should persist region to localStorage', async () => {
      const store = useSettingsStore()
      store.setRegion('eu-west-1')
      await nextTick()
      expect(localStorage.getItem('region')).toBe('eu-west-1')
    })
  })

  describe('setEmulator', () => {
    it('should update emulator', () => {
      const store = useSettingsStore()
      store.setEmulator('http://localhost:4566')
      expect(store.emulator).toBe('http://localhost:4566')
    })
  })

  describe('setCredentials', () => {
    it('should update access key and secret key', () => {
      const store = useSettingsStore()
      store.setCredentials('AKIA123', 'secret456')
      expect(store.accessKey).toBe('AKIA123')
      expect(store.secretKey).toBe('secret456')
    })
  })

  describe('setProvider', () => {
    it('should update provider', () => {
      const store = useSettingsStore()
      store.setProvider('aws')
      expect(store.provider).toBe('aws')
    })

    it('should persist provider to localStorage', async () => {
      const store = useSettingsStore()
      store.setProvider('ministack')
      await nextTick()
      expect(localStorage.getItem('provider')).toBe('ministack')
    })
  })

  describe('toggleDarkMode', () => {
    it('should toggle darkMode from false to true', () => {
      const store = useSettingsStore()
      store.darkMode = false
      store.toggleDarkMode()
      expect(store.darkMode).toBe(true)
    })

    it('should toggle darkMode from true to false', () => {
      const store = useSettingsStore()
      store.darkMode = true
      store.toggleDarkMode()
      expect(store.darkMode).toBe(false)
    })
  })

  describe('setDarkMode', () => {
    it('should set darkMode to true', () => {
      const store = useSettingsStore()
      store.setDarkMode(true)
      expect(store.darkMode).toBe(true)
    })

    it('should set darkMode to false', () => {
      const store = useSettingsStore()
      store.setDarkMode(false)
      expect(store.darkMode).toBe(false)
    })
  })

  describe('setTheme', () => {
    it('should set theme to dark', () => {
      const store = useSettingsStore()
      store.setTheme('dark')
      expect(store.theme).toBe('dark')
      expect(store.darkMode).toBe(true)
    })

    it('should set theme to light', () => {
      const store = useSettingsStore()
      store.setTheme('light')
      expect(store.theme).toBe('light')
      expect(store.darkMode).toBe(false)
    })

    it('should set theme to system and use light mode', () => {
      const store = useSettingsStore()
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
      })) as any
      store.setTheme('system')
      expect(store.theme).toBe('system')
      expect(store.darkMode).toBe(false)
    })

    it('should set theme to system and use dark mode when system prefers dark', () => {
      const store = useSettingsStore()
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: true,
      })) as any
      store.setTheme('system')
      expect(store.theme).toBe('system')
      expect(store.darkMode).toBe(true)
    })
  })

  describe('setSidebarPosition', () => {
    it('should set sidebar position to right', () => {
      const store = useSettingsStore()
      store.setSidebarPosition('right')
      expect(store.sidebarPosition).toBe('right')
    })
  })

  describe('toggleSidebar', () => {
    it('should toggle sidebar collapsed state', () => {
      const store = useSettingsStore()
      store.sidebarCollapsed = false
      store.toggleSidebar()
      expect(store.sidebarCollapsed).toBe(true)
      store.toggleSidebar()
      expect(store.sidebarCollapsed).toBe(false)
    })
  })

  describe('toggleCompactMode', () => {
    it('should toggle compact mode', () => {
      const store = useSettingsStore()
      store.compactMode = false
      store.toggleCompactMode()
      expect(store.compactMode).toBe(true)
      store.toggleCompactMode()
      expect(store.compactMode).toBe(false)
    })
  })

  describe('toggleNotifications', () => {
    it('should toggle notifications', () => {
      const store = useSettingsStore()
      store.notificationsEnabled = true
      store.toggleNotifications()
      expect(store.notificationsEnabled).toBe(false)
    })
  })

  describe('toggleSoundEffects', () => {
    it('should toggle sound effects', () => {
      const store = useSettingsStore()
      store.soundEffectsEnabled = false
      store.toggleSoundEffects()
      expect(store.soundEffectsEnabled).toBe(true)
    })
  })

  describe('toggleDesktopNotifications', () => {
    it('should toggle desktop notifications', () => {
      const store = useSettingsStore()
      store.desktopNotificationsEnabled = false
      store.toggleDesktopNotifications()
      expect(store.desktopNotificationsEnabled).toBe(true)
    })
  })

  describe('setRequestTimeout', () => {
    it('should set request timeout', () => {
      const store = useSettingsStore()
      store.setRequestTimeout(60)
      expect(store.requestTimeout).toBe(60)
    })
  })

  describe('setMaxRetries', () => {
    it('should set max retries', () => {
      const store = useSettingsStore()
      store.setMaxRetries(5)
      expect(store.maxRetries).toBe(5)
    })
  })

  describe('toggleDebugMode', () => {
    it('should toggle debug mode', () => {
      const store = useSettingsStore()
      store.debugMode = false
      store.toggleDebugMode()
      expect(store.debugMode).toBe(true)
    })
  })

  describe('clearLocalStorage', () => {
    it('should clear localStorage and reset values', () => {
      localStorage.setItem('customKey', 'value')
      const store = useSettingsStore()
      store.region = 'eu-west-1'
      store.accessKey = 'custom'
      store.secretKey = 'custom'
      store.theme = 'dark'
      store.sidebarPosition = 'right'
      store.sidebarCollapsed = true
      store.compactMode = true
      store.notificationsEnabled = false
      store.soundEffectsEnabled = false
      store.desktopNotificationsEnabled = true
      store.requestTimeout = 120
      store.maxRetries = 10
      store.debugMode = true

      store.clearLocalStorage()

      expect(store.region).toBe('us-east-1')
      expect(store.accessKey).toBe('test')
      expect(store.secretKey).toBe('test')
      expect(store.theme).toBe('system')
      expect(store.sidebarPosition).toBe('left')
      expect(store.sidebarCollapsed).toBe(false)
      expect(store.compactMode).toBe(false)
      expect(store.notificationsEnabled).toBe(true)
      expect(store.soundEffectsEnabled).toBe(true)
      expect(store.desktopNotificationsEnabled).toBe(false)
      expect(store.requestTimeout).toBe(30)
      expect(store.maxRetries).toBe(3)
      expect(store.debugMode).toBe(false)
    })
  })

  describe('resetSettings', () => {
    it('should reset all settings to defaults', () => {
      const store = useSettingsStore()
      store.region = 'eu-west-1'
      store.accessKey = 'custom'
      store.secretKey = 'custom'
      store.theme = 'dark'
      store.sidebarPosition = 'right'
      store.sidebarCollapsed = true
      store.compactMode = true
      store.notificationsEnabled = false
      store.soundEffectsEnabled = false
      store.desktopNotificationsEnabled = true
      store.requestTimeout = 120
      store.maxRetries = 10
      store.debugMode = true

      store.resetSettings()

      expect(store.region).toBe('us-east-1')
      expect(store.accessKey).toBe('test')
      expect(store.secretKey).toBe('test')
      expect(store.theme).toBe('system')
      expect(store.sidebarPosition).toBe('left')
      expect(store.sidebarCollapsed).toBe(false)
      expect(store.compactMode).toBe(false)
      expect(store.notificationsEnabled).toBe(true)
      expect(store.soundEffectsEnabled).toBe(true)
      expect(store.desktopNotificationsEnabled).toBe(false)
      expect(store.requestTimeout).toBe(30)
      expect(store.maxRetries).toBe(3)
      expect(store.debugMode).toBe(false)
    })
  })

  describe('localStorage persistence', () => {
    it('loads region from localStorage on init', () => {
      localStorage.setItem('region', 'ap-southeast-1')
      setActivePinia(createPinia())
      const store = useSettingsStore()
      expect(store.region).toBe('ap-southeast-1')
    })

    it('loads darkMode from localStorage on init', () => {
      localStorage.setItem('darkMode', 'true')
      setActivePinia(createPinia())
      const store = useSettingsStore()
      expect(store.darkMode).toBe(true)
    })

    it('loads provider from localStorage on init', () => {
      localStorage.setItem('provider', 'aws')
      setActivePinia(createPinia())
      const store = useSettingsStore()
      expect(store.provider).toBe('aws')
    })

    it('persists darkMode changes to localStorage', async () => {
      const store = useSettingsStore()
      store.darkMode = true
      await nextTick()
      expect(localStorage.getItem('darkMode')).toBe('true')
    })
  })
})
