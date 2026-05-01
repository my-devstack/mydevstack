<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

const props = defineProps<{
  open: boolean
  loading?: boolean
  secretToDelete: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
}>()

function handleConfirm() {
  emit('confirm')
  emit('update:open', false)
}

function handleCancel() {
  emit('update:open', false)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50"
        @click="handleCancel"
      />

      <!-- Modal -->
      <div
        class="relative bg-light-surface dark:bg-dark-surface rounded-lg shadow-xl max-w-md w-full p-6"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        <h3 class="text-lg font-semibold mb-4">
          Delete Secret
        </h3>

        <p
          class="text-sm mb-6"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Are you sure you want to delete secret <strong>{{ secretToDelete }}</strong>? This action cannot be undone.
        </p>

        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="settingsStore.darkMode
              ? 'bg-dark-border text-dark-text hover:bg-dark-border/80'
              : 'bg-light-border text-light-text hover:bg-light-border/80'"
            @click="handleCancel"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors bg-red-500 hover:bg-red-600 disabled:opacity-50"
            :disabled="loading"
            @click="handleConfirm"
          >
            {{ loading ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
