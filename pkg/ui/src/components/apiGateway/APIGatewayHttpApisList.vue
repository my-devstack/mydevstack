<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import EmptyState from '@/components/common/EmptyState.vue'

interface HTTPAPI {
  apiId: string
  name: string
  apiEndpoint?: string
  createdDate?: string
}

const props = defineProps<{
  apis: HTTPAPI[]
  loading?: boolean
  expandedApis: Set<string>
}>()

const emit = defineEmits<{
  'toggle-api': [apiId: string]
  'view-api': [api: HTTPAPI]
  'delete-api': [api: HTTPAPI]
}>()

const settingsStore = useSettingsStore()
</script>

<template>
  <div class="space-y-4">
    <EmptyState
      v-if="!loading && apis.length === 0"
      icon="server"
      title="No HTTP APIs"
      description="Create your first HTTP API to get started."
    />

    <div
      v-for="api in apis"
      :key="api.apiId"
      class="border rounded-lg overflow-hidden"
      :class="settingsStore.darkMode ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'"
    >
      <div
        class="flex px-4 py-3 items-center cursor-pointer hover:bg-light-border/30 dark:hover:bg-dark-border/30"
        :class="{ 'border-b': expandedApis.has(api.apiId), 'border-dark-border': settingsStore.darkMode, 'border-light-border': !settingsStore.darkMode }"
        @click="emit('toggle-api', api.apiId)"
      >
        <div class="w-8 flex-shrink-0" />
        <div class="flex-1 min-w-[100px] font-medium text-light-text dark:text-dark-text truncate">
          {{ api.name }}
        </div>
        <div class="w-48 flex-shrink-0 text-light-muted dark:text-dark-muted truncate text-xs">
          {{ api.apiId }}
        </div>
        <div class="w-24 flex-shrink-0 text-light-muted dark:text-dark-muted">
          {{ api.apiEndpoint || '-' }}
        </div>
        <div class="w-16 flex-shrink-0 flex justify-end gap-1">
          <button
            type="button"
            class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
            title="Delete"
            @click.stop="emit('delete-api', api)"
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
          <svg
            class="w-5 h-5 transition-transform"
            :class="{ 'rotate-90': expandedApis.has(api.apiId) }"
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

      <div
        v-if="expandedApis.has(api.apiId)"
        class="border-t p-4"
        :class="settingsStore.darkMode ? 'border-dark-border bg-dark-bg' : 'border-light-border bg-light-bg'"
      >
        <p class="text-sm text-light-muted dark:text-dark-muted">
          Endpoint: <code class="bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ api.apiEndpoint || 'N/A' }}</code>
        </p>
      </div>
    </div>
  </div>
</template>