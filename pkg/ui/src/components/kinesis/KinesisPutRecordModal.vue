<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import { useSettingsStore } from '@/stores/settings'
import type { RecordForm } from '@/composables/useKinesis'

const settingsStore = useSettingsStore()

const props = defineProps<{
  open: boolean
  isLoading: boolean
  putRecordForm: RecordForm
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'put-record'): void
}>()
</script>

<template>
  <Modal
    :open="open"
    title="Put Record"
    size="md"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-4">
      <FormInput
        v-model="putRecordForm.partitionKey"
        label="Partition Key"
        placeholder="partition-key-1"
        required
        help-text="Used to distribute records across shards"
      />
      <div>
        <label
          class="block text-sm font-medium mb-1"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Data (JSON)
        </label>
        <textarea
          v-model="putRecordForm.data"
          class="w-full h-32 px-3 py-2 rounded-lg border bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          placeholder="{&quot;message&quot;: &quot;hello world&quot;}"
          required
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
          :loading="isLoading"
          @click="emit('put-record')"
        >
          Put Record
        </Button>
      </div>
    </template>
  </Modal>
</template>
