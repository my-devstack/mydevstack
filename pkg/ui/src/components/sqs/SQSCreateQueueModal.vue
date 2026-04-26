<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = defineProps<{
  open: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [name: string, isFifo: boolean]
}>()

const queueName = ref('')
const isFifo = ref(false)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    queueName.value = ''
    isFifo.value = false
  }
})

function handleCreate() {
  if (!queueName.value.trim()) return
  emit('create', queueName.value.trim(), isFifo.value)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    title="Create Queue"
    @close="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="queueName"
        label="Queue Name"
        placeholder="my-queue"
        required
      />
      <label class="flex items-center gap-2">
        <input
          v-model="isFifo"
          type="checkbox"
          class="w-4 h-4 rounded border-gray-300"
        >
        <span class="text-sm">FIFO Queue</span>
      </label>
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
          variant="primary"
          :loading="loading"
          :disabled="!queueName.trim()"
          @click="handleCreate"
        >
          Create
        </Button>
      </div>
    </template>
  </Modal>
</template>