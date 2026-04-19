<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { ChevronDownIcon, ExclamationCircleIcon } from '@heroicons/vue/24/solid'

export interface Option {
  value: string | number
  label: string
  disabled?: boolean
}

interface Props {
  modelValue: string | number
  label?: string
  options: Option[]
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  helpText?: string
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
  placeholder: 'Select an option',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const attrs = useAttrs()

const selectId = computed(() => {
  return (attrs.id as string) || `select-${Math.random().toString(36).slice(2, 9)}`
})

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const value = target.value
  emit('update:modelValue', value)
}

const selectClasses = computed(() => [
  'block w-full rounded-md shadow-sm transition-colors duration-150 appearance-none',
  'text-light-text dark:text-dark-text',
  'bg-light-surface dark:bg-dark-surface',
  'border',
  error.value
    ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500'
    : 'border-light-border dark:border-dark-border focus:border-primary-500 focus:ring-primary-500',
  'focus:ring-1 focus:outline-none',
  props.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
])

const error = computed(() => props.error)
</script>

<template>
  <div class="w-full">
    <!-- Label -->
    <label
      v-if="label"
      :for="selectId"
      class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5"
    >
      {{ label }}
      <span
        v-if="required"
        class="text-red-500 ml-0.5"
      >*</span>
    </label>

    <!-- Select Wrapper -->
    <div class="relative">
      <select
        :id="selectId"
        :value="modelValue"
        :required="required"
        :disabled="disabled"
        :class="selectClasses"
        v-bind="attrs"
        @change="handleChange"
      >
        <!-- Placeholder Option -->
        <option
          value=""
          disabled
          :selected="!modelValue"
        >
          {{ placeholder }}
        </option>

        <!-- Options -->
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>

      <!-- Dropdown Icon -->
      <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <ChevronDownIcon class="h-5 w-5 text-light-muted dark:text-dark-muted" />
      </div>

      <!-- Error Icon -->
      <div
        v-if="error"
        class="absolute inset-y-0 right-8 flex items-center pointer-events-none"
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
/* Remove default select styling and add custom appearance */
select {
  padding-right: 2.5rem;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

/* Firefox specific */
select {
  text-overflow: ellipsis;
}

/* Style disabled options */
option:disabled {
  color: #94a3b8;
}
</style>
