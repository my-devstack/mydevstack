<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

interface SNSTopic {
  TopicName: string
}

const props = defineProps<{
  open: boolean
  topic: SNSTopic | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'publish': [subject: string, message: string]
}>()

const form = defineModel<{ subject: string; message: string }>('form', { default: { subject: '', message: '' } })

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    :title="`Publish to: ${props.topic?.TopicName || ''}`"
    size="lg"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="form.subject"
        label="Subject (optional)"
        placeholder="Notification Subject"
      />
      <div>
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
          Message *
        </label>
        <textarea
          v-model="form.message"
          rows="6"
          class="w-full px-3 py-2 rounded-lg border bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-text dark:text-dark-text font-mono text-sm"
          placeholder="Enter your message..."
          required
        />
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
        <Button @click="emit('publish', form.subject, form.message)">
          Publish
        </Button>
      </div>
    </template>
  </Modal>
</template>