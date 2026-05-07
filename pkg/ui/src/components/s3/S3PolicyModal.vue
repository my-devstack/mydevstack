<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import * as s3Api from '@/api/services/s3'

const props = defineProps<{
  open: boolean
  bucketName: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const settingsStore = useSettingsStore()

const loading = ref(false)
const policy = ref('')
const error = ref<string | null>(null)

watch(() => props.open, async (isOpen) => {
  if (isOpen && props.bucketName) {
    await loadPolicy()
  }
})

async function loadPolicy() {
  loading.value = true
  error.value = null
  policy.value = ''
  
  try {
    const result = await s3Api.getBucketPolicy(props.bucketName)
    if (result && result.Policy) {
      // Parse and format the JSON policy
      const parsed = JSON.parse(result.Policy)
      policy.value = JSON.stringify(parsed, null, 2)
    } else {
      policy.value = 'No bucket policy configured'
    }
  } catch (e: any) {
    if (e.message && e.message.includes('NoSuchBucketPolicy')) {
      policy.value = 'No bucket policy configured'
    } else {
      error.value = 'Failed to load policy: ' + e.message
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="emit('update:open', false)"
  >
    <div
      class="p-6 rounded-lg w-[600px] max-h-[80vh] overflow-auto shadow-xl"
      :class="settingsStore.darkMode ? 'bg-gray-800' : 'bg-white'"
    >
      <h2
        class="text-xl font-bold mb-4"
        :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
      >
        Bucket Policy: {{ bucketName }}
      </h2>
      
      <div
        v-if="loading"
        class="text-center py-8"
      >
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        <p
          class="mt-2"
          :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        >
          Loading policy...
        </p>
      </div>
      
      <div
        v-else-if="error"
        class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4"
      >
        {{ error }}
      </div>
      
      <pre
        v-else
        class="p-4 rounded-lg overflow-auto text-sm font-mono max-h-[50vh]"
        :class="settingsStore.darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-800'"
      >{{ policy }}</pre>
      
      <div class="flex justify-end mt-4">
        <button
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          @click="emit('update:open', false)"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>