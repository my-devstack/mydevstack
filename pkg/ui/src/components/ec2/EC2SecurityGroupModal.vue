<script setup lang="ts">
import { ref, computed } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import type { EC2Vpc } from '@/api/types/aws'

interface IngressRule {
  IpProtocol: string
  FromPort: number
  ToPort: number
  CidrIp: string
}

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
  'create': [params: {
    GroupName: string
    Description: string
    VpcId?: string
    IngressRules: IngressRule[]
  }]
}>()

const groupName = ref('')
const description = ref('')
const selectedVpcId = ref('')
const ingressRules = ref<IngressRule[]>([
  { IpProtocol: 'tcp', FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0' },
])

const protocolOptions = [
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'icmp', label: 'ICMP' },
  { value: '-1', label: 'All (-1)' },
]

const vpcOptions = computed(() => [
  { value: '', label: 'Default VPC' },
  ...props.vpcList.map((vpc) => ({ value: vpc.VpcId, label: `${vpc.VpcId} (${vpc.CidrBlock})` })),
])

function addRule() {
  ingressRules.value.push({ IpProtocol: 'tcp', FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0' })
}

function removeRule(index: number) {
  ingressRules.value.splice(index, 1)
}

function handleClose() {
  emit('update:open', false)
  resetForm()
}

function handleCreate() {
  if (!groupName.value.trim() || !description.value.trim()) return
  emit('create', {
    GroupName: groupName.value.trim(),
    Description: description.value.trim(),
    VpcId: selectedVpcId.value || undefined,
    IngressRules: ingressRules.value,
  })
}

function resetForm() {
  groupName.value = ''
  description.value = ''
  selectedVpcId.value = ''
  ingressRules.value = [{ IpProtocol: 'tcp', FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0' }]
}

</script>

<template>
  <Modal
    :open="props.open"
    title="Create Security Group"
    size="lg"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="groupName"
        label="Security Group Name"
        placeholder="web-sg"
        required
      />

      <FormInput
        v-model="description"
        label="Description"
        placeholder="Web server security group"
        required
      />

      <FormSelect
        v-model="selectedVpcId"
        label="VPC"
        :options="vpcOptions"
      />

      <!-- Ingress Rules -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium text-light-text dark:text-dark-text">
            Ingress Rules
          </label>
          <Button
            variant="ghost"
            size="sm"
            @click="addRule"
          >
            + Add Rule
          </Button>
        </div>

        <div class="space-y-3">
          <div
            v-for="(rule, index) in ingressRules"
            :key="index"
            class="p-3 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                Rule {{ index + 1 }}
              </span>
              <button
                type="button"
                class="text-xs text-red-500 hover:text-red-700"
                @click="removeRule(index)"
              >
                Remove
              </button>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <FormSelect
                v-model="rule.IpProtocol"
                label="Protocol"
                :options="protocolOptions"
              />
              <FormInput
                v-model="rule.FromPort"
                label="From Port"
                type="number"
                placeholder="80"
              />
              <FormInput
                v-model="rule.ToPort"
                label="To Port"
                type="number"
                placeholder="80"
              />
              <FormInput
                v-model="rule.CidrIp"
                label="CIDR"
                placeholder="0.0.0.0/0"
              />
            </div>
          </div>
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
          :loading="props.creating"
          @click="handleCreate"
        >
          Create Security Group
        </Button>
      </div>
    </template>
  </Modal>
</template>
