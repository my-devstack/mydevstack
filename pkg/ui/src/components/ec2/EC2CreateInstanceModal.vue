<script setup lang="ts">
import { computed } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import type { EC2KeyPair, EC2SecurityGroup, EC2Vpc, EC2Subnet } from '@/api/types/aws'

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
  vpcList?: EC2Vpc[]
  subnetList?: EC2Subnet[]
}>(), {
  creating: false,
  keyPairs: () => [],
  securityGroups: () => [],
  vpcList: () => [],
  subnetList: () => [],
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

const securityGroupOptions = computed(() =>
  props.securityGroups.map((sg) => ({ value: sg.GroupId, label: `${sg.GroupName} (${sg.GroupId})` })),
)

const subnetOptions = computed(() => [
  { value: '', label: 'Default subnet' },
  ...props.subnetList.map((sn) => ({
    value: sn.SubnetId,
    label: `${sn.SubnetId} (${sn.AvailabilityZone})`,
  })),
])

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

      <div>
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
          Security Groups
        </label>
        <div class="space-y-2 max-h-32 overflow-y-auto border border-light-border dark:border-dark-border rounded-md p-2">
          <label
            v-for="sg in props.securityGroups"
            :key="sg.GroupId"
            class="flex items-center gap-2 text-sm"
          >
            <input
              type="checkbox"
              :checked="form.SecurityGroupIds.includes(sg.GroupId)"
              :value="sg.GroupId"
              class="rounded border-light-border"
              @change="(e: Event) => {
                const target = e.target as HTMLInputElement
                if (target.checked) {
                  form.SecurityGroupIds = [...form.SecurityGroupIds, sg.GroupId]
                } else {
                  form.SecurityGroupIds = form.SecurityGroupIds.filter((id: string) => id !== sg.GroupId)
                }
              }"
            >
            {{ sg.GroupName }} ({{ sg.GroupId }})
          </label>
          <p
            v-if="props.securityGroups.length === 0"
            class="text-sm text-light-muted dark:text-dark-muted"
          >
            No security groups available
          </p>
        </div>
      </div>

      <FormSelect
        v-model="form.SubnetId"
        label="Subnet"
        :options="subnetOptions"
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
