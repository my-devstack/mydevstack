<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'

const props = defineProps<{
  open: boolean
  routeKey: string
  authorizationType?: string
  authorizerId?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update': [routeKey: string, authorizationType: string, authorizerId: string]
}>()

const form = ref({
  routeKey: '',
  authorizationType: 'NONE',
  authorizerId: '',
})

const authOptions = [
  { value: 'NONE', label: 'None' },
  { value: 'AWS_IAM', label: 'AWS IAM' },
  { value: 'CUSTOM', label: 'Custom Authorizer' },
]

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    form.value = {
      routeKey: props.routeKey || '',
      authorizationType: props.authorizationType || 'NONE',
      authorizerId: props.authorizerId || '',
    }
  }
})

function handleUpdate() {
  emit('update', form.value.routeKey, form.value.authorizationType, form.value.authorizerId)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    title="Edit Route"
    size="md"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="form.routeKey"
        label="Route Key"
        placeholder="GET /items"
        help-text="Format: METHOD /path"
      />
      
      <FormSelect
        v-model="form.authorizationType"
        label="Authorization"
        :options="authOptions"
      />
      
      <FormInput
        v-if="form.authorizationType === 'CUSTOM'"
        v-model="form.authorizerId"
        label="Authorizer ID"
        placeholder="abc123"
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
          :disabled="!form.routeKey.trim()"
          @click="handleUpdate"
        >
          {{ loading ? 'Saving...' : 'Save' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>