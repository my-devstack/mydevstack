<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

const props = defineProps<{
  open: boolean
  loading?: boolean
  secretName: string
  secretValue: string
  isEditing?: boolean
  editSecretValue: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:editSecretValue', value: string): void
  (e: 'save'): void
  (e: 'toggle-edit'): void
  (e: 'close'): void
}>()

function handleClose() {
  emit('update:open', false)
  emit('close')
}

function isJson(value: string): boolean {
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
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
        @click="handleClose"
      />

      <!-- Modal -->
      <div
        class="relative bg-light-surface dark:bg-dark-surface rounded-lg shadow-xl max-w-2xl w-full p-6"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        <h3 class="text-lg font-semibold mb-4">
          {{ isEditing ? 'Edit' : 'View' }}: {{ secretName }}
        </h3>

        <!-- Secret Value -->
        <div class="mb-4">
          <div class="flex items-center gap-2 mb-2">
            <label
              class="text-sm font-medium"
              :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
            >
              Secret Value
            </label>
            <span
              v-if="editSecretValue && isJson(editSecretValue)"
              class="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
            >
              JSON
            </span>
          </div>

          <!-- View Mode -->
          <div
            v-if="!isEditing"
            class="p-4 rounded-lg font-mono text-sm whitespace-pre-wrap break-all max-h-64 overflow-y-auto"
            :class="settingsStore.darkMode ? 'bg-dark-bg' : 'bg-gray-50'"
          >
            {{ secretValue }}
          </div>

          <!-- Edit Mode -->
          <textarea
            v-else
            :value="editSecretValue"
            rows="8"
            class="w-full px-3 py-2 rounded-lg border font-mono text-sm"
            :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
            @input="emit('update:editSecretValue', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="settingsStore.darkMode
              ? 'bg-dark-border text-dark-text hover:bg-dark-border/80'
              : 'bg-light-border text-light-text hover:bg-light-border/80'"
            @click="handleClose"
          >
            {{ isEditing ? 'Cancel' : 'Close' }}
          </button>

          <!-- Toggle Edit / Save Buttons -->
          <button
            v-if="!isEditing"
            class="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700"
            @click="emit('toggle-edit')"
          >
            Edit Value
          </button>

          <button
            v-else
            :disabled="loading"
            class="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors bg-green-600 hover:bg-green-700 disabled:opacity-50"
            @click="emit('save')"
          >
            {{ loading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
