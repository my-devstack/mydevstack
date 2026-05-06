<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'

const props = defineProps<{
  open: boolean
  functions: { FunctionName: string; FunctionArn: string }[]
  eventSources: { arn: string; name: string; type: string }[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [data: {
    functionName: string
    eventSourceArn: string
    batchSize: number
    maxBatchingWindow: number
    parallelizationFactor: number
    onSuccessDestination?: string
    onFailureDestination?: string
  }]
}>()

const settingsStore = useSettingsStore()

const selectedFunction = ref('')
const selectedEventSource = ref('')
const batchSize = ref(10)
const maxBatchingWindow = ref(0)
const parallelizationFactor = ref(1)
const onSuccessDestination = ref('')
const onFailureDestination = ref('')

const batchSizeOptions = [
  { value: '1', label: '1' },
  { value: '10', label: '10' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
  { value: '500', label: '500' },
  { value: '1000', label: '1000' },
]

const parallelizationOptions = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '4', label: '4' },
  { value: '8', label: '8' },
  { value: '10', label: '10' },
]

const isValid = computed(() => {
  return selectedFunction.value && selectedEventSource.value
})

watch(() => props.open, (newVal) => {
  if (newVal) {
    selectedFunction.value = ''
    selectedEventSource.value = ''
    batchSize.value = 10
    maxBatchingWindow.value = 0
    parallelizationFactor.value = 1
    onSuccessDestination.value = ''
    onFailureDestination.value = ''
  }
})

function handleCreate() {
  if (!isValid.value) return

  emit('create', {
    functionName: selectedFunction.value,
    eventSourceArn: selectedEventSource.value,
    batchSize: Number(batchSize.value),
    maxBatchingWindow: Number(maxBatchingWindow.value),
    parallelizationFactor: Number(parallelizationFactor.value),
    onSuccessDestination: onSuccessDestination.value || undefined,
    onFailureDestination: onFailureDestination.value || undefined,
  })
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    title="Create Event Source Mapping"
    size="md"
    @update:open="handleClose"
    @close="handleClose"
  >
    <div class="space-y-4">
      <!-- Function Selection -->
      <div>
        <label
          class="block text-sm font-medium mb-1"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Lambda Function *
        </label>
        <FormSelect
          v-model="selectedFunction"
          :options="functions.map(f => ({ value: f.FunctionName, label: f.FunctionName }))"
          placeholder="Select a function"
        />
      </div>

      <!-- Event Source Selection -->
      <div>
        <label
          class="block text-sm font-medium mb-1"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Event Source *
        </label>
        <FormSelect
          v-model="selectedEventSource"
          :options="eventSources.map(es => ({ value: es.arn, label: `${es.name} (${es.type})` }))"
          placeholder="Select an event source"
        />
      </div>

      <!-- Batch Size -->
      <div>
        <label
          class="block text-sm font-medium mb-1"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Batch Size
        </label>
        <FormSelect
          v-model="batchSize"
          :options="batchSizeOptions"
        />
      </div>

      <!-- Maximum Batching Window -->
      <div>
        <label
          class="block text-sm font-medium mb-1"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Maximum Batching Window (seconds)
        </label>
        <FormInput
          v-model="maxBatchingWindow"
          type="number"
          min="0"
          max="300"
          placeholder="0"
        />
        <p
          class="text-xs mt-1"
          :class="settingsStore.darkMode ? 'text-gray-500' : 'text-gray-400'"
        >
          Maximum time to wait before invoking the function (0-300 seconds)
        </p>
      </div>

      <!-- Parallelization Factor -->
      <div>
        <label
          class="block text-sm font-medium mb-1"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Parallelization Factor
        </label>
        <FormSelect
          v-model="parallelizationFactor"
          :options="parallelizationOptions"
        />
        <p
          class="text-xs mt-1"
          :class="settingsStore.darkMode ? 'text-gray-500' : 'text-gray-400'"
        >
          Number of concurrent function invocations per batch
        </p>
      </div>

      <!-- Destination Config -->
      <div class="border-t pt-4">
        <h4
          class="text-sm font-medium mb-3"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Destination Config (optional)
        </h4>
        <div class="space-y-3">
          <div>
            <label
              class="block text-xs font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
            >
              On Success Destination (SQS or SNS ARN)
            </label>
            <FormInput
              v-model="onSuccessDestination"
              placeholder="arn:aws:sqs:region:account:queue-name"
            />
          </div>
          <div>
            <label
              class="block text-xs font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
            >
              On Failure Destination (SQS or SNS ARN)
            </label>
            <FormInput
              v-model="onFailureDestination"
              placeholder="arn:aws:sqs:region:account:queue-name"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        variant="secondary"
        @click="handleClose"
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        :disabled="!isValid || loading"
        :loading="loading"
        @click="handleCreate"
      >
        {{ loading ? 'Creating...' : 'Create' }}
      </Button>
    </template>
  </Modal>
</template>