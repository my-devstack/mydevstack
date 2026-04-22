<script setup lang="ts">
import { ref } from 'vue'
import { ClipboardIcon } from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'

const props = defineProps<{
  open: boolean
  newAccessKey: { AccessKeyId: string; SecretAccessKey: string } | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  create: []
}>()

function handleClose() {
  emit('update:open', false)
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create Access Key"
    size="md"
    @update:open="handleClose"
  >
    <div
      v-if="!props.newAccessKey"
      class="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20"
    >
      <p class="text-sm text-yellow-800 dark:text-yellow-200">
        Make sure to save the Secret Access Key. It cannot be retrieved after closing this modal.
      </p>
    </div>
    <div
      v-else
      class="space-y-4"
    >
      <div>
        <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">
          Access Key ID
        </label>
        <div class="flex items-center gap-2">
          <code class="flex-1 p-2 rounded bg-light-bg dark:bg-dark-bg text-sm font-mono text-light-text dark:text-dark-text">
            {{ props.newAccessKey.AccessKeyId }}
          </code>
          <Button
            variant="ghost"
            size="sm"
            @click="copyToClipboard(props.newAccessKey.AccessKeyId)"
          >
            <ClipboardIcon class="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">
          Secret Access Key
        </label>
        <div class="flex items-center gap-2">
          <code class="flex-1 p-2 rounded bg-light-bg dark:bg-dark-bg text-sm font-mono text-light-text dark:text-dark-text">
            {{ props.newAccessKey.SecretAccessKey }}
          </code>
          <Button
            variant="ghost"
            size="sm"
            @click="copyToClipboard(props.newAccessKey.SecretAccessKey)"
          >
            <ClipboardIcon class="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div class="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
        <p class="text-sm text-yellow-800 dark:text-yellow-200">
          Make sure to save the Secret Access Key. It cannot be retrieved after closing this modal.
        </p>
      </div>
    </div>
    <template #footer>
      <Button
        variant="secondary"
        @click="handleClose"
      >
        {{ props.newAccessKey ? 'Close' : 'Cancel' }}
      </Button>
      <Button
        v-if="!props.newAccessKey"
        variant="primary"
        @click="emit('create')"
      >
        Create Key
      </Button>
    </template>
  </Modal>
</template>