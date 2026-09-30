<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { usePagination } from '@/composables/usePagination'
import type { CloudFrontInvalidation } from '@/api/types/aws'

const props = defineProps<{
  invalidations: CloudFrontInvalidation[]
  loading?: boolean
}>()

const settingsStore = useSettingsStore()

const invalidationsRef = toRef(props, 'invalidations')
const {
  currentPage,
  itemsPerPage,
  totalPages,
  paginatedItems,
  goToPage,
  perPageOptions,
} = usePagination(invalidationsRef, { defaultPerPage: 10 })

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

function getPaths(invalidation: CloudFrontInvalidation): string {
  const items = invalidation.InvalidationBatch?.Paths?.Items || []
  return items.join(', ') || '/*'
}
</script>

<template>
  <div
    v-if="loading"
    class="text-center py-12"
  >
    <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
    <p
      :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
      class="mt-2"
    >
      Loading invalidations...
    </p>
  </div>

  <div
    v-else-if="invalidations.length === 0"
    class="text-center py-12"
  >
    <p
      :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
      class="text-lg"
    >
      No invalidations found.
    </p>
  </div>

  <div
    v-else
    class="space-y-4"
  >
    <!-- Headers -->
    <div
      class="flex px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b"
      :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
    >
      <div class="w-32 flex-shrink-0">
        ID
      </div>
      <div class="w-24 flex-shrink-0">
        Status
      </div>
      <div class="flex-1 min-w-[200px]">
        Paths
      </div>
      <div class="w-48 flex-shrink-0 hidden md:block">
        Created
      </div>
    </div>

    <!-- Rows -->
    <div
      v-for="inv in paginatedItems"
      :key="inv.Id"
      class="border rounded-lg overflow-hidden"
      :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
    >
      <div class="flex px-4 py-3 items-center bg-light-surface dark:bg-dark-surface">
        <div class="w-32 flex-shrink-0 text-sm text-light-text dark:text-dark-text font-mono truncate">
          {{ inv.Id }}
        </div>
        <div class="w-24 flex-shrink-0">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
            :class="inv.Status === 'Completed'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'"
          >
            {{ inv.Status }}
          </span>
        </div>
        <div class="flex-1 min-w-[200px] text-sm text-light-muted dark:text-dark-muted truncate font-mono">
          {{ getPaths(inv) }}
        </div>
        <div class="w-48 flex-shrink-0 hidden md:block text-light-muted dark:text-dark-muted text-sm truncate">
          {{ formatDate(inv.CreateTime) }}
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="flex flex-wrap items-center justify-between gap-4 py-4">
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
</template>
