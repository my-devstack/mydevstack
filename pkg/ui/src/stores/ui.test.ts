import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUIStore } from './ui'

describe('useUIStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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