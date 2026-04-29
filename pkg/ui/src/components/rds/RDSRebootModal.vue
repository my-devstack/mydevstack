<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  open: boolean
  instance: { DBInstanceIdentifier: string; Engine?: string } | null
  rebooting: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'reboot': []
}>()

function handleClose() {
  emit('update:open', false)
}

function handleReboot() {
  emit('reboot')
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Reboot DB Instance"
    size="sm"
    @update:open="handleClose"
  >
    <div class="py-4">
      <p class="mb-4">
        Are you sure you want to reboot the database instance
        <span class="font-semibold">{{ props.instance?.DBInstanceIdentifier }}</span>?
      </p>
      <div class="p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p class="text-sm flex items-center gap-2">
          <ArrowPathIcon class="h-4 w-4 text-blue-500" />
          Engine: {{ props.instance?.Engine || 'Unknown' }}
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="secondary"
          :disabled="props.rebooting"
          @click="handleClose"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          :loading="props.rebooting"
          @click="handleReboot"
        >
          <template #icon>
            <ArrowPathIcon class="h-4 w-4" />
          </template>
          Reboot
        </Button>
      </div>
    </template>
  </Modal>
</template>
