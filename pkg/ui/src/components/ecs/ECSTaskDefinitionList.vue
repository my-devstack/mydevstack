<script setup lang="ts">
import { ref, toRef } from 'vue'
import { TrashIcon, ChevronRightIcon, ChevronDownIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import { usePagination } from '@/composables/usePagination'
import { useSettingsStore } from '@/stores/settings'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import type { ECSTaskDefinition } from '@/api/services/ecs'

const props = defineProps<{
  taskDefinitions: ECSTaskDefinition[]
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  create: []
  delete: [taskDefinitionArn: string]
}>()

const settingsStore = useSettingsStore()

const {
  currentPage,
  itemsPerPage,
  totalPages,
  paginatedItems,
  goToPage,
  perPageOptions,
} = usePagination(toRef(props, 'taskDefinitions'), { defaultPerPage: 10 })

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

function displayName(td: ECSTaskDefinition): string {
  if (td.Family) return td.Revision !== undefined ? `${td.Family}:${td.Revision}` : td.Family
  return td.TaskDefinitionArn || '-'
}

function keyOf(td: ECSTaskDefinition): string {
  return td.TaskDefinitionArn || displayName(td)
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div
      v-if="loading && taskDefinitions.length === 0"
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
      v-else-if="taskDefinitions.length === 0"
      icon="document"
      title="No task definitions"
      description="Register your first task definition to get started"
      action-label="Register Task Definition"
      @action="emit('create')"
    />

    <div
      v-else
      class="space-y-3"
    >
      <div
        v-for="td in paginatedItems"
        :key="keyOf(td)"
        class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
      >
        <div
          class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
          @click="toggleExpand(keyOf(td))"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <DocumentTextIcon class="h-5 w-5" />
            </div>
            <div>
              <h3 class="font-medium text-light-text dark:text-dark-text">
                {{ displayName(td) }}
              </h3>
              <p class="text-xs text-light-muted dark:text-dark-muted font-mono">
                {{ td.TaskDefinitionArn }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <StatusBadge
              :status="td.Status === 'ACTIVE' ? 'active' : 'inactive'"
              :label="td.Status || 'UNKNOWN'"
            />
            <Button
              variant="ghost"
              size="sm"
              @click.stop="emit('delete', td.TaskDefinitionArn || keyOf(td))"
            >
              <template #icon-left>
                <TrashIcon class="h-4 w-4" />
              </template>
            </Button>
            <ChevronRightIcon
              v-if="!expanded.has(keyOf(td))"
              class="h-5 w-5 text-light-muted dark:text-dark-muted"
            />
            <ChevronDownIcon
              v-else
              class="h-5 w-5 text-light-muted dark:text-dark-muted"
            />
          </div>
        </div>
        <div
          v-if="expanded.has(keyOf(td))"
          class="border-t border-light-border dark:border-dark-border p-4"
        >
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Family</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ td.Family || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Revision</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ td.Revision ?? '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Status</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ td.Status || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">CPU</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ td.Cpu || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Memory</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ td.Memory || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Registered</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ formatDate(td.RegisteredAt) }}
              </p>
            </div>
          </div>
          <div
            v-if="td.ContainerDefinitions && td.ContainerDefinitions.length > 0"
            class="mt-4"
          >
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-2">Containers</label>
            <div class="space-y-2">
              <div
                v-for="(container, idx) in td.ContainerDefinitions"
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
        v-if="taskDefinitions.length > 0"
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