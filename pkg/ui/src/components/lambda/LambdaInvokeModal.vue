<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import Button from '@/components/common/Button.vue'

const props = defineProps<{
  open: boolean
  functionName: string
  loading?: boolean
  result?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'invoke': [payload: string, invocationType: string]
}>()

const settingsStore = useSettingsStore()

const payload = ref('{}')
const invocationType = ref('RequestResponse')

const invocationTypes = [
  { value: 'RequestResponse', label: 'Synchronous' },
  { value: 'Event', label: 'Asynchronous' },
  { value: 'DryRun', label: 'Dry Run' },
]

function handleInvoke() {
  emit('invoke', payload.value, invocationType.value)
}

function handleClose() {
  payload.value = '{}'
  invocationType.value = 'RequestResponse'
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    :title="`Invoke: ${functionName}`"
    size="lg"
    @update:open="handleClose"
    @close="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="payload"
        label="Payload (JSON)"
        placeholder="{&quot;key&quot;: &quot;value&quot;}"
      />

      <FormSelect
        v-model="invocationType"
        label="Invocation Type"
        :options="invocationTypes"
      />

      <div class="flex gap-2">
        <Button
          :disabled="loading"
          @click="handleInvoke"
        >
          {{ loading ? 'Invoking...' : 'Invoke' }}
        </Button>
      </div>

      <div
        v-if="result"
        class="mt-4"
      >
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
          Result:
        </label>
        <pre
          class="p-4 rounded-lg overflow-auto max-h-60 text-sm font-mono"
          :class="settingsStore.darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-800'"
        >{{ result }}</pre>
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