<script setup lang="ts">
import { ref } from 'vue'
import { ArchiveBoxIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import S3BucketDetails from './S3BucketDetails.vue'
import { useSettingsStore } from '@/stores/settings'

interface Bucket {
  Name: string
  CreationDate?: string
}

interface BucketDetails {
  versioning: { status: string; mfaDelete: string } | null
  encryption: { algorithm: string; keyId: string } | null
  tags: Array<{ Key: string; Value: string }>
  loading: boolean
}

const props = defineProps<{
  buckets: Bucket[]
  bucketDetails?: Record<string, BucketDetails>
  loading?: boolean
}>()

const emit = defineEmits<{
  'select-bucket': [bucketName: string]
  'delete-bucket': [bucketName: string]
  'expand-bucket': [bucketName: string]
  'add-trigger': [bucketName: string]
  'view-policy': [bucketName: string]
}>()

const settingsStore = useSettingsStore()
const expandedBucket = ref<string | null>(null)

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

function toggleBucketExpansion(bucketName: string) {
  if (expandedBucket.value === bucketName) {
    expandedBucket.value = null
  } else {
    expandedBucket.value = bucketName
    emit('expand-bucket', bucketName)
  }
}
</script>

<template>
  <div
    v-if="loading && buckets.length === 0"
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

  <div
    v-else-if="buckets.length === 0"
    class="text-center py-12"
  >
    <p
      class="text-lg"
      :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
    >
      No buckets found. Create one to get started!
    </p>
  </div>

  <div
    v-else
    class="space-y-4"
  >
    <div
      v-for="bucket in buckets"
      :key="bucket.Name"
      class="border rounded-lg overflow-hidden"
      :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
    >
      <!-- Accordion Header -->
      <div
        class="grid grid-cols-12 gap-4 px-4 py-4 items-center cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg"
        :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-light-surface'"
        @click="toggleBucketExpansion(bucket.Name)"
      >
        <div class="col-span-8 flex items-center gap-2">
          <ArchiveBoxIcon class="h-5 w-5 text-primary-500" />
          <span class="font-medium text-light-text dark:text-dark-text">{{ bucket.Name }}</span>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ formatDate(bucket.CreationDate) }}
          </span>
        </div>
        <div
          class="col-span-4 text-right"
          @click.stop
        >
          <div class="flex items-center justify-end gap-2">
            <button
              type="button"
              class="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600"
              title="View Objects"
              @click.stop="emit('select-bucket', bucket.Name)"
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </button>
            <button
              type="button"
              class="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
              title="Delete"
              @click="emit('delete-bucket', bucket.Name)"
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
            <component
              :is="expandedBucket === bucket.Name ? ChevronDownIcon : ChevronRightIcon"
              class="h-5 w-5 text-light-muted dark:text-dark-muted"
            />
          </div>
        </div>
      </div>

      <!-- Accordion Content -->
      <div
        v-if="expandedBucket === bucket.Name"
        class="px-4 pb-4 border-t"
        :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
      >
        <S3BucketDetails
          :bucket-name="bucket.Name"
          :details="bucketDetails?.[bucket.Name] || null"
          @add-trigger="(name) => emit('add-trigger', name)"
          @view-policy="(name) => emit('view-policy', name)"
        />
      </div>
    </div>
  </div>
</template>