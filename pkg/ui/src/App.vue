<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUIStore } from '@/stores/ui'
import { useToast } from '@/composables/useToast'
import Sidebar from '@/components/Sidebar.vue'
import TopBar from '@/components/TopBar.vue'
import NotificationToast from '@/components/NotificationToast.vue'
import Toast from '@/components/common/Toast.vue'

const settingsStore = useSettingsStore()
const uiStore = useUIStore()
const toast = useToast()

const isDark = computed(() => settingsStore.darkMode)

onMounted(() => {
  // Initialize dark mode class on document
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})

watch(isDark, (dark) => {
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})
</script>

<template>
  <div
    class="min-h-screen transition-colors duration-300"
    :class="isDark ? 'bg-dark-bg text-dark-text' : 'bg-light-bg text-light-text'"
  >
    <!-- Sidebar -->
    <Sidebar
      :collapsed="uiStore.sidebarCollapsed"
      @toggle="uiStore.toggleSidebar"
    />

    <!-- Main Content Area -->
    <div
      class="transition-all duration-300"
      :class="uiStore.sidebarCollapsed ? 'ml-16' : 'ml-64'"
    >
      <!-- Top Bar -->
      <TopBar />

      <!-- Page Content -->
      <main class="p-6">
        <router-view />
      </main>
    </div>

    <!-- Notifications -->
    <NotificationToast />
    <Toast
      :toast="toast.currentToast.value"
      @dismiss="toast.removeToast"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
