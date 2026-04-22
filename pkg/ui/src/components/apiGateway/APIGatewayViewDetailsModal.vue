<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const props = defineProps<{
  open: boolean
  title: string
  details: any
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'close': []
}>()

const settingsStore = useSettingsStore()

function handleClose() {
  emit('update:open', false)
  emit('close')
}

const detailsList = computed(() => {
  if (!props.details) return []
  return Object.entries(props.details).map(([key, value]) => ({
    key: key,
    value: value,
  }))
})
</script>

<template>
  <Modal
    :open="open"
    :title="title"
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
        <div
          v-for="(item, index) in detailsList"
          :key="index"
        >
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">{{ item.key }}</label>
          <p
            class="text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ item.value }}
          </p>
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