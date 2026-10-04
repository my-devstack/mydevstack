<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { usePagination } from '@/composables/usePagination'
import { GlobeAltIcon } from '@heroicons/vue/24/outline'
import type { CloudFrontDistributionSummary } from '@/api/types/aws'
import { localViewerUrl } from '@/api/services/cloudfront'

const props = defineProps<{
  distributions: CloudFrontDistributionSummary[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'edit': [dist: CloudFrontDistributionSummary]
  'delete': [dist: CloudFrontDistributionSummary]
  'invalidate': [dist: CloudFrontDistributionSummary]
  'grant-access': [dist: CloudFrontDistributionSummary]
}>()

const settingsStore = useSettingsStore()

const distributionsRef = toRef(props, 'distributions')
const {
  currentPage,
  itemsPerPage,
  totalPages,
  paginatedItems,
  goToPage,
  perPageOptions,
} = usePagination(distributionsRef, { defaultPerPage: 10 })

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

function getOrigin(dist: CloudFrontDistributionSummary): string {
  const items = dist.Origins?.Items || []
  if (items.length === 0) return '-'
  return items[0].DomainName || '-'
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // ignore
  }
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
      Loading distributions...
    </p>
  </div>

  <div
    v-else-if="distributions.length === 0"
    class="text-center py-12"
  >
    <p
      :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
      class="text-lg"
    >
      No CloudFront distributions found. Create one to get started!
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
      <div class="w-24 flex-shrink-0">
        Status
      </div>
      <div class="flex-1 min-w-[180px]">
        Domain Name
      </div>
      <div class="w-48 flex-shrink-0 hidden md:block">
        Origin
      </div>
      <div class="w-40 flex-shrink-0 hidden lg:block">
        Comment
      </div>
      <div class="w-32 flex-shrink-0 text-right">
        Actions
      </div>
    </div>

    <!-- Rows -->
    <div
      v-for="dist in paginatedItems"
      :key="dist.Id"
      class="border rounded-lg overflow-hidden"
      :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
    >
      <div class="flex px-4 py-3 items-center bg-light-surface dark:bg-dark-surface">
        <div class="w-24 flex-shrink-0">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
            :class="dist.Enabled
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'"
          >
            {{ dist.Enabled ? 'Enabled' : 'Disabled' }}
          </span>
        </div>
        <div class="flex-1 min-w-[180px]">
          <div class="flex items-center gap-2">
            <GlobeAltIcon class="h-4 w-4 text-primary-500 flex-shrink-0" />
            <span class="text-sm text-light-text dark:text-dark-text truncate font-mono">
              {{ dist.DomainName }}
            </span>
          </div>
          <div class="flex items-center gap-1 mt-1">
            <span class="text-xs text-light-muted dark:text-dark-muted font-mono truncate">
              {{ localViewerUrl(dist.Id) }}
            </span>
            <button
              class="p-0.5 rounded hover:bg-light-border dark:hover:bg-dark-border text-light-muted dark:text-dark-muted"
              title="Copy local viewer URL"
              @click="copyToClipboard(localViewerUrl(dist.Id))"
            >
              <svg
                class="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div>
        <div class="w-48 flex-shrink-0 hidden md:block text-light-muted dark:text-dark-muted text-sm truncate font-mono">
          {{ getOrigin(dist) }}
        </div>
        <div class="w-40 flex-shrink-0 hidden lg:block text-light-muted dark:text-dark-muted text-sm truncate">
          {{ dist.Comment || '-' }}
        </div>
        <div class="w-32 flex-shrink-0 flex justify-end gap-1">
          <button
            class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-blue-500"
            title="Edit Distribution"
            @click="emit('edit', dist)"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-amber-500"
            title="Create Invalidation"
            @click="emit('invalidate', dist)"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <button
            class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-green-500"
            title="Grant Bucket Access"
            @click="emit('grant-access', dist)"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </button>
          <button
            class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
            title="Delete Distribution"
            @click="emit('delete', dist)"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
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
