<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { useContentReload } from '@/composables/useContentReload'
import { ArchiveBoxIcon } from '@heroicons/vue/24/outline'
import { s3Service } from '@/api/services/s3'
import S3BucketsList from '@/components/s3/S3BucketsList.vue'
import S3ObjectsList from '@/components/s3/S3ObjectsList.vue'
import S3CreateModal from '@/components/s3/S3CreateModal.vue'
import S3ViewModal from '@/components/s3/S3ViewModal.vue'
import S3DeleteModal from '@/components/s3/S3DeleteModal.vue'
import S3CodeExamples from '@/components/s3/S3CodeExamples.vue'

const { reloadTrigger } = useContentReload()

const settingsStore = useSettingsStore()
const toast = useToast()

// State
const buckets = ref<any[]>([])
const objects = ref<any[]>([])
const selectedBucket = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const uploading = ref(false)

// Modals
const showCreateModal = ref(false)
const showViewModal = ref(false)
const showDeleteModal = ref(false)

// View modal state
const viewFileName = ref('')
const viewContent = ref('')
const viewContentType = ref('')
const viewLoading = ref(false)
const viewError = ref<string | null>(null)

// Delete modal state
const itemToDelete = ref<{ type: 'bucket' | 'object', name: string } | null>(null)

// Load buckets from S3
async function loadBuckets() {
  loading.value = true
  error.value = null
  
  try {
    const response = await s3Service.listBuckets()
    buckets.value = response
  } catch (e: any) {
    error.value = 'Failed to load buckets: ' + e.message
  } finally {
    loading.value = false
  }
}

// Load objects in a bucket
async function loadObjects(bucketName: string) {
  selectedBucket.value = bucketName
  loading.value = true
  error.value = null
  
  try {
    const response = await s3Service.listObjects(bucketName)
    objects.value = response.objects
  } catch (e: any) {
    error.value = 'Failed to load objects: ' + e.message
  } finally {
    loading.value = false
  }
}

// Create bucket
async function handleCreateBucket(name: string, options?: { enableCors?: boolean }) {
  if (!name.trim()) return
  
  loading.value = true
  error.value = null
  
  try {
    await s3Service.createBucket(name.trim(), options)
    showCreateModal.value = false
    await loadBuckets()
  } catch (e: any) {
    error.value = 'Failed to create bucket: ' + e.message
  } finally {
    loading.value = false
  }
}

// Delete bucket
async function deleteBucket() {
  if (!itemToDelete.value || itemToDelete.value.type !== 'bucket') return
  
  const name = itemToDelete.value.name
  loading.value = true
  error.value = null
  
  try {
    await s3Service.deleteBucket(name)
    showDeleteModal.value = false
    itemToDelete.value = null
    toast.success(`Bucket "${name}" deleted successfully`)
    await loadBuckets()
  } catch (e: any) {
    const errMsg = e.message || ''
    if (e.name === 'BucketNotEmpty' || e.statusCode === 409 || errMsg.includes('not empty') || errMsg.includes('BucketNotEmpty')) {
      error.value = 'Conflict: Cannot delete bucket - Bucket is not empty. Delete all objects first.'
    } else {
      error.value = 'Failed to delete bucket: ' + errMsg
    }
  } finally {
    loading.value = false
  }
}

// Upload file
async function uploadFile(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length || !selectedBucket.value) return
  
  const file = input.files[0]
  uploading.value = true
  error.value = null
  
  try {
    const arrayBuffer = await file.arrayBuffer()
    await s3Service.putObject(
      selectedBucket.value,
      file.name,
      new Uint8Array(arrayBuffer),
      file.type || 'application/octet-stream'
    )
    await loadObjects(selectedBucket.value)
  } catch (e: any) {
    error.value = 'Failed to upload: ' + e.message
  } finally {
    uploading.value = false
    input.value = ''
  }
}

// Delete object
async function deleteObject() {
  if (!itemToDelete.value || itemToDelete.value.type !== 'object' || !selectedBucket.value) return
  
  const key = itemToDelete.value.name
  loading.value = true
  error.value = null
  
  try {
    await s3Service.deleteObject(selectedBucket.value, key)
    showDeleteModal.value = false
    itemToDelete.value = null
    toast.success('Object deleted')
    await loadObjects(selectedBucket.value)
  } catch (e: any) {
    error.value = 'Failed to delete: ' + e.message
  } finally {
    loading.value = false
  }
}

