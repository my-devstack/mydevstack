<script setup lang="ts">
import { reactive, computed } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import type { EC2Vpc } from '@/api/types/aws'

const props = withDefaults(defineProps<{
  open: boolean
  creating?: boolean
  vpcList?: EC2Vpc[]
}>(), {
  creating: false,
  vpcList: () => [],
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [vpcId?: string]
}>()

const form = reactive({
  attachVpcId: '',
})

const vpcOptions = computed(() => [
  { value: '', label: 'Do not attach' },
  ...props.vpcList.map((v) => ({ value: v.VpcId, label: `${v.VpcId} (${v.CidrBlock})` })),
])

function handleClose() {
  emit('update:open', false)
}

function handleSubmit() {
  emit('create', form.attachVpcId || undefined)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create Internet Gateway"
    size="md"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <p class="text-sm text-light-muted dark:text-dark-muted">
        Create an internet gateway and optionally attach it to a VPC.
      </p>
      <FormSelect
        v-model="form.attachVpcId"
        label="Attach to VPC (optional)"
        :options="vpcOptions"
      />
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
          :loading="props.creating"
          @click="handleSubmit"
        >
          Create Internet Gateway
        </Button>
      </div>
    </template>
  </Modal>
</template>
