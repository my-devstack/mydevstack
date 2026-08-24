<script setup lang="ts">
import { ref, toRef } from 'vue'
import { TrashIcon, PencilIcon, ChevronRightIcon, ChevronDownIcon, UserIcon, KeyIcon, BeakerIcon } from '@heroicons/vue/24/outline'
import { usePagination } from '@/composables/usePagination'
import { useSettingsStore } from '@/stores/settings'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import type { CognitoUser } from '@/api/services/cognito'

const props = defineProps<{
  users: CognitoUser[]
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  create: []
  edit: [user: CognitoUser]
  delete: [username: string]
  'reset-password': [user: CognitoUser]
  'test-login': [user: CognitoUser]
  expand: [username: string]
}>()

const settingsStore = useSettingsStore()

const {
  currentPage,
  itemsPerPage,
  totalPages,
  paginatedItems,
  goToPage,
  perPageOptions,
} = usePagination(toRef(props, 'users'), { defaultPerPage: 10 })

const expandedUsers = ref(new Set<string>())

function toggleExpand(username: string) {
  if (expandedUsers.value.has(username)) {
    expandedUsers.value.delete(username)
  } else {
    expandedUsers.value.add(username)
    emit('expand', username)
  }
}

function formatDate(dateString?: string): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString()
}

function getAttribute(user: CognitoUser, name: string): string {
  return user.UserAttributes?.find((a) => a.Name === name)?.Value || '-'
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div
      v-if="loading && users.length === 0"
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
      v-else-if="users.length === 0"
      icon="user"
      title="No users"
      description="Create your first user to get started"
      action-label="Create User"
      @action="emit('create')"
    />

    <div
      v-else
      class="space-y-3"
    >
      <div
        v-for="user in paginatedItems"
        :key="user.Username"
        class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
      >
        <div
          class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
          @click="toggleExpand(user.Username)"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <UserIcon class="h-5 w-5" />
            </div>
            <div>
              <h3 class="font-medium text-light-text dark:text-dark-text">
                {{ user.Username }}
              </h3>
              <p class="text-xs text-light-muted dark:text-dark-muted">
                {{ getAttribute(user, 'email') }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <StatusBadge
              :status="user.UserStatus === 'CONFIRMED' ? 'active' : 'pending'"
              :label="user.UserStatus || 'Unknown'"
            />
            <StatusBadge
              :status="user.Enabled ? 'active' : 'inactive'"
              :label="user.Enabled ? 'Enabled' : 'Disabled'"
            />
            <Button
              variant="ghost"
              size="sm"
              @click.stop="emit('edit', user)"
            >
              <template #icon-left>
                <PencilIcon class="h-4 w-4" />
              </template>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click.stop="emit('reset-password', user)"
            >
              <template #icon-left>
                <KeyIcon class="h-4 w-4" />
              </template>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click.stop="emit('test-login', user)"
            >
              <template #icon-left>
                <BeakerIcon class="h-4 w-4" />
              </template>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click.stop="emit('delete', user.Username)"
            >
              <template #icon-left>
                <TrashIcon class="h-4 w-4" />
              </template>
            </Button>
            <ChevronRightIcon
              v-if="!expandedUsers.has(user.Username)"
              class="h-5 w-5 text-light-muted dark:text-dark-muted"
            />
            <ChevronDownIcon
              v-else
              class="h-5 w-5 text-light-muted dark:text-dark-muted"
            />
          </div>
        </div>
        <div
          v-if="expandedUsers.has(user.Username)"
          class="border-t border-light-border dark:border-dark-border p-4"
        >
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Username</label>
              <p class="text-sm text-light-text dark:text-dark-text font-mono">
                {{ user.Username }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Status</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ user.UserStatus || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Enabled</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ user.Enabled ? 'Yes' : 'No' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Created</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ formatDate(user.UserCreateDate) }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Last Modified</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ formatDate(user.UserLastModifiedDate) }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Email</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ getAttribute(user, 'email') }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Phone</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ getAttribute(user, 'phone_number') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="users.length > 0"
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