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
    vpc: 'VPC',
    subnet: 'Subnet',
    routetable: 'Route Table',
    igw: 'Internet Gateway',
    natgw: 'NAT Gateway',
    nacl: 'Network ACL',
    flowlog: 'Flow Log',
    eip: 'Elastic IP',
  }
  return `${prefix} ${typeMap[props.itemType] || props.itemType}`
})

const message = computed(() => {
  const typeMap: Record<string, string> = {
    vpc: 'Are you sure you want to delete VPC',
    subnet: 'Are you sure you want to delete subnet',
    routetable: 'Are you sure you want to delete route table',
    igw: 'Are you sure you want to delete internet gateway',
    natgw: 'Are you sure you want to delete NAT gateway',
    nacl: 'Are you sure you want to delete network ACL',
    flowlog: 'Are you sure you want to delete flow log',
    eip: 'Are you sure you want to release elastic IP',
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
