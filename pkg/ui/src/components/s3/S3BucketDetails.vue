<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import {
  ShieldCheckIcon,
  KeyIcon,
  TagIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'

interface BucketDetails {
  versioning: { status: string; mfaDelete: string } | null
  encryption: { algorithm: string; keyId: string } | null
  tags: Array<{ Key: string; Value: string }>
  lifecycleRules: Array<{ ID?: string; Status: string; Filter?: { Prefix?: string }; Expiration?: { Days?: number }; Transitions?: Array<{ StorageClass: string }> }>
  loading: boolean
}

interface Props {
  bucketName: string
  details?: BucketDetails | null
}

const props = withDefaults(defineProps<Props>(), {
  details: null,
})

const emit = defineEmits<{
  close: []
  addTrigger: [bucketName: string]
  viewPolicy: [bucketName: string]
  manageLifecycle: [bucketName: string]
  toggleVersioning: [bucketName: string, enable: boolean]
}>()

const settingsStore = useSettingsStore()

function getVersioningToggleClass(enable: boolean): string {
  return enable
    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50'
}

function getLifecycleRuleCount(): number {
  return props.details?.lifecycleRules?.length || 0
}

function getVersioningStatusClass(status: string): string {
  switch (status) {
    case 'Enabled':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'Suspended':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
  }
}

function getEncryptionClass(algorithm: string): string {
  switch (algorithm) {
    case 'AES256':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'aws:kms':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
  }
}
</script>

<template>
  <div
    v-if="details?.loading"
    class="mt-4 text-center py-4"
  >
    <div class="inline-block animate-spin rounded-full h-6 w-6 border-4 border-blue-600 border-t-transparent" />
    <p class="mt-2 text-sm text-light-muted dark:text-dark-muted">
      Loading bucket details...
    </p>
  </div>
  <div
    v-else-if="details"
    class="mt-4 space-y-4"
  >
    <!-- Versioning -->
    <div>
      <div class="flex items-center gap-2 mb-2">
        <ShieldCheckIcon class="w-4 h-4 text-primary-500" />
        <label class="text-xs font-medium text-light-muted dark:text-dark-muted uppercase">Versioning</label>
      </div>
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        :class="getVersioningStatusClass(details.versioning?.status || 'Unknown')"
      >
        {{ details.versioning?.status || 'Unknown' }}
      </span>
      <span
        v-if="details.versioning?.mfaDelete === 'Enabled'"
        class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      >
        MFA Delete
      </span>
      <button
        v-if="details.versioning?.status === 'Enabled'"
        type="button"
        class="ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded"
        :class="getVersioningToggleClass(false)"
        @click="emit('toggleVersioning', bucketName, false)"
      >
        <ArrowPathIcon class="w-3 h-3" />
        Disable
      </button>
      <button
        v-if="details.versioning?.status === '' || details.versioning?.status === 'Suspended'"
        type="button"
        class="ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded"
        :class="getVersioningToggleClass(true)"
        @click="emit('toggleVersioning', bucketName, true)"
      >
        <ArrowPathIcon class="w-3 h-3" />
        Enable
      </button>
    </div>

    <!-- Encryption -->
    <div>
      <div class="flex items-center gap-2 mb-2">
        <KeyIcon class="w-4 h-4 text-primary-500" />
        <label class="text-xs font-medium text-light-muted dark:text-dark-muted uppercase">Encryption</label>
      </div>
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        :class="getEncryptionClass(details.encryption?.algorithm || 'None')"
      >
        {{ details.encryption?.algorithm || 'None' }}
      </span>
      <span
        v-if="details.encryption?.keyId"
        class="ml-2 text-xs text-light-muted dark:text-dark-muted"
      >
        KMS Key: {{ details.encryption.keyId.substring(0, 20) }}...
      </span>
    </div>

    <!-- Tags -->
    <div>
      <div class="flex items-center gap-2 mb-2">
        <TagIcon class="w-4 h-4 text-primary-500" />
        <label class="text-xs font-medium text-light-muted dark:text-dark-muted uppercase">Tags</label>
      </div>
      <div
        v-if="details.tags && details.tags.length > 0"
        class="flex flex-wrap gap-2"
      >
        <span
          v-for="tag in details.tags"
          :key="tag.Key"
          class="inline-flex items-center px-2 py-1 rounded text-sm bg-light-border dark:bg-dark-border text-light-text dark:text-dark-text"
        >
          <span class="font-medium">{{ tag.Key }}</span>
          <span class="mx-1 text-light-muted dark:text-dark-muted">=</span>
          <span>{{ tag.Value }}</span>
        </span>
      </div>
      <p
        v-else
        class="text-sm text-light-muted dark:text-dark-muted"
      >
        No tags
      </p>
    </div>

    <!-- Lifecycle -->
    <div>
      <div class="flex items-center gap-2 mb-2">
        <CalendarDaysIcon class="w-4 h-4 text-primary-500" />
        <label class="text-xs font-medium text-light-muted dark:text-dark-muted uppercase">Lifecycle Rules</label>
      </div>
      <p class="text-sm text-light-text dark:text-dark-text mb-2">
        {{ getLifecycleRuleCount() > 0 ? `${getLifecycleRuleCount()} rule(s)` : 'No rules' }}
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
        @click="emit('manageLifecycle', bucketName)"
      >
        <CalendarDaysIcon class="w-3.5 h-3.5" />
        Manage Lifecycle
      </button>
    </div>

    <!-- Actions -->
    <div class="flex gap-2 pt-2 border-t border-light-border dark:border-dark-border">
      <button
        type="button"
        class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
        @click="emit('addTrigger', bucketName)"
      >
        <CloudArrowUpIcon class="w-3.5 h-3.5" />
        Add Trigger
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        @click="emit('viewPolicy', bucketName)"
      >
        <DocumentTextIcon class="w-3.5 h-3.5" />
        View Policy
      </button>
    </div>
  </div>
</template>