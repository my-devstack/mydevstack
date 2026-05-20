<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import EmptyState from '@/components/common/EmptyState.vue'

interface HTTPAPI {
  apiId: string
  name: string
  protocolType?: string
  description?: string
}

const props = defineProps<{
  apis: HTTPAPI[]
  loading?: boolean
  expandedApis: Set<string>
  stages?: Record<string, any[]>
  routes?: Record<string, any[]>
  routeTargets?: Record<string, Record<string, string>>
  integrations?: Record<string, any[]>
}>()

const emit = defineEmits<{
  'toggle-api': [apiId: string]
  'view-api': [api: HTTPAPI]
  'edit-api': [api: HTTPAPI]
  'delete-api': [api: HTTPAPI]
  'get-invoke-url': [api: HTTPAPI]
  'create-route': [api: HTTPAPI]
  'edit-route': [route: any, apiId: string]
  'delete-route': [route: any]
  'create-integration': [api: HTTPAPI]
  'edit-integration': [integration: any]
  'delete-integration': [integration: any]
  'create-stage': [api: HTTPAPI]
  'edit-stage': [stage: any, apiId: string]
  'delete-stage': [stage: any]
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

    <template v-else>
      <div
        class="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b"
        :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
      >
        <div class="col-span-2">
          NAME / ID
        </div>
        <div class="col-span-2">
          PROTOCOL
        </div>
        <div class="col-span-5">
          DESCRIPTION
        </div>
        <div class="col-span-3 text-right">
          ACTIONS
        </div>
      </div>

      <div
        v-for="api in apis"
        :key="api.apiId"
        class="border rounded-lg overflow-hidden"
        :class="settingsStore.darkMode ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'"
      >
        <div
          class="grid grid-cols-12 gap-4 px-4 py-3 items-center cursor-pointer hover:bg-light-border/30 dark:hover:bg-dark-border/30"
          :class="{ 'border-b': expandedApis.has(api.apiId), 'border-dark-border': settingsStore.darkMode, 'border-light-border': !settingsStore.darkMode }"
          @click="emit('toggle-api', api.apiId)"
        >
          <div class="col-span-2 flex items-center gap-2">
            <span class="font-medium text-light-text dark:text-dark-text truncate">{{ api.name }}</span>
            <span class="text-light-muted dark:text-dark-muted text-xs shrink-0">({{ api.apiId }})</span>
          </div>
          <div class="col-span-2 text-light-muted dark:text-dark-muted">
            {{ api.protocolType || 'HTTP' }}
          </div>
          <div class="col-span-5 text-light-muted dark:text-dark-muted truncate">
            {{ api.description || 'No description' }}
          </div>
          <div class="col-span-3 flex justify-end gap-2 items-center">
            <button
              type="button"
              class="p-1.5 rounded hover:bg-light-border dark:hover:bg-dark-border"
              title="Get Invoke URL"
              @click.stop="emit('get-invoke-url', api)"
            >
              <svg
                class="w-4 h-4 text-gray-600 dark:text-gray-300"
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
              class="p-1.5 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
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
              class="w-4 h-4 text-light-muted dark:text-dark-muted transition-transform"
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
          class="border-t p-4 space-y-4"
          :class="settingsStore.darkMode ? 'border-dark-border bg-dark-bg' : 'border-light-border bg-light-bg'"
        >
          <div class="flex justify-between items-center">
            <h4
              class="text-sm font-semibold uppercase tracking-wider"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Routes
            </h4>
            <button
              type="button"
              class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              @click.stop="emit('create-route', api)"
            >
              Create Route
            </button>
          </div>

          <div
            v-if="routes?.[api.apiId]?.length"
            class="space-y-2"
          >
            <div
              class="hidden md:grid grid-cols-12 gap-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b"
              :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
            >
              <div class="col-span-6">
                ROUTE KEY
              </div>
              <div class="col-span-3">
                TARGET
              </div>
              <div class="col-span-3 text-right">
                ACTIONS
              </div>
            </div>
            <div
              v-for="route in routes[api.apiId]"
              :key="route.routeId"
              class="grid grid-cols-12 gap-4 px-3 py-2 items-center border-b"
              :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
            >
              <div class="col-span-6 text-light-text dark:text-dark-text">
                {{ route.routeKey }}
              </div>
              <div class="col-span-3 text-light-muted dark:text-dark-muted text-xs">
                {{ routeTargets?.[api.apiId]?.[route.routeId] || '-' }}
              </div>
              <div class="col-span-3 flex justify-end gap-2">
                <button
                  type="button"
                  class="p-1 rounded text-red-500 hover:bg-light-border dark:hover:bg-dark-border"
                  title="Delete"
                  @click.stop="emit('delete-route', route)"
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
          <div
            v-else
            class="text-light-muted dark:text-dark-muted text-sm"
          >
            No routes yet.
          </div>

          <div class="flex justify-between items-center">
            <h4
              class="text-sm font-semibold uppercase tracking-wider"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Integrations
            </h4>
            <button
              type="button"
              class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              @click.stop="emit('create-integration', api)"
            >
              Create Integration
            </button>
          </div>

          <div
            v-if="integrations?.[api.apiId]?.length"
            class="space-y-2"
          >
            <div
              class="hidden md:grid grid-cols-12 gap-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b"
              :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
            >
              <div class="col-span-3">
                INTEGRATION ID
              </div>
              <div class="col-span-3">
                TYPE
              </div>
              <div class="col-span-3">
                URI
              </div>
              <div class="col-span-3 text-right">
                ACTIONS
              </div>
            </div>
            <div
              v-for="integration in integrations[api.apiId]"
              :key="integration.integrationId"
              class="grid grid-cols-12 gap-4 px-3 py-2 items-center border-b"
              :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
            >
              <div class="col-span-3 text-light-text dark:text-dark-text text-xs">
                {{ integration.integrationId }}
              </div>
              <div class="col-span-3 text-light-muted dark:text-dark-muted text-xs">
                {{ integration.integrationType }}
              </div>
              <div class="col-span-3 text-light-muted dark:text-dark-muted text-xs truncate">
                {{ integration.integrationUri }}
              </div>
              <div class="col-span-3 flex justify-end gap-2">
                <button
                  type="button"
                  class="p-1 rounded text-red-500 hover:bg-light-border dark:hover:bg-dark-border"
                  title="Delete"
                  @click.stop="emit('delete-integration', integration)"
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
          <div
            v-else
            class="text-light-muted dark:text-dark-muted text-sm"
          >
            No integrations yet.
          </div>

          <div class="flex justify-between items-center">
            <h4
              class="text-sm font-semibold uppercase tracking-wider"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Stages
            </h4>
            <button
              type="button"
              class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              @click.stop="emit('create-stage', api)"
            >
              Create Stage
            </button>
          </div>

          <div
            v-if="stages?.[api.apiId]?.length"
            class="space-y-2"
          >
            <div
              class="hidden md:grid grid-cols-12 gap-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b"
              :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
            >
              <div class="col-span-3">
                STAGE NAME
              </div>
              <div class="col-span-3">
                AUTO DEPLOY
              </div>
              <div class="col-span-3">
                DESCRIPTION
              </div>
              <div class="col-span-3 text-right">
                ACTIONS
              </div>
            </div>
            <div
              v-for="stage in stages[api.apiId]"
              :key="stage.stageName"
              class="grid grid-cols-12 gap-4 px-3 py-2 items-center border-b"
              :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
            >
              <div class="col-span-3 text-light-text dark:text-dark-text">
                {{ stage.stageName }}
              </div>
              <div class="col-span-3 text-light-muted dark:text-dark-muted">
                {{ stage.autoDeploy ? 'Yes' : 'No' }}
              </div>
              <div class="col-span-3 text-light-muted dark:text-dark-muted">
                -
              </div>
              <div class="col-span-3 flex justify-end gap-2">
                <button
                  type="button"
                  class="p-1 rounded text-red-500 hover:bg-light-border dark:hover:bg-dark-border"
                  title="Delete"
                  @click.stop="emit('delete-stage', stage)"
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
          <div
            v-else
            class="text-light-muted dark:text-dark-muted text-sm"
          >
            No stages yet.
          </div>
        </div>
      </div>
    </template>
  </div>
</template>