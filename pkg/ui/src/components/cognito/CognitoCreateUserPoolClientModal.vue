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
  create: [data: { ClientName: string; GenerateSecret?: boolean }]
}>()

const newClient = ref({
  ClientName: '',
  GenerateSecret: false,
})

function handleCreate() {
  emit('create', {
    ClientName: newClient.value.ClientName,
    GenerateSecret: newClient.value.GenerateSecret || undefined,
  })
}

function handleClose() {
  newClient.value = { ClientName: '', GenerateSecret: false }
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create User Pool Client"
    size="md"
    @update:open="handleClose"
  >
    <form
      class="space-y-4"
      @submit.prevent="handleCreate"
    >
      <FormInput
        v-model="newClient.ClientName"
        label="Client Name"
        placeholder="web-app"
        required
      />
      <label class="flex items-center gap-2 text-sm text-light-text dark:text-dark-text cursor-pointer">
        <input
          v-model="newClient.GenerateSecret"
          type="checkbox"
          class="rounded border-light-border dark:border-dark-border text-primary-500 focus:ring-primary-500"
        >
        Generate Client Secret
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
        :disabled="!newClient.ClientName.trim()"
        @click="handleCreate"
      >
        Create
      </Button>
    </template>
  </Modal>
</template>