<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import { LockOpenIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'decrypt': [ciphertext: string]
}>()

const decryptForm = defineModel<{ ciphertext: string }>('decryptForm', {
  default: { ciphertext: '' }
})

const decryptedResult = defineModel<string>('decryptedResult', {
  default: ''
})

function handleClose() {
  decryptedResult.value = ''
  emit('update:open', false)
}

function handleDecrypt() {
  if (!decryptForm.value.ciphertext) return
  emit('decrypt', decryptForm.value.ciphertext)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Decrypt Data"
    size="lg"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
          Ciphertext
        </label>
        <textarea
          v-model="decryptForm.ciphertext"
          rows="4"
          placeholder="Enter ciphertext to decrypt..."
          class="block w-full rounded-md shadow-sm border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div
        v-if="decryptedResult"
        class="space-y-2"
      >
        <label class="block text-sm font-medium text-light-text dark:text-dark-text">
          Decrypted Result
        </label>
        <div class="p-4 rounded-lg bg-light-bg dark:bg-dark-bg">
          <p class="text-sm font-mono text-light-text dark:text-dark-text break-all">
            {{ decryptedResult }}
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        variant="secondary"
        @click="handleClose"
      >
        Close
      </Button>
      <Button
        variant="primary"
        :disabled="!decryptForm.ciphertext"
        @click="handleDecrypt"
      >
        <template #icon-left>
          <LockOpenIcon class="h-4 w-4" />
        </template>
        Decrypt
      </Button>
    </template>
  </Modal>
</template>
