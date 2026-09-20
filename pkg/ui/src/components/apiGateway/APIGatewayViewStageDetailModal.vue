<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const props = defineProps<{
  open: boolean
  stage?: any | null
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const settingsStore = useSettingsStore()

function handleClose() {
  emit('update:open', false)
}

const createdDateFormatted = computed(() => {
  const date = props.stage?.createdDate
  if (!date) return '-'
  try {
    return new Date(date).toLocaleString()
  } catch {
    return String(date)
  }
})

const variablesText = computed(() => {
  if (!props.stage?.variables) return '-'
  try {
    return JSON.stringify(props.stage.variables, null, 2)
  } catch {
    return String(props.stage.variables)
  }
})
</script>

<template>
  <Modal
    :open="open"
    title="Stage Details"
    size="md"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div
      v-if="loading"
      class="flex justify-center py-8"
    >
      <LoadingSpinner />
    </div>

    <div
      v-else-if="stage"
      class="space-y-4"
    >
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Stage Name</label>
          <p
            class="font-mono text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ stage.stageName || '-' }}
          </p>
        </div>
        <div>
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Deployment ID</label>
          <p
            class="font-mono text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ stage.deploymentId || '-' }}
          </p>
        </div>
        <div>
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Created</label>
          <p
            class="text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ createdDateFormatted }}
          </p>
        </div>
        <div>
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Cache Cluster</label>
          <p
            class="text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ stage.cacheClusterEnabled ? 'Enabled' : 'Disabled' }}
          </p>
        </div>
        <div>
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Cache Cluster Status</label>
          <p
            class="text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ stage.cacheClusterStatus || '-' }}
          </p>
        </div>
        <div>
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Tracing Enabled</label>
          <p
            class="text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ stage.tracingEnabled ? 'Yes' : 'No' }}
          </p>
        </div>
      </div>

      <div v-if="stage.description">
        <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Description</label>
        <p
          class="text-sm mt-1"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          {{ stage.description }}
        </p>
      </div>

      <div>
        <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Stage Variables</label>
        <pre
          class="text-sm mt-1 whitespace-pre-wrap break-all font-mono"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >{{ variablesText }}</pre>
      </div>
    </div>

    <div
      v-else
      class="text-light-muted dark:text-dark-muted"
    >
      No stage data available
    </div>

    <template #footer>
      <Button
        variant="secondary"
        @click="handleClose"
      >
        Close
      </Button>
    </template>
  </Modal>
</template>