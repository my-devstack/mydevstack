<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import FormInput from '@/components/common/FormInput.vue'
import Button from '@/components/common/Button.vue'
import type { CloudFrontCreateInvalidationRequest } from '@/api/types/aws'

const props = defineProps<{
  open: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [data: CloudFrontCreateInvalidationRequest]
}>()

const settingsStore = useSettingsStore()

const form = ref({
  paths: '/*',
})

function handleConfirm() {
  if (!form.value.paths.trim()) return
  const paths = form.value.paths.split('\n').map(p => p.trim()).filter(p => p)
  emit('create', { Paths: paths })
}

function handleClose() {
  emit('update:open', false)
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      form.value.paths = '/*'
    }
  },
  { immediate: true }
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
      role="dialog"
      aria-label="Create Invalidation"
    >
      <h2
        class="text-xl font-bold mb-4"
        :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
      >
        Create Invalidation
      </h2>

      <div class="mb-4">
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
          Paths (one per line)
        </label>
        <textarea
          v-model="form.paths"
          class="block w-full rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2 font-mono text-sm"
          rows="5"
          placeholder="/*"
        />
        <p class="text-xs text-light-muted dark:text-dark-muted mt-1">
          Enter paths to invalidate, one per line. Use /* to invalidate all objects.
        </p>
      </div>

      <div class="flex gap-2 justify-end mt-6">
        <Button
          variant="secondary"
          @click="handleClose"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          :disabled="!form.paths.trim() || loading"
          :loading="loading"
          @click="handleConfirm"
        >
          {{ loading ? 'Creating...' : 'Create' }}
        </Button>
      </div>
    </div>
  </div>
</template>
