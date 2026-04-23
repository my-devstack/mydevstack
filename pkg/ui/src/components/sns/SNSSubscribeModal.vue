<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'

interface SNSTopic {
  TopicName: string
}

const props = defineProps<{
  open: boolean
  topic: SNSTopic | null
  protocolOptions: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'subscribe': [protocol: string, endpoint: string]
}>()

const form = defineModel<{ protocol: string; endpoint: string }>('form', { default: { protocol: 'https', endpoint: '' } })

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    :title="`Subscribe to: ${props.topic?.TopicName || ''}`"
    size="md"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <FormSelect
        v-model="form.protocol"
        label="Protocol"
        :options="props.protocolOptions"
      />
      <FormInput
        v-model="form.endpoint"
        label="Endpoint"
        :placeholder="form.protocol === 'http' || form.protocol === 'https' ? 'https://your-endpoint.com/webhook' : form.protocol === 'email' ? 'your@email.com' : 'ARN or endpoint'"
        required
      />
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="secondary"
          @click="handleClose"
        >
          Cancel
        </Button>
        <Button @click="emit('subscribe', form.protocol, form.endpoint)">
          Subscribe
        </Button>
      </div>
    </template>
  </Modal>
</template>