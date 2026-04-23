<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [name: string, displayName: string]
}>()

const form = defineModel<{ name: string; displayName: string }>('form', { default: { name: '', displayName: '' } })

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create SNS Topic"
    size="md"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="form.name"
        label="Topic Name"
        placeholder="my-topic"
        required
      />
      <FormInput
        v-model="form.displayName"
        label="Display Name"
        placeholder="My Topic (optional)"
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
        <Button @click="emit('create', form.name, form.displayName)">
          Create
        </Button>
      </div>
    </template>
  </Modal>
</template>