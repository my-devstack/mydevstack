<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{
  open: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [name: string, options?: { enableCors?: boolean }]
}>()

const settingsStore = useSettingsStore()
const bucketName = ref('')
const enableCors = ref(false)

function handleCreate() {
  if (bucketName.value.trim()) {
    emit('create', bucketName.value, { enableCors: enableCors.value })
    bucketName.value = ''
    enableCors.value = false
  }
}

function handleClose() {
  bucketName.value = ''
  enableCors.value = false
  emit('update:open', false)
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="handleClose"
  >
    <div
      class="p-6 rounded-lg w-96 shadow-xl"
      :class="settingsStore.darkMode ? 'bg-gray-800' : 'bg-white'"
    >
      <h2
        class="text-xl font-bold mb-4"
        :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
      >
        Create New Bucket
      </h2>
      <input
        v-model="bucketName"
        type="text"
        placeholder="Enter bucket name"
        class="w-full px-3 py-2 border rounded-lg mb-4"
        :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
        @keyup.enter="handleCreate"
      >
      <label class="flex items-center gap-2 mb-4 cursor-pointer">
        <input
          v-model="enableCors"
          type="checkbox"
          class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        >
        <span
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Enable CORS (allows browser access from any origin)
        </span>
      </label>
      <p
        class="text-sm mb-4"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
      >
        Bucket names must be unique and lowercase.
      </p>
      <div class="flex gap-2 justify-end">
        <button
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          @click="handleClose"
        >
          Cancel
        </button>
        <button
          :disabled="!bucketName.trim() || loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          @click="handleCreate"
        >
          {{ loading ? 'Creating...' : 'Create' }}
        </button>
      </div>
    </div>
  </div>
</template>