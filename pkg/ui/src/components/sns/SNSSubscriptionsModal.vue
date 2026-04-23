<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

interface SNSSubscription {
  Protocol: string
  Endpoint: string
  SubscriptionArn: string
}

interface Column {
  key: string
  label: string
}

const props = defineProps<{
  open: boolean
  loading: boolean
  subscriptions: SNSSubscription[]
  columns: Column[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Topic Subscriptions"
    size="lg"
    @update:open="handleClose"
  >
    <div
      v-if="props.loading"
      class="flex justify-center py-8"
    >
      <LoadingSpinner />
    </div>
    <EmptyState
      v-else-if="props.subscriptions.length === 0"
      icon="user"
      title="No Subscriptions"
      description="No subscriptions found for this topic."
    />
    <DataTable
      v-else
      :columns="props.columns"
      :data="props.subscriptions"
      empty-title="No Subscriptions"
      empty-text="No subscriptions found."
    >
      <template #cell-Protocol="{ value }">
        <StatusBadge
          status="active"
          :label="value"
        />
      </template>
      <template #cell-Endpoint="{ value }">
        <span class="text-light-text dark:text-dark-text truncate">{{ value }}</span>
      </template>
      <template #cell-SubscriptionArn="{ value }">
        <StatusBadge 
          :status="getSubscriptionStatus(value)" 
          :label="value?.includes('PendingConfirmation') ? 'Pending' : value?.includes(':confirmed') ? 'Confirmed' : 'Unknown'" 
        />
      </template>
    </DataTable>
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