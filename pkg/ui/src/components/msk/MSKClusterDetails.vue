<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import StatusBadge from '@/components/common/StatusBadge.vue'
import type { MSKClusterDetails as MSKClusterDetailsType } from '@/composables/useMSK'

const settingsStore = useSettingsStore()

const props = defineProps<{
  clusterArn: string
  details: MSKClusterDetailsType | undefined | null
  brokers: string[]
}>()

function formatTime(timeStr: string | undefined): string {
  if (!timeStr) return '-'
  try {
    return new Date(timeStr).toLocaleString()
  } catch {
    return timeStr
  }
}

function getBrokerString(brokers: string[]): string {
  if (brokers.length === 0) return 'Not available'
  return brokers.join(', ')
}
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Cluster Info Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <p
          class="text-xs font-medium uppercase tracking-wider"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Cluster ARN
        </p>
        <p
          class="text-sm font-mono break-all"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          {{ clusterArn }}
        </p>
      </div>
      <div>
        <p
          class="text-xs font-medium uppercase tracking-wider"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          State
        </p>
        <div class="mt-0.5">
          <StatusBadge
            v-if="details?.State"
            :status="details.State === 'ACTIVE' ? 'active' : details.State === 'CREATING' ? 'pending' : 'inactive'"
            :label="details.State"
          />
          <span
            v-else
            class="text-sm text-light-muted dark:text-dark-muted"
          >Loading...</span>
        </div>
      </div>
      <div>
        <p
          class="text-xs font-medium uppercase tracking-wider"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Current Version
        </p>
        <p
          class="text-sm font-medium"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          {{ details?.CurrentVersion || '-' }}
        </p>
      </div>
      <div>
        <p
          class="text-xs font-medium uppercase tracking-wider"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Created
        </p>
        <p
          class="text-sm font-medium"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          {{ formatTime(details?.CreationTime) }}
        </p>
      </div>
      <div>
        <p
          class="text-xs font-medium uppercase tracking-wider"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Brokers
        </p>
        <p
          class="text-sm font-medium"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          {{ details?.NumberOfBrokerNodes ?? '-' }}
        </p>
      </div>
    </div>

    <!-- Boostrap Brokers -->
    <div
      v-if="brokers.length > 0"
      class="border-t pt-4"
      :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
    >
      <h4
        class="text-sm font-semibold mb-2"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        Bootstrap Brokers
      </h4>
      <p
        class="text-sm font-mono"
        :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
      >
        {{ getBrokerString(brokers) }}
      </p>
    </div>

    <!-- Provisioned Info -->
    <div
      v-if="details?.Provisioned"
      class="border-t pt-4"
      :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
    >
      <h4
        class="text-sm font-semibold mb-2"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        Provisioned Details
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p
            class="text-xs font-medium uppercase tracking-wider"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            Instance Type
          </p>
          <p
            class="text-sm font-medium"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ details.Provisioned?.BrokerNodeGroupInfo?.InstanceType || '-' }}
          </p>
        </div>
        <div>
          <p
            class="text-xs font-medium uppercase tracking-wider"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            Storage per Broker
          </p>
          <p
            class="text-sm font-medium"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ details.Provisioned?.BrokerNodeGroupInfo?.StorageInfo?.EbsStorageInfo?.VolumeSize || '-' }} GB
          </p>
        </div>
        <div>
          <p
            class="text-xs font-medium uppercase tracking-wider"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            Client Subnets
          </p>
          <p
            class="text-sm font-mono"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ details.Provisioned?.BrokerNodeGroupInfo?.ClientSubnets?.join(', ') || '-' }}
          </p>
        </div>
        <div>
          <p
            class="text-xs font-medium uppercase tracking-wider"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            Security Groups
          </p>
          <p
            class="text-sm font-mono"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ details.Provisioned?.BrokerNodeGroupInfo?.SecurityGroups?.join(', ') || '-' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div
      v-if="!details"
      class="py-8 text-center"
    >
      <svg
        class="animate-spin h-6 w-6 mx-auto text-primary-500"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <p
        class="mt-2 text-sm"
        :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
      >
        Loading cluster details...
      </p>
    </div>
  </div>
</template>
