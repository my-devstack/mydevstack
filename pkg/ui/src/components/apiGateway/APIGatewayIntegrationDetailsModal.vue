<script setup lang="ts">
import { computed } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'

const props = defineProps<{
  open: boolean
  integrationData?: Record<string, any> | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

function handleClose() {
  emit('update:open', false)
}

// Extract integration details from method response (which has MethodIntegration) or direct integration
const integrationType = computed(() => {
  const data = props.integrationData
  return data?.MethodIntegration?.Type || data?.MethodIntegration?.type || data?.type || data?.Type || 'N/A'
})

const integrationUri = computed(() => {
  const data = props.integrationData
  return data?.MethodIntegration?.Uri || data?.MethodIntegration?.uri || data?.uri || data?.Uri || 'N/A'
})

const integrationHttpMethod = computed(() => {
  const data = props.integrationData
  return data?.MethodIntegration?.HttpMethod || data?.MethodIntegration?.httpMethod || data?.integrationHttpMethod || data?.method || 'N/A'
})
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
      v-if="integrationData"
      class="space-y-4"
    >
      <div>
        <label class="block text-sm font-medium text-light-muted dark:text-dark-muted">Type</label>
        <p class="text-light-text dark:text-dark-text">
          {{ integrationType }}
        </p>
      </div>
      <div>
        <label class="block text-sm font-medium text-light-muted dark:text-dark-muted">URI</label>
        <p class="text-light-text dark:text-dark-text break-all">
          {{ integrationUri }}
        </p>
      </div>
      <div>
        <label class="block text-sm font-medium text-light-muted dark:text-dark-muted">HTTP Method</label>
        <p class="text-light-text dark:text-dark-text">
          {{ integrationHttpMethod }}
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
      <Button @click="handleClose">
        Close
      </Button>
    </template>
  </Modal>
</template>