<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import type { APIGatewayRestAPI } from '@/api/types/aws'

const props = defineProps<{
  open: boolean
  details: APIGatewayRestAPI | null
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'edit': []
  'delete': []
}>()

const settingsStore = useSettingsStore()

function handleClose() {
  emit('update:open', false)
}

function handleEdit() {
  emit('update:open', false)
  emit('edit')
}

function handleDelete() {
  emit('update:open', false)
  emit('delete')
}

const createdDateFormatted = computed(() => {
  if (!props.details?.createdDate) return ''
  return new Date(Number(props.details.createdDate) * 1000).toLocaleString()
})

const endpointType = computed(() => {
  return props.details?.endpointConfiguration?.types?.join(', ') || 'REGIONAL'
})
</script>

<template>
  <Modal
    :open="open"
    :title="`API Details: ${details?.name || ''}`"
    size="md"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div
      v-if="loading"
      class="flex justify-center py-8"
    >
      <LoadingSpinner />
    </div>
    
    <div
      v-else-if="details"
      class="space-y-4"
    >
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">API ID</label>
          <p
            class="font-mono text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ details.id }}
          </p>
        </div>
        <div>
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">API Key Source</label>
          <p
            class="text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ details.apiKeySource || 'HEADER' }}
          </p>
        </div>
        <div>
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Endpoint Type</label>
          <p
            class="text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ endpointType }}
          </p>
        </div>
        <div>
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Created</label>
          <p
            class="text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ createdDateFormatted }}
          </p>
        </div>
      </div>
      
      <div v-if="details.description">
        <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Description</label>
        <p
          class="text-sm mt-1"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          {{ details.description }}
        </p>
      </div>
      
      <div v-if="details.binaryMediaTypes?.length">
        <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Binary Media Types</label>
        <div class="flex flex-wrap gap-2 mt-1">
          <span
            v-for="type in details.binaryMediaTypes"
            :key="type"
            class="px-2 py-1 text-xs rounded bg-light-border dark:bg-dark-border"
          >
            {{ type }}
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center">
        <Button
          variant="secondary"
          @click="handleClose"
        >
          Close
        </Button>
        <div class="flex gap-2">
          <Button
            variant="secondary"
            @click="handleEdit"
          >
            Edit
          </Button>
          <Button
            variant="danger"
            @click="handleDelete"
          >
            Delete
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>