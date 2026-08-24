<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = defineProps<{
  open: boolean
  userPoolId?: string
  groupName?: string
  description?: string
  roleArn?: string
  precedence?: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update': [userPoolId: string, groupName: string, params: { Description?: string; RoleArn?: string; Precedence?: number }]
}>()

const form = ref({ Description: '', RoleArn: '', Precedence: 0 })

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    form.value = {
      Description: props.description || '',
      RoleArn: props.roleArn || '',
      Precedence: props.precedence ?? 0,
    }
  }
}, { immediate: true })

function handleUpdate() {
  emit('update', props.userPoolId || '', props.groupName || '', { ...form.value })
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    title="Edit Group"
    size="md"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="form.Description"
        label="Description"
        placeholder="Admin group"
      />
      <FormInput
        v-model="form.RoleArn"
        label="Role ARN"
        placeholder="arn:aws:iam::000000000000:role/admin"
      />
      <FormInput
        v-model="form.Precedence"
        label="Precedence"
        type="number"
        placeholder="0"
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