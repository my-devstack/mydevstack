<script setup lang="ts">
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'

const props = defineProps<{
  open: boolean
  title: string
  message: string
  itemName?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
}>()

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    :title="props.title"
    size="md"
    @update:open="handleClose"
  >
    <div class="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
      <ExclamationCircleIcon class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <p class="text-sm text-red-700 dark:text-red-400">
          {{ props.message }}
          <strong v-if="props.itemName">{{ props.itemName }}</strong>?
        </p>
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
        @click="emit('confirm')"
      >
        Delete
      </Button>
    </template>
  </Modal>
</template>