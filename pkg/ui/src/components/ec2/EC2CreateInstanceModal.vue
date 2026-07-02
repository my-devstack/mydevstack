<script setup lang="ts">
import { computed } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import { VpcSelector } from '@/components/vpc'
import type { EC2KeyPair, EC2SecurityGroup } from '@/api/types/aws'
import type { VpcSelection } from '@/types/vpc'

interface CreateForm {
  ImageId: string
  InstanceType: string
  KeyName: string
  SecurityGroupIds: string[]
  SubnetId: string
  MinCount: number
  MaxCount: number
}

const props = withDefaults(defineProps<{
  open: boolean
  creating?: boolean
  keyPairs?: EC2KeyPair[]
  securityGroups?: EC2SecurityGroup[]
}>(), {
  creating: false,
  keyPairs: () => [],
  securityGroups: () => [],
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': []
}>()

const form = defineModel<CreateForm>('form', { default: {
  ImageId: 'ami-0abcdef1234567890',
  InstanceType: 't2.micro',
  KeyName: '',
  SecurityGroupIds: [],
  SubnetId: '',
  MinCount: 1,
  MaxCount: 1,
}})

const instanceTypeOptions = [
  { value: 't2.nano', label: 't2.nano (1 vCPU, 0.5 GB)' },
  { value: 't2.micro', label: 't2.micro (1 vCPU, 1 GB)' },
  { value: 't2.small', label: 't2.small (1 vCPU, 2 GB)' },
  { value: 't2.medium', label: 't2.medium (2 vCPU, 4 GB)' },
  { value: 't3.micro', label: 't3.micro (2 vCPU, 1 GB)' },
  { value: 't3.small', label: 't3.small (2 vCPU, 2 GB)' },
  { value: 't3.medium', label: 't3.medium (2 vCPU, 4 GB)' },
  { value: 't3.large', label: 't3.large (2 vCPU, 8 GB)' },
  { value: 'm5.large', label: 'm5.large (2 vCPU, 8 GB)' },
  { value: 'm5.xlarge', label: 'm5.xlarge (4 vCPU, 16 GB)' },
  { value: 'c5.large', label: 'c5.large (2 vCPU, 4 GB)' },
  { value: 'c5.xlarge', label: 'c5.xlarge (4 vCPU, 8 GB)' },
]

const keyPairOptions = computed(() => [
  { value: '', label: 'No key pair' },
  ...props.keyPairs.map((kp) => ({ value: kp.KeyName, label: kp.KeyName })),
])

function onVpcSelectionChange(selection: VpcSelection | null) {
  if (selection) {
    form.value.SecurityGroupIds = selection.securityGroupIds
    form.value.SubnetId = selection.subnetIds[0] || ''
  } else {
    form.value.SecurityGroupIds = []
    form.value.SubnetId = ''
  }
}

function handleClose() {
  emit('update:open', false)
}

</script>

<template>
  <Modal
    :open="props.open"
    title="Run Instance"
    size="lg"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="form.ImageId"
        label="Image ID (AMI)"
        placeholder="ami-0abcdef1234567890"
        required
      />

      <FormSelect
        v-model="form.InstanceType"
        label="Instance Type"
        :options="instanceTypeOptions"
      />

      <FormSelect
        v-model="form.KeyName"
        label="Key Pair"
        :options="keyPairOptions"
      />

      <VpcSelector
        resource-type="ec2"
        :required="false"
        show-subnet
        show-security-group
        @update:model-value="onVpcSelectionChange"
      />

      <div class="grid grid-cols-2 gap-4">
        <FormInput
          v-model="form.MinCount"
          label="Min Count"
          type="number"
          placeholder="1"
        />
        <FormInput
          v-model="form.MaxCount"
          label="Max Count"
          type="number"
          placeholder="1"
        />
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
          :loading="props.creating"
          @click="emit('create')"
        >
          Launch Instance
        </Button>
      </div>
    </template>
  </Modal>
</template>
