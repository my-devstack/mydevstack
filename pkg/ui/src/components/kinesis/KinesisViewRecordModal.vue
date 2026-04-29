<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import JsonViewer from '@/components/common/JsonViewer.vue'
import { useSettingsStore } from '@/stores/settings'
import type { KinesisRecord } from '@/composables/useKinesis'

const settingsStore = useSettingsStore()

const props = defineProps<{
  open: boolean
  selectedRecord: KinesisRecord | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

function decodeData(base64Data: string): string {
  try {
    return atob(base64Data)
  } catch {
    return base64Data
  }
}

function getDecodedData(): any {
  if (!props.selectedRecord) return {}
  try {
    return JSON.parse(decodeData(props.selectedRecord.Data))
  } catch {
    return decodeData(props.selectedRecord.Data)
  }
}
</script>

<template>
  <Modal
    :open="open"
    title="Record Details"
    size="lg"
    @update:open="emit('update:open', $event)"
  >
    <div
      v-if="selectedRecord"
      class="space-y-4"
    >
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p
            class="text-sm"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            Partition Key
          </p>
          <p
            class="mt-1 font-medium"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ selectedRecord.PartitionKey }}
          </p>
        </div>
        <div>
          <p
            class="text-sm"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            Sequence Number
          </p>
          <code
            class="mt-1 text-xs block"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ selectedRecord.SequenceNumber }}
          </code>
        </div>
      </div>
      
      <div>
        <p
          class="text-sm mb-2"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Data
        </p>
        <JsonViewer :data="getDecodedData()" />
      </div>
    </div>
    
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="secondary"
          @click="emit('update:open', false)"
        >
          Close
        </Button>
      </div>
    </template>
  </Modal>
</template>
