<script setup lang="ts">
import { ref, toRef } from 'vue'
import { TrashIcon, ChevronRightIcon, ChevronDownIcon, CogIcon } from '@heroicons/vue/24/outline'
import { usePagination } from '@/composables/usePagination'
import { useSettingsStore } from '@/stores/settings'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import type { ECSService } from '@/api/services/ecs'

const props = defineProps<{
  services: ECSService[]
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  create: []
  delete: [serviceName: string]
}>()

const settingsStore = useSettingsStore()

const {
  currentPage,
  itemsPerPage,
  totalPages,
  paginatedItems,
  goToPage,
  perPageOptions,
} = usePagination(toRef(props, 'services'), { defaultPerPage: 10 })

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

function keyOf(service: ECSService): string {
  return service.ServiceArn || service.ServiceName || '-'
}

function statusType(status?: string): string {
  const s = (status || '').toUpperCase()
  if (s === 'ACTIVE') return 'active'
  if (s === 'DRAINING' || s === 'INACTIVE') return 'inactive'
  return 'inactive'
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div
      v-if="loading && services.length === 0"
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
      v-else-if="services.length === 0"
      icon="server"
      title="No services"
      description="Create your first ECS service to get started"
      action-label="Create Service"
      @action="emit('create')"
    />

    <div
      v-else
      class="space-y-3"
    >
      <div
        v-for="service in paginatedItems"
        :key="keyOf(service)"
        class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
      >
        <div
          class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
          @click="toggleExpand(keyOf(service))"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
              <CogIcon class="h-5 w-5" />
            </div>
            <div>
              <h3 class="font-medium text-light-text dark:text-dark-text">
                {{ service.ServiceName || service.ServiceArn }}
              </h3>
              <p class="text-xs text-light-muted dark:text-dark-muted font-mono">
                {{ service.ServiceArn }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <StatusBadge
              :status="statusType(service.Status)"
              :label="service.Status || 'UNKNOWN'"
            />
            <Button
              variant="ghost"
              size="sm"
              @click.stop="emit('delete', service.ServiceName || service.ServiceArn || '')"
            >
              <template #icon-left>
                <TrashIcon class="h-4 w-4" />
              </template>
            </Button>
            <ChevronRightIcon
              v-if="!expanded.has(keyOf(service))"
              class="h-5 w-5 text-light-muted dark:text-dark-muted"
            />
            <ChevronDownIcon
              v-else
              class="h-5 w-5 text-light-muted dark:text-dark-muted"
            />
          </div>
        </div>
        <div
          v-if="expanded.has(keyOf(service))"
          class="border-t border-light-border dark:border-dark-border p-4"
        >
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Service Name</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ service.ServiceName || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Status</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ service.Status || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Desired Count</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ service.DesiredCount ?? '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Running Count</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ service.RunningCount ?? '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Launch Type</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ service.LaunchType || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Task Definition</label>
              <p class="text-sm text-light-text dark:text-dark-text font-mono break-all">
                {{ service.TaskDefinition || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Scheduling Strategy</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ service.SchedulingStrategy || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Created</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ formatDate(service.CreatedAt) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="services.length > 0"
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