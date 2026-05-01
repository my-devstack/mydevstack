<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'

const settingsStore = useSettingsStore()

const props = defineProps<{
  open: boolean
  loading: boolean
  newParamName: string
  newParamValue: string
  newParamType: 'String' | 'StringList' | 'SecureString'
  newParamDescription: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:new-param-name', value: string): void
  (e: 'update:new-param-value', value: string): void
  (e: 'update:new-param-type', value: 'String' | 'StringList' | 'SecureString'): void
  (e: 'update:new-param-description', value: string): void
  (e: 'create'): void
}>()
</script>

<template>
  <Modal
    :open="open"
    title="Create Parameter"
    size="md"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-4">
      <FormInput
        :model-value="newParamName"
        label="Name"
        placeholder="/my-app/feature-flag"
        required
        help-text="Use a path-like structure for organization (e.g., /app/env/var)"
        @update:model-value="emit('update:new-param-name', $event)"
      />

      <FormSelect
        :model-value="newParamType"
        label="Type"
        :options="[
          { value: 'String', label: 'String - Plain text value' },
          { value: 'StringList', label: 'StringList - Comma-separated list' },
          { value: 'SecureString', label: 'SecureString - Encrypted value' },
        ]"
        @update:model-value="emit('update:new-param-type', $event)"
      />

      <div>
        <label
          class="block text-sm font-medium mb-1"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Value
        </label>
        <textarea
          :value="newParamValue"
          class="w-full h-24 px-3 py-2 rounded-lg border bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          placeholder="Enter parameter value"
          required
          @input="emit('update:new-param-value', ($event.target as HTMLTextAreaElement).value)"
        />
      </div>

      <FormInput
        :model-value="newParamDescription"
        label="Description"
        placeholder="Optional description"
        @update:model-value="emit('update:new-param-description', $event)"
      />
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
          aria-label="Create"
          :loading="loading"
          @click="emit('create')"
        >
          Create
        </Button>
      </div>
    </template>
  </Modal>
</template>
