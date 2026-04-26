<script setup lang="ts">
import { computed } from 'vue'
import Modal from './Modal.vue'
import Button from './Button.vue'

interface Props {
  open: boolean
  mode: 'create' | 'delete'
  title?: string
  itemName?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  loading: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
}>()

const computedTitle = computed(() => {
  if (props.title) return props.title
  return props.mode === 'create' ? 'Create' : 'Delete'
})

const confirmText = computed(() => 
  props.mode === 'delete' ? 'Delete' : 'Create'
)

const message = computed(() => {
  if (props.mode === 'delete' && props.itemName) {
    return `Are you sure you want to delete "${props.itemName}"? This action cannot be undone.`
  }
  return props.mode === 'create' ? 'Confirm creation?' : 'Confirm deletion?'
})

function handleConfirm() {
  emit('confirm')
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    :title="computedTitle"
    :closable="!loading"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <p
        v-if="mode === 'delete'"
        class="text-light-text dark:text-dark-text"
      >
        {{ message }}
      </p>
      <slot />
    </div>

    <template #footer>
      <Button
        variant="secondary"
        :disabled="loading"
        @click="handleClose"
      >
        Cancel
      </Button>
      <Button
        variant="danger"
        :loading="loading"
        @click="handleConfirm"
      >
        {{ confirmText }}
      </Button>
    </template>
  </Modal>
</template>