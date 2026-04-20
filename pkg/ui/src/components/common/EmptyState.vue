<script setup lang="ts">
import { computed } from 'vue'
import {
  InboxIcon,
  FolderOpenIcon,
  DocumentTextIcon,
  ServerIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  UserIcon,
  HeartIcon,
  StarIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'

interface Props {
  icon?: string
  title?: string
  description?: string
  actionLabel?: string
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
})

const emit = defineEmits<{
  action: []
}>()

// Icon mapping
const iconMap: Record<string, unknown> = {
  'inbox': InboxIcon,
  'folder': FolderOpenIcon,
  'folder-open': FolderOpenIcon,
  'document': DocumentTextIcon,
  'file': DocumentTextIcon,
  'server': ServerIcon,
  'users': UserGroupIcon,
  'user': UserIcon,
  'cart': ShoppingCartIcon,
  'payment': CreditCardIcon,
  'heart': HeartIcon,
  'star': StarIcon,
  'refresh': ArrowPathIcon,
  'loading': ArrowPathIcon,
  'table-cells': DocumentTextIcon,
}

const IconComponent = computed(() => {
  if (!props.icon) return InboxIcon
  return iconMap[props.icon] || InboxIcon
})

const iconSize = computed(() => {
  return props.compact ? 'h-10 w-10' : 'h-16 w-16'
})

const iconPadding = computed(() => {
  return props.compact ? 'p-2' : 'p-4'
})

function handleAction() {
  emit('action')
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center text-center"
    :class="{ 'py-8': !compact, 'py-4': compact }"
  >
    <!-- Icon -->
    <div
      :class="[
        'rounded-full bg-light-bg dark:bg-dark-bg text-light-muted dark:text-dark-muted',
        iconPadding,
        iconSize,
      ]"
    >
      <component
        :is="IconComponent"
        class="h-full w-full"
      />
    </div>

    <!-- Content -->
    <div class="mt-4 max-w-sm">
      <h3
        v-if="title"
        class="text-base font-semibold text-light-text dark:text-dark-text"
      >
        {{ title }}
      </h3>

      <p
        v-if="description"
        class="mt-1 text-sm text-light-muted dark:text-dark-muted"
      >
        {{ description }}
      </p>

      <!-- Default Action Slot -->
      <div
        v-if="$slots.action"
        class="mt-4"
      >
        <slot name="action" />
      </div>

      <!-- Action Button -->
      <button
        v-else-if="actionLabel"
        type="button"
        class="mt-4 px-4 py-2 text-sm font-medium rounded-md bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 transition-colors"
        @click="handleAction"
      >
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>
