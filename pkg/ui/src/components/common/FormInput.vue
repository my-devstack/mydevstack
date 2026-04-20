<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { ExclamationCircleIcon } from '@heroicons/vue/24/solid'

interface Props {
  modelValue: string | number
  label?: string
  type?: string
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  helpText?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const attrs = useAttrs()

const inputId = computed(() => {
  return (attrs.id as string) || `input-${Math.random().toString(36).slice(2, 9)}`
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = props.type === 'number' ? Number(target.value) : target.value
  emit('update:modelValue', value)
}

const inputClasses = computed(() => [
  'block w-full rounded-md shadow-sm transition-colors duration-150',
  'text-light-text dark:text-dark-text',
  'bg-light-surface dark:bg-dark-surface',
  'border',
  props.error
    ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500'
    : 'border-light-border dark:border-dark-border focus:border-primary-500 focus:ring-primary-500',
  'focus:ring-1 focus:outline-none',
  props.disabled ? 'opacity-50 cursor-not-allowed' : '',
  attrs.class as string,
])
</script>

<template>
  <div class="w-full">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5"
    >
      {{ label }}
      <span
        v-if="required"
        class="text-red-500 ml-0.5"
      >*</span>
    </label>

    <!-- Input Wrapper -->
    <div class="relative">
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :class="inputClasses"
        v-bind="attrs"
        @input="handleInput"
      >

      <!-- Error Icon -->
      <div
        v-if="error"
        class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
      >
        <ExclamationCircleIcon class="h-5 w-5 text-red-500" />
      </div>
    </div>

    <!-- Error Message -->
    <p
      v-if="error"
      class="mt-1.5 text-sm text-red-500 dark:text-red-400"
    >
      {{ error }}
    </p>

    <!-- Help Text -->
    <p
      v-else-if="helpText"
      class="mt-1.5 text-sm text-light-muted dark:text-dark-muted"
    >
      {{ helpText }}
    </p>
  </div>
</template>

<style scoped>
/* Remove default number input spinners */
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
}

/* Date input styling */
input[type='date']::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.6;
}

input[type='date']::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

/* Color input styling */
input[type='color'] {
  padding: 0.25rem;
  height: 2.5rem;
}
</style>
