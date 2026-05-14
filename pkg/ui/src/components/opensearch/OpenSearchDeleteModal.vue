<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'

const props = defineProps<{
  open: boolean
  domain: { DomainName: string } | null
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
    title="Delete Domain"
    size="sm"
    @update:open="handleClose"
  >
    <div class="py-4">
      <p class="mb-4">
        Are you sure you want to delete the domain
        <span class="font-semibold">{{ props.domain?.DomainName }}</span>?
      </p>
      <div class="p-3 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
        <p class="text-sm">
          This will permanently remove the domain and all its data.
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
          variant="danger"
          @click="emit('delete')"
        >
          Delete
        </Button>
      </div>
    </template>
  </Modal>
</template>
