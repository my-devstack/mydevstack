<script setup lang="ts">
import { computed } from 'vue'

type Size = 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  size?: Size
  color?: string
  fullScreen?: boolean
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  fullScreen: false,
})

const sizeClasses = computed(() => {
  const sizes: Record<Size, string> = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  }
  return sizes[props.size]
})

const strokeWidth = computed(() => {
  const widths: Record<Size, string> = {
    sm: '2',
    md: '2.5',
    lg: '3',
    xl: '3.5',
  }
  return widths[props.size]
})

const spinnerColor = computed(() => {
  if (props.color) return props.color
  return 'text-primary-500'
})

const screenSizeClasses = 'fixed inset-0 z-50 bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-sm flex items-center justify-center'
</script>

<template>
  <!-- Full Screen Spinner -->
  <div
    v-if="fullScreen"
    :class="screenSizeClasses"
  >
    <div class="flex flex-col items-center gap-4">
      <svg
        :class="[sizeClasses, spinnerColor, 'animate-spin']"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          :stroke-width="strokeWidth"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span
        v-if="label"
        class="text-sm font-medium text-light-text dark:text-dark-text"
      >
        {{ label }}
      </span>
    </div>
  </div>

  <!-- Inline Spinner -->
  <svg
    v-else
    :class="[sizeClasses, spinnerColor, 'animate-spin']"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    role="status"
    :aria-label="label || 'Loading'"
  >
    <circle
      class="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      :stroke-width="strokeWidth"
    />
    <path
      class="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
</template>
