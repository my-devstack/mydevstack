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
  create: [data: { Username: string; TemporaryPassword?: string }]
}>()

const newUser = ref({
  Username: '',
  TemporaryPassword: '',
})

function handleCreate() {
  emit('create', {
    Username: newUser.value.Username,
    TemporaryPassword: newUser.value.TemporaryPassword || undefined,
  })
}

function handleClose() {
  newUser.value = { Username: '', TemporaryPassword: '' }
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create User"
    size="md"
    @update:open="handleClose"
  >
    <form
      class="space-y-4"
      @submit.prevent="handleCreate"
    >
      <FormInput
        v-model="newUser.Username"
        label="Username"
        placeholder="username"
        required
      />
      <FormInput
        v-model="newUser.TemporaryPassword"
        label="Temporary Password"
        placeholder="temporary-password"
        help-text="Optional temporary password for the user"
      />
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