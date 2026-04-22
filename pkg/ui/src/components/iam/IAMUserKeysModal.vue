<script setup lang="ts">
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'

interface AccessKeyInfo {
  AccessKeyId: string
  Status: 'Active' | 'Inactive'
  CreateDate: string
}

const props = defineProps<{
  open: boolean
  userName: string
  accessKeys: AccessKeyInfo[]
  formatDate: (dateString?: string) => string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create-key': []
  'delete-key': [accessKeyId: string]
}>()

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Access Keys"
    size="lg"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-light-text dark:text-dark-text">
          Access Keys for {{ props.userName }}
        </h3>
        <Button
          variant="primary"
          size="sm"
          @click="emit('create-key')"
        >
          <template #icon-left>
            <PlusIcon class="h-4 w-4" />
          </template>
          Create Key
        </Button>
      </div>

      <EmptyState
        v-if="props.accessKeys.length === 0"
        icon="key"
        title="No access keys"
        description="Create an access key to enable programmatic access"
        compact
      />

      <div
        v-else
        class="space-y-2"
      >
        <div
          v-for="key in props.accessKeys"
          :key="key.AccessKeyId"
          class="flex items-center justify-between p-3 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg"
        >
          <div>
            <p class="text-sm font-mono text-light-text dark:text-dark-text">
              {{ key.AccessKeyId }}
            </p>
            <p class="text-xs text-light-muted dark:text-dark-muted">
              Created: {{ props.formatDate(key.CreateDate) }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <StatusBadge
              :status="key.Status === 'Active' ? 'active' : 'inactive'"
              :label="key.Status"
            />
            <Button
              variant="ghost"
              size="sm"
              @click="emit('delete-key', key.AccessKeyId)"
            >
              <template #icon-left>
                <TrashIcon class="h-4 w-4" />
              </template>
            </Button>
          </div>
        </div>
      </div>
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