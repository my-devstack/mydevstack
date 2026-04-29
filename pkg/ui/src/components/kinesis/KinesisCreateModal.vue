<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import type { StreamForm } from '@/composables/useKinesis'

const props = defineProps<{
  open: boolean
  isLoading: boolean
  newStream: StreamForm
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'create'): void
}>()
</script>

<template>
  <Modal
    :open="open"
    title="Create Kinesis Stream"
    size="md"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-4">
      <FormInput
        v-model="newStream.name"
        label="Stream Name"
        placeholder="my-stream"
        required
      />
      <FormInput
        v-model="newStream.shardCount"
        label="Number of Shards"
        type="number"
        placeholder="1"
        help-text="Each shard can handle up to 1,000 records per second or 1 MB per second"
      />
    </div>
    
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="secondary"
          @click="emit('update:open', false)"
        >
          Cancel
        </Button>
        <Button
          :loading="isLoading"
          @click="emit('create')"
        >
          Create
        </Button>
      </div>
    </template>
  </Modal>
</template>
