<script setup lang="ts">
import { computed } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'

const props = defineProps<{
  open: boolean
  title?: string
  name?: string
  loading?: boolean
  type?: 'rest' | 'http' | 'resource' | 'method' | 'deployment' | 'stage'
  itemName?: string
  itemType?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
  'delete': []
}>()

const itemTitle = computed(() => props.title || props.name || props.itemName || '')
const itemTypeValue = computed(() => props.type || props.itemType || 'item')

function handleClose() {
  emit('update:open', false)
}

function handleDelete() {
  emit('confirm')
  emit('delete')
}
</script>

<template>
  <Modal
    :open="open"
    :title="`Delete ${itemTitle}`"
    size="md"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="space-y-4">
      <div class="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
        <svg
          class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <p class="text-sm text-red-800 dark:text-red-200">
            Are you sure you want to delete the {{ itemTypeValue }} "{{ itemTitle }}"?
          </p>
          <p class="text-xs text-red-700 dark:text-red-300 mt-1">
            <template v-if="itemTypeValue === 'rest' || itemTypeValue === 'http'">
              This will delete the API and all its resources. This action cannot be undone.
            </template>
            <template v-else-if="itemTypeValue === 'resource'">
              This will delete the resource and all its methods. This action cannot be undone.
            </template>
            <template v-else-if="itemTypeValue === 'method'">
              This will delete the method and its integration. This action cannot be undone.
            </template>
            <template v-else-if="itemTypeValue === 'deployment'">
              This will delete the deployment. This action cannot be undone.
            </template>
            <template v-else-if="itemTypeValue === 'stage'">
              This will delete the stage. This action cannot be undone.
            </template>
          </p>
        </div>
      </div>
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
          variant="danger"
          :disabled="loading"
          @click="handleDelete"
        >
          {{ loading ? 'Deleting...' : 'Delete' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>