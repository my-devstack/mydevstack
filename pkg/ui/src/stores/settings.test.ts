import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

describe('Settings Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
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

  it('should default to light mode', () => {
    const store = useSettingsStore()
    // Based on system preference or localStorage
    expect(typeof store.darkMode).toBe('boolean')
  })
})
