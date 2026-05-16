<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'

interface IAMPolicy {
  PolicyName: string
  Arn: string
  PolicyId: string
  AttachmentCount?: number
}

const props = defineProps<{
  open: boolean
  policy: IAMPolicy | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Policy Details"
    size="xl"
    @update:open="handleClose"
  >
    <div
      v-if="props.policy"
      class="space-y-4"
    >
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">
            Name
          </label>
          <p class="text-sm text-light-text dark:text-dark-text">
            {{ props.policy.PolicyName }}
          </p>
        </div>
        <div>
          <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">
            ARN
          </label>
          <p class="text-sm text-light-text dark:text-dark-text font-mono">
            {{ props.policy.Arn }}
          </p>
        </div>
        <div>
          <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">
            ID
          </label>
          <p class="text-sm text-light-text dark:text-dark-text">
            {{ props.policy.PolicyId }}
          </p>
        </div>
        <div>
          <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">
            Attachments
          </label>
          <p class="text-sm text-light-text dark:text-dark-text">
            {{ props.policy.AttachmentCount ?? '-' }}
          </p>
        </div>
      </div>
    </div>
    <template #footer>
      <Button
        variant="secondary"
        @click="handleClose"
      >
        Close
      </Button>
    </template>
  </Modal>
</template>