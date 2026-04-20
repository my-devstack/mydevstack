import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUIStore } from './ui'

// Mock crypto.randomUUID
const originalCrypto = global.crypto
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9))
  },
  writable: true
})

describe('useUIStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
    // Restore original crypto
    Object.defineProperty(global, 'crypto', {
      value: originalCrypto,
      writable: true
    })
  })

  describe('initial state', () => {
    it('should have sidebarCollapsed as false', () => {
      const store = useUIStore()
      expect(store.sidebarCollapsed).toBe(false)
    })

    it('should have currentService as null', () => {
      const store = useUIStore()
      expect(store.currentService).toBeNull()
    })

    it('should have global loading as false', () => {
      const store = useUIStore()
      expect(store.isLoading).toBe(false)
    })

    it('should have empty notifications', () => {
      const store = useUIStore()
      expect(store.notifications).toEqual([])
      expect(store.hasNotifications).toBe(false)
    })

    it('should have no active modal', () => {
      const store = useUIStore()
      expect(store.activeModal).toBeNull()
    })

    it('should have empty search query', () => {
      const store = useUIStore()
      expect(store.searchQuery).toBe('')
      expect(store.isSearchOpen).toBe(false)
    })
  })

  describe('sidebar', () => {
    it('should toggle sidebar', () => {
      const store = useUIStore()
      expect(store.sidebarCollapsed).toBe(false)
      store.toggleSidebar()
      expect(store.sidebarCollapsed).toBe(true)
      store.toggleSidebar()
      expect(store.sidebarCollapsed).toBe(false)
    })

    it('should set sidebar collapsed state', () => {
      const store = useUIStore()
      store.setSidebarCollapsed(true)
      expect(store.sidebarCollapsed).toBe(true)
      store.setSidebarCollapsed(false)
      expect(store.sidebarCollapsed).toBe(false)
    })
  })

  describe('current service', () => {
    it('should set current service', () => {
      const store = useUIStore()
      store.setCurrentService('s3')
      expect(store.currentService).toBe('s3')
    })

    it('should set current service to null', () => {
      const store = useUIStore()
      store.setCurrentService('s3')
      store.setCurrentService(null)
      expect(store.currentService).toBeNull()
    })
  })

  describe('loading states', () => {
    it('should set global loading', () => {
      const store = useUIStore()
      store.setGlobalLoading(true)
      expect(store.isLoading).toBe(true)
      store.setGlobalLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('should set service loading', () => {
      const store = useUIStore()
      store.setServiceLoading('s3', true)
      expect(store.isServiceLoading('s3')).toBe(true)
      store.setServiceLoading('s3', false)
      expect(store.isServiceLoading('s3')).toBe(false)
    })

    it('should return false for unknown service', () => {
      const store = useUIStore()
      expect(store.isServiceLoading('unknown')).toBe(false)
    })
  })

  describe('notifications', () => {
    it('should add notification', () => {
      const store = useUIStore()
      const id = store.addNotification({ type: 'success', title: 'Test' })
      expect(id).toBeDefined()
      expect(store.notifications).toHaveLength(1)
      expect(store.notifications[0].title).toBe('Test')
      expect(store.hasNotifications).toBe(true)
    })

    it('should add notification with message', () => {
      const store = useUIStore()
      store.addNotification({ type: 'info', title: 'Test', message: 'Test message' })
      expect(store.notifications[0].message).toBe('Test message')
    })

    it('should add notification with custom duration', () => {
      const store = useUIStore()
      store.addNotification({ type: 'warning', title: 'Test', duration: 1000 })
      expect(store.notifications[0].duration).toBe(1000)
    })

    it('should remove notification', () => {
      const store = useUIStore()
      const id = store.addNotification({ type: 'error', title: 'Test' })
      store.removeNotification(id)
      expect(store.notifications).toHaveLength(0)
    })

    it('should clear all notifications', () => {
      const store = useUIStore()
      store.addNotification({ type: 'success', title: 'Test 1' })
      store.addNotification({ type: 'error', title: 'Test 2' })
      expect(store.notifications).toHaveLength(2)
      store.clearNotifications()
      expect(store.notifications).toHaveLength(0)
    })

    it('should notify success', () => {
      const store = useUIStore()
      store.notifySuccess('Success', 'Operation completed')
      expect(store.notifications[0].type).toBe('success')
      expect(store.notifications[0].title).toBe('Success')
    })

    it('should notify error with longer duration', () => {
      const store = useUIStore()
      store.notifyError('Error', 'Something went wrong')
      expect(store.notifications[0].type).toBe('error')
      expect(store.notifications[0].duration).toBe(8000)
    })

    it('should notify warning', () => {
      const store = useUIStore()
      store.notifyWarning('Warning', 'Check this')
      expect(store.notifications[0].type).toBe('warning')
    })

    it('should notify info', () => {
      const store = useUIStore()
      store.notifyInfo('Info', 'Just so you know')
      expect(store.notifications[0].type).toBe('info')
    })
  })

  describe('modals', () => {
    it('should open modal', () => {
      const store = useUIStore()
      store.openModal('createBucket', { name: 'test-bucket' })
      expect(store.activeModal).toBe('createBucket')
      expect(store.modalData).toEqual({ name: 'test-bucket' })
    })

    it('should open modal without data', () => {
      const store = useUIStore()
      store.openModal('confirmDelete')
      expect(store.activeModal).toBe('confirmDelete')
      expect(store.modalData).toEqual({})
    })

    it('should close modal', () => {
      const store = useUIStore()
      store.openModal('test')
      store.closeModal()
      expect(store.activeModal).toBeNull()
      expect(store.modalData).toEqual({})
    })
  })

  describe('search', () => {
    it('should set search query', () => {
      const store = useUIStore()
      store.setSearchQuery('lambda')
      expect(store.searchQuery).toBe('lambda')
    })

    it('should open search', () => {
      const store = useUIStore()
      store.openSearch()
      expect(store.isSearchOpen).toBe(true)
    })

    it('should close search and clear query', () => {
      const store = useUIStore()
      store.setSearchQuery('test')
      store.openSearch()
      store.closeSearch()
      expect(store.isSearchOpen).toBe(false)
      expect(store.searchQuery).toBe('')
    })
  })
})