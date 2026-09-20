<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const props = defineProps<{
  open: boolean
  deployment?: any | null
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
  const date = props.deployment?.createdDate
  if (!date) return '-'
  try {
    return new Date(date).toLocaleString()
  } catch {
    return String(date)
  }
})
</script>

<template>
  <Modal
    :open="open"
    title="Deployment Details"
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
      v-else-if="deployment"
      class="space-y-4"
    >
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Deployment ID</label>
          <p
            class="font-mono text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ deployment.id || deployment.deploymentId || '-' }}
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
      </div>

      <div>
        <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Description</label>
        <p
          class="text-sm mt-1"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          {{ deployment.description || '-' }}
        </p>
      </div>
    </div>

    <div
      v-else
      class="text-light-muted dark:text-dark-muted"
    >
      No deployment data available
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