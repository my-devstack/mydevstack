<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { TrashIcon, KeyIcon, EyeIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import StatusBadge from '@/components/common/StatusBadge.vue'
import SSMParameterDetails from '@/components/ssm/SSMParameterDetails.vue'
import type { SSMParameterItem } from '@/composables/useSSM'

const settingsStore = useSettingsStore()

const props = defineProps<{
  parameters: SSMParameterItem[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', param: SSMParameterItem): void
  (e: 'view-value', param: SSMParameterItem): void
  (e: 'view-history', param: SSMParameterItem): void
  (e: 'delete', param: SSMParameterItem): void
}>()

const expandedParam = ref<string | null>(null)

function toggleExpansion(name: string) {
  expandedParam.value = expandedParam.value === name ? null : name
}

function isExpanded(name: string): boolean {
  return expandedParam.value === name
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

function getParamTypeStatus(type: string): 'active' | 'pending' | 'inactive' {
  const typeMap: Record<string, 'active' | 'pending' | 'inactive'> = {
    String: 'active',
    StringList: 'active',
    SecureString: 'warning',
  }
  return typeMap[type] || 'inactive'
}

function handleRowClick(param: SSMParameterItem) {
  emit('select', param)
  toggleExpansion(param.Name)
}

function handleViewValue(param: SSMParameterItem) {
  emit('view-value', param)
}

function handleViewHistory(param: SSMParameterItem) {
  emit('view-history', param)
}

function handleDelete(param: SSMParameterItem) {
  emit('delete', param)
}
</script>

<template>
  <div>
    <h2
      class="text-lg font-medium mb-4"
      :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
    >
      Parameters
    </h2>

    <!-- Loading -->
    <div
      v-if="loading"
      class="text-center py-12"
    >
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      <p
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        class="mt-2"
      >
        Loading parameters...
      </p>
    </div>

    <!-- Empty -->
    <div
      v-else-if="parameters.length === 0"
      class="text-center py-12"
    >
      <p
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        class="text-lg"
      >
        No parameters found.
      </p>
    </div>

    <!-- Accordion List -->
    <div
      v-else
      class="space-y-4"
    >
      <!-- Headers -->
      <div
        class="flex px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b"
        :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
      >
        <div class="w-8 flex-shrink-0" />
        <div class="flex-1 min-w-[100px]">
          Name
        </div>
        <div class="w-32 flex-shrink-0">
          Type
        </div>
        <div class="w-20 flex-shrink-0">
          Version
        </div>
        <div class="w-24 flex-shrink-0">
          Tier
        </div>
        <div class="w-36 flex-shrink-0">
          Last Modified
        </div>
        <div class="w-20 flex-shrink-0 text-right">
          Actions
        </div>
      </div>

      <!-- Rows -->
      <div
        v-for="param in parameters"
        :key="param.Name"
        class="border rounded-lg overflow-hidden"
        :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
      >
        <!-- Main Row -->
        <div
          class="flex px-4 py-3 items-center cursor-pointer bg-light-surface dark:bg-dark-surface hover:bg-light-bg dark:hover:bg-dark-bg"
          :class="{ 'border-b': isExpanded(param.Name), 'border-dark-border': settingsStore.darkMode, 'border-light-border': !settingsStore.darkMode }"
          @click="handleRowClick(param)"
        >
          <div class="w-8 flex-shrink-0" />
          <div class="flex-1 min-w-[100px] font-medium text-light-text dark:text-dark-text truncate flex items-center gap-2">
            <KeyIcon class="h-5 w-5 text-primary-500" />
            {{ param.Name }}
          </div>
          <div class="w-32 flex-shrink-0">
            <StatusBadge
              :status="getParamTypeStatus(param.Type)"
              :label="param.Type"
              size="sm"
            />
          </div>
          <div class="w-20 flex-shrink-0 text-sm text-light-muted dark:text-dark-muted">
            v{{ param.Version || 1 }}
          </div>
          <div class="w-24 flex-shrink-0 text-sm capitalize text-light-muted dark:text-dark-muted">
            {{ param.Tier || 'Standard' }}
          </div>
          <div class="w-36 flex-shrink-0 text-light-muted dark:text-dark-muted text-sm truncate">
            {{ formatDate(param.LastModifiedDate) }}
          </div>
          <div class="w-20 flex-shrink-0 flex justify-end gap-1">
            <button
              type="button"
              aria-label="View Value"
              class="p-1.5 rounded hover:bg-light-border dark:hover:bg-dark-border transition-colors"
              :class="settingsStore.darkMode ? 'text-dark-muted hover:text-dark-text' : 'text-light-muted hover:text-light-text'"
              @click.stop="handleViewValue(param)"
            >
              <EyeIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="View History"
              class="p-1.5 rounded hover:bg-light-border dark:hover:bg-dark-border transition-colors"
              :class="settingsStore.darkMode ? 'text-dark-muted hover:text-dark-text' : 'text-light-muted hover:text-light-text'"
              @click.stop="handleViewHistory(param)"
            >
              <ArrowPathIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Delete"
              class="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
              @click.stop="handleDelete(param)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
            <svg
              class="w-5 h-5 transition-transform"
              :class="{ 'rotate-90': isExpanded(param.Name) }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>

        <!-- Accordion Content -->
        <div
          v-if="isExpanded(param.Name)"
          class="border-t p-4"
          :class="settingsStore.darkMode ? 'border-dark-border bg-dark-bg' : 'border-light-border bg-light-bg'"
        >
          <SSMParameterDetails
            :parameter="param"
            @view-value="handleViewValue(param)"
            @view-history="handleViewHistory(param)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
