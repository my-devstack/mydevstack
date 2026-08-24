<script setup lang="ts">
import { ref, toRef } from 'vue'
import { TrashIcon, PencilIcon, ChevronRightIcon, ChevronDownIcon, CloudIcon } from '@heroicons/vue/24/outline'
import { usePagination } from '@/composables/usePagination'
import { useSettingsStore } from '@/stores/settings'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import type { CognitoUserPool } from '@/api/services/cognito'

const props = defineProps<{
  userPools: CognitoUserPool[]
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  create: []
  edit: [userPool: CognitoUserPool]
  delete: [userPoolId: string]
  expand: [userPoolId: string]
}>()

const settingsStore = useSettingsStore()

const {
  currentPage,
  itemsPerPage,
  totalPages,
  paginatedItems,
  goToPage,
  perPageOptions,
} = usePagination(toRef(props, 'userPools'), { defaultPerPage: 10 })

const expandedPools = ref(new Set<string>())

function toggleExpand(userPoolId: string) {
  if (expandedPools.value.has(userPoolId)) {
    expandedPools.value.delete(userPoolId)
  } else {
    expandedPools.value.add(userPoolId)
    emit('expand', userPoolId)
  }
}

function formatDate(dateString?: string): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString()
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div
      v-if="loading && userPools.length === 0"
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
      v-else-if="userPools.length === 0"
      icon="cloud"
      title="No user pools"
      description="Create your first user pool to get started"
      action-label="Create User Pool"
      @action="emit('create')"
    />

    <div
      v-else
      class="space-y-3"
    >
      <div
        v-for="pool in paginatedItems"
        :key="pool.Id"
        class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
      >
        <div
          class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
          @click="toggleExpand(pool.Id)"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
              <CloudIcon class="h-5 w-5" />
            </div>
            <div>
              <h3 class="font-medium text-light-text dark:text-dark-text">
                {{ pool.Name }}
              </h3>
              <p class="text-xs text-light-muted dark:text-dark-muted font-mono">
                {{ pool.Id }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <StatusBadge
              :status="pool.Status === 'Enabled' ? 'active' : 'inactive'"
              :label="pool.Status || 'Unknown'"
            />
            <Button
              variant="ghost"
              size="sm"
              @click.stop="emit('edit', pool)"
            >
              <template #icon-left>
                <PencilIcon class="h-4 w-4" />
              </template>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click.stop="emit('delete', pool.Id)"
            >
              <template #icon-left>
                <TrashIcon class="h-4 w-4" />
              </template>
            </Button>
            <ChevronRightIcon
              v-if="!expandedPools.has(pool.Id)"
              class="h-5 w-5 text-light-muted dark:text-dark-muted"
            />
            <ChevronDownIcon
              v-else
              class="h-5 w-5 text-light-muted dark:text-dark-muted"
            />
          </div>
        </div>
        <div
          v-if="expandedPools.has(pool.Id)"
          class="border-t border-light-border dark:border-dark-border p-4"
        >
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Id</label>
              <p class="text-sm text-light-text dark:text-dark-text font-mono">
                {{ pool.Id }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Name</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ pool.Name }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">ARN</label>
              <p class="text-sm text-light-text dark:text-dark-text font-mono break-all">
                {{ pool.Arn || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Status</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ pool.Status || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Created</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ formatDate(pool.CreationDate) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="userPools.length > 0"
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