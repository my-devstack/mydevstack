<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import type { LambdaEventSourceMapping } from '@/api/types/aws'

const props = defineProps<{
  open: boolean
  mapping: LambdaEventSourceMapping | null
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'delete': []
}>()

const settingsStore = useSettingsStore()

function handleDelete() {
  emit('delete')
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    title="Delete Event Source Mapping"
    size="sm"
    @update:open="handleClose"
    @close="handleClose"
  >
    <div class="text-center py-4">
      <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6 text-red-600 dark:text-red-400"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <p
        class="text-lg font-medium mb-2"
        :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
      >
        Delete Event Source Mapping?
      </p>
      <p
        v-if="mapping"
        class="text-sm mb-2"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
      >
        This will remove the mapping for
        <span class="font-mono text-xs">{{ mapping.FunctionArn?.split(':').pop() }}</span>
      </p>
      <p
        class="text-sm"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
      >
        The Lambda function and event source will not be deleted. This action cannot be undone.
      </p>
    </div>

    <template #footer>
      <Button
        variant="secondary"
        @click="handleClose"
      >
        Cancel
      </Button>
      <Button
        variant="danger"
        :disabled="loading"
        @click="handleDelete"
      >
        {{ loading ? 'Deleting...' : 'Delete' }}
      </Button>
    </template>
  </Modal>
</template>