<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { useContentReload } from '@/composables/useContentReload'
import { ArchiveBoxIcon } from '@heroicons/vue/24/outline'
import { s3Service } from '@/api/services/s3'
import Modal from '@/components/common/Modal.vue'
import DataTable from '@/components/common/DataTable.vue'

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
const uploadProgress = ref(0)

// View modal state
const showViewModal = ref(false)
const viewFileName = ref('')
const viewContent = ref('')
const viewContentType = ref('')
const viewLoading = ref(false)
const viewError = ref<string | null>(null)

// Delete modal state
const showDeleteModal = ref(false)
const itemToDelete = ref<{ type: 'bucket' | 'object', name: string } | null>(null)

// Bucket columns
const bucketColumns = computed(() => [
  { key: 'Name', label: 'Name', sortable: true },
  { key: 'CreationDate', label: 'Created', sortable: true },
])

// Example code tabs
const selectedExample = ref(0)

// Code examples
const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List buckets
aws s3 ls --endpoint-url http://127.0.0.1:4566

# Create bucket
aws s3 mb s3://my-bucket --endpoint-url http://127.0.0.1:4566

# List objects in bucket
aws s3 ls s3://my-bucket/ --endpoint-url http://127.0.0.1:4566

# Upload file
aws s3 cp my-file.txt s3://my-bucket/ --endpoint-url http://127.0.0.1:4566

# Download file
aws s3 cp s3://my-bucket/my-file.txt ./my-file.txt --endpoint-url http://127.0.0.1:4566

# Delete object
aws s3 rm s3://my-bucket/my-file.txt --endpoint-url http://127.0.0.1:4566

# Delete bucket
aws s3 rb s3://my-bucket --endpoint-url http://127.0.0.1:4566`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { S3Client, ListBucketsCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const client = new S3Client({
  region: '${settingsStore.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
  forcePathStyle: true,
});

// List buckets
const buckets = await client.send(new ListBucketsCommand({}));
console.log(buckets.Buckets);

// Upload file
await client.send(new PutObjectCommand({
  Bucket: 'my-bucket',
  Key: 'my-file.txt',
  Body: 'Hello World',
  ContentType: 'text/plain',
}));

// Download file
const response = await client.send(new GetObjectCommand({
  Bucket: 'my-bucket',
  Key: 'my-file.txt',
}));
const body = await response.Body.transformToString();
console.log(body);

// Delete file
await client.send(new DeleteObjectCommand({
  Bucket: 'my-bucket',
  Key: 'my-file.txt',
}));`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3

client = boto3.client(
    's3',
    region_name='${settingsStore.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List buckets
response = client.list_buckets()
for bucket in response['Buckets']:
    print(f"  {bucket['Name']}")

# Upload file
client.put_object(
    Bucket='my-bucket',
    Key='my-file.txt',
    Body='Hello World',
    ContentType='text/plain',
)

# Download file
response = client.get_object(Bucket='my-bucket', Key='my-file.txt')
print(response['Body'].read().decode('utf-8'))

# Delete file
client.delete_object(Bucket='my-bucket', Key='my-file.txt')`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/s3"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

client := s3.New(s3.Options{
    Region: "${settingsStore.region}",
    BaseURL: aws.String("http://127.0.0.1:4566"),
    Credentials: aws.CredentialsProviderFunc(
        func(ctx context.Context) (aws.Credentials, error) {
            return aws.Credentials{
                AccessKeyID:     "${settingsStore.accessKey}",
                SecretAccessKey: "${settingsStore.secretKey}",
            }, nil
        },
    ),
})

// List buckets
buckets, _ := client.ListBuckets(context.Background(), &s3.ListBucketsInput{})
fmt.Println(buckets.Buckets)

// Upload file
client.PutObject(context.Background(), &s3.PutObjectInput{
    Bucket:      aws.String("my-bucket"),
    Key:         aws.String("my-file.txt"),
    Body:        strings.NewReader("Hello World"),
    ContentType: aws.String("text/plain"),
})

