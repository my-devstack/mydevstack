// Theme composable for dark/light mode support
import { ref, computed, watch, onMounted } from 'vue'
import type { Theme } from '@/types/services'

const STORAGE_KEY = 'mydevstack-theme'

// Global reactive state
const theme = ref<Theme>('system')
const isDark = ref(false)

// Initialize theme from localStorage or system preference
function initTheme(): void {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    theme.value = stored
  }
  updateIsDark()
}

// Update the isDark value based on theme setting
function updateIsDark(): void {
  if (theme.value === 'system') {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  } else {
    isDark.value = theme.value === 'dark'
  }
  applyTheme()
}

// Apply theme to document
function applyTheme(): void {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Toggle between light and dark (for quick toggle button)
function toggleTheme(): void {
  theme.value = isDark.value ? 'light' : 'dark'
  localStorage.setItem(STORAGE_KEY, theme.value)
  updateIsDark()
}

// Set specific theme
function setTheme(newTheme: Theme): void {
  theme.value = newTheme
  localStorage.setItem(STORAGE_KEY, theme.value)
  updateIsDark()
}

export function useTheme() {
  onMounted(() => {
    initTheme()
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (theme.value === 'system') {
        updateIsDark()
      }
    })
  })

  watch(theme, updateIsDark)

  return {
    theme: computed(() => theme.value),
    isDark: computed(() => isDark.value),
    toggleTheme,
    setTheme
  }
}
