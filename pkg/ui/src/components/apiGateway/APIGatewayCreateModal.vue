<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = defineProps<{
  open: boolean
  type: 'rest' | 'http'
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create-rest': [name: string, description: string]
  'create-http': [name: string, description: string]
}>()

const settingsStore = useSettingsStore()

const restName = ref('')
const restDescription = ref('')
const httpName = ref('')
const httpDescription = ref('')

// Reset form when modal opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    restName.value = ''
    restDescription.value = ''
    httpName.value = ''
    httpDescription.value = ''
  }
})

function handleCreate() {
  if (props.type === 'rest') {
    if (!restName.value.trim()) return
    emit('create-rest', restName.value.trim(), restDescription.value.trim())
  } else {
    if (!httpName.value.trim()) return
    emit('create-http', httpName.value.trim(), httpDescription.value.trim())
  }
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    :title="type === 'rest' ? 'Create REST API' : 'Create HTTP API'"
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
        placeholder="my-http-api"
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
        placeholder="My HTTP API (optional)"
      />

      <div
        v-if="type === 'http'"
        class="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20"
      >
        <p class="text-sm text-blue-800 dark:text-blue-200">
          <strong>HTTP APIs</strong> are optimized for Lambda and HTTP backends. 
          They support route-based routing and are generally simpler to configure than REST APIs.
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
          {{ loading ? 'Creating...' : 'Create' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>