// Download file
output, _ := client.GetObject(context.Background(), &s3.GetObjectInput{
    Bucket: aws.String("my-bucket"),
    Key:    aws.String("my-file.txt"),
})
body, _ := io.ReadAll(output.Body)
fmt.Println(string(body))`
  },
])

// Computed
const isTextContent = computed(() => {
  return viewContentType.value.startsWith('text/') || 
         viewContentType.value === 'application/json' ||
         viewContentType.value.includes('json')
})

const isImageContent = computed(() => {
  return viewContentType.value.startsWith('image/')
})

const isJsonContent = computed(() => {
  return viewContentType.value === 'application/json' || viewContentType.value.includes('json')
})

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
async function createBucket(name: string, options?: { enableCors?: boolean }) {
  if (!name.trim()) return
  
  loading.value = true
  error.value = null
  
  try {
    
    await s3Service.createBucket(name.trim(), options)
    await loadBuckets()
  } catch (e: any) {
    error.value = 'Failed to create bucket: ' + e.message
  } finally {
    loading.value = false
  }
}

// Delete bucket
function confirmDeleteBucket(name: string) {
  itemToDelete.value = { type: 'bucket', name }
  showDeleteModal.value = true
}

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
  uploadProgress.value = 0
  error.value = null
  
  try {
    
    const arrayBuffer = await file.arrayBuffer()
    await s3Service.putObject(
      selectedBucket.value,
      file.name,
      new Uint8Array(arrayBuffer),
      file.type || 'application/octet-stream'
    )
    uploadProgress.value = 100
    await loadObjects(selectedBucket.value)
  } catch (e: any) {
    error.value = 'Failed to upload: ' + e.message
  } finally {
    uploading.value = false
    input.value = ''
  }
}

// Delete object
function confirmDeleteObject(key: string) {
  itemToDelete.value = { type: 'object', name: key }
  showDeleteModal.value = true
}

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
      viewContent.value = `Binary file: ${key}\nType: ${response.contentType}\nSize: ${formatSize(response.body.byteLength)}`
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

// Close view modal
function closeViewModal() {
  showViewModal.value = false
  viewContent.value = ''
  viewFileName.value = ''
  viewContentType.value = ''
  viewError.value = null
}

// Format file size
function formatSize(bytes: number | string): string {
  const num = typeof bytes === 'string' ? parseInt(bytes) : bytes
  if (isNaN(num) || num <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(num) / Math.log(k))
  return parseFloat((num / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Format date
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

// Go back to buckets list
function goBack() {
  selectedBucket.value = null
  objects.value = []
}

// New bucket modal state
const showCreateModal = ref(false)
const newBucketName = ref('')
const enableCors = ref(false)

function openCreateModal() {
  newBucketName.value = ''
  enableCors.value = false
  showCreateModal.value = true
}

function handleCreateBucket() {
  if (newBucketName.value.trim()) {
    createBucket(newBucketName.value, { enableCors: enableCors.value })
    showCreateModal.value = false
  }
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
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            v-if="!selectedBucket"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            @click="openCreateModal"
          >
            + Create Bucket
          </button>
          <button
            v-if="!selectedBucket"
            class="p-2 text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border rounded"
            title="Refresh"
            @click="loadBuckets"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
    <div v-if="!loading && !selectedBucket">
      <div
        v-if="buckets.length === 0"
        class="text-center py-12"
      >
        <p
          class="text-lg"
          :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        >
          No buckets found. Create one to get started!
        </p>
      </div>
      
      <!-- Buckets List -->
      <DataTable
        v-else
        :columns="bucketColumns"
        :data="buckets"
        :loading="loading"
        selectable
        empty-message="No buckets found. Create one to get started!"
        @row-click="(row) => loadObjects(row.Name)"
      >
        <template #cell-Name="{ value, row }">
          <div class="flex items-center gap-2">
            <ArchiveBoxIcon class="h-5 w-5 text-primary-500" />
            <span class="font-medium text-light-text dark:text-dark-text">{{ value }}</span>
          </div>
        </template>
        <template #cell-CreationDate="{ value }">
          <span class="text-light-muted dark:text-dark-muted">{{ formatDate(value) }}</span>
        </template>
        <template #row-actions="{ row }">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
              title="Delete"
              @click.stop="confirmDeleteBucket(row.Name)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Objects List -->
    <div v-if="!loading && selectedBucket">
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
            @change="uploadFile"
          >
        </label>
        <span
          v-if="uploading"
          class="ml-4"
        >
          <span class="animate-pulse">Uploading...</span>
        </span>
      </div>

      <!-- Objects Table -->
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
                  @click="viewObject(obj.Key)"
                >
                  View
                </button>
                <button
                  class="text-green-500 hover:text-green-700 text-sm mr-3"
                  @click="downloadObject(obj.Key)"
                >
                  Download
                </button>
                <button
                  class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Delete"
                  @click="confirmDeleteObject(obj.Key)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Bucket Modal -->
    <div 
      v-if="showCreateModal" 
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showCreateModal = false"
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
          v-model="newBucketName"
          type="text"
          placeholder="Enter bucket name"
          class="w-full px-3 py-2 border rounded-lg mb-4"
          :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
          @keyup.enter="handleCreateBucket"
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
            @click="showCreateModal = false"
          >
            Cancel
          </button>
          <button
            :disabled="!newBucketName.trim() || loading"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            @click="handleCreateBucket"
          >
            Create
          </button>
        </div>
      </div>
    </div>

    <!-- View File Modal -->
    <Modal
      :open="showViewModal"
      :title="viewFileName"
      size="xl"
      @update:open="showViewModal = $event"
      @close="closeViewModal"
    >
      <!-- Loading state -->
      <div
        v-if="viewLoading"
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
        v-else-if="viewError"
        class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
      >
        {{ viewError }}
      </div>

      <!-- Image content -->
      <div
        v-else-if="isImageContent"
        class="text-center"
      >
        <img 
          :src="`/s3/${selectedBucket}/${encodeURIComponent(viewFileName)}`" 
          :alt="viewFileName"
          class="max-w-full max-h-[60vh] mx-auto rounded-lg"
        >
      </div>

      <!-- JSON content -->
      <div v-else-if="isJsonContent">
        <pre 
          class="p-4 rounded-lg overflow-auto max-h-[60vh] text-sm font-mono"
          :class="settingsStore.darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-800'"
        >{{ viewContent }}</pre>
      </div>

      <!-- Text content -->
      <div v-else-if="isTextContent">
        <pre 
          class="p-4 rounded-lg overflow-auto max-h-[60vh] text-sm font-mono whitespace-pre-wrap"
          :class="settingsStore.darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-800'"
        >{{ viewContent }}</pre>
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
          Type: {{ viewContentType }}
        </p>
      </div>

      <template #footer>
        <div class="flex gap-2">
          <button
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            @click="downloadObject(viewFileName)"
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
            @click="closeViewModal"
          >
            Close
          </button>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal
      :open="showDeleteModal"
      :title="itemToDelete?.type === 'bucket' ? 'Delete Bucket' : 'Delete Object'"
      size="sm"
      @update:open="showDeleteModal = $event"
      @close="showDeleteModal = false"
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
          Delete "{{ itemToDelete?.name }}"?
        </p>
        <p
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
        >
          <template v-if="itemToDelete?.type === 'bucket'">
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
          @click="showDeleteModal = false"
        >
          Cancel
        </button>
        <button
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          :disabled="loading"
          @click="itemToDelete?.type === 'bucket' ? deleteBucket() : deleteObject()"
        >
          {{ loading ? 'Deleting...' : 'Delete' }}
        </button>
      </template>
    </Modal>

    <!-- Usage Examples Section -->
    <div
      v-if="!selectedBucket"
      class="mt-8"
    >
      <h2
        class="text-lg font-semibold mb-4"
        :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
      >
        Usage Examples
      </h2>
      <div
        class="rounded-lg border overflow-hidden"
        :class="settingsStore.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
      >
        <div
          class="flex border-b"
          :class="settingsStore.darkMode ? 'border-gray-700' : 'border-gray-200'"
        >
          <button
            v-for="(example, index) in codeExamples"
            :key="example.language"
            class="px-4 py-2 text-sm font-medium transition-colors"
            :class="[
              selectedExample === index
                ? settingsStore.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                : settingsStore.darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            ]"
            @click="selectedExample = index"
          >
            {{ example.label }}
          </button>
        </div>
        <div class="p-4 overflow-x-auto">
          <pre
            class="text-sm font-mono"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >{{ codeExamples[selectedExample].code }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>
