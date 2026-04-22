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
  create: [data: { UserName: string; Path?: string }]
}>()

const newUser = ref({
  UserName: '',
  Path: '',
})

function handleCreate() {
  emit('create', {
    UserName: newUser.value.UserName,
    Path: newUser.value.Path || undefined,
  })
}

function handleClose() {
  newUser.value = { UserName: '', Path: '' }
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
        v-model="newUser.UserName"
        label="User Name"
        placeholder="username"
        required
      />
      <FormInput
        v-model="newUser.Path"
        label="Path"
        placeholder="/"
        help-text="Optional path for the user"
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