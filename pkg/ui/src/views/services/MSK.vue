<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ArrowPathIcon, PlusIcon } from '@heroicons/vue/24/outline'
import Button from '@/components/common/Button.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useSettingsStore } from '@/stores/settings'
import { usePagination } from '@/composables/usePagination'
import { useContentReload } from '@/composables/useContentReload'
import { useMSK } from '@/composables/useMSK'
import {
  MSKList,
  MSKCreateClusterModal,
  MSKDeleteClusterModal,
} from '@/components/msk'
import CodeSnippet from '@/components/common/CodeSnippet.vue'

const settingsStore = useSettingsStore()

const {
  // state
  isLoading, clusters, isAvailable,
  showCreateModal, showDeleteModal, clusterToDelete,
  expandedCluster, clusterDetails, clusterBrokers, newCluster,
  // computed
  clusterColumns, clusterCount, codeExamples,
  // functions
  loadClusters, toggleCluster, createCluster, openDeleteModal, confirmDeleteCluster,
} = useMSK()

const { reloadTrigger } = useContentReload()

// Pagination via composable
const {
  currentPage: clusterPage,
  itemsPerPage: clustersPerPage,
  totalPages: totalClusterPages,
  paginatedItems: paginatedClusters,
  goToPage,
  perPageOptions,
} = usePagination(clusters, { defaultPerPage: 10 })

onMounted(() => {
  loadClusters()
})

watch(reloadTrigger, () => {
  loadClusters()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <svg
            class="h-6 w-6 text-light-text dark:text-dark-text"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125m1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M18 5.625v5.25m0-5.25c0 .621.504 1.125 1.125 1.125M18 5.625c0-.621.504-1.125 1.125-1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M6 5.625v5.25m0-5.25c0 .621.504 1.125 1.125 1.125M6 5.625C6 5.004 5.496 4.5 4.875 4.5m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 5.496 4.5 4.875 4.5m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125"
            />
          </svg>
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            MSK
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            Amazon Managed Streaming for Apache Kafka
          </span>
          <span
            v-if="clusters.length > 0"
            class="text-sm text-light-muted dark:text-dark-muted"
          >
            {{ clusters.length }} cluster{{ clusters.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            :loading="isLoading"
            @click="loadClusters"
          >
            <ArrowPathIcon class="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            :disabled="!isAvailable"
            @click="showCreateModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Create Cluster
          </Button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <!-- Unavailable message -->
      <div
        v-if="!isAvailable && !isLoading"
        class="mb-6 p-4 rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20"
      >
        <div class="flex items-center gap-3">
          <svg
            class="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div>
            <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              MSK is not available in this environment
            </p>
            <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-0.5">
              The MSK API is not supported by the current emulator. Some features may not work until a compatible backend is available.
            </p>
          </div>
        </div>
      </div>

      <MSKList
        :clusters="paginatedClusters"
        :is-loading="isLoading"
        :expanded-cluster="expandedCluster"
        :cluster-details="clusterDetails"
        :cluster-brokers="clusterBrokers"
        :columns="clusterColumns"
        @create="showCreateModal = true"
        @delete="openDeleteModal"
        @expand="toggleCluster"
      />

      <!-- Pagination -->
      <div
        v-if="clusters.length > 0 && !isLoading"
        class="flex flex-wrap items-center justify-between gap-4 py-4"
      >
        <div class="flex items-center gap-2">
          <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
          <select
            v-model="clustersPerPage"
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
          v-if="totalClusterPages > 1"
          class="flex items-center gap-2"
        >
          <button
            class="px-3 py-1 rounded border disabled:opacity-50"
            :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
            :disabled="clusterPage === 1"
            @click="goToPage(clusterPage - 1)"
          >
            Previous
          </button>
          <span
            class="text-sm"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            Page {{ clusterPage }} of {{ totalClusterPages }}
          </span>
          <button
            class="px-3 py-1 rounded border disabled:opacity-50"
            :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
            :disabled="clusterPage === totalClusterPages"
            @click="goToPage(clusterPage + 1)"
          >
            Next
          </button>
        </div>
      </div>

      <MSKCreateClusterModal
        :open="showCreateModal"
        :is-loading="isLoading"
        :new-cluster="newCluster"
        @update:open="showCreateModal = $event"
        @create="createCluster"
        @update:new-cluster="newCluster = $event"
      />

      <MSKDeleteClusterModal
        :open="showDeleteModal"
        :is-loading="isLoading"
        :cluster="clusterToDelete"
        @update:open="showDeleteModal = $event"
        @confirm="confirmDeleteCluster"
      />

      <!-- Usage Examples -->
      <div class="mt-8">
        <CodeSnippet
          title="Usage Examples"
          :snippets="codeExamples"
          default-tab="aws-cli"
          :disable-highlight="true"
        />
      </div>
    </div>
  </div>
</template>
