<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const props = defineProps<{
  open: boolean
  integration?: any | null
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const settingsStore = useSettingsStore()

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    title="Integration Details"
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
      v-else-if="integration"
      class="space-y-4"
    >
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Integration ID</label>
          <p
            class="font-mono text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ integration.integrationId || '-' }}
          </p>
        </div>
        <div>
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Type</label>
          <p
            class="text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ integration.integrationType || '-' }}
          </p>
        </div>
        <div class="col-span-2">
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">URI</label>
          <p
            class="text-sm mt-1 break-all"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ integration.integrationUri || '-' }}
          </p>
        </div>
        <div>
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">HTTP Method</label>
          <p
            class="text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ integration.integrationMethod || '-' }}
          </p>
        </div>
        <div>
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Payload Format Version</label>
          <p
            class="text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ integration.payloadFormatVersion || '-' }}
          </p>
        </div>
        <div>
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Timeout (ms)</label>
          <p
            class="text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ integration.timeoutInMillis ?? '-' }}
          </p>
        </div>
        <div>
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Connection Type</label>
          <p
            class="text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ integration.connectionType || '-' }}
          </p>
        </div>
        <div>
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Connection ID</label>
          <p
            class="text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ integration.connectionId || '-' }}
          </p>
        </div>
        <div>
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Credentials ARN</label>
          <p
            class="text-sm mt-1 break-all"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ integration.credentialsArn || '-' }}
          </p>
        </div>
      </div>

      <div v-if="integration.description">
        <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Description</label>
        <p
          class="text-sm mt-1"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          {{ integration.description }}
        </p>
      </div>
    </div>

    <div
      v-else
      class="text-light-muted dark:text-dark-muted"
    >
      No integration data available
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