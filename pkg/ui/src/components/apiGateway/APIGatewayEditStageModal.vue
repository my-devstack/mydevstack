<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = defineProps<{
  open: boolean
  stageName: string
  description?: string
  autoDeploy?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update': [description: string, autoDeploy: boolean]
}>()

const form = ref({
  description: '',
  autoDeploy: false,
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    form.value = {
      description: props.description || '',
      autoDeploy: props.autoDeploy ?? false,
    }
  }
})

function handleUpdate() {
  emit('update', form.value.description, form.value.autoDeploy)
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
      <div>
        <label class="text-sm font-medium">Stage Name</label>
        <p class="text-sm mt-1">
          {{ stageName }}
        </p>
      </div>
      
      <FormInput
        v-model="form.description"
        label="Description"
        placeholder="Production stage"
      />
      
      <div>
        <label class="flex items-center gap-2">
          <input
            v-model="form.autoDeploy"
            type="checkbox"
            class="rounded border-gray-300"
          >
          <span class="text-sm font-medium">Auto Deploy</span>
        </label>
        <p class="text-xs text-light-muted dark:text-dark-muted mt-1">
          Automatically deploy new changes to this stage
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
          :loading="loading"
          @click="handleUpdate"
        >
          {{ loading ? 'Saving...' : 'Save' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>