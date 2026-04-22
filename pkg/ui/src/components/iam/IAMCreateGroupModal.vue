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
  create: [data: { GroupName: string; Path?: string }]
}>()

const newGroup = ref({
  GroupName: '',
  Path: '',
})

function handleCreate() {
  emit('create', {
    GroupName: newGroup.value.GroupName,
    Path: newGroup.value.Path || undefined,
  })
}

function handleClose() {
  newGroup.value = { GroupName: '', Path: '' }
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create Group"
    size="md"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="newGroup.GroupName"
        label="Group Name"
        placeholder="my-group"
        required
      />
      <FormInput
        v-model="newGroup.Path"
        label="Path (optional)"
        placeholder="/"
        help-text="The path for the group"
      />
    </div>
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