<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import FormInput from '@/components/common/FormInput.vue'
import Button from '@/components/common/Button.vue'

const props = defineProps<{
  open: boolean
  functionName: string
  memory?: number
  timeout?: number
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update-config': [memory: number, timeout: number]
}>()

const settingsStore = useSettingsStore()

const form = ref({
  memory: props.memory || 128,
  timeout: props.timeout || 30,
})

function handleUpdate() {
  emit('update-config', form.value.memory, form.value.timeout)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    title="Update Function Configuration"
    size="sm"
    @update:open="handleClose"
    @close="handleClose"
  >
    <div class="space-y-4">
      <p class="text-sm text-light-muted dark:text-dark-muted">
        Updating configuration for: <strong>{{ functionName }}</strong>
      </p>

      <FormInput
        v-model.number="form.memory"
        label="Memory (MB)"
        type="number"
      />

      <FormInput
        v-model.number="form.timeout"
        label="Timeout (seconds)"
        type="number"
      />
    </div>

    <template #footer>
      <div class="flex gap-2">
        <Button
          variant="secondary"
          @click="handleClose"
        >
          Cancel
        </Button>
        <Button
          :disabled="loading"
          @click="handleUpdate"
        >
          {{ loading ? 'Updating...' : 'Update' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>