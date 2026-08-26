<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import FormInput from '@/components/common/FormInput.vue'
import Button from '@/components/common/Button.vue'
import type { ECRRepository, ECRImageDetail } from '@/api/types/aws'

type ModalMode = 'create' | 'view' | 'delete'

const props = defineProps<{
  open: boolean
  mode: ModalMode
  loading?: boolean
  repository?: ECRRepository | null
  image?: ECRImageDetail | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [data: { repositoryName: string; imageTagMutability: 'MUTABLE' | 'IMMUTABLE'; scanOnPush: boolean }]
  'delete': []
}>()

const settingsStore = useSettingsStore()

const form = ref({
  repositoryName: '',
  imageTagMutability: 'MUTABLE' as 'MUTABLE' | 'IMMUTABLE',
  scanOnPush: false,
})

const mutabilityOptions = [
  { value: 'MUTABLE', label: 'Mutable' },
  { value: 'IMMUTABLE', label: 'Immutable' },
]

const title = computed(() => {
  if (props.mode === 'create') return 'Create ECR Repository'
  if (props.mode === 'delete') return 'Delete Repository'
  return 'Repository Details'
})

const confirmText = computed(() => {
  if (props.mode === 'create') return 'Create'
  if (props.mode === 'delete') return 'Delete'
  return 'Close'
})

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

function handleConfirm() {
  if (props.mode === 'create') {
    if (!form.value.repositoryName.trim()) return
    emit('create', { ...form.value })
  } else if (props.mode === 'delete') {
    emit('delete')
  } else {
    emit('update:open', false)
  }
}

function handleClose() {
  emit('update:open', false)
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      form.value = {
        repositoryName: '',
        imageTagMutability: 'MUTABLE',
        scanOnPush: false,
      }
    }
  }
)
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="handleClose"
  >
    <div
      class="p-6 rounded-lg w-[500px] max-h-[90vh] overflow-y-auto shadow-xl"
      :class="settingsStore.darkMode ? 'bg-gray-800' : 'bg-white'"
    >
      <h2
        class="text-xl font-bold mb-4"
        :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
      >
        {{ title }}
      </h2>

      <!-- Create Mode -->
      <template v-if="mode === 'create'">
        <FormInput
          v-model="form.repositoryName"
          label="Repository Name"
          placeholder="my-app"
          required
          help-text="May include namespaces with / (e.g. project-a/nginx-web-app)"
        />

        <div class="mt-4">
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Image Tag Mutability
          </label>
          <select
            v-model="form.imageTagMutability"
            class="block w-full rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2"
          >
            <option
              v-for="opt in mutabilityOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <label class="mt-4 flex items-center gap-2 cursor-pointer">
          <input
            v-model="form.scanOnPush"
            type="checkbox"
            class="rounded border-light-border dark:border-dark-border"
          >
          <span class="text-sm text-light-text dark:text-dark-text">
            Scan images on push
          </span>
        </label>
      </template>

      <!-- View Mode -->
      <template v-else-if="mode === 'view' && repository">
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Repository Name</label>
            <p class="text-sm text-light-text dark:text-dark-text font-mono">
              {{ repository.RepositoryName }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Repository URI</label>
            <p class="text-sm text-light-text dark:text-dark-text font-mono break-all">
              {{ repository.RepositoryUri || '-' }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">ARN</label>
            <p class="text-sm text-light-text dark:text-dark-text font-mono break-all">
              {{ repository.RepositoryArn || '-' }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Registry ID</label>
              <p class="text-sm text-light-text dark:text-dark-text font-mono">
                {{ repository.RegistryId || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Created</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ formatDate(repository.CreatedAt) }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Mutability</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ repository.ImageTagMutability || 'MUTABLE' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Scan on Push</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ repository.ImageScanningConfiguration?.ScanOnPush ? 'Enabled' : 'Disabled' }}
              </p>
            </div>
          </div>
        </div>
      </template>

      <!-- Delete Mode -->
      <template v-else-if="mode === 'delete'">
        <p class="text-sm text-light-text dark:text-dark-text">
          Are you sure you want to permanently delete repository
          <span class="font-mono font-semibold">{{ repository?.RepositoryName || image?.RepositoryName || '' }}</span>?
        </p>
        <p class="mt-2 text-sm text-red-500">
          This action cannot be undone.
        </p>
      </template>

      <div class="flex gap-2 justify-end mt-6">
        <Button
          variant="secondary"
          @click="handleClose"
        >
          Cancel
        </Button>
        <Button
          :variant="mode === 'delete' ? 'danger' : 'primary'"
          :disabled="(mode === 'create' && !form.repositoryName.trim()) || loading"
          :loading="loading"
          @click="handleConfirm"
        >
          {{ loading ? (mode === 'create' ? 'Creating...' : mode === 'delete' ? 'Deleting...' : 'Loading...') : confirmText }}
        </Button>
      </div>
    </div>
  </div>
</template>