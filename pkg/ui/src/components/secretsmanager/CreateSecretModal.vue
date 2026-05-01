<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

const props = defineProps<{
  open: boolean
  creating?: boolean
  newSecretName: string
  newSecretValue: string
  newSecretDescription: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:newSecretName', value: string): void
  (e: 'update:newSecretValue', value: string): void
  (e: 'update:newSecretDescription', value: string): void
  (e: 'create'): void
}>()

function handleClose() {
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
        @click="handleClose"
      />

      <!-- Modal -->
      <div
        class="relative bg-light-surface dark:bg-dark-surface rounded-lg shadow-xl max-w-lg w-full p-6"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        <h3 class="text-lg font-semibold mb-4">
          Create Secret
        </h3>

        <div class="space-y-4">
          <!-- Secret Name -->
          <div>
            <label
              class="block text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
            >
              Secret Name *
            </label>
            <input
              :value="newSecretName"
              type="text"
              placeholder="my-secret"
              class="w-full px-3 py-2 rounded-lg border"
              :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
              @input="emit('update:newSecretName', ($event.target as HTMLInputElement).value)"
            >
          </div>

          <!-- Secret Value -->
          <div>
            <label
              class="block text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
            >
              Secret Value * (JSON or plain text)
            </label>
            <textarea
              :value="newSecretValue"
              rows="4"
              placeholder="{&quot;username&quot;: &quot;admin&quot;, &quot;password&quot;: &quot;secret123&quot;}"
              class="w-full px-3 py-2 rounded-lg border font-mono text-sm"
              :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
              @input="emit('update:newSecretValue', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>

          <!-- Description -->
          <div>
            <label
              class="block text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
            >
              Description (optional)
            </label>
            <input
              :value="newSecretDescription"
              type="text"
              placeholder="Database credentials for production"
              class="w-full px-3 py-2 rounded-lg border"
              :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
              @input="emit('update:newSecretDescription', ($event.target as HTMLInputElement).value)"
            >
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-3 mt-6">
          <button
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="settingsStore.darkMode
              ? 'bg-dark-border text-dark-text hover:bg-dark-border/80'
              : 'bg-light-border text-light-text hover:bg-light-border/80'"
            @click="handleClose"
          >
            Cancel
          </button>
          <button
            :disabled="!newSecretName.trim() || !newSecretValue.trim() || creating"
            class="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            @click="emit('create')"
          >
            {{ creating ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
