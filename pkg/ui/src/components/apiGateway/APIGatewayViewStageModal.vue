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

const stageVariablesText = computed(() => {
  if (!props.stage?.stageVariables) return '-'
  try {
    return JSON.stringify(props.stage.stageVariables, null, 2)
  } catch {
    return String(props.stage.stageVariables)
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
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Auto Deploy</label>
          <p
            class="text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ stage.autoDeploy ? 'Yes' : 'No' }}
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
        >{{ stageVariablesText }}</pre>
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