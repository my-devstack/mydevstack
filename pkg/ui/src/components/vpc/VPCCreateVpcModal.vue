<script setup lang="ts">
import { reactive } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = withDefaults(defineProps<{
  open: boolean
  creating?: boolean
}>(), {
  creating: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [data: { CidrBlock: string }]
}>()

const form = reactive({
  CidrBlock: '10.0.0.0/16',
})

function handleClose() {
  emit('update:open', false)
}

function handleSubmit() {
  emit('create', { CidrBlock: form.CidrBlock })
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create VPC"
    size="md"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="form.CidrBlock"
        label="CIDR Block"
        placeholder="10.0.0.0/16"
        required
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
          :loading="props.creating"
          @click="handleSubmit"
        >
          Create VPC
        </Button>
      </div>
    </template>
  </Modal>
</template>
