<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import Button from '@/components/common/Button.vue'

const props = defineProps<{
  open: boolean
  logGroupName: string
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  delete: []
}>()

const settingsStore = useSettingsStore()

function handleDelete() {
  emit('delete')
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center"
  >
    <div
      class="absolute inset-0 bg-black/50"
      @click="close"
    />
    <div
      class="relative w-full max-w-md mx-4 rounded-lg border shadow-xl"
      :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-white border-light-border'"
      role="dialog"
    >
      <div
        class="flex items-center justify-between px-6 py-4 border-b"
        :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
      >
        <h2
          class="text-lg font-semibold"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Delete Log Group
        </h2>
        <button
          class="text-light-muted hover:text-light-text dark:hover:text-dark-text"
          @click="close"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div class="px-6 py-4">
        <p
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Are you sure you want to delete log group <strong>{{ logGroupName }}</strong>? This action cannot be undone.
        </p>
      </div>
      <div
        class="flex justify-end gap-2 px-6 py-4 border-t"
        :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
      >
        <Button
          variant="secondary"
          @click="close"
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          @click="handleDelete"
        >
          Delete
        </Button>
      </div>
    </div>
  </div>
</template>
