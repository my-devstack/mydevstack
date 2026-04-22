<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{
  open: boolean
  item: { type: 'bucket' | 'object', name: string } | null
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'delete': []
}>()

const settingsStore = useSettingsStore()
</script>

<template>
  <Modal
    :open="open"
    :title="item?.type === 'bucket' ? 'Delete Bucket' : 'Delete Object'"
    size="sm"
    @update:open="(v) => emit('update:open', v)"
    @close="emit('update:open', false)"
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
        Delete "{{ item?.name }}"?
      </p>
      <p
        class="text-sm"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
      >
        <template v-if="item?.type === 'bucket'">
          This will permanently delete the bucket and all its objects. This action cannot be undone.
        </template>
        <template v-else>
          This will permanently delete the object. This action cannot be undone.
        </template>
      </p>
    </div>
    
    <template #footer>
      <button
        class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 mr-2"
        @click="emit('update:open', false)"
      >
        Cancel
      </button>
      <button
        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        :disabled="loading"
        @click="emit('delete')"
      >
        {{ loading ? 'Deleting...' : 'Delete' }}
      </button>
    </template>
  </Modal>
</template>