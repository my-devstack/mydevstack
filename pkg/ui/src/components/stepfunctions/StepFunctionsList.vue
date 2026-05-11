<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { TrashIcon, EyeIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'
import StatusBadge from '@/components/common/StatusBadge.vue'
import JsonViewer from '@/components/common/JsonViewer.vue'
import type { StateMachineItem } from '@/composables/useStepFunctions'

const settingsStore = useSettingsStore()

const props = defineProps<{
  stateMachines: StateMachineItem[]
  loading?: boolean
  getDetails?: (arn: string) => Promise<StateMachineItem | null>
}>()

const emit = defineEmits<{
  (e: 'select', machine: StateMachineItem): void
  (e: 'delete', machine: StateMachineItem): void
  (e: 'view-detail', machine: StateMachineItem): void
}>()

const expandedMachine = ref<string | null>(null)
const expandedDetails = ref<Record<string, StateMachineItem>>({})
const loadingDetails = ref<Record<string, boolean>>({})

async function toggleExpansion(arn: string) {
  if (!arn) return
  if (expandedMachine.value === arn) {
    // Collapse
    expandedMachine.value = null
  } else {
    // Expand - load details if not already loaded
    expandedMachine.value = arn
    if (!expandedDetails.value[arn] && props.getDetails && !loadingDetails.value[arn]) {
      loadingDetails.value[arn] = true
      try {
        const details = await props.getDetails(arn)
        if (details) {
          expandedDetails.value[arn] = details
        }
      } finally {
        loadingDetails.value[arn] = false
      }
    }
  }
}

function isExpanded(arn: string): boolean {
  return expandedMachine.value === arn
}

function getExpandedDetails(arn: string): StateMachineItem | undefined {
  // Prefer loaded details, fall back to basic info from stateMachines prop
  if (expandedDetails.value[arn]) {
    return expandedDetails.value[arn]
  }
  return props.stateMachines.find(m => m.stateMachineArn === arn)
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

function tryParseDefinition(definition: string | undefined): string {
  if (!definition) return '-'
  try {
    return JSON.stringify(JSON.parse(definition), null, 2)
  } catch {
    return definition
  }
}

function getStatusType(status: string | undefined): 'active' | 'pending' | 'inactive' {
  const map: Record<string, 'active' | 'pending' | 'inactive'> = {
    ACTIVE: 'active',
    RUNNING: 'pending',
    SUCCEEDED: 'active',
    FAILED: 'inactive',
    TIMED_OUT: 'inactive',
    ABORTED: 'inactive',
  }
  return map[status || ''] || 'inactive'
}

function handleRowClick(machine: StateMachineItem) {
  emit('select', machine)
  toggleExpansion(machine.stateMachineArn)
}

function handleViewDetail(machine: StateMachineItem) {
  emit('view-detail', machine)
}

function handleDelete(machine: StateMachineItem) {
  emit('delete', machine)
}
</script>

<template>
  <div>
    <h2
      class="text-lg font-medium mb-4"
      :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
    >
      State Machines
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
        Loading state machines...
      </p>
    </div>

    <!-- Empty -->
    <div
      v-else-if="stateMachines.length === 0"
      class="text-center py-12"
    >
      <p
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        class="text-lg"
      >
        No state machines found.
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
        <div class="flex-1 min-w-[120px]">
          Name
        </div>
        <div class="w-28 flex-shrink-0">
          Status
        </div>
        <div class="w-28 flex-shrink-0">
          Type
        </div>
        <div class="w-40 flex-shrink-0">
          Created
        </div>
        <div class="w-24 flex-shrink-0 text-right">
          Actions
        </div>
      </div>

      <!-- Rows -->
      <div
        v-for="machine in stateMachines"
        :key="machine.stateMachineArn"
        class="border rounded-lg overflow-hidden"
        :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
      >
        <!-- Main Row -->
        <div
          class="flex px-4 py-3 items-center cursor-pointer bg-light-surface dark:bg-dark-surface hover:bg-light-bg dark:hover:bg-dark-bg"
          :class="{ 'border-b': isExpanded(machine.stateMachineArn), 'border-dark-border': settingsStore.darkMode, 'border-light-border': !settingsStore.darkMode }"
          @click="handleRowClick(machine)"
        >
          <div class="w-8 flex-shrink-0" />
          <div class="flex-1 min-w-[120px] font-medium text-light-text dark:text-dark-text truncate flex items-center gap-2">
            <ArrowTopRightOnSquareIcon class="h-5 w-5 text-primary-500" />
            {{ machine.name }}
          </div>
          <div class="w-28 flex-shrink-0">
            <StatusBadge
              :status="getStatusType(machine.status)"
              :label="machine.status || 'Unknown'"
              size="sm"
            />
          </div>
          <div class="w-28 flex-shrink-0 text-sm text-light-muted dark:text-dark-muted">
            {{ machine.type || 'STANDARD' }}
          </div>
          <div class="w-40 flex-shrink-0 text-light-muted dark:text-dark-muted text-sm truncate">
            {{ formatDate(machine.creationDate) }}
          </div>
          <div class="w-24 flex-shrink-0 flex justify-end gap-1">
            <button
              type="button"
              aria-label="View Detail"
              class="p-1.5 rounded hover:bg-light-border dark:hover:bg-dark-border transition-colors"
              :class="settingsStore.darkMode ? 'text-dark-muted hover:text-dark-text' : 'text-light-muted hover:text-light-text'"
              @click.stop="handleViewDetail(machine)"
            >
              <EyeIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Delete"
              class="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
              @click.stop="handleDelete(machine)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
            <svg
              class="w-5 h-5 transition-transform"
              :class="{ 'rotate-90': isExpanded(machine.stateMachineArn) }"
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
          v-if="isExpanded(machine.stateMachineArn)"
          class="border-t p-4"
          :class="settingsStore.darkMode ? 'border-dark-border bg-dark-bg' : 'border-light-border bg-light-bg'"
        >
          <!-- Loading state -->
          <div
            v-if="loadingDetails[machine.stateMachineArn]"
            class="text-sm py-2"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            Loading details...
          </div>
          <!-- Details -->
          <div v-else>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="col-span-2">
                <span class="font-semibold" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">ARN:</span>
                <span class="ml-2 font-mono text-xs break-all" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">{{ getExpandedDetails(machine.stateMachineArn)?.stateMachineArn }}</span>
              </div>
              <div>
                <span class="font-semibold" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">Description:</span>
                <span class="ml-2" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">{{ getExpandedDetails(machine.stateMachineArn)?.description || '-' }}</span>
              </div>
              <div>
                <span class="font-semibold" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">Created:</span>
                <span class="ml-2" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">{{ formatDate(getExpandedDetails(machine.stateMachineArn)?.creationDate) }}</span>
              </div>
            </div>
            <!-- Definition -->
            <div
              v-if="getExpandedDetails(machine.stateMachineArn)?.definition"
              class="mt-3"
            >
              <span class="font-semibold text-sm" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">Definition:</span>
              <div class="mt-1 max-h-40 overflow-auto rounded border p-2" :class="settingsStore.darkMode ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'">
                <pre class="text-xs font-mono whitespace-pre-wrap" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">{{ tryParseDefinition(getExpandedDetails(machine.stateMachineArn)?.definition) }}</pre>
              </div>
            </div>
            <div class="mt-3 flex gap-2">
              <button
                type="button"
                class="px-3 py-1.5 text-xs font-medium rounded-md bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                @click="handleViewDetail(machine)"
              >
                View Detail
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
