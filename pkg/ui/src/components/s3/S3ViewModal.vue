<script setup lang="ts">
import { computed } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{
  open: boolean
  fileName: string
  content: string
  contentType: string
  loading?: boolean
  error?: string | null
  bucketName: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'close': []
  'download': [key: string]
}>()

const settingsStore = useSettingsStore()

const isTextContent = computed(() => {
  return props.contentType.startsWith('text/') || 
         props.contentType === 'application/json' ||
         props.contentType.includes('json')
})

const isImageContent = computed(() => {
  return props.contentType.startsWith('image/')
})

const isJsonContent = computed(() => {
  return props.contentType === 'application/json' || props.contentType.includes('json')
})
</script>

<template>
  <Modal
    :open="open"
    :title="fileName"
    size="xl"
    @update:open="(v) => emit('update:open', v)"
    @close="emit('close')"
  >
    <!-- Loading state -->
    <div
      v-if="loading"
      class="text-center py-8"
    >
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      <p
        class="mt-2"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
      >
        Loading file...
      </p>
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
    >
      {{ error }}
    </div>

    <!-- Image content -->
    <div
      v-else-if="isImageContent"
      class="text-center"
    >
      <img 
        :src="`/s3/${bucketName}/${encodeURIComponent(fileName)}`" 
        :alt="fileName"
        class="max-w-full max-h-[60vh] mx-auto rounded-lg"
      >
    </div>

    <!-- JSON content -->
    <div v-else-if="isJsonContent">
      <pre 
        class="p-4 rounded-lg overflow-auto max-h-[60vh] text-sm font-mono"
        :class="settingsStore.darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-800'"
      >{{ content }}</pre>
    </div>

    <!-- Text content -->
    <div v-else-if="isTextContent">
      <pre 
        class="p-4 rounded-lg overflow-auto max-h-[60vh] text-sm font-mono whitespace-pre-wrap"
        :class="settingsStore.darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-800'"
      >{{ content }}</pre>
    </div>

    <!-- Binary file info -->
    <div
      v-else
      class="text-center py-8"
    >
      <p
        class="text-lg mb-4"
        :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
      >
        Binary file - cannot display content
      </p>
      <p
        class="text-sm"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
      >
        Type: {{ contentType }}
      </p>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <button
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          @click="emit('download', fileName)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Download
        </button>
        <button
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          @click="emit('close')"
        >
          Close
        </button>
      </div>
    </template>
  </Modal>
</template>