<script setup lang="ts">
import { ref } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = defineProps<{
  open: boolean
  username?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [password: string, permanent: boolean]
}>()

const password = ref('')
const permanent = ref(false)

function handleConfirm() {
  emit('confirm', password.value, permanent.value)
}

function handleClose() {
  password.value = ''
  permanent.value = false
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    :title="`Reset Password — ${props.username || ''}`"
    size="md"
    @update:open="handleClose"
  >
    <form
      class="space-y-4"
      @submit.prevent="handleConfirm"
    >
      <FormInput
        v-model="password"
        label="New Password"
        type="password"
        placeholder="NewPass123!"
        required
      />
      <label class="flex items-center gap-2 text-sm text-light-text dark:text-dark-text cursor-pointer">
        <input
          v-model="permanent"
          type="checkbox"
          class="rounded border-light-border dark:border-dark-border text-primary-500 focus:ring-primary-500"
        >
        Permanent password (user won't be forced to change on next login)
      </label>
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
        :disabled="!password"
        @click="handleConfirm"
      >
        Reset Password
      </Button>
    </template>
  </Modal>
</template>