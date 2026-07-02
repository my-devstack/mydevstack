<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import { VpcSelector } from '@/components/vpc'
import type { CreateGroupInput } from '@/composables/useElastiCache'

const props = withDefaults(defineProps<{
  open: boolean
  creating?: boolean
}>(), {
  creating: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': []
}>()

const form = defineModel<CreateGroupInput>('form', { default: {
  ReplicationGroupId: '',
  ReplicationGroupDescription: '',
  CacheNodeType: 'cache.t3.micro',
  Engine: 'valkey',
  NumNodeGroups: 1,
  Port: 6379,
}})

const nodeTypeOptions = [
  { value: 'cache.t3.micro', label: 't3.micro (0.5 vCPU, 0.5 GB)' },
  { value: 'cache.t3.small', label: 't3.small (1 vCPU, 2 GB)' },
  { value: 'cache.t3.medium', label: 't3.medium (2 vCPU, 4 GB)' },
  { value: 'cache.m5.large', label: 'm5.large (2 vCPU, 8 GB)' },
]

const engineOptions = [
  { value: 'valkey', label: 'Valkey (Redis OSS compatible)' },
  { value: 'redis', label: 'Redis (legacy)' },
]

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create Replication Group"
    size="md"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="form.ReplicationGroupId"
        label="Replication Group ID"
        placeholder="my-cache"
        required
      />
      
      <FormInput
        v-model="form.ReplicationGroupDescription"
        label="Description"
        placeholder="My cache cluster"
      />
      
      <FormSelect
        v-model="form.CacheNodeType"
        label="Node Type"
        :options="nodeTypeOptions"
      />
      
      <FormSelect
        v-model="form.Engine"
        label="Engine"
        :options="engineOptions"
      />
      
      <FormInput
        v-model="form.NumNodeGroups"
        label="Number of Node Groups"
        type="number"
        placeholder="1"
      />
      
      <FormInput
        v-model="form.Port"
        label="Port"
        type="number"
        placeholder="6379"
      />

      <!-- VPC Configuration -->
      <details class="border border-light-border dark:border-dark-border rounded-lg">
        <summary class="px-4 py-3 cursor-pointer text-sm font-medium text-light-text dark:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover rounded-lg">
          VPC Configuration
          <span class="text-light-muted dark:text-dark-muted font-normal ml-1">(optional)</span>
        </summary>
        <div class="px-4 pb-4 pt-2">
          <VpcSelector
            v-model="form.vpcSelection"
            resource-type="elasticache"
            :required="false"
            :show-subnet="true"
            :show-security-group="true"
          />
        </div>
      </details>
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
          Create
        </Button>
      </div>
    </template>
  </Modal>
</template>