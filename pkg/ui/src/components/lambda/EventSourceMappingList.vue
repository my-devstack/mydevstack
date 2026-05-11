<script setup lang="ts">
import { computed, ref } from 'vue'
import { TrashIcon } from '@heroicons/vue/24/outline'
import { useSettingsStore } from '@/stores/settings'
import type { LambdaEventSourceMapping } from '@/api/types/aws'

const props = defineProps<{
  mappings: LambdaEventSourceMapping[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'delete-mapping': [mapping: LambdaEventSourceMapping]
}>()

const settingsStore = useSettingsStore()

function getEventSourceType(arn: string): string {
  if (arn.includes('sqs:')) return 'SQS'
  if (arn.includes('kinesis:')) return 'Kinesis'
  if (arn.includes('dynamodb:')) return 'DynamoDB'
  if (arn.includes('kafka:') || arn.includes('msk:')) return 'MSK'
  return 'Unknown'
}

function getEventSourceIcon(type: string): string {
  switch (type) {
    case 'SQS': return 'queue'
    case 'Kinesis': return 'stream'
    case 'DynamoDB': return 'database'
    case 'MSK': return 'stream'
    default: return 'unknown'
  }
}

function formatState(state: string | undefined): string {
  if (!state) return 'Unknown'
  switch (state) {
    case 'Enabled': return 'Active'
    case 'Disabled': return 'Disabled'
    case 'Creating': return 'Creating...'
    case 'Updating': return 'Updating...'
    case 'Deleting': return 'Deleting...'
    default: return state
  }
}

function getStateColor(state: string | undefined): string {
  if (!state) return 'text-gray-500'
  switch (state) {
    case 'Enabled': return 'text-green-500'
    case 'Disabled': return 'text-yellow-500'
    case 'Creating':
    case 'Updating':
      return 'text-blue-500'
    case 'Deleting': return 'text-red-500'
    default: return 'text-gray-500'
  }
}

const sortedMappings = computed(() => {
  return [...props.mappings].sort((a, b) => {
    return (a.FunctionArn || '').localeCompare(b.FunctionArn || '')
  })
})

// Accordion state
const expandedMappingUUID = ref<string | null>(null)

function toggleExpand(uuid: string) {
  if (expandedMappingUUID.value === uuid) {
    expandedMappingUUID.value = null
  } else {
    expandedMappingUUID.value = uuid
  }
}

function isExpanded(uuid: string): boolean {
  return expandedMappingUUID.value === uuid
}
</script>

<template>
  <div
    v-if="loading"
    class="flex items-center justify-center py-12"
  >
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
  </div>

  <div
    v-else-if="mappings.length === 0"
    class="text-center py-12"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
    <p
      class="text-lg font-medium mb-2"
      :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
    >
      No Event Source Mappings
    </p>
    <p
      class="text-sm"
      :class="settingsStore.darkMode ? 'text-gray-500' : 'text-gray-500'"
    >
      Create a mapping to connect your Lambda to event sources like SQS, Kinesis, or DynamoDB.
    </p>
  </div>

  <div
    v-else
    class="space-y-2"
  >
    <!-- Headers -->
    <div
      class="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b"
      :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
    >
      <div class="col-span-2">
        Function
      </div>
      <div class="col-span-3">
        Event Source
      </div>
      <div class="col-span-2">
        Batch Size
      </div>
      <div class="col-span-2">
        State
      </div>
      <div class="col-span-2 text-right">
        UUID
      </div>
      <div class="col-span-1" />
    </div>

    <!-- Accordion Items -->
    <div
      v-for="mapping in sortedMappings"
      :key="mapping.UUID"
      class="border rounded-lg overflow-hidden"
      :class="[
        settingsStore.darkMode ? 'border-dark-border' : 'border-light-border',
        isExpanded(mapping.UUID) ? 'border-b-0' : ''
      ]"
    >
      <!-- Main Row -->
      <div
        class="grid grid-cols-12 gap-4 px-4 py-3 items-center cursor-pointer bg-light-surface dark:bg-dark-surface hover:bg-light-bg dark:hover:bg-dark-bg"
        :class="{
          'border-b': isExpanded(mapping.UUID),
          'border-dark-border': settingsStore.darkMode,
          'border-light-border': !settingsStore.darkMode
        }"
        @click="toggleExpand(mapping.UUID)"
      >
        <div class="col-span-2 text-sm font-medium truncate">
          <span :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'">
            {{ mapping.FunctionArn?.split(':').pop() || '-' }}
          </span>
        </div>
        <div class="col-span-3 flex items-center gap-2">
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
            :class="[
              getEventSourceType(mapping.EventSourceArn) === 'SQS' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
              getEventSourceType(mapping.EventSourceArn) === 'Kinesis' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
              getEventSourceType(mapping.EventSourceArn) === 'DynamoDB' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            ]"
          >
            {{ getEventSourceType(mapping.EventSourceArn) }}
          </span>
          <span
            class="text-xs truncate"
            :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
            :title="mapping.EventSourceArn"
          >
            {{ mapping.EventSourceArn?.split(':').slice(-1).join(':') || '-' }}
          </span>
        </div>
        <div class="col-span-2">
          <span
            class="text-sm"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >
            {{ mapping.BatchSize || '-' }}
          </span>
        </div>
        <div class="col-span-2">
          <span
            class="text-sm font-medium"
            :class="getStateColor(mapping.State)"
          >
            {{ formatState(mapping.State) }}
          </span>
        </div>
        <div class="col-span-2 text-right">
          <span
            class="text-xs font-mono"
            :class="settingsStore.darkMode ? 'text-gray-500' : 'text-gray-400'"
          >
            {{ mapping.UUID?.substring(0, 8) || '-' }}...
          </span>
        </div>
        <div class="col-span-1 flex justify-end items-center gap-2">
          <button
            type="button"
            aria-label="Delete"
            class="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
            @click.stop="emit('delete-mapping', mapping)"
          >
            <TrashIcon class="h-4 w-4" />
          </button>
          <svg
            class="w-5 h-5 transition-transform flex-shrink-0"
            :class="{ 'rotate-90': isExpanded(mapping.UUID) }"
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
        v-if="isExpanded(mapping.UUID)"
        class="border-t p-4"
        :class="settingsStore.darkMode ? 'border-dark-border bg-dark-bg' : 'border-light-border bg-light-bg'"
      >
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div class="p-3 bg-light-surface dark:bg-dark-surface rounded-lg">
            <h3 class="text-xs font-medium text-light-muted dark:text-dark-muted mb-1">
              UUID
            </h3>
            <p class="text-sm font-mono text-light-text dark:text-dark-text break-all">
              {{ mapping.UUID }}
            </p>
          </div>
          <div class="p-3 bg-light-surface dark:bg-dark-surface rounded-lg">
            <h3 class="text-xs font-medium text-light-muted dark:text-dark-muted mb-1">
              State
            </h3>
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="getStateColor(mapping.State)"
            >
              {{ formatState(mapping.State) }}
            </span>
          </div>
          <div class="p-3 bg-light-surface dark:bg-dark-surface rounded-lg">
            <h3 class="text-xs font-medium text-light-muted dark:text-dark-muted mb-1">
              State Transition Reason
            </h3>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ mapping.StateTransitionReason || 'N/A' }}
            </p>
          </div>
          <div class="p-3 bg-light-surface dark:bg-dark-surface rounded-lg">
            <h3 class="text-xs font-medium text-light-muted dark:text-dark-muted mb-1">
              Starting Position
            </h3>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ mapping.StartingPosition || 'N/A' }}
            </p>
          </div>
          <div class="p-3 bg-light-surface dark:bg-dark-surface rounded-lg">
            <h3 class="text-xs font-medium text-light-muted dark:text-dark-muted mb-1">
              Batch Size
            </h3>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ mapping.BatchSize }}
            </p>
          </div>
          <div class="p-3 bg-light-surface dark:bg-dark-surface rounded-lg">
            <h3 class="text-xs font-medium text-light-muted dark:text-dark-muted mb-1">
              Maximum Batching Window (sec)
            </h3>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ mapping.MaximumBatchingWindowInSeconds ?? 'N/A' }}
            </p>
          </div>
          <div class="p-3 bg-light-surface dark:bg-dark-surface rounded-lg">
            <h3 class="text-xs font-medium text-light-muted dark:text-dark-muted mb-1">
              Parallelization Factor
            </h3>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ mapping.ParallelizationFactor ?? 'N/A' }}
            </p>
          </div>
          <div class="p-3 bg-light-surface dark:bg-dark-surface rounded-lg">
            <h3 class="text-xs font-medium text-light-muted dark:text-dark-muted mb-1">
              Maximum Record Age (sec)
            </h3>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ mapping.MaximumRecordAgeInSeconds ?? 'N/A' }}
            </p>
          </div>
          <div class="p-3 bg-light-surface dark:bg-dark-surface rounded-lg">
            <h3 class="text-xs font-medium text-light-muted dark:text-dark-muted mb-1">
              Bisect on Error
            </h3>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ mapping.BisectBatchOnFunctionError ? 'Enabled' : 'Disabled' }}
            </p>
          </div>
          <div
            v-if="mapping.DestinationConfig?.OnFailure?.Destination"
            class="p-3 bg-light-surface dark:bg-dark-surface rounded-lg col-span-2"
          >
            <h3 class="text-xs font-medium text-light-muted dark:text-dark-muted mb-1">
              DLQ Destination
            </h3>
            <p class="text-sm text-light-text dark:text-dark-text break-all">
              {{ mapping.DestinationConfig.OnFailure.Destination }}
            </p>
          </div>
          <div class="p-3 bg-light-surface dark:bg-dark-surface rounded-lg col-span-2 md:col-span-3">
            <h3 class="text-xs font-medium text-light-muted dark:text-dark-muted mb-1">
              Function ARN
            </h3>
            <p class="text-sm text-light-text dark:text-dark-text break-all">
              {{ mapping.FunctionArn }}
            </p>
          </div>
          <div class="p-3 bg-light-surface dark:bg-dark-surface rounded-lg col-span-2 md:col-span-3">
            <h3 class="text-xs font-medium text-light-muted dark:text-dark-muted mb-1">
              Event Source ARN
            </h3>
            <p class="text-sm text-light-text dark:text-dark-text break-all">
              {{ mapping.EventSourceArn }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>