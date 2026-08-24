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
  create: [data: { Identifier: string; Name: string }]
}>()

const newServer = ref({
  Identifier: '',
  Name: '',
})

function handleCreate() {
  emit('create', {
    Identifier: newServer.value.Identifier,
    Name: newServer.value.Name,
  })
}

function handleClose() {
  newServer.value = { Identifier: '', Name: '' }
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create Resource Server"
    size="md"
    @update:open="handleClose"
  >
    <form
      class="space-y-4"
      @submit.prevent="handleCreate"
    >
      <FormInput
        v-model="newServer.Identifier"
        label="Identifier"
        placeholder="api.example.com"
        required
      />
      <FormInput
        v-model="newServer.Name"
        label="Name"
        placeholder="API Server"
        required
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
        :disabled="!newServer.Identifier.trim() || !newServer.Name.trim()"
        @click="handleCreate"
      >
        Create
      </Button>
    </template>
  </Modal>
</template>