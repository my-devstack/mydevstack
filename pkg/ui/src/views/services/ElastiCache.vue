<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useContentReload } from '@/composables/useContentReload'
import { useElastiCache } from '@/composables/useElastiCache'
import {
  PlusIcon,
  ArrowPathIcon,
  ServerIcon,
  CircleStackIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline'
import Button from '@/components/common/Button.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import {
  ElastiCacheCreateGroupModal,
  ElastiCacheDeleteModal,
  ElastiCacheCodeExamples,
} from '@/components/elasticache'

// Composable
const {
  groups,
  loading,
  expandedGroups,
  showCreateModal,
  showDeleteConfirm,
  groupToDelete,
  codeExamples,
  loadGroups,
  deleteGroup,
  toggleGroup,
  confirmDelete,
  getStatus,
  createGroup,
  createForm,
  creating,
} = useElastiCache()

// Stores
const settingsStore = useSettingsStore()
const { reloadTrigger } = useContentReload()

// Lifecycle
onMounted(() => {
  loadGroups()
})

watch(reloadTrigger, () => {
  loadGroups()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <CircleStackIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            ElastiCache
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ groups.length }} group{{ groups.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            :loading="loading"
            @click="loadGroups"
          >
            <ArrowPathIcon class="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            @click="showCreateModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Create Group
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Empty State -->
      <EmptyState
        v-if="!loading && groups.length === 0"
        icon="server"
        title="No Replication Groups"
        description="Create a new Valkey/Redis replication group to get started."
        action-label="Create Group"
        @action="showCreateModal = true"
      />
      
      <!-- Group List as Accordions -->
      <template v-else>
        <div class="space-y-3">
          <div
            v-for="group in groups"
            :key="group.ReplicationGroupId"
            class="rounded-lg border overflow-hidden"
            :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
          >
            <!-- Accordion Header -->
            <div
              class="p-4 flex items-center justify-between cursor-pointer hover:bg-opacity-50"
              :class="settingsStore.darkMode ? 'hover:bg-dark-hover' : 'hover:bg-light-hover'"
              @click="toggleGroup(group.ReplicationGroupId)"
            >
              <div class="flex items-center gap-3">
                <component
                  :is="expandedGroups.has(group.ReplicationGroupId) ? ChevronDownIcon : ChevronRightIcon"
                  class="h-5 w-5"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                />
                <ServerIcon class="h-5 w-5 text-primary-500" />
                <div>
                  <span
                    class="font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ group.ReplicationGroupId }}
                  </span>
                  <span
                    class="ml-2 text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    {{ group.Engine }} {{ group.EngineVersion }}
                  </span>
                </div>
                <StatusBadge
                  :status="getStatus(group.Status)"
                  :label="group.Status"
                />
              </div>
              
              <div
                class="flex items-center gap-2"
                @click.stop
              >
                <button
                  type="button"
                  class="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                  title="Delete"
                  @click="confirmDelete(group)"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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
            
            <!-- Accordion Content -->
            <div
              v-if="expandedGroups.has(group.ReplicationGroupId)"
              class="px-4 pb-4 border-t"
              :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
            >
              <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Node Type
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ group.CacheNodeType || '-' }}
                  </p>
                </div>
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Node Groups
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ group.NodeGroups?.length || 1 }}
                  </p>
                </div>
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Primary Port
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ group.NodeGroups?.[0]?.PrimaryEndpoint?.Port || 6379 }}
                  </p>
                </div>
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Description
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ group.ReplicationGroupDescription || '-' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Modals -->
    <ElastiCacheCreateGroupModal
      v-model:open="showCreateModal"
      v-model:form="createForm"
      :creating="creating"
      @create="createGroup"
    />

    <ElastiCacheDeleteModal
      v-model:open="showDeleteConfirm"
      :group="groupToDelete"
      @delete="deleteGroup"
    />

    <!-- Code Examples -->
    <ElastiCacheCodeExamples :examples="codeExamples" />
  </div>
</template>