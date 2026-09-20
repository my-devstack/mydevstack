<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = defineProps<{
  open: boolean
  stageName: string
  description?: string
  deploymentId?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:description': [description: string]
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
  emit('update:description', form.value.description)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    title="Edit Stage"
    size="md"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium">Stage Name</label>
          <p class="text-sm mt-1 font-mono">
            {{ stageName }}
          </p>
        </div>
        <div>
          <label class="text-sm font-medium">Deployment ID</label>
          <p class="text-sm mt-1 font-mono">
            {{ deploymentId || '-' }}
          </p>
        </div>
      </div>

      <FormInput
        v-model="form.description"
        label="Description"
        placeholder="Production stage"
        help-text="Stage description is mutable via patch operations."
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