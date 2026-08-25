<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { usePagination } from '@/composables/usePagination'
import { CubeIcon } from '@heroicons/vue/24/outline'
import type { ECRRepository } from '@/api/types/aws'

const props = defineProps<{
  repositories: ECRRepository[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'view-repository': [repo: ECRRepository]
  'delete-repository': [repo: ECRRepository]
}>()

const settingsStore = useSettingsStore()

const repositoriesRef = toRef(props, 'repositories')
const {
  currentPage,
  itemsPerPage,
  totalPages,
  paginatedItems,
  goToPage,
  perPageOptions,
} = usePagination(repositoriesRef, { defaultPerPage: 10 })

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
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
      Loading repositories...
    </p>
  </div>

  <div
    v-else-if="repositories.length === 0"
    class="text-center py-12"
  >
    <p
      :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
      class="text-lg"
    >
      No ECR repositories found. Create one to get started!
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
      <div class="flex-1 min-w-[120px]">
        Repository Name
      </div>
      <div class="w-64 flex-shrink-0 hidden md:block">
        Repository URI
      </div>
      <div class="w-40 flex-shrink-0 hidden lg:block">
        Created
      </div>
      <div class="w-24 flex-shrink-0">
        Mutability
      </div>
      <div class="w-16 flex-shrink-0 text-right">
        Actions
      </div>
    </div>

    <!-- Rows -->
    <div
      v-for="repo in paginatedItems"
      :key="repo.RepositoryName"
      class="border rounded-lg overflow-hidden"
      :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
    >
      <div
        class="flex px-4 py-3 items-center cursor-pointer bg-light-surface dark:bg-dark-surface hover:bg-light-bg dark:hover:bg-dark-bg"
        @click="emit('view-repository', repo)"
      >
        <div class="flex-1 min-w-[120px] font-medium text-light-text dark:text-dark-text truncate flex items-center gap-2">
          <CubeIcon class="h-5 w-5 text-primary-500" />
          {{ repo.RepositoryName }}
        </div>
        <div class="w-64 flex-shrink-0 hidden md:block text-light-muted dark:text-dark-muted truncate font-mono text-sm">
          {{ repo.RepositoryUri || '-' }}
        </div>
        <div class="w-40 flex-shrink-0 hidden lg:block text-light-muted dark:text-dark-muted text-sm truncate">
          {{ formatDate(repo.CreatedAt) }}
        </div>
        <div class="w-24 flex-shrink-0 text-light-muted dark:text-dark-muted text-sm">
          {{ repo.ImageTagMutability || 'MUTABLE' }}
        </div>
        <div class="w-16 flex-shrink-0 flex justify-end gap-1">
          <button
            class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
            title="Delete"
            @click.stop="emit('delete-repository', repo)"
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