<script setup lang="ts">
import { toRef } from 'vue'
import { TrashIcon, ServerIcon } from '@heroicons/vue/24/outline'
import { usePagination } from '@/composables/usePagination'
import { useSettingsStore } from '@/stores/settings'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { CognitoResourceServer } from '@/api/services/cognito'

const props = defineProps<{
  resourceServers: CognitoResourceServer[]
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  create: []
  delete: [identifier: string]
}>()

const settingsStore = useSettingsStore()

const {
  currentPage,
  itemsPerPage,
  totalPages,
  paginatedItems,
  goToPage,
  perPageOptions,
} = usePagination(toRef(props, 'resourceServers'), { defaultPerPage: 10 })

function formatDate(dateString?: string): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString()
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div
      v-if="loading && resourceServers.length === 0"
      class="flex items-center justify-center py-12"
    >
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400"
    >
      {{ error }}
    </div>

    <!-- Empty -->
    <EmptyState
      v-else-if="resourceServers.length === 0"
      icon="server"
      title="No resource servers"
      description="Create your first resource server to get started"
      action-label="Create Resource Server"
      @action="emit('create')"
    />

    <div
      v-else
      class="space-y-3"
    >
      <div
        v-for="server in paginatedItems"
        :key="server.Identifier"
        class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
      >
        <div class="flex items-center justify-between p-4">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
              <ServerIcon class="h-5 w-5" />
            </div>
            <div>
              <h3 class="font-medium text-light-text dark:text-dark-text">
                {{ server.Name }}
              </h3>
              <p class="text-xs text-light-muted dark:text-dark-muted font-mono">
                {{ server.Identifier }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span
              v-if="server.Scopes && server.Scopes.length > 0"
              class="text-xs px-2 py-1 rounded-full bg-light-bg dark:bg-dark-bg text-light-muted dark:text-dark-muted font-mono"
            >
              {{ server.Scopes.length }} scopes
            </span>
            <Button
              variant="ghost"
              size="sm"
              @click="emit('delete', server.Identifier)"
            >
              <template #icon-left>
                <TrashIcon class="h-4 w-4" />
              </template>
            </Button>
          </div>
        </div>
        <div class="border-t border-light-border dark:border-dark-border px-4 py-3">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Identifier</label>
              <p class="text-sm text-light-text dark:text-dark-text font-mono break-all">
                {{ server.Identifier }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Name</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ server.Name }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Scopes</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ server.Scopes?.map(s => s.ScopeName).join(', ') || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Last Modified</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ formatDate(server.LastModifiedDate) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="resourceServers.length > 0"
        class="flex flex-wrap items-center justify-between gap-4 py-4"
      >
        <div class="flex items-center gap-2">
          <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
          <select
            v-model="itemsPerPage"
            class="text-sm border rounded px-2 py-1"
            :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
          >
            <option
              v-for="opt in perPageOptions"
              :key="opt"
              :value="opt"
            >
              {{ opt }}
            </option>
          </select>
          <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
        </div>

        <div
          v-if="totalPages > 1"
          class="flex items-center gap-2"
        >
          <button
            class="px-3 py-1 rounded border disabled:opacity-50"
            :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            Previous
          </button>
          <span
            class="text-sm"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button
            class="px-3 py-1 rounded border disabled:opacity-50"
            :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>