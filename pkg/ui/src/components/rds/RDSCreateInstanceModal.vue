<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'

const props = defineProps<{
  open: boolean
  creating: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': []
}>()

const form = defineModel<{
  instanceId: string
  dbEngine: string
  dbVersion: string
  masterUsername: string
  masterPassword: string
  instanceClass: string
  port: string
  allocatedStorage: string
}>('form', { default: {
  instanceId: '',
  dbEngine: 'mysql',
  dbVersion: '',
  masterUsername: '',
  masterPassword: '',
  instanceClass: 'db.t3.micro',
  port: '',
  allocatedStorage: '20'
}})

const engineOptions = [
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgres', label: 'PostgreSQL' },
  { value: 'mariadb', label: 'MariaDB' },
]

const instanceClassOptions = [
  { value: 'db.t3.micro', label: 't3.micro (2 vCPU, 1 GB)' },
  { value: 'db.t3.small', label: 't3.small (2 vCPU, 2 GB)' },
  { value: 'db.t3.medium', label: 't3.medium (2 vCPU, 4 GB)' },
]

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create DB Instance"
    size="md"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="form.instanceId"
        label="Instance Identifier"
        placeholder="my-db-instance"
        required
      />
      
      <FormSelect
        v-model="form.dbEngine"
        label="Database Engine"
        :options="engineOptions"
      />
      
      <FormInput
        v-model="form.dbVersion"
        label="Engine Version"
        :placeholder="form.dbEngine === 'mysql' ? '8.0.36' : '15.3'"
      />
      
      <FormInput
        v-model="form.masterUsername"
        label="Master Username"
        placeholder="root"
      />
      
      <FormInput
        v-model="form.masterPassword"
        label="Master Password"
        type="password"
        placeholder="Enter password"
        required
      />
      
      <FormSelect
        v-model="form.instanceClass"
        label="Instance Class"
        :options="instanceClassOptions"
      />
      
      <FormInput
        v-model="form.port"
        label="Port"
        type="number"
        :placeholder="form.dbEngine === 'mysql' ? '3306' : '5432'"
      />
      
      <FormInput
        v-model="form.allocatedStorage"
        label="Allocated Storage (GB)"
        type="number"
        placeholder="20"
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
          @click="emit('create')"
        >
          Create
        </Button>
      </div>
    </template>
  </Modal>
</template>