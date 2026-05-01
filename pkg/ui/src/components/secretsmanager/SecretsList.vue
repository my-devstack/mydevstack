<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import { TrashIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import type { SecretItem, SecretDetails } from '@/composables/useSecretsManager'

const settingsStore = useSettingsStore()

const props = defineProps<{
  secrets: SecretItem[]
  loading?: boolean
  secretDetailsMap: Record<string, SecretDetails | null>
  expandedSecret: string | null
}>()

const emit = defineEmits<{
  (e: 'view-secret', secret: SecretItem): void
  (e: 'open-delete', name: string): void
  (e: 'toggle-expansion', name: string): void
  (e: 'open-edit', name: string, secretString: string): void
}>()

function handleRowClick(secret: SecretItem) {
  emit('toggle-expansion', secret.Name)
}

function handleDelete(name: string) {
  emit('open-delete', name)
}

function handleEdit(name: string, secretString: string) {
  emit('open-edit', name, secretString)
}

function isExpanded(name: string): boolean {
  return props.expandedSecret === name
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr || 'Unknown'
  }
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div
      v-if="loading"
      class="text-center py-12"
    >
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      <p
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        class="mt-2"
      >
        Loading secrets...
      </p>
    </div>

    <!-- Empty -->
    <div
      v-else-if="secrets.length === 0"
      class="text-center py-12"
    >
      <p
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        class="text-lg"
      >
        No secrets found. Create one to get started!
      </p>
    </div>

    <!-- Accordion List -->
    <div
      v-else
      class="space-y-4"
    >
      <div
        v-for="secret in secrets"
        :key="secret.Name"
        class="border rounded-lg overflow-hidden"
        :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
      >
        <!-- Main Row -->
        <div
          class="grid grid-cols-12 gap-4 px-4 py-4 items-center cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg"
          :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-light-surface'"
          @click="handleRowClick(secret)"
        >
          <div class="col-span-9 flex items-center gap-2">
            <svg
              class="h-5 w-5 text-primary-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <div class="min-w-0">
              <span class="font-medium text-light-text dark:text-dark-text">{{ secret.Name }}</span>
              <p
                v-if="secret.Description"
                class="text-sm truncate"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                {{ secret.Description }}
              </p>
            </div>
          </div>
          <div class="col-span-3 flex items-center justify-end gap-2">
            <button
              type="button"
              aria-label="Delete"
              class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
              @click.stop="handleDelete(secret.Name)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
            <ChevronRightIcon
              class="h-5 w-5 transition-transform"
              :class="isExpanded(secret.Name) ? 'rotate-90' : ''"
            />
          </div>
        </div>

        <!-- Accordion Content -->
        <div
          v-if="isExpanded(secret.Name)"
          class="px-4 pb-4 border-t"
          :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
        >
          <div class="mt-4 space-y-4">
            <!-- Created Date -->
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Created Date</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ formatDate(secret.CreatedDate) }}
              </p>
            </div>

            <!-- Secret Value -->
            <div v-if="secretDetailsMap[secret.Name]">
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Secret Value</label>
              <div
                class="p-4 rounded-lg font-mono text-sm whitespace-pre-wrap break-all"
                :class="settingsStore.darkMode ? 'bg-dark-bg' : 'bg-gray-50'"
              >
                {{ secretDetailsMap[secret.Name]?.secret }}
              </div>
              <div class="mt-2 flex items-center gap-2">
                <button
                  class="px-3 py-1 text-sm text-blue-500 hover:text-blue-700 border border-blue-500 rounded hover:bg-blue-50"
                  @click="handleEdit(secret.Name, secretDetailsMap[secret.Name]?.secret || '')"
                >
                  Edit Value
                </button>
              </div>
            </div>
            <div
              v-else-if="secretDetailsMap[secret.Name] === null"
              class="text-center py-4"
            >
              <p class="text-sm text-light-muted dark:text-dark-muted">
                Failed to load secret value
              </p>
            </div>
            <div
              v-else
              class="text-center py-4"
            >
              <div class="inline-block animate-spin rounded-full h-6 w-6 border-4 border-blue-600 border-t-transparent" />
              <p class="mt-2 text-sm text-light-muted dark:text-dark-muted">
                Loading secret value...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
