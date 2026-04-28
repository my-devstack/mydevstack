<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { ShieldCheckIcon, ShieldExclamationIcon, TrashIcon } from '@heroicons/vue/24/outline'
import type { KeyInfo } from '@/composables/useKMS'
import type { KMSKey } from '@/api/types/aws'

const props = defineProps<{
  open: boolean
  selectedKey: KeyInfo | null
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'enable-key': []
  'disable-key': []
  'delete-key': []
}>()

// Helper functions (local to this component, not duplicated from composable)
// Note: These are simplified versions. The composable has more complete versions.
function getStatusFromKey(key: KeyInfo): 'enabled' | 'disabled' | 'pending' | 'unknown' {
  const state = (key.keyMetadata?.KeyState as string) || 'unknown'
  switch (state) {
    case 'Enabled':
      return 'enabled'
    case 'Disabled':
      return 'disabled'
    case 'PendingDeletion':
    case 'PendingReplicaDeletion':
      return 'pending'
    default:
      return 'unknown'
  }
}

function getStatusLabel(state: string): string {
  const labels: Record<string, string> = {
    Enabled: 'Enabled',
    Disabled: 'Disabled',
    PendingDeletion: 'Pending Deletion',
    PendingReplicaDeletion: 'Pending Replica Deletion',
  }
  return labels[state] || state
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Key Details"
    size="lg"
    @update:open="handleClose"
  >
    <div
      v-if="props.selectedKey?.keyMetadata"
      class="space-y-6"
    >
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Key ID</label>
          <p class="text-sm text-light-text dark:text-dark-text font-mono">
            {{ props.selectedKey.keyMetadata.KeyId }}
          </p>
        </div>
        <div>
          <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Status</label>
          <StatusBadge
            :status="getStatusFromKey(props.selectedKey) === 'enabled' ? 'active' : getStatusFromKey(props.selectedKey) === 'pending' ? 'pending' : 'inactive'"
            :label="getStatusLabel(props.selectedKey.keyMetadata.KeyState || '')"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Key Usage</label>
          <p class="text-sm text-light-text dark:text-dark-text">
            {{ props.selectedKey.keyMetadata.KeyUsage }}
          </p>
        </div>
        <div>
          <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Origin</label>
          <p class="text-sm text-light-text dark:text-dark-text">
            {{ props.selectedKey.keyMetadata.Origin }}
          </p>
        </div>
        <div>
          <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Creation Date</label>
          <p class="text-sm text-light-text dark:text-dark-text">
            {{ props.selectedKey.keyMetadata.CreationDate ? new Date(props.selectedKey.keyMetadata.CreationDate).toLocaleDateString() : '-' }}
          </p>
        </div>
        <div v-if="props.selectedKey.keyMetadata.DeletionDate">
          <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Deletion Date</label>
          <p class="text-sm text-light-text dark:text-dark-text">
            {{ new Date(props.selectedKey.keyMetadata.DeletionDate).toLocaleDateString() }}
          </p>
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">ARN</label>
        <p class="text-sm text-light-text dark:text-dark-text font-mono break-all">
          {{ props.selectedKey.keyMetadata.Arn }}
        </p>
      </div>

      <div v-if="props.selectedKey.keyMetadata.Description">
        <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Description</label>
        <p class="text-sm text-light-text dark:text-dark-text">
          {{ props.selectedKey.keyMetadata.Description }}
        </p>
      </div>

      <div class="flex items-center gap-2 pt-4 border-t border-light-border dark:border-dark-border">
        <Button
          v-if="props.selectedKey.keyMetadata.KeyState === 'Disabled'"
          variant="primary"
          @click="emit('enable-key')"
        >
          <template #icon-left>
            <ShieldCheckIcon class="h-4 w-4" />
          </template>
          Enable Key
        </Button>
        <Button
          v-else-if="props.selectedKey.keyMetadata.KeyState === 'Enabled'"
          variant="secondary"
          @click="emit('disable-key')"
        >
          <template #icon-left>
            <ShieldExclamationIcon class="h-4 w-4" />
          </template>
          Disable Key
        </Button>
        <Button
          variant="danger"
          :disabled="props.selectedKey.keyMetadata.KeyState === 'PendingDeletion'"
          @click="emit('delete-key')"
        >
          <template #icon-left>
            <TrashIcon class="h-4 w-4" />
          </template>
          Schedule Deletion
        </Button>
      </div>
    </div>
    <div
      v-else
      class="flex items-center justify-center py-8"
    >
      <div
        v-if="props.loading"
        class="flex items-center justify-center"
      >
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
      <p
        v-else
        class="text-sm text-light-muted dark:text-dark-muted"
      >
        No key selected
      </p>
    </div>

    <template #footer>
      <Button
        variant="secondary"
        @click="handleClose"
      >
        Close
      </Button>
    </template>
  </Modal>
</template>
