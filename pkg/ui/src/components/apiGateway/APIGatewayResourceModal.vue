<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = defineProps<{
  open: boolean
  parentId: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [pathPart: string]
}>()

const settingsStore = useSettingsStore()
const pathPart = ref('')

function handleCreate() {
  if (!pathPart.value.trim()) return
  emit('create', pathPart.value.trim())
}

function handleClose() {
  pathPart.value = ''
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    title="Create Resource"
    size="sm"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="pathPart"
        label="Resource Path"
        placeholder="/my-resource"
        help-text="e.g., /users, /items/{id}"
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
          :loading="loading"
          :disabled="!pathPart.trim()"
          @click="handleCreate"
        >
          {{ loading ? 'Creating...' : 'Create' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>