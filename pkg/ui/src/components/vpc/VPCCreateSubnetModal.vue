<script setup lang="ts">
import { reactive, computed } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
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
  'create': [data: { VpcId: string; CidrBlock: string; AvailabilityZone?: string }]
}>()

const form = reactive({
  VpcId: '',
  CidrBlock: '10.0.1.0/24',
  AvailabilityZone: '',
})

const vpcOptions = computed(() =>
  props.vpcList.map((v) => ({ value: v.VpcId, label: `${v.VpcId} (${v.CidrBlock})` })),
)

const azOptions = [
  { value: '', label: 'No preference' },
  { value: 'us-east-1a', label: 'us-east-1a' },
  { value: 'us-east-1b', label: 'us-east-1b' },
  { value: 'us-east-1c', label: 'us-east-1c' },
  { value: 'us-east-1d', label: 'us-east-1d' },
  { value: 'us-east-1e', label: 'us-east-1e' },
  { value: 'us-east-1f', label: 'us-east-1f' },
]

function handleClose() {
  emit('update:open', false)
}

function handleSubmit() {
  emit('create', {
    VpcId: form.VpcId,
    CidrBlock: form.CidrBlock,
    AvailabilityZone: form.AvailabilityZone || undefined,
  })
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create Subnet"
    size="md"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <FormSelect
        v-model="form.VpcId"
        label="VPC"
        :options="vpcOptions"
        required
      />

      <FormInput
        v-model="form.CidrBlock"
        label="CIDR Block"
        placeholder="10.0.1.0/24"
        required
      />

      <FormSelect
        v-model="form.AvailabilityZone"
        label="Availability Zone"
        :options="azOptions"
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
          Create Subnet
        </Button>
      </div>
    </template>
  </Modal>
</template>
