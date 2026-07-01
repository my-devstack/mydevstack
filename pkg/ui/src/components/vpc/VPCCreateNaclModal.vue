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
  'create': [data: { VpcId: string }]
}>()

const form = reactive({
  VpcId: '',
})

const vpcOptions = computed(() =>
  props.vpcList.map((v) => ({ value: v.VpcId, label: `${v.VpcId} (${v.CidrBlock})` })),
)

function handleClose() {
  emit('update:open', false)
}

function handleSubmit() {
  emit('create', { VpcId: form.VpcId })
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create Network ACL"
    size="md"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <p class="text-sm text-light-muted dark:text-dark-muted">
        A network ACL will be created with default rules that allow all traffic.
      </p>
      <FormSelect
        v-model="form.VpcId"
        label="VPC"
        :options="vpcOptions"
        required
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
          Create Network ACL
        </Button>
      </div>
    </template>
  </Modal>
</template>
