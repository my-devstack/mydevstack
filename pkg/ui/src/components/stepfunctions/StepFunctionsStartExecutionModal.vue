<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'

const settingsStore = useSettingsStore()

const props = defineProps<{
  open: boolean
  loading: boolean
  newExecutionInput: string
  stateMachineName: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:new-execution-input', value: string): void
  (e: 'start'): void
}>()
</script>

<template>
  <Modal
    :open="open"
    :title="`Start Execution: ${stateMachineName}`"
    size="md"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-4">
      <p
        class="text-sm"
        :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
      >
        Provide input for the execution as JSON. Leave empty for no input.
      </p>

      <div>
        <label
          class="block text-sm font-medium mb-1"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Execution Input (JSON)
        </label>
        <textarea
          :value="newExecutionInput"
          class="w-full h-36 px-3 py-2 rounded-lg border bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}"
          @input="emit('update:new-execution-input', ($event.target as HTMLTextAreaElement).value)"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="secondary"
          @click="emit('update:open', false)"
        >
          Cancel
        </Button>
        <Button
          aria-label="Start Execution"
          :loading="loading"
          @click="emit('start')"
        >
          Start Execution
        </Button>
      </div>
    </template>
  </Modal>
</template>
