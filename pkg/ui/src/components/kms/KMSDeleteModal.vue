<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'delete': []
}>()

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Schedule Key Deletion"
    size="md"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <div class="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
        <ExclamationCircleIcon class="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div>
          <p class="text-sm text-yellow-800 dark:text-yellow-200">
            Are you sure you want to schedule deletion of this key?
          </p>
          <p class="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
            The key will be scheduled for deletion and cannot be recovered after the waiting period (7-30 days).
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        variant="secondary"
        @click="handleClose"
      >
        Cancel
      </Button>
      <Button
        variant="danger"
        @click="emit('delete')"
      >
        Schedule Deletion
      </Button>
    </template>
  </Modal>
</template>