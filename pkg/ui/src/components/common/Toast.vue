<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { TransitionRoot, TransitionChild } from '@headlessui/vue'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface Props {
  toast: ToastItem | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  dismiss: [id: string]
}>()

const progress = ref(100)
const isVisible = ref(false)
let progressInterval: ReturnType<typeof setInterval> | null = null
let dismissTimeout: ReturnType<typeof setTimeout> | null = null

const config = {
  success: {
    icon: CheckCircleIcon,
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-500',
    textColor: 'text-emerald-800 dark:text-emerald-300',
    progressColor: 'bg-emerald-500',
  },
  error: {
    icon: ExclamationCircleIcon,
    bgColor: 'bg-red-50 dark:bg-red-900/30',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-500',
    textColor: 'text-red-800 dark:text-red-300',
    progressColor: 'bg-red-500',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-500',
    textColor: 'text-amber-800 dark:text-amber-300',
    progressColor: 'bg-amber-500',
  },
  info: {
    icon: InformationCircleIcon,
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-500',
    textColor: 'text-blue-800 dark:text-blue-300',
    progressColor: 'bg-blue-500',
  },
}

const currentConfig = () => config[props.toast?.type || 'info']

function startProgress(duration: number) {
  stopProgress()

  progress.value = 100
  const step = 100 / (duration / 50)

  progressInterval = setInterval(() => {
    progress.value -= step
    if (progress.value <= 0) {
      stopProgress()
    }
  }, 50)

  dismissTimeout = setTimeout(() => {
    dismiss()
  }, duration)
}

function stopProgress() {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
}

function dismiss() {
  isVisible.value = false
  stopProgress()

  setTimeout(() => {
    if (props.toast) {
      emit('dismiss', props.toast.id)
    }
  }, 300)
}

watch(
  () => props.toast,
  (newToast) => {
    if (newToast) {
      isVisible.value = true
      const duration = newToast.duration || 5000
      startProgress(duration)
    } else {
      isVisible.value = false
      stopProgress()
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  stopProgress()
  if (dismissTimeout) {
    clearTimeout(dismissTimeout)
  }
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      <TransitionRoot
        appear
        :show="isVisible && !!toast"
        enter="transform transition duration-300 ease-out"
        enter-from="translate-x-full opacity-0"
        enter-to="translate-x-0 opacity-100"
        leave="transform transition duration-200 ease-in"
        leave-from="translate-x-0 opacity-100"
        leave-to="translate-x-full opacity-0"
      >
        <div
          v-if="toast"
          class="pointer-events-auto w-80 rounded-lg shadow-lg overflow-hidden"
          :class="[currentConfig().bgColor, currentConfig().borderColor, 'border']"
          @mouseenter="stopProgress"
          @mouseleave="startProgress(toast.duration || 5000)"
        >
          <div class="p-4 flex items-start gap-3">
            <component
              :is="currentConfig().icon"
              :class="currentConfig().iconColor"
              class="h-5 w-5 flex-shrink-0 mt-0.5"
            />
            <div class="flex-1 min-w-0">
              <p
                :class="currentConfig().textColor"
                class="text-sm font-medium"
              >
                {{ toast.message }}
              </p>
            </div>
            <button
              type="button"
              :class="currentConfig().textColor"
              class="flex-shrink-0 p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              @click="dismiss"
            >
              <XMarkIcon class="h-4 w-4" />
            </button>
          </div>

          <!-- Progress Bar -->
          <div class="h-1 w-full bg-black/5 dark:bg-white/10">
            <div
              class="h-full transition-all duration-50 ease-linear"
              :class="currentConfig().progressColor"
              :style="{ width: `${progress}%` }"
            />
          </div>
        </div>
      </TransitionRoot>
    </div>
  </Teleport>
</template>
