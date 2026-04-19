<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { TransitionRoot, TransitionChild } from '@headlessui/vue'

type Size = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full'

interface Props {
  open: boolean
  title?: string
  size?: Size
  closable?: boolean
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
  showHeader?: boolean
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
  closeOnBackdrop: true,
  closeOnEsc: true,
  showHeader: true,
  zIndex: 50,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  close: []
}>()

const modalRef = ref<HTMLElement | null>(null)
const firstFocusableElement = ref<HTMLElement | null>(null)
const lastFocusableElement = ref<HTMLElement | null>(null)
const previouslyFocusedElement = ref<HTMLElement | null>(null)

const sizeClasses: Record<Size, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-5xl',
  '4xl': 'max-w-6xl',
  '5xl': 'max-w-7xl',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
}

function close() {
  if (!props.closable) return
  emit('update:open', false)
  emit('close')
}

function handleBackdropClick(event: MouseEvent) {
  if (props.closeOnBackdrop && event.target === event.currentTarget) {
    close()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (props.closeOnEsc && event.key === 'Escape') {
    close()
    return
  }

  // Focus trap
  if (event.key === 'Tab') {
    if (!modalRef.value) return

    const focusableElements = modalRef.value.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
}

function setupFocusTrap() {
  if (!props.open || !modalRef.value) return

  // Store previously focused element
  previouslyFocusedElement.value = document.activeElement as HTMLElement

  nextTick(() => {
    if (!modalRef.value) return

    const focusableElements = modalRef.value.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length > 0) {
      firstFocusableElement.value = focusableElements[0]
      lastFocusableElement.value = focusableElements[focusableElements.length - 1]

      // Focus first element
      firstFocusableElement.value?.focus()
    }
  })
}

function restoreFocus() {
  if (previouslyFocusedElement.value) {
    previouslyFocusedElement.value.focus()
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setupFocusTrap()
      document.addEventListener('keydown', handleKeydown)
    } else {
      document.body.style.overflow = ''
      restoreFocus()
      document.removeEventListener('keydown', handleKeydown)
    }
  }
)

onMounted(() => {
  if (props.open) {
    document.body.style.overflow = 'hidden'
    setupFocusTrap()
    document.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <TransitionRoot
      appear
      :show="open"
      as="template"
    >
      <div
        class="fixed inset-0 flex items-center justify-center p-4"
        :style="{ zIndex: zIndex }"
        @click="handleBackdropClick"
      >
        <!-- Backdrop -->
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </TransitionChild>

        <!-- Modal Content -->
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0 scale-95"
          enter-to="opacity-100 scale-100"
          leave="ease-in duration-200"
          leave-from="opacity-100 scale-100"
          leave-to="opacity-0 scale-95"
        >
          <div
            ref="modalRef"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="title ? 'modal-title' : undefined"
            :class="[
              'relative w-full rounded-lg shadow-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border',
              sizeClasses[size],
            ]"
          >
            <!-- Header -->
            <div
              v-if="showHeader"
              class="flex items-center justify-between px-6 py-4 border-b border-light-border dark:border-dark-border"
            >
              <h2
                id="modal-title"
                class="text-lg font-semibold text-light-text dark:text-dark-text"
              >
                {{ title }}
              </h2>
              <button
                v-if="closable"
                type="button"
                class="p-1 rounded-md text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
                aria-label="Close modal"
                @click="close"
              >
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>

            <!-- Body -->
            <div class="px-6 py-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
              <slot />
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="flex items-center justify-end gap-3 px-6 py-4 border-t border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg"
            >
              <slot name="footer" />
            </div>
          </div>
        </TransitionChild>
      </div>
    </TransitionRoot>
  </Teleport>
</template>
