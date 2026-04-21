<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = defineProps<{
  open: boolean
  integrationId: string
  description?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update': [description: string]
}>()

const form = ref({
  description: '',
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    form.value = {
      description: props.description || '',
    }
  }
})

function handleUpdate() {
  emit('update', form.value.description)
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
          @click="handleUpdate"
        >
          {{ loading ? 'Saving...' : 'Save' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>