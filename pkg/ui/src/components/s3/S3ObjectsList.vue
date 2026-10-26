<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import {
  FolderIcon,
  FolderArrowDownIcon,
  DocumentArrowUpIcon,
  FolderPlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'

interface S3Object {
  Key: string
  Size?: number | string
  LastModified?: string
}

const props = defineProps<{
  objects: S3Object[]
  prefixes?: string[]
  currentPrefix?: string
  bucketName: string
  loading?: boolean
  uploading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  'open-folder': [prefix: string]
  'create-folder': [name: string]
  'select-object': [key: string]
  'download-object': [key: string]
  'delete-object': [key: string]
  'delete-folder': [prefix: string]
  'copy-link': [key: string]
  'upload-file': [event: Event]
  'upload-folder': [event: Event]
}>()

const settingsStore = useSettingsStore()

const folderNames = computed(() => {
  const prefix = props.currentPrefix || ''
  return (props.prefixes || []).map(p => {
    const name = p.replace(prefix, '').replace(/\/$/, '')
    return { fullPrefix: p, displayName: name }
  })
})

function getRelativeName(key: string): string {
  const prefix = props.currentPrefix || ''
  if (!prefix) return key
  if (key.startsWith(prefix)) return key.slice(prefix.length)
  return key
}

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
function handleCreateFolder() {
  const name = window.prompt('Enter folder name:')
  if (name && name.trim()) {
    emit('create-folder', name.trim())
  }
}

function handleFolderKeydown(event: KeyboardEvent, prefix: string) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('open-folder', prefix)
  }
}

const emptyMessage = computed(() => {
  const prefix = props.currentPrefix || ''
  return prefix ? 'This folder is empty. Upload files or create subfolders.' : 'No objects in this bucket. Upload a file to get started!'
})
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
      Actions
    </h3>
    <div class="flex flex-wrap items-center gap-2">
      <label
        class="inline-flex p-2 rounded text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border"
        :class="uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'"
        title="Upload Files"
        aria-label="Upload Files"
      >
        <DocumentArrowUpIcon class="w-4 h-4" />
        <input
          type="file"
          multiple
          class="hidden"
          :disabled="uploading"
          @change="(e) => emit('upload-file', e)"
        >
      </label>
      <label
        class="inline-flex p-2 rounded text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border"
        :class="uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'"
        title="Upload Folder"
        aria-label="Upload Folder"
      >
        <FolderArrowDownIcon class="w-4 h-4 rotate-180" />
        <input
          type="file"
          webkitdirectory
          directory
          class="hidden"
          :disabled="uploading"
          @change="(e) => emit('upload-folder', e)"
        >
      </label>
      <button
        type="button"
        class="p-2 rounded text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border"
        :class="uploading ? 'opacity-50 cursor-not-allowed' : ''"
        :disabled="uploading"
        :title="uploading ? 'Uploading...' : 'Create Folder'"
        aria-label="Create Folder"
        @click="handleCreateFolder"
      >
        <FolderPlusIcon class="w-4 h-4" />
      </button>
      <span
        v-if="uploading"
        class="sr-only"
        aria-live="polite"
      >
        Uploading...
      </span>
    </div>
  </div>

  <!-- Error Banner -->
  <div
    v-if="error"
    class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
    :class="settingsStore.darkMode ? 'bg-red-900 border-red-700 text-red-200' : ''"
  >
    {{ error }}
  </div>

  <!-- Loading Skeleton -->
  <div
    v-if="loading"
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
          v-for="i in 5"
          :key="i"
          class="border-t"
          :class="settingsStore.darkMode ? 'border-gray-700' : 'border-gray-200'"
        >
          <td class="px-4 py-3">
            <div
              class="h-4 bg-gray-200 rounded animate-pulse"
              :class="settingsStore.darkMode ? 'bg-gray-700' : ''"
            />
          </td>
          <td class="px-4 py-3">
            <div
              class="h-4 bg-gray-200 rounded animate-pulse w-16"
              :class="settingsStore.darkMode ? 'bg-gray-700' : ''"
            />
          </td>
          <td class="px-4 py-3">
            <div
              class="h-4 bg-gray-200 rounded animate-pulse w-32"
              :class="settingsStore.darkMode ? 'bg-gray-700' : ''"
            />
          </td>
          <td class="px-4 py-3">
            <div
              class="h-4 bg-gray-200 rounded animate-pulse w-24"
              :class="settingsStore.darkMode ? 'bg-gray-700' : ''"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Empty State -->
  <div
    v-else-if="folderNames.length === 0 && objects.length === 0"
    class="text-center py-12"
  >
    <p
      class="text-lg"
      :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
    >
      {{ emptyMessage }}
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
        <!-- Folder Rows -->
        <tr
          v-for="folder in folderNames"
          :key="folder.fullPrefix"
          class="border-t cursor-pointer hover:bg-light-border dark:hover:bg-dark-border"
          :class="settingsStore.darkMode ? 'border-gray-700' : 'border-gray-200'"
          role="button"
          tabindex="0"
          @click="emit('open-folder', folder.fullPrefix)"
          @keydown="handleFolderKeydown($event, folder.fullPrefix)"
        >
          <td class="px-4 py-3 font-mono text-sm">
            <div class="flex items-center gap-2">
              <FolderIcon class="w-5 h-5 text-blue-500" />
              <span class="font-semibold">{{ folder.displayName }}</span>
            </div>
          </td>
          <td class="px-4 py-3">
            -
          </td>
          <td class="px-4 py-3">
            -
          </td>
          <td class="px-4 py-3">
            <button
              type="button"
              class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
              title="Delete Folder"
              aria-label="Delete Folder"
              @click.stop="emit('delete-folder', folder.fullPrefix)"
            >
              <TrashIcon class="w-4 h-4" />
            </button>
          </td>
        </tr>

        <!-- File Rows -->
        <tr
          v-for="obj in objects"
          :key="obj.Key"
          class="border-t"
          :class="settingsStore.darkMode ? 'border-gray-700' : 'border-gray-200'"
        >
          <td class="px-4 py-3 font-mono text-sm">
            {{ getRelativeName(obj.Key) }}
          </td>
          <td class="px-4 py-3">
            {{ formatSize(obj.Size) }}
          </td>
          <td class="px-4 py-3">
            {{ formatDate(obj.LastModified) }}
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="p-2 rounded text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border"
                title="View"
                aria-label="View"
                @click="emit('select-object', obj.Key)"
              >
                <MagnifyingGlassIcon class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-2 rounded text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border"
                title="Download"
                aria-label="Download"
                @click="emit('download-object', obj.Key)"
              >
                <ArrowDownTrayIcon class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-2 rounded text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border"
                title="Copy Link"
                aria-label="Copy Link"
                @click="handleCopyLink(obj.Key)"
              >
                <DocumentDuplicateIcon class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                title="Delete"
                aria-label="Delete"
                @click="emit('delete-object', obj.Key)"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
