<script setup lang="ts">
import Modal from './Modal.vue'

interface Props {
  open: boolean
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Details',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    :title="title"
    :closable="true"
    size="xl"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <slot />
    </div>

    <template #footer>
      <slot name="actions" />
    </template>
  </Modal>
</template>