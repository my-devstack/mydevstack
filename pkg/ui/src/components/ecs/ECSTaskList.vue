<script setup lang="ts">
import { ref, toRef } from 'vue'
import { StopIcon, ChevronRightIcon, ChevronDownIcon, PlayIcon } from '@heroicons/vue/24/outline'
import { usePagination } from '@/composables/usePagination'
import { useSettingsStore } from '@/stores/settings'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import type { ECSTask } from '@/api/services/ecs'

const props = defineProps<{
  tasks: ECSTask[]
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  create: []
  stop: [taskArn: string]
}>()

const settingsStore = useSettingsStore()

const {
  currentPage,
  itemsPerPage,
  totalPages,
  paginatedItems,
  goToPage,
  perPageOptions,
} = usePagination(toRef(props, 'tasks'), { defaultPerPage: 10 })

const expanded = ref(new Set<string>())

function toggleExpand(key: string) {
  if (expanded.value.has(key)) {
    expanded.value.delete(key)
  } else {
    expanded.value.add(key)
  }
}

function formatDate(dateString?: string): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString()
}

function taskId(task: ECSTask): string {
  return task.TaskArn || task.TaskDefinitionArn || '-'
}

function shortArn(arn?: string): string {
  if (!arn) return '-'
  return arn.split('/').pop() || arn
}

function statusType(status?: string): string {
  const s = (status || '').toUpperCase()
  if (s === 'RUNNING') return 'active'
  if (s === 'PENDING') return 'pending'
  if (s === 'STOPPED') return 'inactive'
  return 'inactive'
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div
      v-if="loading && tasks.length === 0"
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
      v-else-if="tasks.length === 0"
      icon="server"
      title="No tasks"
      description="Run a task to get started"
      action-label="Run Task"
      @action="emit('create')"
    />

    <div
      v-else
      class="space-y-3"
    >
      <div
        v-for="task in paginatedItems"
        :key="taskId(task)"
        class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
      >
        <div
          class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
          @click="toggleExpand(taskId(task))"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <PlayIcon class="h-5 w-5" />
            </div>
            <div>
              <h3 class="font-medium text-light-text dark:text-dark-text font-mono">
                {{ shortArn(task.TaskArn) }}
              </h3>
              <p class="text-xs text-light-muted dark:text-dark-muted font-mono">
                {{ task.TaskDefinitionArn }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <StatusBadge
              :status="statusType(task.LastStatus)"
              :label="task.LastStatus || 'UNKNOWN'"
            />
            <Button
              v-if="task.LastStatus !== 'STOPPED'"
              variant="ghost"
              size="sm"
              @click.stop="emit('stop', task.TaskArn || '')"
            >
              <template #icon-left>
                <StopIcon class="h-4 w-4" />
              </template>
            </Button>
            <ChevronRightIcon
              v-if="!expanded.has(taskId(task))"
              class="h-5 w-5 text-light-muted dark:text-dark-muted"
            />
            <ChevronDownIcon
              v-else
              class="h-5 w-5 text-light-muted dark:text-dark-muted"
            />
          </div>
        </div>
        <div
          v-if="expanded.has(taskId(task))"
          class="border-t border-light-border dark:border-dark-border p-4"
        >
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Task ARN</label>
              <p class="text-sm text-light-text dark:text-dark-text font-mono break-all">
                {{ task.TaskArn || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Last Status</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ task.LastStatus || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Desired Status</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ task.DesiredStatus || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Launch Type</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ task.LaunchType || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Started By</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ task.StartedBy || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Created</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ formatDate(task.CreatedAt) }}
              </p>
            </div>
          </div>
          <div
            v-if="task.StoppedReason"
            class="mt-4"
          >
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Stopped Reason</label>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ task.StoppedReason }}
            </p>
          </div>
          <div
            v-if="task.Containers && task.Containers.length > 0"
            class="mt-4"
          >
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-2">Containers</label>
            <div class="space-y-2">
              <div
                v-for="(container, idx) in task.Containers"
                :key="idx"
                class="rounded border border-light-border dark:border-dark-border p-3"
              >
                <p class="text-sm font-medium text-light-text dark:text-dark-text">
                  {{ container.Name }}
                </p>
                <p class="text-xs text-light-muted dark:text-dark-muted font-mono">
                  {{ container.Image }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="tasks.length > 0"
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