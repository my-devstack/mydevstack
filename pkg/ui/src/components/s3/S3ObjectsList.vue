<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

interface S3Object {
  Key: string
  Size?: number | string
  LastModified?: string
}

const props = defineProps<{
  objects: S3Object[]
  bucketName: string
  loading?: boolean
  uploading?: boolean
}>()

const emit = defineEmits<{
  'select-object': [key: string]
  'download-object': [key: string]
  'delete-object': [key: string]
  'copy-link': [key: string]
  'upload-file': [event: Event]
}>()

const settingsStore = useSettingsStore()

async function handleCopyLink(key: string) {
  emit('copy-link', key)
}

function formatSize(bytes: number | string | undefined): string {
  if (!bytes) return '0 B'
  const num = typeof bytes === 'string' ? parseInt(bytes) : bytes
  if (isNaN(num) || num <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(num) / Math.log(k))
  return parseFloat((num / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}
</script>

<template>
  <!-- Upload Section -->
  <div
    class="mb-6 p-4 rounded-lg border"
    :class="settingsStore.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
  >
    <h3
      class="font-semibold mb-3"
      :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
    >
      Upload File
    </h3>
    <label class="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
      <span v-if="uploading">Uploading...</span>
      <span v-else>Choose File</span>
      <input
        type="file"
        class="hidden"
        :disabled="uploading"
        @change="(e) => emit('upload-file', e)"
      >
    </label>
    <span
      v-if="uploading"
      class="ml-4"
    >
      <span class="animate-pulse">Uploading...</span>
    </span>
  </div>

  <!-- Empty State -->
  <div
    v-if="objects.length === 0"
    class="text-center py-12"
  >
    <p
      class="text-lg"
      :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
    >
      No objects in this bucket. Upload a file to get started!
    </p>
  </div>

  <!-- Objects Table -->
  <div
    v-else
    class="overflow-x-auto"
  >
    <table class="w-full">
      <thead>
        <tr :class="settingsStore.darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'">
          <th class="px-4 py-3 text-left text-sm font-medium">
            Name
          </th>
          <th class="px-4 py-3 text-left text-sm font-medium">
            Size
          </th>
          <th class="px-4 py-3 text-left text-sm font-medium">
            Last Modified
          </th>
          <th class="px-4 py-3 text-left text-sm font-medium">
            Actions
          </th>
        </tr>
      </thead>
      <tbody :class="settingsStore.darkMode ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-700'">
        <tr
          v-for="obj in objects"
          :key="obj.Key"
          class="border-t"
          :class="settingsStore.darkMode ? 'border-gray-700' : 'border-gray-200'"
        >
          <td class="px-4 py-3 font-mono text-sm">
            {{ obj.Key }}
          </td>
          <td class="px-4 py-3">
            {{ formatSize(obj.Size) }}
          </td>
          <td class="px-4 py-3">
            {{ formatDate(obj.LastModified) }}
          </td>
          <td class="px-4 py-3">
            <button
              class="text-blue-500 hover:text-blue-700 text-sm mr-3"
              @click="emit('select-object', obj.Key)"
            >
              View
            </button>
            <button
              class="text-green-500 hover:text-green-700 text-sm mr-3"
              @click="emit('download-object', obj.Key)"
            >
              Download
            </button>
            <button
              class="text-purple-500 hover:text-purple-700 text-sm mr-3"
              title="Copy Link"
              @click="handleCopyLink(obj.Key)"
            >
              Copy Link
            </button>
            <button
              class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
              title="Delete"
              @click="emit('delete-object', obj.Key)"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>