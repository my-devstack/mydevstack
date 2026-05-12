<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import StatusBadge from '@/components/common/StatusBadge.vue'
import JsonViewer from '@/components/common/JsonViewer.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import type { StateMachineItem } from '@/composables/useStepFunctions'

const settingsStore = useSettingsStore()

const props = defineProps<{
  stateMachine: StateMachineItem | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

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

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

function hasValidDefinition(stateMachine: StateMachineItem | null): boolean {
  if (!stateMachine?.definition) return false
  // Check if definition is an error object from API response
  if (typeof stateMachine.definition === 'object' && 'error' in stateMachine.definition) {
    return false
  }
  return true
}

function tryParseDefinition(definition: string | undefined): object | string {
  if (!definition) return { error: 'No definition available' }
  // Don't pass error objects to JsonViewer
  if (typeof definition === 'object' && 'error' in definition) {
    return { error: 'No definition available' }
  }
  try {
    return JSON.parse(definition)
  } catch {
    return definition
  }
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div
      v-if="loading"
      class="text-center py-12"
    >
      <LoadingSpinner size="lg" />
      <p
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        class="mt-2"
      >
        Loading state machine details...
      </p>
    </div>

    <!-- Error: null machine -->
    <div
      v-else-if="!stateMachine"
      class="text-center py-12"
    >
      <p
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        class="text-lg"
      >
        No state machine selected.
      </p>
    </div>

    <!-- Detail Content -->
    <div v-else>
      <!-- Back button -->
      <button
        type="button"
        class="flex items-center gap-1 text-sm mb-4 text-primary-500 hover:text-primary-600 transition-colors"
        @click="emit('back')"
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to list
      </button>

      <h2
        class="text-lg font-medium mb-4"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        {{ stateMachine.name }}
      </h2>

      <!-- Metadata -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div
          class="p-4 rounded-lg border"
          :class="settingsStore.darkMode ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'"
        >
          <label
            class="block text-xs font-semibold uppercase tracking-wider mb-1"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >ARN</label>
          <span
            class="font-mono text-xs break-all"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >{{ stateMachine.stateMachineArn }}</span>
        </div>
        <div
          class="p-4 rounded-lg border"
          :class="settingsStore.darkMode ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'"
        >
          <label
            class="block text-xs font-semibold uppercase tracking-wider mb-1"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >Status</label>
          <StatusBadge
            :status="getStatusType(stateMachine.status)"
            :label="stateMachine.status || 'Unknown'"
            size="sm"
          />
        </div>
        <div
          class="p-4 rounded-lg border"
          :class="settingsStore.darkMode ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'"
        >
          <label
            class="block text-xs font-semibold uppercase tracking-wider mb-1"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >Type</label>
          <span :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">{{ stateMachine.type || 'STANDARD' }}</span>
        </div>
        <div
          class="p-4 rounded-lg border"
          :class="settingsStore.darkMode ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'"
        >
          <label
            class="block text-xs font-semibold uppercase tracking-wider mb-1"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >Created</label>
          <span :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">{{ formatDate(stateMachine.creationDate) }}</span>
        </div>
      </div>

      <!-- Description -->
      <div
        v-if="stateMachine.description"
        class="mb-6 p-4 rounded-lg border"
        :class="settingsStore.darkMode ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'"
      >
        <label
          class="block text-xs font-semibold uppercase tracking-wider mb-1"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >Description</label>
        <p :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
          {{ stateMachine.description }}
        </p>
      </div>

      <!-- Definition -->
      <div v-if="hasValidDefinition(stateMachine)">
        <label
          class="block text-xs font-semibold uppercase tracking-wider mb-2"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >Definition</label>
        <JsonViewer
          :data="tryParseDefinition(stateMachine.definition)"
          expanded
        />
      </div>
      <div
        v-else
        class="p-4 rounded-lg border"
        :class="settingsStore.darkMode ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'"
      >
        <p :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
          No definition available
        </p>
      </div>
    </div>
  </div>
</template>
