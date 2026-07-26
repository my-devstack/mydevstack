<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useContentReload } from '@/composables/useContentReload'
import { useRDS } from '@/composables/useRDS'
import {
  PlusIcon,
  TrashIcon,
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
  RDSCreateInstanceModal,
  RDSDeleteModal,
  RDSRebootModal,
  RDSCodeExamples,
} from '@/components/rds'

// Composable
const {
  instances,
  loading,
  expandedInstances,
  showCreateModal,
  showDeleteModal,
  showRebootModal,
  creating,
  rebooting,
  createForm,
  instanceToDelete,
  instanceToReboot,
  loadInstances,
  createInstance,
  deleteInstance,
  rebootInstance,
  toggleInstance,
  confirmDelete,
  confirmReboot,
  getStatus,
} = useRDS()

// Stores
const settingsStore = useSettingsStore()
const { reloadTrigger } = useContentReload()

// Lifecycle
onMounted(() => {
  loadInstances()
})

watch(reloadTrigger, () => {
  loadInstances()
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
            RDS
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ instances.length }} instance{{ instances.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            :loading="loading"
            @click="loadInstances"
          >
            <ArrowPathIcon class="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            @click="showCreateModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Create Instance
          </Button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <EmptyState
        v-if="!loading && instances.length === 0"
        icon="server"
        title="No RDS Instances"
        description="Create a new RDS instance to get started."
        action-label="Create Instance"
        @action="showCreateModal = true"
      />

      <template v-else>
        <div class="space-y-3">
          <div
            v-for="instance in instances"
            :key="instance.DBInstanceIdentifier"
            class="rounded-lg border overflow-hidden"
            :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
          >
            <!-- Accordion Header -->
            <div
              class="p-4 flex items-center justify-between cursor-pointer hover:bg-opacity-50"
              :class="settingsStore.darkMode ? 'hover:bg-dark-hover' : 'hover:bg-light-hover'"
              @click="toggleInstance(instance.DBInstanceIdentifier)"
            >
              <div class="flex items-center gap-3">
                <component
                  :is="expandedInstances.has(instance.DBInstanceIdentifier) ? ChevronDownIcon : ChevronRightIcon"
                  class="h-5 w-5"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                />
                <ServerIcon class="h-5 w-5 text-primary-500" />
                <div>
                  <span
                    class="font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ instance.DBInstanceIdentifier }}
                  </span>
                  <span
                    class="ml-2 text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    {{ instance.Engine }} {{ instance.EngineVersion }}
                  </span>
                </div>
                <StatusBadge
                  :status="getStatus(instance.DBInstanceStatus)"
                  :label="instance.DBInstanceStatus"
                />
              </div>

              <div
                class="flex items-center gap-2"
                @click.stop
              >
                <button
                  type="button"
                  class="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600"
                  title="Reboot"
                  @click="confirmReboot(instance)"
                >
                  <ArrowPathIcon class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                  title="Delete"
                  @click="confirmDelete(instance)"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </div>

            <!-- Accordion Content -->
            <div
              v-if="expandedInstances.has(instance.DBInstanceIdentifier)"
              class="px-4 pb-4 border-t text-sm"
              :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
            >
              <div class="mt-2 grid grid-cols-2 gap-2">
                <span>Class: {{ instance.DBInstanceClass }}</span>
                <span>Engine: {{ instance.Engine }} {{ instance.EngineVersion }}</span>
                <span>Endpoint: {{ instance.Endpoint?.Address || '-' }}:{{ instance.Endpoint?.Port }}</span>
                <span>Storage: {{ instance.AllocatedStorage }}GB</span>
                <span>Multi-AZ: {{ instance.MultiAZ ? 'Yes' : 'No' }}</span>
                <span>Public: {{ instance.PubliclyAccessible ? 'Yes' : 'No' }}</span>
              </div>

              <!-- Connection Details -->
              <div class="mt-4 pt-4 border-t border-light-border dark:border-dark-border">
                <h4 class="font-medium mb-2">
                  Connection Details
                </h4>
                <div class="grid grid-cols-2 gap-2">
                  <span>Username: {{ instance.MasterUsername }}</span>
                  <span>Endpoint: {{ instance.Endpoint?.Address || '-' }}</span>
                  <span>Port: {{ instance.Endpoint?.Port || instance.Port || '-' }}</span>
                  <span>DB Name: {{ instance.DBName || 'N/A' }}</span>
                </div>
                <div class="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                  <div v-if="instance.Engine === 'mysql'">
                    mysql -h {{ instance.Endpoint?.Address }} -P {{ instance.Endpoint?.Port || 3306 }} -u {{ instance.MasterUsername }} -p
                  </div>
                  <div v-else-if="instance.Engine === 'postgres'">
                    psql -h {{ instance.Endpoint?.Address }} -p {{ instance.Endpoint?.Port || 5432 }} -U {{ instance.MasterUsername }} -d {{ instance.DBName || 'postgres' }}
                  </div>
                </div>
              </div>

              <!-- VPC Configuration -->
              <div class="mt-4 pt-4 border-t border-light-border dark:border-dark-border">
                <h4 class="font-medium mb-2">
                  VPC Configuration
                </h4>
                <div class="grid grid-cols-2 gap-2">
                  <template v-if="instance.DBSubnetGroup">
                    <span>DB Subnet Group: {{ instance.DBSubnetGroup.DBSubnetGroupName }}</span>
                    <span>VPC ID: {{ instance.DBSubnetGroup.VpcId }}</span>
                  </template>
                  <template v-if="instance.VpcSecurityGroups && instance.VpcSecurityGroups.length > 0">
                    <div class="col-span-2">
                      <span class="font-medium">Security Groups:</span>
                      <div class="mt-1 space-y-1">
                        <div
                          v-for="sg in instance.VpcSecurityGroups"
                          :key="sg.VpcSecurityGroupId"
                          class="flex items-center gap-2 text-xs"
                        >
                          <span class="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {{ sg.VpcSecurityGroupId }}
                          </span>
                          <span class="text-light-muted dark:text-dark-muted">{{ sg.Status }}</span>
                        </div>
                      </div>
                    </div>
                  </template>
                  <template v-if="!instance.DBSubnetGroup && (!instance.VpcSecurityGroups || instance.VpcSecurityGroups.length === 0)">
                    <span class="col-span-2 text-light-muted dark:text-dark-muted">
                      No VPC configuration available
                    </span>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Usage Examples (always visible) -->
    <div class="flex-shrink-0 p-4 border-t border-light-border dark:border-dark-border">
      <RDSCodeExamples
        region="us-east-1"
        access-key="test"
        secret-key="test"
      />
    </div>

    <!-- Modals -->
    <RDSCreateInstanceModal
      v-model:open="showCreateModal"
      v-model:form="createForm"
      :creating="creating"
      @create="createInstance"
    />

    <RDSDeleteModal
      v-model:open="showDeleteModal"
      :instance="instanceToDelete"
      @delete="deleteInstance"
    />

    <RDSRebootModal
      v-model:open="showRebootModal"
      :instance="instanceToReboot"
      :rebooting="rebooting"
      @reboot="rebootInstance"
    />
  </div>
</template>
