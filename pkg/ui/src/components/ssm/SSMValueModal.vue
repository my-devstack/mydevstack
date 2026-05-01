<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import { EyeIcon } from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import type { SSMParameterItem } from '@/composables/useSSM'

const settingsStore = useSettingsStore()

const props = defineProps<{
  open: boolean
  loading: boolean
  parameter: SSMParameterItem | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:new-param-value', value: string): void
  (e: 'update'): void
}>()

function getParamTypeStatus(type: string): 'active' | 'pending' | 'inactive' {
  const typeMap: Record<string, 'active' | 'pending' | 'inactive'> = {
    String: 'active',
    StringList: 'active',
    SecureString: 'warning',
  }
  return typeMap[type] || 'inactive'
}
</script>

<template>
  <Modal
    :open="open"
    :title="`Parameter: ${parameter?.Name || ''}`"
    size="md"
    @update:open="emit('update:open', $event)"
  >
    <div
      v-if="parameter"
      class="space-y-4"
    >
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p
            class="text-sm"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            Type
          </p>
          <StatusBadge
            :status="getParamTypeStatus(parameter.Type)"
            :label="parameter.Type"
            class="mt-1"
          />
        </div>
        <div>
          <p
            class="text-sm"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            Version
          </p>
          <p
            class="mt-1 font-medium"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ parameter.Version || 1 }}
          </p>
        </div>
      </div>

      <div>
        <p
          class="text-sm mb-2"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Value
        </p>
        <div
          class="p-4 rounded-lg border font-mono text-sm break-all"
          :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-light-bg border-light-border text-light-text'"
        >
          {{ parameter.Value || '(Value not loaded)' }}
        </div>
      </div>

      <div v-if="parameter.Description">
        <p
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Description
        </p>
        <p
          class="mt-1"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          {{ parameter.Description }}
        </p>
      </div>

      <!-- Update Value Form -->
      <div class="border-t pt-4 mt-4">
        <p
          class="text-sm font-medium mb-2"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Update Value
        </p>
        <textarea
          class="w-full h-24 px-3 py-2 rounded-lg border bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          placeholder="New value"
          @input="emit('update:new-param-value', ($event.target as HTMLTextAreaElement).value)"
        />
        <Button
          class="mt-2"
          size="sm"
          aria-label="Update"
          :loading="loading"
          @click="emit('update')"
        >
          Update
        </Button>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="secondary"
          @click="emit('update:open', false)"
        >
          Close
        </Button>
      </div>
    </template>
  </Modal>
</template>
