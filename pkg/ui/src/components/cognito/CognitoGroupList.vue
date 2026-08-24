<script setup lang="ts">
import { ref, toRef } from 'vue'
import { TrashIcon, PencilIcon, ChevronRightIcon, ChevronDownIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
import { usePagination } from '@/composables/usePagination'
import { useSettingsStore } from '@/stores/settings'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { CognitoGroup } from '@/api/services/cognito'

const props = defineProps<{
  groups: CognitoGroup[]
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  create: []
  edit: [group: CognitoGroup]
  delete: [groupName: string]
  members: [group: CognitoGroup]
  expand: [groupName: string]
}>()

const settingsStore = useSettingsStore()

const {
  currentPage,
  itemsPerPage,
  totalPages,
  paginatedItems,
  goToPage,
  perPageOptions,
} = usePagination(toRef(props, 'groups'), { defaultPerPage: 10 })

const expandedGroups = ref(new Set<string>())

function toggleExpand(groupName: string) {
  if (expandedGroups.value.has(groupName)) {
    expandedGroups.value.delete(groupName)
  } else {
    expandedGroups.value.add(groupName)
    emit('expand', groupName)
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
      v-if="loading && groups.length === 0"
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
      v-else-if="groups.length === 0"
      icon="users"
      title="No groups"
      description="Create your first group to get started"
      action-label="Create Group"
      @action="emit('create')"
    />

    <div
      v-else
      class="space-y-3"
    >
      <div
        v-for="group in paginatedItems"
        :key="group.GroupName"
        class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
      >
        <div
          class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
          @click="toggleExpand(group.GroupName)"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
              <UserGroupIcon class="h-5 w-5" />
            </div>
            <div>
              <h3 class="font-medium text-light-text dark:text-dark-text">
                {{ group.GroupName }}
              </h3>
              <p class="text-xs text-light-muted dark:text-dark-muted">
                {{ group.Description || 'No description' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span
              v-if="group.Precedence !== undefined"
              class="text-xs px-2 py-1 rounded-full bg-light-bg dark:bg-dark-bg text-light-muted dark:text-dark-muted font-mono"
            >
              Precedence: {{ group.Precedence }}
            </span>
            <Button
              variant="ghost"
              size="sm"
              @click.stop="emit('edit', group)"
            >
              <template #icon-left>
                <PencilIcon class="h-4 w-4" />
              </template>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click.stop="emit('members', group)"
            >
              <template #icon-left>
                <UserGroupIcon class="h-4 w-4" />
              </template>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click.stop="emit('delete', group.GroupName)"
            >
              <template #icon-left>
                <TrashIcon class="h-4 w-4" />
              </template>
            </Button>
            <ChevronRightIcon
              v-if="!expandedGroups.has(group.GroupName)"
              class="h-5 w-5 text-light-muted dark:text-dark-muted"
            />
            <ChevronDownIcon
              v-else
              class="h-5 w-5 text-light-muted dark:text-dark-muted"
            />
          </div>
        </div>
        <div
          v-if="expandedGroups.has(group.GroupName)"
          class="border-t border-light-border dark:border-dark-border p-4"
        >
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Group Name</label>
              <p class="text-sm text-light-text dark:text-dark-text font-mono">
                {{ group.GroupName }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Description</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ group.Description || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Precedence</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ group.Precedence ?? '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Role ARN</label>
              <p class="text-sm text-light-text dark:text-dark-text font-mono break-all">
                {{ group.RoleArn || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Created</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ formatDate(group.CreationDate) }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Last Modified</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ formatDate(group.LastModifiedDate) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="groups.length > 0"
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