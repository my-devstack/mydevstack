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
  'view-routes': [api: HTTPAPI]
  'view-integrations': [api: HTTPAPI]
  'delete-api': [api: HTTPAPI]
  'create-stage': [api: HTTPAPI]
  'delete-stage': [apiId: string, stageName: string]
  'get-invoke-url': [api: HTTPAPI]
}>()

const settingsStore = useSettingsStore()

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
  <div class="space-y-6">
    <!-- Empty State -->
    <EmptyState
      v-if="!loading && apis.length === 0"
      icon="server"
      title="No HTTP APIs"
      description="Create your first HTTP API to get started."
    />

    <!-- HTTP APIs List -->
    <div
      v-else
      class="space-y-4"
    >
      <!-- Column Headers -->
      <div
        class="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b"
        :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
      >
        <div class="col-span-4">
          Name / API ID
        </div>
        <div class="col-span-4">
          Endpoint
        </div>
        <div class="col-span-2">
          Created
        </div>
        <div class="col-span-2 text-right">
          Actions
        </div>
      </div>

      <div
        v-for="api in apis"
        :key="api.apiId"
        class="border rounded-lg overflow-hidden"
        :class="settingsStore.darkMode ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'"
      >
        <!-- API Header -->
        <div
          class="grid grid-cols-12 gap-4 px-4 py-4 items-center cursor-pointer hover:bg-light-border/50 dark:hover:bg-dark-border/50"
          :class="{ 'border-b': expandedApis.has(api.apiId), 'border-dark-border': settingsStore.darkMode, 'border-light-border': !settingsStore.darkMode }"
          @click="emit('toggle-api', api.apiId)"
        >
          <div class="col-span-4 flex items-center gap-3">
            <svg
              class="w-5 h-5 text-orange-500 transition-transform flex-shrink-0"
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
            <div>
              <div class="font-medium">
                {{ api.name }}
              </div>
              <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-0.5 rounded">{{ api.apiId }}</code>
            </div>
          </div>
          <div class="col-span-4">
            <span
              v-if="api.apiEndpoint"
              class="text-sm text-light-muted dark:text-dark-muted truncate block font-mono"
              :title="api.apiEndpoint"
            >
              {{ api.apiEndpoint }}
            </span>
            <span
              v-else
              class="text-sm text-light-muted dark:text-dark-muted italic"
            >
              No endpoint
            </span>
          </div>
          <div class="col-span-2">
            <span class="text-sm text-light-muted dark:text-dark-muted">
              {{ formatDate(api.createdDate) }}
            </span>
          </div>
          <div class="flex items-center justify-end gap-2">
            <button
              type="button"
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              title="Get Invoke URL"
              @click.stop="emit('get-invoke-url', api)"
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
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </button>
            <button
              type="button"
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              title="View Routes"
              @click.stop="emit('view-routes', api)"
            >
              Routes
            </button>
            <button
              type="button"
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              title="View Integrations"
              @click.stop="emit('view-integrations', api)"
            >
              Integrations
            </button>
            <button
              type="button"
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              title="Create Stage"
              @click.stop="emit('create-stage', api)"
            >
              + Stage
            </button>
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>