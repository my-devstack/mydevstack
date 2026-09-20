<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'

const props = defineProps<{
  open: boolean
  integrationId: string
  integrationType?: string
  integrationUri?: string
  integrationMethod?: string
  description?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update': [integrationType: string, integrationUri: string, integrationMethod: string, description: string]
}>()

const form = ref({
  integrationType: 'AWS_PROXY',
  integrationUri: '',
  integrationMethod: 'POST',
  description: '',
})

const integrationTypeOptions = [
  { value: 'AWS_PROXY', label: 'Lambda (AWS_PROXY)' },
  { value: 'AWS', label: 'Lambda (AWS with VTL)' },
  { value: 'HTTP_PROXY', label: 'HTTP Proxy' },
  { value: 'HTTP', label: 'HTTP (with VTL)' },
  { value: 'MOCK', label: 'Mock' },
]

const httpMethods = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'HEAD', label: 'HEAD' },
  { value: 'OPTIONS', label: 'OPTIONS' },
]

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    form.value = {
      integrationType: props.integrationType || 'AWS_PROXY',
      integrationUri: props.integrationUri || '',
      integrationMethod: props.integrationMethod || 'POST',
      description: props.description || '',
    }
  }
}, { immediate: true })

function handleUpdate() {
  emit('update', form.value.integrationType, form.value.integrationUri, form.value.integrationMethod, form.value.description)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    title="Edit Integration"
    size="md"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium">Integration ID</label>
        <p class="text-sm mt-1 font-mono">
          {{ integrationId }}
        </p>
      </div>

      <FormSelect
        v-model="form.integrationType"
        label="Integration Type"
        :options="integrationTypeOptions"
      />

      <FormInput
        v-model="form.integrationUri"
        label="URI"
        placeholder="arn:aws:apigateway:region:lambda:path/function_name"
      />

      <FormSelect
        v-model="form.integrationMethod"
        label="Integration HTTP Method"
        :options="httpMethods"
      />

      <FormInput
        v-model="form.description"
        label="Description"
        placeholder="My integration description"
      />
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
          :loading="loading"
          :disabled="form.integrationType !== 'MOCK' && !form.integrationUri.trim()"
          @click="handleUpdate"
        >
          {{ loading ? 'Saving...' : 'Save' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>