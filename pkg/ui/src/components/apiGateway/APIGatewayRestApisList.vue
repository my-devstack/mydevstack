<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

interface APIGatewayRestAPI {
  id: string
  name: string
  description?: string
  createdDate?: string
}

interface Resource {
  id: string
  path: string
  pathPart: string
}

interface Method {
  AuthorizationType?: string
  authorizationType?: string
  ApiKeyRequired?: boolean
  apiKeyRequired?: boolean
  integrationUri?: string
  integrationType?: string
  methodIntegration?: string
  Type?: string
  Uri?: string
  HttpMethod?: string
}

const props = defineProps<{
  apis: APIGatewayRestAPI[]
  resources: Resource[]
  loading?: boolean
  loadingResources?: boolean
  expandedApis: Set<string>
  expandedResources: Set<string>
  resourceMethodsMap: Record<string, Record<string, Method>>
  resourceMethodsLoading: Record<string, boolean>
  deployments?: any[]
  stages?: any[]
}>()

const emit = defineEmits<{
  'toggle-api': [apiId: string]
  'toggle-resource': [resourceId: string]
  'view-api': [api: APIGatewayRestAPI]
  'edit-api': [api: APIGatewayRestAPI]
  'delete-api': [api: APIGatewayRestAPI]
  'create-resource': [api: APIGatewayRestAPI, parent?: Resource]
  'add-method': [resource: Resource, api: APIGatewayRestAPI]
  'delete-resource': [resource: Resource]
  'setup-integration': [method: string, resource: Resource]
  'view-integration': [method: string, resource: Resource, integration: any]
  'delete-method': [method: string, resource: Resource]
  'create-deployment': [api: APIGatewayRestAPI]
  'delete-deployment': [apiId: string, deploymentId: string]
  'create-stage': [api: APIGatewayRestAPI]
  'delete-stage': [apiId: string, stageName: string]
  'get-invoke-url': [api: APIGatewayRestAPI]
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
      title="No REST APIs"
      description="Create your first REST API to get started."
    />

    <!-- APIs List -->
    <div
      v-else
      class="space-y-4"
    >
      <!-- Column Headers -->
      <div
        class="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b"
        :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
      >
        <div class="col-span-5">
          Name / ID
        </div>
        <div class="col-span-4">
          Description
        </div>
        <div class="col-span-3 text-right">
          Actions
        </div>
      </div>

      <div
        v-for="api in apis"
        :key="api.id"
        class="border rounded-lg overflow-hidden"
        :class="settingsStore.darkMode ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'"
      >
        <!-- API Header - Match old style with chevron -->
        <div
          class="grid grid-cols-12 gap-4 px-4 py-3 items-center cursor-pointer hover:bg-light-border/30 dark:hover:bg-dark-border/30"
          :class="{ 'border-b': expandedApis.has(api.id), 'border-dark-border': settingsStore.darkMode, 'border-light-border': !settingsStore.darkMode }"
          @click="emit('toggle-api', api.id)"
        >
          <div class="col-span-5 flex items-center gap-2">
            <span class="font-medium text-light-text dark:text-dark-text truncate">{{ api.name }}</span>
            <span class="text-light-muted dark:text-dark-muted text-xs shrink-0">({{ api.id }})</span>
          </div>
          <div class="col-span-4 text-light-muted dark:text-dark-muted truncate">
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
              class="p-1.5 rounded hover:bg-light-border dark:hover:bg-dark-border"
              title="View Details"
              @click.stop="emit('view-api', api)"
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
            <button
              type="button"
              class="p-1.5 rounded hover:bg-light-border dark:hover:bg-dark-border"
              title="Edit"
              @click.stop="emit('edit-api', api)"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              type="button"
              class="p-1.5 rounded hover:bg-light-border dark:hover:bg-dark-border"
              title="Delete"
              @click.stop="emit('delete-api', api)"
            >
              <svg
                class="w-4 h-4 text-red-500"
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
            <!-- Chevron -->
            <svg
              class="w-4 h-4 text-light-muted dark:text-dark-muted transition-transform"
              :class="expandedApis.has(api.id) ? 'rotate-90' : ''"
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

        <!-- Expanded Resources Section -->
        <div
          v-if="expandedApis.has(api.id)"
          class="border-t p-4"
          :class="settingsStore.darkMode ? 'border-dark-border bg-dark-bg' : 'border-light-border bg-light-bg'"
        >
          <!-- Resources Header -->
          <div class="flex justify-between items-center mb-4">
            <h4
              class="text-sm font-medium"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Resources
            </h4>
            <button
              type="button"
              class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              @click.stop="emit('create-resource', api, resources?.[0])"
            >
              + Create Resource
            </button>
          </div>

          <!-- Loading -->
          <div
            v-if="loadingResources"
            class="flex justify-center py-4"
          >
            <LoadingSpinner />
          </div>

          <!-- Resources List -->
          <div
            v-else-if="resources.length > 0"
            class="space-y-2"
          >
            <!-- Resources Column Headers -->
            <div
              class="hidden md:grid grid-cols-12 gap-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b"
              :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
            >
              <div class="col-span-6">
                Resource Path
              </div>
              <div class="col-span-3">
                Methods
              </div>
              <div class="col-span-3 text-right">
                Actions
              </div>
            </div>

            <div
              v-for="resource in resources"
              :key="resource.id"
              class="border rounded-lg overflow-hidden"
              :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
            >
              <!-- Resource Header -->
              <div
                class="grid grid-cols-12 gap-4 px-3 py-3 items-center cursor-pointer hover:bg-light-border/30 dark:hover:bg-dark-border/30"
                :class="{ 'border-b': expandedResources.has(resource.id), 'border-dark-border': settingsStore.darkMode, 'border-light-border': !settingsStore.darkMode }"
                @click="emit('toggle-resource', resource.id)"
              >
                <div class="col-span-6 flex items-center gap-2">
                  <svg
                    class="w-4 h-4 text-blue-500 transition-transform flex-shrink-0"
                    :class="{ 'rotate-0': !expandedResources.has(resource.id) }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  <span class="font-mono text-sm">{{ resource.path }}</span>
                  <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-0.5 rounded">{{ resource.pathPart }}</code>
                </div>
                <div class="col-span-3">
                  <span
                    v-if="resourceMethodsMap[resource.id] && Object.keys(resourceMethodsMap[resource.id]).length > 0"
                    class="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    {{ Object.keys(resourceMethodsMap[resource.id]).join(', ') }}
                  </span>
                </div>
                <div class="col-span-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    class="px-2 py-1 text-xs rounded hover:bg-light-border dark:hover:bg-dark-border"
                    title="Add Method"
                    @click.stop="emit('add-method', resource, api)"
                  >
                    + Method
                  </button>
                  <button
                    type="button"
                    class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
                    title="Delete"
                    @click.stop="emit('delete-resource', resource)"
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

              <!-- Expanded Methods -->
              <div
                v-if="expandedResources.has(resource.id) && (resourceMethodsLoading[resource.id] || (resourceMethodsMap[resource.id] && Object.keys(resourceMethodsMap[resource.id]).length > 0))"
                class="border-t p-3"
                :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
              >
                <div
                  v-if="resourceMethodsLoading[resource.id]"
                  class="flex justify-center py-2"
                >
                  <LoadingSpinner />
                </div>

                <div
                  v-else-if="resourceMethodsMap[resource.id] && Object.keys(resourceMethodsMap[resource.id]).length > 0"
                  class="space-y-2"
                >
                  <div
                    v-for="(methodDetails, method) in resourceMethodsMap[resource.id]"
                    :key="method"
                    class="flex items-center justify-between p-2 rounded bg-light-border/30 dark:bg-dark-border/30"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="px-2 py-0.5 text-xs font-bold rounded"
                        :class="{
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': method === 'GET',
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': method === 'POST',
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': method === 'PUT',
                          'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200': method === 'PATCH',
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': method === 'DELETE',
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200': !['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method as string),
                        }"
                      >
                        {{ method }}
                      </span>
                      <span class="text-xs text-light-muted dark:text-dark-muted">
                        Auth: {{ methodDetails?.AuthorizationType || methodDetails?.authorizationType || 'NONE' }}
                      </span>
                      <span
                        v-if="methodDetails?.ApiKeyRequired || methodDetails?.apiKeyRequired"
                        class="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      >
                        API Key
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <!-- Integration Info (always visible) -->
                      <button
                        v-if="methodDetails?.integrationType || methodDetails?.Type || methodDetails?.integrationUri || methodDetails?.Uri"
                        type="button"
                        class="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800"
                        :title="`Type: ${methodDetails?.integrationType || methodDetails?.Type}\nURI: ${methodDetails?.integrationUri || methodDetails?.Uri}\nMethod: ${methodDetails?.methodIntegration || methodDetails?.HttpMethod}`"
                        @click.stop="emit('view-integration', method as string, resource, methodDetails)"
                      >
                        {{ methodDetails?.integrationType || methodDetails?.Type || 'INT' }}
                      </button>
                      <span
                        v-else
                        class="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                      >
                        No INT
                      </span>
                      <button
                        type="button"
                        class="px-2 py-1 text-xs rounded hover:bg-light-border dark:hover:bg-dark-border"
                        title="Setup Integration"
                        @click.stop="emit('setup-integration', method as string, resource)"
                      >
                        Integration
                      </button>
                      <button
                        type="button"
                        class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
                        title="Delete Method"
                        @click.stop="emit('delete-method', method as string, resource)"
                      >
                        <svg
                          class="w-3 h-3"
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
          </div>

          <!-- Deployments Section -->
          <div
            class="mt-4 pt-4 border-t"
            :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
          >
            <div class="flex justify-between items-center mb-3">
              <h4
                class="text-sm font-medium"
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
              >
                Deployments
              </h4>
              <button
                type="button"
                class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                @click.stop="emit('create-deployment', api)"
              >
                + Create Deployment
              </button>
            </div>
            <div
              v-if="deployments && deployments.length > 0"
              class="space-y-2"
            >
              <div
                v-for="deployment in deployments"
                :key="deployment.id"
                class="flex items-center justify-between p-2 rounded bg-light-border/30 dark:bg-dark-border/30"
              >
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-mono">{{ deployment.id }}</span>
                    <span
                      v-if="deployment.description"
                      class="text-xs text-light-muted dark:text-dark-muted"
                    >
                      {{ deployment.description }}
                    </span>
                  </div>
                  <span class="text-xs text-light-muted dark:text-dark-muted">
                    Created: {{ formatDate(deployment.createdDate) }}
                  </span>
                </div>
                <button
                  type="button"
                  class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
                  title="Delete Deployment"
                  @click.stop="emit('delete-deployment', api.id, deployment.id)"
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
            <div
              v-else
              class="text-sm text-light-muted dark:text-dark-muted"
            >
              No deployments found for this API.
            </div>
          </div>

          <!-- Stages Section -->
          <div
            class="mt-4 pt-4 border-t"
            :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
          >
            <div class="flex justify-between items-center mb-3">
              <h4
                class="text-sm font-medium"
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
              >
                Stages
              </h4>
              <button
                type="button"
                class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                @click.stop="emit('create-stage', api)"
              >
                + Create Stage
              </button>
            </div>
            <div
              v-if="stages && stages.length > 0"
              class="space-y-2"
            >
              <div
                v-for="stage in stages"
                :key="stage.stageName"
                class="flex items-center justify-between p-2 rounded bg-light-border/30 dark:bg-dark-border/30"
              >
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-mono">{{ stage.stageName }}</span>
                    <span
                      v-if="stage.description"
                      class="text-xs text-light-muted dark:text-dark-muted"
                    >
                      {{ stage.description }}
                    </span>
                  </div>
                  <span class="text-xs text-light-muted dark:text-dark-muted">
                    Deployment: {{ stage.deploymentId || 'N/A' }}
                  </span>
                </div>
                <button
                  type="button"
                  class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
                  title="Delete Stage"
                  @click.stop="emit('delete-stage', api.id, stage.stageName)"
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
            <div
              v-else
              class="text-sm text-light-muted dark:text-dark-muted"
            >
              No stages found for this API.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>