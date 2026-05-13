<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'

const props = defineProps<{
  open: boolean
  templateName: string
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
    title="Delete SES Template"
    size="md"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <div class="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
        <svg
          class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <p class="text-sm text-red-800 dark:text-red-200">
            Are you sure you want to delete the template "{{ props.templateName }}"?
          </p>
          <p class="text-xs text-red-700 dark:text-red-300 mt-1">
            This action cannot be undone.
          </p>
        </div>
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
          variant="danger"
          @click="emit('delete')"
        >
          Delete
        </Button>
      </div>
    </template>
  </Modal>
</template>
