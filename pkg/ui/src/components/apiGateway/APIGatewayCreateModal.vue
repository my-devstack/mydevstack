<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'

const props = defineProps<{
  open: boolean
  type: 'rest' | 'http'
  loading?: boolean
  api?: any
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create-rest': [name: string, description: string]
  'create-http': [name: string, description: string, protocol: string]
  'create': [name: string, description: string]
  'update': [name: string, description: string]
  'update-rest': [name: string, description: string]
}>()

const restName = ref('')
const restDescription = ref('')
const httpName = ref('')
const httpDescription = ref('')
const protocolType = ref('HTTP')

const protocolOptions = computed(() => {
  return [
    { value: 'HTTP', label: 'HTTP' },
    { value: 'WEBSOCKET', label: 'WebSocket' },
  ]
})

// Reset form when modal opens or api changes
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    if (props.api) {
      restName.value = props.api.name || ''
      restDescription.value = props.api.description || ''
      httpName.value = props.api.name || ''
      httpDescription.value = props.api.description || ''
    } else {
      restName.value = ''
      restDescription.value = ''
      httpName.value = ''
      httpDescription.value = ''
      protocolType.value = 'HTTP'
    }
  }
}, { immediate: true })

function handleCreate() {
  if (props.api) {
    if (props.type === 'rest') {
      emit('update', restName.value.trim(), restDescription.value.trim())
    } else {
      emit('update', httpName.value.trim(), httpDescription.value.trim())
    }
  } else if (props.type === 'rest') {
    if (!restName.value.trim()) return
    emit('create-rest', restName.value.trim(), restDescription.value.trim())
    emit('create', restName.value.trim(), restDescription.value.trim())
  } else {
    if (!httpName.value.trim()) return
    emit('create-http', httpName.value.trim(), httpDescription.value.trim(), protocolType.value)
    emit('create', httpName.value.trim(), httpDescription.value.trim())
  }
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    :title="api ? (type === 'rest' ? 'Edit REST API' : 'Edit API (V2)') : (type === 'rest' ? 'Create REST API' : 'Create API (V2)')"
    size="md"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-if="type === 'rest'"
        v-model="restName"
        label="API Name"
        placeholder="my-api"
        required
      />
      <FormInput
        v-else
        v-model="httpName"
        label="API Name"
        placeholder="my-api"
        required
      />

      <FormInput
        v-if="type === 'rest'"
        v-model="restDescription"
        label="Description"
        placeholder="My REST API (optional)"
      />
      <FormInput
        v-else
        v-model="httpDescription"
        label="Description"
        placeholder="My API (optional)"
      />

      <FormSelect
        v-if="type === 'http'"
        v-model="protocolType"
        label="Protocol"
        :options="protocolOptions"
      />

      <div
        v-if="type === 'http' && protocolType === 'HTTP'"
        class="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20"
      >
        <p class="text-sm text-blue-800 dark:text-blue-200">
          <strong>HTTP APIs</strong> are optimized for Lambda and HTTP backends. 
          They support route-based routing and are generally simpler to configure than REST APIs.
        </p>
      </div>

      <div
        v-if="type === 'http' && protocolType === 'WEBSOCKET'"
        class="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20"
      >
        <p class="text-sm text-blue-800 dark:text-blue-200">
          <strong>WebSocket APIs</strong> enable real-time two-way communication. They support $connect, $disconnect, and $default routes.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="secondary"
          @click="handleClose"
        >
          Cancel
        </Button>
        <Button
          :disabled="loading || (type === 'rest' ? !restName.trim() : !httpName.trim())"
          @click="handleCreate"
        >
          {{ loading ? (api ? 'Updating...' : 'Creating...') : (api ? 'Update' : 'Create') }}
        </Button>
      </div>
    </template>
  </Modal>
</template>