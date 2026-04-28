<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

interface SQSMessage {
  MessageId?: string
  ReceiptHandle?: string
  Body?: string
  [key: string]: unknown
}

const props = defineProps<{
  open: boolean
  queueName: string
  messages: SQSMessage[]
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'refresh': []
  'delete': [receiptHandle: string]
}>()

const formatBody = (body: string): string => {
  try {
    const parsed = JSON.parse(body)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return body
  }
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    :title="`Messages - ${queueName}`"
    size="lg"
    @close="handleClose"
  >
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <span class="text-sm text-light-muted dark:text-dark-muted">
          {{ messages.length }} message(s) available
        </span>
        <Button
          variant="secondary"
          size="sm"
          @click="emit('refresh')"
        >
          Refresh
        </Button>
      </div>

      <div
        v-if="loading"
        class="flex justify-center py-8"
      >
        <LoadingSpinner />
      </div>

      <EmptyState
        v-else-if="messages.length === 0"
        icon="inbox"
        title="No Messages"
        description="This queue is empty or messages have already been received."
      />

      <div
        v-else
        class="space-y-3 max-h-96 overflow-auto"
      >
        <div
          v-for="(msg, index) in messages"
          :key="msg.MessageId || index"
          class="p-3 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg"
        >
          <div class="flex justify-between items-start gap-2">
            <div class="flex-1 min-w-0">
              <div class="text-xs font-medium text-light-muted dark:text-dark-muted mb-1">
                Message ID: {{ msg.MessageId }}
              </div>
              <div class="text-xs text-light-muted dark:text-dark-muted mb-2">
                Receipt Handle: <code class="text-xs">{{ msg.ReceiptHandle }}</code>
              </div>
              <pre class="text-sm text-light-text dark:text-dark-text whitespace-pre-wrap break-all font-mono">{{ formatBody(msg.Body || '') }}</pre>
            </div>
            <Button
              variant="danger"
              size="sm"
              :disabled="!msg.ReceiptHandle"
              @click="msg.ReceiptHandle && emit('delete', msg.ReceiptHandle)"
            >
              Delete
            </Button>
          </div>
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