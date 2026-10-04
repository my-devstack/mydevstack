<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import FormInput from '@/components/common/FormInput.vue'
import Button from '@/components/common/Button.vue'
import type { CloudFrontCreateOriginAccessControlRequest } from '@/api/types/aws'

const props = defineProps<{
  open: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [data: CloudFrontCreateOriginAccessControlRequest]
}>()

const settingsStore = useSettingsStore()

const form = ref({
  name: '',
  description: '',
  originType: 's3',
  signingBehavior: 'always',
  signingProtocol: 'sigv4',
})

function handleConfirm() {
  if (!form.value.name.trim()) return
  emit('create', {
    Name: form.value.name,
    Description: form.value.description || undefined,
    OriginAccessControlOriginType: form.value.originType,
    SigningBehavior: form.value.signingBehavior,
    SigningProtocol: form.value.signingProtocol,
  })
}

function handleClose() {
  emit('update:open', false)
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      form.value = {
        name: '',
        description: '',
        originType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      }
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
      aria-label="Create Origin Access Control"
    >
      <h2
        class="text-xl font-bold mb-4"
        :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
      >
        Create Origin Access Control
      </h2>

      <FormInput
        v-model="form.name"
        label="Name"
        placeholder="my-oac"
        required
      />

      <FormInput
        v-model="form.description"
        label="Description"
        placeholder="Optional description"
      />

      <div class="mt-4">
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
          Origin Type
        </label>
        <select
          v-model="form.originType"
          class="block w-full rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2"
        >
          <option value="s3">
            S3
          </option>
        </select>
      </div>

      <div class="mt-4">
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
          Signing Behavior
        </label>
        <select
          v-model="form.signingBehavior"
          class="block w-full rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2"
        >
          <option value="always">
            Always
          </option>
          <option value="never">
            Never
          </option>
        </select>
      </div>

      <div class="mt-4">
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
          Signing Protocol
        </label>
        <select
          v-model="form.signingProtocol"
          class="block w-full rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2"
        >
          <option value="sigv4">
            sigv4
          </option>
        </select>
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
          :disabled="!form.name.trim() || loading"
          :loading="loading"
          @click="handleConfirm"
        >
          {{ loading ? 'Creating...' : 'Create' }}
        </Button>
      </div>
    </div>
  </div>
</template>
