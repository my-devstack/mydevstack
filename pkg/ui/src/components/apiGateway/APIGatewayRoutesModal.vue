<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import DataTable from '@/components/common/DataTable.vue'

const props = defineProps<{
  open: boolean
  apiName: string
  routes: any[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create-route': []
  'delete-route': [routeId: string]
}>()

const settingsStore = useSettingsStore()

const columns = [
  { key: 'routeKey', label: 'Route Key', sortable: true },
  { key: 'routeId', label: 'Route ID' },
  { key: 'authorizationType', label: 'Authorization' },
]

function handleCreateRoute() {
  emit('create-route')
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    :title="`Routes: ${apiName}`"
    size="lg"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="flex justify-end mb-4">
      <Button
        size="sm"
        @click="handleCreateRoute"
      >
        <template #icon>
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </template>
        Create Route
      </Button>
    </div>

    <div
      v-if="loading"
      class="flex justify-center py-8"
    >
      <LoadingSpinner />
    </div>

    <EmptyState
      v-else-if="routes.length === 0"
      icon="server"
      title="No Routes"
      description="No routes found for this API."
    />

    <DataTable
      v-else
      :columns="columns"
      :data="routes"
      empty-title="No Routes"
      empty-text="No routes found."
    >
      <template #cell-routeKey="{ value }">
        <span class="font-mono font-medium">{{ value }}</span>
      </template>
      <template #cell-routeId="{ value }">
        <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value }}</code>
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