// View object in modal
async function viewObject(key: string) {
  viewFileName.value = key
  viewContent.value = ''
  viewContentType.value = ''
  viewError.value = null
  showViewModal.value = true
  viewLoading.value = true

  try {
    const response = await s3Service.getObject(selectedBucket.value!, key)
    viewContentType.value = response.contentType
    
    if (response.contentType.startsWith('text/') || response.contentType === 'application/json' || response.contentType.includes('json')) {
      const decoder = new TextDecoder('utf-8', { fatal: false })
      viewContent.value = decoder.decode(response.body)
    } else {
      viewContent.value = `Binary file: ${key}\nType: ${response.contentType}`
    }
  } catch (e: any) {
    viewError.value = 'Failed to view object: ' + e.message
  } finally {
    viewLoading.value = false
  }
}

// Download object
async function downloadObject(key: string) {
  try {
    const response = await s3Service.getObject(selectedBucket.value!, key)
    
    const blob = new Blob([response.body], { type: response.contentType })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const fileName = key.split('/').pop() || key
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (e: any) {
    toast.error('Failed to download object: ' + e.message)
  }
}

// Modal handlers
function confirmDeleteBucket(name: string) {
  itemToDelete.value = { type: 'bucket', name }
  showDeleteModal.value = true
}

function confirmDeleteObject(key: string) {
  itemToDelete.value = { type: 'object', name: key }
  showDeleteModal.value = true
}

function closeViewModal() {
  showViewModal.value = false
  viewContent.value = ''
  viewFileName.value = ''
  viewContentType.value = ''
  viewError.value = null
}

// Navigation
function goBack() {
  selectedBucket.value = null
  objects.value = []
}

onMounted(() => {
  loadBuckets()
})

watch(reloadTrigger, () => {
  loadBuckets()
  selectedBucket.value = null
  objects.value = []
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <ArchiveBoxIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            {{ selectedBucket ? selectedBucket : 'S3 Buckets' }}
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ selectedBucket ? `${objects.length} object(s)` : `${buckets.length} bucket(s)` }}
          </span>
        </div>
        
        <div class="flex items-center gap-2">
          <button
            v-if="selectedBucket"
            class="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
            @click="goBack"
          >
            ← Back
          </button>
          <button
            v-if="selectedBucket"
            class="p-2 text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border rounded"
            title="Refresh"
            @click="loadObjects(selectedBucket!)"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <button
            v-if="!selectedBucket"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            @click="showCreateModal = true"
          >
            + Create Bucket
          </button>
          <button
            v-if="!selectedBucket"
            class="p-2 text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border rounded"
            title="Refresh"
            @click="loadBuckets"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
    >
      {{ error }}
      <button
        class="float-right font-bold"
        @click="error = null"
      >
        ×
      </button>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="text-center py-12"
    >
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      <p
        class="mt-2"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
      >
        Loading...
      </p>
    </div>

    <!-- Buckets List -->
    <S3BucketsList
      v-if="!loading && !selectedBucket"
      :buckets="buckets"
      @select-bucket="loadObjects"
      @delete-bucket="confirmDeleteBucket"
    />

    <!-- Objects List -->
    <S3ObjectsList
      v-if="!loading && selectedBucket"
      :bucket-name="selectedBucket"
      :objects="objects"
      :uploading="uploading"
      @select-object="viewObject"
      @download-object="downloadObject"
      @delete-object="confirmDeleteObject"
      @upload-file="uploadFile"
    />

    <!-- Create Bucket Modal -->
    <S3CreateModal
      :open="showCreateModal"
      :loading="loading"
      @update:open="showCreateModal = $event"
      @create="handleCreateBucket"
    />

    <!-- View Object Modal -->
    <S3ViewModal
      :open="showViewModal"
      :file-name="viewFileName"
      :content="viewContent"
      :content-type="viewContentType"
      :loading="viewLoading"
      :error="viewError"
      :bucket-name="selectedBucket"
      @update:open="showViewModal = $event"
      @close="closeViewModal"
      @download="downloadObject"
    />

    <!-- Delete Confirmation Modal -->
    <S3DeleteModal
      :open="showDeleteModal"
      :item="itemToDelete"
      :loading="loading"
      @update:open="showDeleteModal = $event"
      @delete="itemToDelete?.type === 'bucket' ? deleteBucket() : deleteObject()"
    />

    <!-- Usage Examples Section -->
    <S3CodeExamples
      v-if="!selectedBucket"
      :region="settingsStore.region"
      :access-key="settingsStore.accessKey"
      :secret-key="settingsStore.secretKey"
    />
  </div>
</template>