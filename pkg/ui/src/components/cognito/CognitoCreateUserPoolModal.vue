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
  create: [data: { PoolName: string }]
}>()

const poolName = ref('')

function handleCreate() {
  emit('create', { PoolName: poolName.value })
}

function handleClose() {
  poolName.value = ''
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create User Pool"
    size="md"
    @update:open="handleClose"
  >
    <form
      class="space-y-4"
      @submit.prevent="handleCreate"
    >
      <FormInput
        v-model="poolName"
        label="Pool Name"
        placeholder="my-user-pool"
        help-text="Name of the user pool to create"
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
        @click="handleCreate"
      >
        Create
      </Button>
    </template>
  </Modal>
</template>