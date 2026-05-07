<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

export interface CreateBucketOptions {
  enableCors?: boolean
  enableVersioning?: boolean
  encryptionType?: 'AES256' | 'aws:kms'
  kmsKeyId?: string
  blockPublicAccess?: boolean
  tags?: Array<{ Key: string; Value: string }>
  bucketPolicy?: string
}

const props = defineProps<{
  open: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [name: string, options?: CreateBucketOptions]
}>()

const settingsStore = useSettingsStore()
const bucketName = ref('')
const enableCors = ref(false)
const showAdvanced = ref(false)
const enableVersioning = ref(false)
const encryptionType = ref<'AES256' | 'aws:kms' | ''>('')
const kmsKeyId = ref('')
const blockPublicAccess = ref(false)
const tags = ref<Array<{ key: string; value: string }>>([])
const bucketPolicy = ref('')

function addTag() {
  tags.value.push({ key: '', value: '' })
}

function removeTag(index: number) {
  tags.value.splice(index, 1)
}

const hasAdvancedOptions = computed(() => {
  return enableVersioning.value || encryptionType.value || blockPublicAccess.value ||
    tags.value.length > 0 || bucketPolicy.value.trim()
})

function handleCreate() {
  if (bucketName.value.trim()) {
    const options: CreateBucketOptions = {
      enableCors: enableCors.value,
    }

    if (showAdvanced.value) {
      options.enableVersioning = enableVersioning.value
      if (encryptionType.value) {
        options.encryptionType = encryptionType.value
        if (encryptionType.value === 'aws:kms' && kmsKeyId.value.trim()) {
          options.kmsKeyId = kmsKeyId.value.trim()
        }
      }
      options.blockPublicAccess = blockPublicAccess.value
      const validTags = tags.value.filter(t => t.key.trim() && t.value.trim())
      if (validTags.length > 0) {
        options.tags = validTags.map(t => ({ Key: t.key.trim(), Value: t.value.trim() }))
      }
      if (bucketPolicy.value.trim()) {
        options.bucketPolicy = bucketPolicy.value.trim()
      }
    }

    emit('create', bucketName.value, options)
    resetForm()
  }
}

function resetForm() {
  bucketName.value = ''
  enableCors.value = false
  showAdvanced.value = false
  enableVersioning.value = false
  encryptionType.value = ''
  kmsKeyId.value = ''
  blockPublicAccess.value = false
  tags.value = []
  bucketPolicy.value = ''
}

function handleClose() {
  resetForm()
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
      class="p-6 rounded-lg w-[480px] max-h-[90vh] overflow-y-auto shadow-xl"
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

      <!-- Advanced Options Toggle -->
      <button
        type="button"
        class="flex items-center gap-2 text-sm mb-4 cursor-pointer"
        :class="settingsStore.darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'"
        @click="showAdvanced = !showAdvanced"
      >
        <span
          class="transform transition-transform"
          :class="showAdvanced ? 'rotate-90' : ''"
        >▶</span>
        Advanced Options
      </button>

      <!-- Advanced Options Section -->
      <div
        v-if="showAdvanced"
        class="border-t pt-4 mb-4"
      >
        <!-- Versioning -->
        <label class="flex items-center gap-2 mb-3 cursor-pointer">
          <input
            v-model="enableVersioning"
            type="checkbox"
            class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          >
          <span
            class="text-sm"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >
            Enable Versioning
          </span>
        </label>

        <!-- Server-Side Encryption -->
        <div class="mb-3">
          <label
            class="block text-sm mb-1"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >
            Server-Side Encryption
          </label>
          <select
            v-model="encryptionType"
            class="w-full px-3 py-2 border rounded-lg"
            :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
          >
            <option value="">
              None
            </option>
            <option value="AES256">
              AES-256
            </option>
            <option value="aws:kms">
              AWS KMS
            </option>
          </select>
        </div>

        <!-- KMS Key (conditional) -->
        <div
          v-if="encryptionType === 'aws:kms'"
          class="mb-3 ml-4"
        >
          <input
            v-model="kmsKeyId"
            placeholder="KMS Key ID (optional)"
            class="w-full px-3 py-2 border rounded-lg"
            :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 placeholder-gray-400'"
          >
        </div>

        <!-- Block Public Access -->
        <label class="flex items-center gap-2 mb-3 cursor-pointer">
          <input
            v-model="blockPublicAccess"
            type="checkbox"
            class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          >
          <span
            class="text-sm"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >
            Block Public Access
          </span>
        </label>

        <!-- Tags -->
        <div class="mb-3">
          <label
            class="block text-sm mb-2"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >
            Tags
          </label>
          <div
            v-for="(tag, index) in tags"
            :key="index"
            class="flex gap-2 mb-2"
          >
            <input
              v-model="tag.key"
              placeholder="Key"
              class="flex-1 px-3 py-2 border rounded-lg"
              :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 placeholder-gray-400'"
            >
            <input
              v-model="tag.value"
              placeholder="Value"
              class="flex-1 px-3 py-2 border rounded-lg"
              :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 placeholder-gray-400'"
            >
            <button
              type="button"
              class="text-red-500 hover:text-red-600 px-2"
              @click="removeTag(index)"
            >
              ×
            </button>
          </div>
          <button
            type="button"
            class="text-sm text-blue-500 hover:text-blue-600"
            @click="addTag"
          >
            + Add Tag
          </button>
        </div>

        <!-- Bucket Policy (JSON) -->
        <div class="mb-3">
          <label
            class="block text-sm mb-1"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >
            Bucket Policy (JSON)
          </label>
          <textarea
            v-model="bucketPolicy"
            rows="4"
            class="w-full px-3 py-2 border rounded-lg font-mono text-sm"
            :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 placeholder-gray-400'"
            placeholder="{&quot;Version&quot;:&quot;2012-10-17&quot;,&quot;Statement&quot;:[...]}"
          />
        </div>
      </div>

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