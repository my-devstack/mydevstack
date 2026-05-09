<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import type { StateMachineItem } from '@/composables/useStepFunctions'

const settingsStore = useSettingsStore()

const props = defineProps<{
  open: boolean
  loading: boolean
  stateMachineToDelete: StateMachineItem | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <Modal
    :open="open"
    title="Delete State Machine"
    size="sm"
    @update:open="emit('update:open', $event)"
  >
    <p :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
      Are you sure you want to delete state machine <strong>{{ stateMachineToDelete?.name }}</strong>? This action cannot be undone.
    </p>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="secondary"
          @click="emit('update:open', false)"
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          :loading="loading"
          @click="emit('confirm')"
        >
          Delete
        </Button>
      </div>
    </template>
  </Modal>
</template>
