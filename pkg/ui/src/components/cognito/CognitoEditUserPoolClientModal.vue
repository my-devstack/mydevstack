<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = defineProps<{
  open: boolean
  userPoolId?: string
  clientId?: string
  clientName?: string
  refreshTokenValidity?: number
  accessTokenValidity?: number
  idTokenValidity?: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update': [userPoolId: string, clientId: string, params: { ClientName?: string; RefreshTokenValidity?: number; AccessTokenValidity?: number; IdTokenValidity?: number }]
}>()

const form = ref({ ClientName: '', RefreshTokenValidity: 30, AccessTokenValidity: 60, IdTokenValidity: 60 })

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    form.value = {
      ClientName: props.clientName || '',
      RefreshTokenValidity: props.refreshTokenValidity ?? 30,
      AccessTokenValidity: props.accessTokenValidity ?? 60,
      IdTokenValidity: props.idTokenValidity ?? 60,
    }
  }
}, { immediate: true })

function handleUpdate() {
  emit('update', props.userPoolId || '', props.clientId || '', { ...form.value })
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    title="Edit User Pool Client"
    size="md"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="form.ClientName"
        label="Client Name"
        placeholder="web-app"
        required
      />
      <FormInput
        v-model="form.RefreshTokenValidity"
        label="Refresh Token Validity (days)"
        type="number"
        placeholder="30"
      />
      <FormInput
        v-model="form.AccessTokenValidity"
        label="Access Token Validity (minutes)"
        type="number"
        placeholder="60"
      />
      <FormInput
        v-model="form.IdTokenValidity"
        label="ID Token Validity (minutes)"
        type="number"
        placeholder="60"
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
          :disabled="!form.ClientName.trim()"
          @click="handleUpdate"
        >
          Save
        </Button>
      </div>
    </template>
  </Modal>
</template>