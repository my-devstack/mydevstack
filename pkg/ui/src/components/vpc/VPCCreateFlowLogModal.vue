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
  'create': [data: { ResourceId: string; LogDestinationType: string; LogDestination: string; TrafficType: string }]
}>()

const form = reactive({
  ResourceId: '',
  LogDestinationType: 'cloud-watch-logs',
  LogDestination: '',
  TrafficType: 'ALL',
})

const vpcOptions = computed(() =>
  props.vpcList.map((v) => ({ value: v.VpcId, label: `${v.VpcId} (${v.CidrBlock})` })),
)

const destinationTypeOptions = [
  { value: 'cloud-watch-logs', label: 'CloudWatch Logs' },
  { value: 's3', label: 'S3' },
]

const trafficTypeOptions = [
  { value: 'ALL', label: 'ALL' },
  { value: 'ACCEPT', label: 'ACCEPT' },
  { value: 'REJECT', label: 'REJECT' },
]

function handleClose() {
  emit('update:open', false)
}

function handleSubmit() {
  emit('create', {
    ResourceId: form.ResourceId,
    LogDestinationType: form.LogDestinationType,
    LogDestination: form.LogDestination,
    TrafficType: form.TrafficType,
  })
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create Flow Log"
    size="md"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <FormSelect
        v-model="form.ResourceId"
        label="Resource (VPC)"
        :options="vpcOptions"
        required
      />

      <FormSelect
        v-model="form.LogDestinationType"
        label="Log Destination Type"
        :options="destinationTypeOptions"
      />

      <FormInput
        v-model="form.LogDestination"
        label="Log Destination ARN"
        placeholder="arn:aws:logs:us-east-1:123456789012:log-group:my-flow-logs"
        required
      />

      <FormSelect
        v-model="form.TrafficType"
        label="Traffic Type"
        :options="trafficTypeOptions"
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
          Create Flow Log
        </Button>
      </div>
    </template>
  </Modal>
</template>
