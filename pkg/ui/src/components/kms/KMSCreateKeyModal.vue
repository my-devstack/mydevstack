<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = defineProps<{
  open: boolean
  keySpecs: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': []
}>()

const form = defineModel<{ description: string; keyUsage: string; keySpec: string }>('form', { 
  default: { description: '', keyUsage: 'ENCRYPT_DECRYPT', keySpec: 'SYMMETRIC_DEFAULT' } 
})

function handleClose() {
  emit('update:open', false)
}

function handleCreate() {
  emit('create')
  handleClose()
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create KMS Key"
    size="md"
    @update:open="handleClose"
  >
    <form
      class="space-y-4"
      @submit.prevent="handleCreate"
    >
      <FormInput
        v-model="form.description"
        label="Description"
        placeholder="Key description"
      />

      <div>
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
          Key Usage
        </label>
        <select
          v-model="form.keyUsage"
          class="block w-full rounded-md shadow-sm border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="ENCRYPT_DECRYPT">
            Encrypt and Decrypt
          </option>
          <option value="SIGN_VERIFY">
            Sign and Verify
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
          Key Spec
        </label>
        <select
          v-model="form.keySpec"
          class="block w-full rounded-md shadow-sm border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option
            v-for="spec in props.keySpecs"
            :key="spec.value"
            :value="spec.value"
          >
            {{ spec.label }}
          </option>
        </select>
      </div>
    </form>

    <template #footer>
      <Button
        variant="secondary"
        @click="handleClose"
      >
        Cancel
      </Button>
      <Button @click="handleCreate">
        Create
      </Button>
    </template>
  </Modal>
</template>