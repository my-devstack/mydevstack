<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{
  open: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [params: { stackName: string; templateBody: string }]
  'reset': []
}>()

const settingsStore = useSettingsStore()

const stackName = ref('')
const templateBody = ref('')
const nameError = ref('')
const templateError = ref('')

function validate() {
  let valid = true
  nameError.value = ''
  templateError.value = ''

  if (!stackName.value.trim()) {
    nameError.value = 'Stack name is required'
    valid = false
  }

  if (!templateBody.value.trim()) {
    templateError.value = 'Template body is required'
    valid = false
  } else {
    try {
      JSON.parse(templateBody.value)
    } catch {
      templateError.value = 'Invalid JSON template'
      valid = false
    }
  }

  return valid
}

function handleCreate() {
  if (!validate()) return

  emit('create', {
    stackName: stackName.value.trim(),
    templateBody: templateBody.value.trim(),
  })
}

function closeModal() {
  emit('update:open', false)
  resetForm()
}

function resetForm() {
  stackName.value = ''
  templateBody.value = ''
  nameError.value = ''
  templateError.value = ''
}

defineExpose({ resetForm })
</script>

<template>
  <div
    v-if="open"
    role="dialog"
    aria-modal="true"
    class="fixed inset-0 z-50 overflow-y-auto"
  >
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/50"
      @click="closeModal"
    />

    <!-- Modal -->
    <div class="flex min-h-screen items-center justify-center p-4">
      <div
        class="relative w-full max-w-2xl rounded-lg shadow-xl"
        :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-white'"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between p-6 border-b"
          :class="settingsStore.darkMode ? 'border-dark-border' : 'border-gray-200'"
        >
          <h3
            class="text-lg font-semibold"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-gray-900'"
          >
            Create New Stack
          </h3>
          <button
            class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border"
            @click="closeModal"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-4">
          <!-- Stack Name -->
          <div>
            <label
              class="block text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-gray-700'"
            >
              Stack Name
            </label>
            <input
              v-model="stackName"
              type="text"
              placeholder="Enter stack name"
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-gray-300 text-gray-900'"
            >
            <p
              v-if="nameError"
              class="mt-1 text-sm text-red-600"
            >
              {{ nameError }}
            </p>
          </div>

          <!-- Template Body -->
          <div>
            <label
              class="block text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-gray-700'"
            >
              Template Body (JSON)
            </label>
            <textarea
              v-model="templateBody"
              rows="10"
              placeholder="{\n  &quot;AWSTemplateFormatVersion&quot;: &quot;2010-09-09&quot;,\n  &quot;Resources&quot;: {}\n}"
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
              :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-gray-300 text-gray-900'"
            />
            <p
              v-if="templateError"
              class="mt-1 text-sm text-red-600"
            >
              {{ templateError }}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-end gap-3 p-6 border-t"
          :class="settingsStore.darkMode ? 'border-dark-border' : 'border-gray-200'"
        >
          <button
            class="px-4 py-2 text-sm font-medium rounded-lg border"
            :class="settingsStore.darkMode ? 'border-dark-border text-dark-text hover:bg-dark-border' : 'border-gray-300 text-gray-700 hover:bg-gray-50'"
            @click="closeModal"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            :disabled="loading"
            @click="handleCreate"
          >
            <span v-if="loading">Creating...</span>
            <span v-else>Create Stack</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
