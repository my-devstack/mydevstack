<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import { PlusIcon } from '@heroicons/vue/24/outline'
import Button from '@/components/common/Button.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import type { KinesisStream } from '@/composables/useKinesis'

const settingsStore = useSettingsStore()

const props = defineProps<{
  stream: KinesisStream
}>()

const emit = defineEmits<{
  (e: 'put-record-click'): void
}>()

function getStatus(status: string): 'active' | 'pending' | 'inactive' | 'error' {
  const statusMap: Record<string, 'active' | 'pending' | 'inactive' | 'error'> = {
    ACTIVE: 'active',
    CREATING: 'pending',
    DELETING: 'pending',
    UPDATING: 'pending',
  }
  return statusMap[status] || 'inactive'
}
</script>

<template>
  <div
    class="p-6 rounded-lg border"
    :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
  >
    <div class="flex items-center justify-between mb-4">
      <h3
        class="text-lg font-semibold"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        Stream: {{ stream.StreamName }}
      </h3>
      <Button 
        v-if="stream.StreamStatus === 'ACTIVE'" 
        size="sm" 
        @click="emit('put-record-click')"
      >
        <PlusIcon class="h-4 w-4 mr-1" />
        Put Record
      </Button>
    </div>
    
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <p
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Status
        </p>
        <StatusBadge
          :status="getStatus(stream.StreamStatus)"
          class="mt-1"
        />
      </div>
      <div>
        <p
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Shards
        </p>
        <p
          class="mt-1 font-medium"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          {{ stream.ShardCount }}
        </p>
      </div>
      <div>
        <p
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Retention Period
        </p>
        <p
          class="mt-1 font-medium"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          {{ stream.RetentionPeriodHours }} hours
        </p>
      </div>
      <div>
        <p
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Encryption
        </p>
        <p
          class="mt-1 font-medium"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          {{ stream.EncryptionType }}
        </p>
      </div>
    </div>
  </div>
</template>
