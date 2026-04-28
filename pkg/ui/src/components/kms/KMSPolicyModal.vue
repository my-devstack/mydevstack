<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import type { KeyInfo } from '@/composables/useKMS'

const props = defineProps<{
  open: boolean
  selectedKey: KeyInfo | null
  policy: string
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
    title="Key Policy"
    size="lg"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <div>
        <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Key ID</label>
        <p class="text-sm text-light-text dark:text-dark-text font-mono">
          {{ props.selectedKey?.KeyId }}
        </p>
      </div>
      <div>
        <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Policy</label>
        <pre
          v-if="props.policy"
          class="p-4 rounded-lg bg-light-bg dark:bg-dark-bg text-sm font-mono overflow-auto max-h-96 text-light-text dark:text-dark-text"
        >{{ props.policy }}</pre>
        <p
          v-else
          class="text-sm text-light-muted dark:text-dark-muted italic"
        >
          No policy found
        </p>
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
