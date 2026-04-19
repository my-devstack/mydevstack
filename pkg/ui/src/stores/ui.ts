import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export interface LoadingState {
  global: boolean
  services: Record<string, boolean>
}

export const useUIStore = defineStore('ui', () => {
  // Sidebar state
  const sidebarCollapsed = ref(false)

  // Current service
  const currentService = ref<string | null>(null)

  // Loading states
  const loadingStates = ref<LoadingState>({
    global: false,
    services: {},
  })

  // Notifications
  const notifications = ref<Notification[]>([])

  // Modal state
  const activeModal = ref<string | null>(null)
  const modalData = ref<Record<string, unknown>>({})

  // Search
  const searchQuery = ref('')
  const isSearchOpen = ref(false)

  // Computed
  const isLoading = computed(() => loadingStates.value.global)

  const isServiceLoading = computed(() => {
    return (service: string) => loadingStates.value.services[service] || false
  })

  const hasNotifications = computed(() => notifications.value.length > 0)

  // Actions
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setSidebarCollapsed(collapsed: boolean) {
    sidebarCollapsed.value = collapsed
  }

  function setCurrentService(service: string | null) {
    currentService.value = service
  }

  function setGlobalLoading(loading: boolean) {
    loadingStates.value.global = loading
  }

  function setServiceLoading(service: string, loading: boolean) {
    loadingStates.value.services[service] = loading
  }

  function addNotification(notification: Omit<Notification, 'id'>) {
    const id = crypto.randomUUID()
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification,
    }
    notifications.value.push(newNotification)

    // Auto-remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }

  function removeNotification(id: string) {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  function clearNotifications() {
    notifications.value = []
  }

  function openModal(modalId: string, data: Record<string, unknown> = {}) {
    activeModal.value = modalId
    modalData.value = data
  }

  function closeModal() {
    activeModal.value = null
    modalData.value = {}
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  function openSearch() {
    isSearchOpen.value = true
  }

  function closeSearch() {
    isSearchOpen.value = false
    searchQuery.value = ''
  }

  // Convenience notification methods
  function notifySuccess(title: string, message?: string) {
    return addNotification({ type: 'success', title, message })
  }

  function notifyError(title: string, message?: string) {
    return addNotification({ type: 'error', title, message, duration: 8000 })
  }

  function notifyWarning(title: string, message?: string) {
    return addNotification({ type: 'warning', title, message })
  }

  function notifyInfo(title: string, message?: string) {
    return addNotification({ type: 'info', title, message })
  }

  return {
    // State
    sidebarCollapsed,
    currentService,
    loadingStates,
    notifications,
    activeModal,
    modalData,
    searchQuery,
    isSearchOpen,
    // Computed
    isLoading,
    isServiceLoading,
    hasNotifications,
    // Actions
    toggleSidebar,
    setSidebarCollapsed,
    setCurrentService,
    setGlobalLoading,
    setServiceLoading,
    addNotification,
    removeNotification,
    clearNotifications,
    openModal,
    closeModal,
    setSearchQuery,
    openSearch,
    closeSearch,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
  }
})
