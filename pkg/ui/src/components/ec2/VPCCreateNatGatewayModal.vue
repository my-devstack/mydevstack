<script setup lang="ts">
import { reactive, computed } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import { useSettingsStore } from '@/stores/settings'
import type { EC2Subnet } from '@/api/types/aws'

const settings = useSettingsStore()

const props = withDefaults(defineProps<{
  open: boolean
  creating?: boolean
  subnetList?: EC2Subnet[]
}>(), {
  creating: false,
  subnetList: () => [],
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [data: { SubnetId: string; AllocationId: string }]
}>()

const form = reactive({
  SubnetId: '',
  AllocationId: '',
})

const subnetOptions = computed(() =>
  props.subnetList.map((s) => ({ value: s.SubnetId, label: `${s.SubnetId} (${s.CidrBlock}, ${s.AvailabilityZone})` })),
)

function handleClose() {
  emit('update:open', false)
}

function handleSubmit() {
  emit('create', {
    SubnetId: form.SubnetId,
    AllocationId: form.AllocationId,
  })
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create NAT Gateway"
    size="md"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <FormSelect
        v-model="form.SubnetId"
        label="Subnet"
        :options="subnetOptions"
        required
      />

      <div>
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
          Elastic IP Allocation ID
        </label>
        <p class="text-xs text-light-muted dark:text-dark-muted mb-2">
          First allocate an Elastic IP from the Elastic IPs tab, then enter its Allocation ID here.
        </p>
        <input
          v-model="form.AllocationId"
          type="text"
          placeholder="eipalloc-1234567890abcdef0"
          class="w-full px-3 py-2 rounded-lg border text-sm"
          :class="settings.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
        >
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
          @click="handleSubmit"
        >
          Create NAT Gateway
        </Button>
      </div>
    </template>
  </Modal>
</template>
