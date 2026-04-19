import { shallowRef, computed } from 'vue'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration?: number
}

// Global toast state
const toasts = shallowRef<ToastItem[]>([])
const currentToast = shallowRef<ToastItem | null>(null)

// Generate unique ID
function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// Create a new toast
function addToast(type: ToastType, message: string, duration?: number): string {
  const id = generateId()
  const toast: ToastItem = {
    id,
    type,
    message,
    duration,
  }

  toasts.value = [...toasts.value, toast]

  // Auto-show the new toast
  if (!currentToast.value) {
    showNextToast()
  }

  return id
}

// Remove a toast by ID
function removeToast(id: string) {
  toasts.value = toasts.value.filter((t) => t.id !== id)

  if (currentToast.value?.id === id) {
    currentToast.value = null
    showNextToast()
  }
}

// Dismiss current toast
function dismissCurrent() {
  if (currentToast.value) {
    removeToast(currentToast.value.id)
  }
}

// Show next toast in queue
function showNextToast() {
  if (toasts.value.length > 0) {
    currentToast.value = toasts.value[0]
  } else {
    currentToast.value = null
  }
}

// Convenience methods
function success(message: string, duration?: number): string {
  return addToast('success', message, duration)
}

function error(message: string, duration?: number): string {
  return addToast('error', message, duration || 7000) // Errors stay longer by default
}

function warning(message: string, duration?: number): string {
  return addToast('warning', message, duration)
}

function info(message: string, duration?: number): string {
  return addToast('info', message, duration)
}

// Export composable
export function useToast() {
  return {
    // State
    toasts: computed(() => toasts.value),
    currentToast: computed(() => currentToast.value),

    // Methods
    addToast,
    removeToast,
    dismissCurrent,
    success,
    error,
    warning,
    info,
  }
}

// Export types for external use
export type { ToastType, ToastItem }
