<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import DataTable from '@/components/common/DataTable.vue'
import { useApiGateway } from '@/composables/useApiGateway'

const props = defineProps<{
  open: boolean
  apiId: string
  apiName: string
  apiType: 'http' | 'rest'
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create-authorizer': []
  'edit-authorizer': [authorizer: any]
}>()

const {
  loading,
  loadHttpApiAuthorizers,
  loadRestApiAuthorizers,
  deleteHttpApiAuthorizer,
  deleteRestApiAuthorizer,
} = useApiGateway()

const authorizers = ref<any[]>([])

const columns = computed(() => {
  if (props.apiType === 'http') {
    return [
      { key: 'name', label: 'Name' },
      { key: 'authorizerType', label: 'Type' },
      { key: 'authorizerUri', label: 'Authorizer URI' },
    ]
  }
  return [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'identitySource', label: 'Identity Source' },
  ]
})

async function loadAuthorizers() {
  if (props.apiType === 'http') {
    const response = await loadHttpApiAuthorizers(props.apiId)
    authorizers.value = response?.items || []
  } else {
    const response = await loadRestApiAuthorizers(props.apiId)
    authorizers.value = response?.items || []
  }
}

onMounted(loadAuthorizers)

watch(() => props.open, (isOpen) => {
  if (isOpen) loadAuthorizers()
})

function handleCreate() {
  emit('create-authorizer')
}

function handleEdit(authorizer: any) {
  emit('edit-authorizer', authorizer)
}

async function handleDelete(authorizer: any) {
  if (props.apiType === 'http') {
    await deleteHttpApiAuthorizer(props.apiId, authorizer.authorizerId)
  } else {
    await deleteRestApiAuthorizer(props.apiId, authorizer.id)
  }
  loadAuthorizers()
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    :title="`Authorizers: ${apiName}`"
    size="lg"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="flex justify-end mb-4">
      <Button
        size="sm"
        @click="handleCreate"
      >
        <template #icon-left>
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
        Create Authorizer
      </Button>
    </div>

    <div
      v-if="loading"
      class="flex justify-center py-8"
    >
      <LoadingSpinner />
    </div>

    <EmptyState
      v-else-if="authorizers.length === 0"
      icon="shield"
      title="No Authorizers"
      description="No authorizers found for this API."
    />

    <DataTable
      v-else
      :columns="columns"
      :data="authorizers"
      empty-title="No Authorizers"
      empty-text="No authorizers found."
    >
      <template #cell-name="{ value }">
        <span class="font-medium">{{ value }}</span>
      </template>
      <template #cell-authorizerType="{ value }">
        <span class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value }}</span>
      </template>
      <template #cell-type="{ value }">
        <span class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value }}</span>
      </template>
      <template #cell-authorizerUri="{ value }">
        <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value || '-' }}</code>
      </template>
      <template #cell-identitySource="{ value }">
        <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value || '-' }}</code>
      </template>
      <template #row-actions="{ row }">
        <div class="flex justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            @click="handleEdit(row)"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            @click="handleDelete(row)"
          >
            Delete
          </Button>
        </div>
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