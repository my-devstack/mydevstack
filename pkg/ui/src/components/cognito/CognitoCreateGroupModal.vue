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
  create: [data: { GroupName: string; Description?: string }]
}>()

const newGroup = ref({
  GroupName: '',
  Description: '',
})

function handleCreate() {
  emit('create', {
    GroupName: newGroup.value.GroupName,
    Description: newGroup.value.Description || undefined,
  })
}

function handleClose() {
  newGroup.value = { GroupName: '', Description: '' }
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
    <form
      class="space-y-4"
      @submit.prevent="handleCreate"
    >
      <FormInput
        v-model="newGroup.GroupName"
        label="Group Name"
        placeholder="developers"
        required
      />
      <FormInput
        v-model="newGroup.Description"
        label="Description"
        placeholder="Description of the group"
        help-text="Optional description for the group"
      />
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
        @click="handleCreate"
      >
        Create
      </Button>
    </template>
  </Modal>
</template>