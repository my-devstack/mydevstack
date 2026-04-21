<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = defineProps<{
  open: boolean
  title?: string
  name?: string
  description?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update-config': [name: string, description: string]
}>()

const form = ref({
  name: '',
  description: '',
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    form.value = {
      name: props.name || '',
      description: props.description || '',
    }
  }
})

function handleUpdate() {
  emit('update-config', form.value.name, form.value.description)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    :title="title || 'Edit API'"
    size="md"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="form.name"
        label="API Name"
        placeholder="My API"
        required
      />
      
      <FormInput
        v-model="form.description"
        label="Description"
        placeholder="API description"
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
          :disabled="!form.name.trim()"
          @click="handleUpdate"
        >
          {{ loading ? 'Saving...' : 'Save' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>