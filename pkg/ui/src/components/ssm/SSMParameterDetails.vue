<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import { EyeIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import Button from '@/components/common/Button.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import type { SSMParameterItem } from '@/composables/useSSM'

const settingsStore = useSettingsStore()

const props = defineProps<{
  parameter: SSMParameterItem | null
}>()

const emit = defineEmits<{
  (e: 'view-value'): void
  (e: 'view-history'): void
  (e: 'update', value: string): void
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
  <div
    v-if="parameter"
    class="p-6 rounded-lg border"
    :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
  >
    <h3
      class="text-lg font-semibold mb-4"
      :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
    >
      Parameter: {{ parameter.Name }}
    </h3>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      <div>
        <p
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Tier
        </p>
        <p
          class="mt-1 font-medium"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          {{ parameter.Tier || 'Standard' }}
        </p>
      </div>
      <div>
        <p
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Data Type
        </p>
        <p
          class="mt-1 font-medium"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          {{ parameter.DataType || 'text' }}
        </p>
      </div>
    </div>

    <div class="mt-4 flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        @click="emit('view-value')"
      >
        <EyeIcon class="h-4 w-4 mr-1" />
        View Value
      </Button>
      <Button
        variant="secondary"
        size="sm"
        @click="emit('view-history')"
      >
        <ArrowPathIcon class="h-4 w-4 mr-1" />
        View History
      </Button>
    </div>
  </div>
</template>
