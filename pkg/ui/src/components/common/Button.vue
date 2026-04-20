<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface Props {
  variant?: Variant
  size?: Size
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
  fullWidth: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const attrs = useAttrs()

const variantClasses = computed(() => {
  const variants: Record<Variant, string> = {
    primary:
      'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus:ring-primary-500 dark:bg-primary-600 dark:hover:bg-primary-500',
    secondary:
      'bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg active:bg-light-border dark:active:bg-dark-border focus:ring-primary-500',
    danger:
      'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-500',
    ghost:
      'text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg active:bg-light-border dark:active:bg-dark-border focus:ring-primary-500',
  }
  return variants[props.variant]
})

const sizeClasses = computed(() => {
  const sizes: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  }
  return sizes[props.size]
})

const isDisabled = computed(() => props.disabled || props.loading)

function handleClick(event: MouseEvent) {
  if (isDisabled.value) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<template>
  <button
    :type="type"
    :disabled="isDisabled"
    :class="[
      'inline-flex items-center justify-center font-medium rounded-md shadow-sm transition-all duration-150',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-surface',
      variantClasses,
      sizeClasses,
      fullWidth ? 'w-full' : '',
      isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    ]"
    v-bind="attrs"
    @click="handleClick"
  >
    <LoadingSpinner
      v-if="loading"
      size="sm"
      class="absolute"
    />
    <span :class="{ 'invisible': loading }">
      <slot name="icon-left" />
    </span>
    <span :class="{ 'opacity-0': loading }">
      <slot />
    </span>
    <span :class="{ 'invisible': loading }">
      <slot name="icon-right" />
    </span>
  </button>
</template>
