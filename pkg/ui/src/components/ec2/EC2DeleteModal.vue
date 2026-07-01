<script setup lang="ts">
import { computed } from 'vue'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'

const props = withDefaults(defineProps<{
  open: boolean
  itemName?: string
  itemType?: string
  deleting?: boolean
}>(), {
  itemName: '',
  itemType: 'instance',
  deleting: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
}>()

function handleClose() {
  emit('update:open', false)
}

const title = computed(() => {
  const prefix = 'Delete'
  const typeMap: Record<string, string> = {
    instance: 'Instance',
    'key pair': 'Key Pair',
    keypair: 'Key Pair',
    'security group': 'Security Group',
    secgroup: 'Security Group',
  }
  return `${prefix} ${typeMap[props.itemType] || props.itemType}`
})

const message = computed(() => {
  const typeMap: Record<string, string> = {
    instance: 'Are you sure you want to terminate instance',
    'key pair': 'Are you sure you want to delete key pair',
    keypair: 'Are you sure you want to delete key pair',
    'security group': 'Are you sure you want to delete security group',
    secgroup: 'Are you sure you want to delete security group',
  }
  return `${typeMap[props.itemType] || 'Are you sure you want to delete'}`
})

</script>

<template>
  <Modal
    :open="props.open"
    :title="title"
    size="sm"
    @update:open="handleClose"
  >
    <div class="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
      <ExclamationCircleIcon class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <p class="text-sm text-red-700 dark:text-red-400">
          {{ message }}
          <strong>{{ props.itemName }}</strong>?
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
          :loading="props.deleting"
          @click="emit('confirm')"
        >
          Delete
        </Button>
      </div>
    </template>
  </Modal>
</template>
