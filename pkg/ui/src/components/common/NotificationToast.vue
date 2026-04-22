<script setup lang="ts">
import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import { TransitionRoot, TransitionChild } from '@headlessui/vue'

const uiStore = useUIStore()
const settingsStore = useSettingsStore()

const notifications = computed(() => uiStore.notifications)

const iconMap = {
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

const colorMap = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
}
</script>

<template>
  <div class="fixed top-4 right-4 z-50 space-y-2 w-80">
    <TransitionRoot
      v-for="notification in notifications"
      :key="notification.id"
      appear
      show
      enter="transform transition duration-300 ease-out"
      enter-from="translate-x-full opacity-0"
      enter-to="translate-x-0 opacity-100"
      leave="transform transition duration-200 ease-in"
      leave-from="translate-x-0 opacity-100"
      leave-to="translate-x-full opacity-0"
    >
      <div
        class="flex items-start gap-3 p-4 rounded-lg shadow-lg border"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <div class="flex-shrink-0">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center"
            :class="colorMap[notification.type]"
          >
            <svg
              class="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="iconMap[notification.type]"
              />
            </svg>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p
            class="text-sm font-medium"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ notification.title }}
          </p>
          <p
            v-if="notification.message"
            class="mt-1 text-sm"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            {{ notification.message }}
          </p>
        </div>
        <button
          class="flex-shrink-0 p-1 rounded hover:bg-opacity-10 transition-colors"
          :class="settingsStore.darkMode ? 'hover:bg-dark-border text-dark-muted' : 'hover:bg-light-border text-light-muted'"
          @click="uiStore.removeNotification(notification.id)"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </TransitionRoot>
  </div>
</template>
