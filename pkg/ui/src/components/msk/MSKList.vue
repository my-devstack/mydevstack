<script setup lang="ts">
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useSettingsStore } from '@/stores/settings'
import Button from '@/components/common/Button.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import MSKClusterDetails from './MSKClusterDetails.vue'
import type { MSKClusterSummary, MSKClusterDetails as MSKClusterDetailsType } from '@/composables/useMSK'

const settingsStore = useSettingsStore()

const props = defineProps<{
  clusters: MSKClusterSummary[]
  isLoading: boolean
  expandedCluster: string | null
  clusterDetails: Record<string, MSKClusterDetailsType>
  clusterBrokers: Record<string, string[]>
  columns: { key: string; label: string; sortable: boolean }[]
}>()

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'delete', cluster: MSKClusterSummary): void
  (e: 'expand', arn: string): void
}>()

function getStatusBadge(status: string): 'active' | 'pending' | 'inactive' | 'error' {
  const statusMap: Record<string, 'active' | 'pending' | 'inactive' | 'error'> = {
    ACTIVE: 'active',
    CREATING: 'pending',
    DELETING: 'pending',
    UPDATING: 'pending',
  }
  return statusMap[status] || 'inactive'
}
</script>

<template>
  <div>
    <div
      v-if="!isLoading && clusters.length === 0"
      class="mb-6"
    >
      <EmptyState
        icon="folder"
        title="No MSK Clusters"
        description="Create your first MSK cluster to start using Amazon Managed Streaming for Apache Kafka."
        @action="emit('create')"
      />
    </div>

    <div
      v-else
      class="space-y-3"
    >
      <div
        v-for="cluster in clusters"
        :key="cluster.ClusterArn"
        class="border rounded-lg overflow-hidden"
        :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
      >
        <!-- Accordion Header -->
        <div
          class="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
          :class="[
            settingsStore.darkMode ? 'bg-dark-surface hover:bg-dark-bg' : 'bg-light-surface hover:bg-light-bg',
            expandedCluster === cluster.ClusterArn ? (settingsStore.darkMode ? 'bg-dark-bg' : 'bg-light-bg') : ''
          ]"
          @click="emit('expand', cluster.ClusterArn)"
        >
          <div class="flex items-center gap-3 min-w-0">
            <component
              :is="expandedCluster === cluster.ClusterArn ? ChevronDownIcon : ChevronRightIcon"
              class="h-5 w-5 flex-shrink-0 text-light-muted dark:text-dark-muted"
            />
            <div class="min-w-0">
              <p
                class="font-medium truncate"
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
              >
                {{ cluster.ClusterName }}
              </p>
              <p
                class="text-xs truncate"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                {{ cluster.ClusterArn }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3 flex-shrink-0">
            <div class="hidden sm:flex items-center gap-4 text-sm">
              <span
                class="text-light-muted dark:text-dark-muted"
              >
                {{ cluster.KafkaVersion || '-' }}
              </span>
              <span
                class="text-light-muted dark:text-dark-muted"
              >
                {{ cluster.NumberOfBrokerNodes || 0 }} brokers
              </span>
            </div>
            <StatusBadge
              :status="getStatusBadge(cluster.State)"
              :label="cluster.State"
            />
            <button
              class="p-1.5 rounded text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              title="Delete cluster"
              @click.stop="emit('delete', cluster)"
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

        <!-- Accordion Content -->
        <div
          v-if="expandedCluster === cluster.ClusterArn"
          class="border-t"
          :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
        >
          <MSKClusterDetails
            :cluster-arn="cluster.ClusterArn"
            :details="clusterDetails[cluster.ClusterArn]"
            :brokers="clusterBrokers[cluster.ClusterArn] || []"
          />
        </div>
      </div>
    </div>
  </div>
</template>
