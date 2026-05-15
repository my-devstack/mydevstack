<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'

const props = defineProps<{
  open: boolean
  isLoading: boolean
  newCluster: {
    name: string
    kafkaVersion: string
    brokerCount: number
    instanceType: string
    storagePerBroker: number
    clientSubnets: string
  }
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'create'): void
  (e: 'update:newCluster', value: typeof props.newCluster): void
}>()

const kafkaVersionOptions = [
  { value: '2.8.1', label: '2.8.1' },
  { value: '3.2.0', label: '3.2.0' },
  { value: '3.3.1', label: '3.3.1' },
  { value: '3.4.0', label: '3.4.0' },
  { value: '3.5.1', label: '3.5.1' },
  { value: '3.6.0', label: '3.6.0' },
]

const instanceTypeOptions = [
  { value: 'kafka.m5.large', label: 'kafka.m5.large' },
  { value: 'kafka.m5.xlarge', label: 'kafka.m5.xlarge' },
  { value: 'kafka.m5.2xlarge', label: 'kafka.m5.2xlarge' },
]

function updateField(field: string, value: string | number) {
  emit('update:newCluster', { ...props.newCluster, [field]: value })
}
</script>

<template>
  <Modal
    :open="open"
    title="Create MSK Cluster"
    size="lg"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-4">
      <FormInput
        :model-value="newCluster.name"
        label="Cluster Name"
        placeholder="my-msk-cluster"
        required
        @update:model-value="updateField('name', $event)"
      />

      <FormSelect
        :model-value="newCluster.kafkaVersion"
        label="Kafka Version"
        :options="kafkaVersionOptions"
        placeholder="Select Kafka version"
        @update:model-value="updateField('kafkaVersion', $event)"
      />

      <FormInput
        :model-value="newCluster.brokerCount"
        label="Number of Brokers"
        type="number"
        placeholder="2"
        help-text="Minimum 2 brokers for production use"
        @update:model-value="updateField('brokerCount', Number($event))"
      />

      <FormSelect
        :model-value="newCluster.instanceType"
        label="Instance Type"
        :options="instanceTypeOptions"
        placeholder="Select instance type"
        @update:model-value="updateField('instanceType', $event)"
      />

      <FormInput
        :model-value="newCluster.storagePerBroker"
        label="Storage per Broker (GB)"
        type="number"
        placeholder="100"
        help-text="EBS storage volume size in GB per broker"
        @update:model-value="updateField('storagePerBroker', Number($event))"
      />

      <FormInput
        :model-value="newCluster.clientSubnets"
        label="Client Subnets"
        placeholder="subnet-123456,subnet-789012"
        help-text="Comma-separated subnet IDs. At least one required."
        @update:model-value="updateField('clientSubnets', $event)"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="secondary"
          @click="emit('update:open', false)"
        >
          Cancel
        </Button>
        <Button
          :loading="isLoading"
          @click="emit('create')"
        >
          Create Cluster
        </Button>
      </div>
    </template>
  </Modal>
</template>
