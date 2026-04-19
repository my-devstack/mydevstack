<script setup lang="ts">
import { computed } from 'vue'

export interface Tab {
  id: string
  label: string
  icon?: unknown
  disabled?: boolean
}

interface Props {
  tabs: Tab[]
  activeTab: string
  variant?: 'underline' | 'pills' | 'boxed'
  size?: 'sm' | 'md' | 'lg'
  align?: 'left' | 'center' | 'right'
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'underline',
  size: 'md',
  align: 'left',
  fullWidth: false,
})

const emit = defineEmits<{
  'update:activeTab': [value: string]
}>()

function selectTab(tabId: string) {
  const tab = props.tabs.find((t) => t.id === tabId)
  if (tab && !tab.disabled) {
    emit('update:activeTab', tabId)
  }
}

const containerClasses = computed(() => {
  const base = 'flex'
  const alignment = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }
  const width = props.fullWidth ? 'w-full' : ''

  return [base, alignment[props.align], width]
})

const variantClasses = computed(() => {
  const variants = {
    underline: {
      container: 'border-b border-light-border dark:border-dark-border',
      tab: 'border-transparent',
      activeTab: 'border-primary-500 text-primary-500',
      disabled: 'opacity-50 cursor-not-allowed',
    },
    pills: {
      container: 'gap-1',
      tab: 'rounded-md',
      activeTab: 'bg-primary-500 text-white',
      disabled: 'opacity-50 cursor-not-allowed',
    },
    boxed: {
      container: 'border border-light-border dark:border-dark-border rounded-lg p-1 bg-light-bg dark:bg-dark-bg',
      tab: 'rounded-md',
      activeTab: 'bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text shadow-sm',
      disabled: 'opacity-50 cursor-not-allowed',
    },
  }
  return variants[props.variant]
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
  }
  return sizes[props.size]
})

function getTabClasses(tab: Tab) {
  const isActive = tab.id === props.activeTab
  const baseClasses = [
    'inline-flex items-center font-medium transition-all duration-150 whitespace-nowrap',
    sizeClasses.value,
  ]

  if (variantClasses.value.container.includes('border-b')) {
    baseClasses.push('relative -mb-px')
  }

  baseClasses.push(variantClasses.value.tab)

  if (isActive) {
    baseClasses.push(variantClasses.value.activeTab)
  } else {
    baseClasses.push('text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text')
  }

  if (tab.disabled) {
    baseClasses.push(variantClasses.value.disabled)
  }

  return baseClasses
}
</script>

<template>
  <div>
    <!-- Tabs Container -->
    <div
      :class="containerClasses"
      role="tablist"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="tab.id === activeTab"
        :aria-disabled="tab.disabled"
        :tabindex="tab.id === activeTab ? 0 : -1"
        :class="getTabClasses(tab)"
        :disabled="tab.disabled"
        @click="selectTab(tab.id)"
      >
        <!-- Icon -->
        <component
          :is="tab.icon"
          v-if="tab.icon"
          class="h-4 w-4 flex-shrink-0"
        />
        <!-- Label -->
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Panels -->
    <div class="mt-4">
      <slot :name="activeTab" />
    </div>
  </div>
</template>
