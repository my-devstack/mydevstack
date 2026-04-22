<script setup lang="ts">
import { ref } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  create: [data: { RoleName: string; Description?: string; AssumeRolePolicyDocument: string }]
}>()

const newRole = ref({
  RoleName: '',
  Description: '',
  AssumeRolePolicyDocument: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { Service: 'ec2.amazonaws.com' },
        Action: 'sts:AssumeRole',
      },
    ],
  }, null, 2),
})

function handleCreate() {
  emit('create', {
    RoleName: newRole.value.RoleName,
    Description: newRole.value.Description || undefined,
    AssumeRolePolicyDocument: newRole.value.AssumeRolePolicyDocument,
  })
}

function handleClose() {
  newRole.value = {
    RoleName: '',
    Description: '',
    AssumeRolePolicyDocument: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { Service: 'ec2.amazonaws.com' },
          Action: 'sts:AssumeRole',
        },
      ],
    }, null, 2),
  }
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create Role"
    size="lg"
    @update:open="handleClose"
  >
    <form
      class="space-y-4"
      @submit.prevent="handleCreate"
    >
      <FormInput
        v-model="newRole.RoleName"
        label="Role Name"
        placeholder="my-role"
        required
      />
      <FormInput
        v-model="newRole.Description"
        label="Description"
        placeholder="Role description"
      />
      <div>
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
          Assume Role Policy
        </label>
        <textarea
          v-model="newRole.AssumeRolePolicyDocument"
          rows="10"
          class="block w-full rounded-md shadow-sm border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
    </form>
    <template #footer>
      <Button
        variant="secondary"
        @click="handleClose"
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        @click="handleCreate"
      >
        Create
      </Button>
    </template>
  </Modal>
</template>