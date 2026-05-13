import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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

  return {
    // State
    sidebarCollapsed,
    currentService,
    loadingStates,
    activeModal,
    modalData,
    searchQuery,
    isSearchOpen,
    // Computed
    isLoading,
    isServiceLoading,
    // Actions
    toggleSidebar,
    setSidebarCollapsed,
    setCurrentService,
    setGlobalLoading,
    setServiceLoading,
    openModal,
    closeModal,
    setSearchQuery,
    openSearch,
    closeSearch,
  }
})
