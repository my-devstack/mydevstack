<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import type { MSKClusterSummary } from '@/composables/useMSK'

const props = defineProps<{
  open: boolean
  isLoading: boolean
  cluster: MSKClusterSummary | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <Modal
    :open="open"
    title="Delete MSK Cluster"
    size="md"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-4">
      <p class="text-sm text-light-text dark:text-dark-text">
        Are you sure you want to delete the following MSK cluster?
      </p>
      <div
        v-if="cluster"
        class="p-3 rounded border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg"
      >
        <p class="font-medium text-light-text dark:text-dark-text">
          {{ cluster.ClusterName }}
        </p>
        <p class="text-xs text-light-muted dark:text-dark-muted font-mono mt-1">
          {{ cluster.ClusterArn }}
        </p>
      </div>
      <p class="text-sm text-red-600 dark:text-red-400">
        This action cannot be undone. The cluster will be permanently deleted.
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="secondary"
          @click="emit('update:open', false)"
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          :loading="isLoading"
          @click="emit('confirm')"
        >
          Delete Cluster
        </Button>
      </div>
    </template>
  </Modal>
</template>
