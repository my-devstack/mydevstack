<script setup lang="ts">
import { computed } from 'vue'
import Modal from './Modal.vue'
import Button from './Button.vue'

type ModalMode = 'create' | 'edit' | 'view' | 'delete'
type Size = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full'

interface Props {
  open: boolean
  mode: ModalMode
  title?: string
  size?: Size
  loading?: boolean
  closable?: boolean
  confirmText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'view',
  size: 'md',
  loading: false,
  closable: true,
  confirmText: 'Confirm',
  cancelText: 'Cancel',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
  'close': []
}>()

const titles: Record<ModalMode, string> = {
  create: 'Create',
  edit: 'Edit',
  view: 'View Details',
  delete: 'Confirm Delete',
}

const computedTitle = computed(() => props.title || titles[props.mode])

const isDeleteMode = computed(() => props.mode === 'delete')
const isViewMode = computed(() => props.mode === 'view')

function handleConfirm() {
  if (!isDeleteMode.value && !isViewMode.value) {
    emit('confirm')
  }
}

function handleClose() {
  emit('update:open', false)
  emit('close')
}
</script>

<template>
  <Modal
    :open="open"
    :title="computedTitle"
    :size="size"
    :closable="closable && !loading"
    @update:open="handleClose"
  >
    <slot />

    <template #footer>
      <Button
        :variant="isDeleteMode ? 'danger' : 'secondary'"
        :disabled="loading"
        @click="handleClose"
      >
        {{ cancelText }}
      </Button>
      <Button
        v-if="!isViewMode"
        :variant="isDeleteMode ? 'danger' : 'primary'"
        :loading="loading"
        @click="handleConfirm"
      >
        {{ confirmText }}
      </Button>
    </template>
  </Modal>
</template>