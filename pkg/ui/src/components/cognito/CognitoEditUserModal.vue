<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = defineProps<{
  open: boolean
  userPoolId?: string
  username?: string
  email?: string
  phoneNumber?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update': [userPoolId: string, username: string, userAttributes: { Name: string; Value: string }[]]
}>()

const form = ref({ email: '', phoneNumber: '' })

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    form.value = {
      email: props.email || '',
      phoneNumber: props.phoneNumber || '',
    }
  }
}, { immediate: true })

function handleUpdate() {
  const userAttributes = [
    { Name: 'email', Value: form.value.email },
    { Name: 'phone_number', Value: form.value.phoneNumber },
  ]
  emit('update', props.userPoolId || '', props.username || '', userAttributes)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    title="Edit User"
    size="md"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="form.email"
        label="Email"
        placeholder="user@example.com"
      />
      <FormInput
        v-model="form.phoneNumber"
        label="Phone Number"
        placeholder="+15551234567"
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
          @click="handleUpdate"
        >
          Save
        </Button>
      </div>
    </template>
  </Modal>
</template>