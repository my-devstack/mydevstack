<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import { LockClosedIcon } from '@heroicons/vue/24/outline'
import type { KeyInfo } from '@/composables/useKMS'

const props = defineProps<{
  open: boolean
  selectedKey: KeyInfo | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'encrypt': [plaintext: string]
}>()

const encryptForm = defineModel<{ plaintext: string }>('encryptForm', {
  default: { plaintext: '' }
})

const encryptedResult = defineModel<string>('encryptedResult', {
  default: ''
})

function handleClose() {
  encryptedResult.value = ''
  emit('update:open', false)
}

function handleEncrypt() {
  if (!encryptForm.value.plaintext) return
  emit('encrypt', encryptForm.value.plaintext)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Encrypt Data"
    size="lg"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
          Plaintext
        </label>
        <textarea
          v-model="encryptForm.plaintext"
          rows="4"
          placeholder="Enter text to encrypt..."
          class="block w-full rounded-md shadow-sm border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div
        v-if="encryptedResult"
        class="space-y-2"
      >
        <label class="block text-sm font-medium text-light-text dark:text-dark-text">
          Encrypted Result
        </label>
        <div class="p-4 rounded-lg bg-light-bg dark:bg-dark-bg">
          <p class="text-sm font-mono text-light-text dark:text-dark-text break-all">
            {{ encryptedResult }}
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
        :disabled="!encryptForm.plaintext"
        @click="handleEncrypt"
      >
        <template #icon-left>
          <LockClosedIcon class="h-4 w-4" />
        </template>
        Encrypt
      </Button>
    </template>
  </Modal>
</template>
