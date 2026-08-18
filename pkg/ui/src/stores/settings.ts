import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { PROXY_BACKEND } from '@/config'

export type Theme = 'light' | 'dark' | 'system'
export type SidebarPosition = 'left' | 'right'
export type TimeRange = '15m' | '30m' | '1h' | '6h' | '24h' | 'custom'
export type Provider = 'aws' | 'localstack' | 'ministack'

export interface SettingsState {
  region: string
  emulator: string
  accessKey: string
  secretKey: string
  darkMode: boolean
  sidebarCollapsed: boolean
  theme: Theme
  sidebarPosition: SidebarPosition
  compactMode: boolean
  notificationsEnabled: boolean
  soundEffectsEnabled: boolean
  desktopNotificationsEnabled: boolean
  requestTimeout: number
  maxRetries: number
  debugMode: boolean
}

export const useSettingsStore = defineStore('settings', () => {
  // State - Connection
  const endpoint = computed(() => PROXY_BACKEND)
  const region = ref<string>(localStorage.getItem('region') || 'us-east-1')
  const emulator = ref<string>('')
  const accessKey = ref<string>(localStorage.getItem('accessKey') || 'test')
  const secretKey = ref<string>(localStorage.getItem('secretKey') || 'test')
  const provider = ref<Provider>(
    (localStorage.getItem('provider') as Provider) || 'localstack'
  )
  const publicEndpoint = ref<string>(localStorage.getItem('publicEndpoint') || 'http://127.0.0.1:4566')

  // State - Appearance
  const darkMode = ref<boolean>(
    localStorage.getItem('darkMode') === 'true' ||
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const theme = ref<Theme>(
    (localStorage.getItem('theme') as Theme) || 'system'
  )
  const sidebarPosition = ref<SidebarPosition>(
    (localStorage.getItem('sidebarPosition') as SidebarPosition) || 'left'
  )
  const sidebarCollapsed = ref<boolean>(
    localStorage.getItem('sidebarCollapsed') === 'true'
  )
  const compactMode = ref<boolean>(
    localStorage.getItem('compactMode') === 'true'
  )

  // State - Notifications
  const notificationsEnabled = ref<boolean>(
    localStorage.getItem('notificationsEnabled') !== 'false'
  )
  const soundEffectsEnabled = ref<boolean>(
    localStorage.getItem('soundEffectsEnabled') !== 'false'
  )
  const desktopNotificationsEnabled = ref<boolean>(
    localStorage.getItem('desktopNotificationsEnabled') === 'true'
  )

  // State - Advanced
  const requestTimeout = ref<number>(
    parseInt(localStorage.getItem('requestTimeout') || '30', 10)
  )
  const maxRetries = ref<number>(
    parseInt(localStorage.getItem('maxRetries') || '3', 10)
  )
  const debugMode = ref<boolean>(
    localStorage.getItem('debugMode') === 'true'
  )

  // Computed
  const isDarkMode = computed(() => {
    if (theme.value === 'system') {
      return darkMode.value
    }
    return theme.value === 'dark'
  })

  // Persist to localStorage
  watch(endpoint, (val) => localStorage.setItem('endpoint', val))
  watch(region, (val) => localStorage.setItem('region', val))
  watch(emulator, (val) => localStorage.setItem('emulator', val))
  watch(accessKey, (val) => localStorage.setItem('accessKey', val))
  watch(secretKey, (val) => localStorage.setItem('secretKey', val))
  watch(provider, (val) => localStorage.setItem('provider', val))
  watch(darkMode, (val) => localStorage.setItem('darkMode', String(val)))
  watch(theme, (val) => localStorage.setItem('theme', val))
  watch(sidebarPosition, (val) => localStorage.setItem('sidebarPosition', val))
  watch(sidebarCollapsed, (val) => localStorage.setItem('sidebarCollapsed', String(val)))
  watch(compactMode, (val) => localStorage.setItem('compactMode', String(val)))
  watch(notificationsEnabled, (val) => localStorage.setItem('notificationsEnabled', String(val)))
  watch(soundEffectsEnabled, (val) => localStorage.setItem('soundEffectsEnabled', String(val)))
  watch(desktopNotificationsEnabled, (val) => localStorage.setItem('desktopNotificationsEnabled', String(val)))
  watch(requestTimeout, (val) => localStorage.setItem('requestTimeout', String(val)))
  watch(maxRetries, (val) => localStorage.setItem('maxRetries', String(val)))
  watch(debugMode, (val) => localStorage.setItem('debugMode', String(val)))
  watch(publicEndpoint, (val) => localStorage.setItem('publicEndpoint', val))

  // Actions
  function setRegion(newRegion: string) {
    region.value = newRegion
  }

  function setEmulator(newEmulator: string) {
    emulator.value = newEmulator
  }

  function setCredentials(key: string, secret: string) {
    accessKey.value = key
    secretKey.value = secret
  }

  function setProvider(newProvider: Provider) {
    provider.value = newProvider
  }

  function setPublicEndpoint(newEndpoint: string) {
    publicEndpoint.value = newEndpoint
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
  }

  function setDarkMode(enabled: boolean) {
    darkMode.value = enabled
  }

  function setTheme(newTheme: Theme) {
    theme.value = newTheme
    if (newTheme === 'system') {
      darkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    } else {
      darkMode.value = newTheme === 'dark'
    }
  }

  function setSidebarPosition(position: SidebarPosition) {
    sidebarPosition.value = position
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function toggleCompactMode() {
    compactMode.value = !compactMode.value
  }

  function toggleNotifications() {
    notificationsEnabled.value = !notificationsEnabled.value
  }

  function toggleSoundEffects() {
    soundEffectsEnabled.value = !soundEffectsEnabled.value
  }

  function toggleDesktopNotifications() {
    desktopNotificationsEnabled.value = !desktopNotificationsEnabled.value
  }

  function setRequestTimeout(timeout: number) {
    requestTimeout.value = timeout
  }

  function setMaxRetries(retries: number) {
    maxRetries.value = retries
  }

  function toggleDebugMode() {
    debugMode.value = !debugMode.value
  }

  function clearLocalStorage() {
    localStorage.clear()
    // Reset to defaults (endpoint is computed from config, not stored)
    region.value = 'us-east-1'
    accessKey.value = 'test'
    secretKey.value = 'test'
    theme.value = 'system'
    sidebarPosition.value = 'left'
    sidebarCollapsed.value = false
    compactMode.value = false
    notificationsEnabled.value = true
    soundEffectsEnabled.value = true
    desktopNotificationsEnabled.value = false
    requestTimeout.value = 30
    maxRetries.value = 3
    debugMode.value = false
    darkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    publicEndpoint.value = 'http://127.0.0.1:4566'
  }

  function resetSettings() {
    region.value = 'us-east-1'
    accessKey.value = 'test'
    secretKey.value = 'test'
    theme.value = 'system'
    sidebarPosition.value = 'left'
    sidebarCollapsed.value = false
    compactMode.value = false
    notificationsEnabled.value = true
    soundEffectsEnabled.value = true
    desktopNotificationsEnabled.value = false
    requestTimeout.value = 30
    maxRetries.value = 3
    debugMode.value = false
    darkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    publicEndpoint.value = 'http://127.0.0.1:4566'
  }

  return {
    // State - Connection
    endpoint,
    region,
    emulator,
    accessKey,
    secretKey,
    provider,
    publicEndpoint,
    // State - Appearance
    darkMode,
    theme,
    sidebarPosition,
    sidebarCollapsed,
    compactMode,
    // State - Notifications
    notificationsEnabled,
    soundEffectsEnabled,
    desktopNotificationsEnabled,
    // State - Advanced
    requestTimeout,
    maxRetries,
    debugMode,
    // Computed
    isDarkMode,
    // Actions - Connection
    setRegion,
    setEmulator,
    setCredentials,
    setProvider,
    setPublicEndpoint,
    // Actions - Appearance
    toggleDarkMode,
    setDarkMode,
    setTheme,
    setSidebarPosition,
    toggleSidebar,
    toggleCompactMode,
    // Actions - Notifications
    toggleNotifications,
    toggleSoundEffects,
    toggleDesktopNotifications,
    // Actions - Advanced
    setRequestTimeout,
    setMaxRetries,
    toggleDebugMode,
    clearLocalStorage,
    resetSettings,
  }
})
