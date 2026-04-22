<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const props = defineProps<{
  open: boolean
  loading?: boolean
  currentIntegration?: { type?: string }
  initialType?: string
  initialUri?: string
  initialHttpMethod?: string
  lambdaFunctions?: string[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:type': [value: string]
  'update:uri': [value: string]
  'update:httpMethod': [value: string]
  'save': []
}>()

const integrationTypes = [
  { value: 'MOCK', label: 'Mock (works in LocalStack)' },
  { value: 'AWS', label: 'AWS (Lambda) - production only' },
  { value: 'HTTP', label: 'HTTP' },
  { value: 'HTTP_PROXY', label: 'HTTP Proxy' },
]

const httpMethods = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'HEAD', label: 'HEAD' },
  { value: 'OPTIONS', label: 'OPTIONS' },
]

const localType = ref(props.initialType || 'MOCK')
const localUri = ref(props.initialUri || '')
const localHttpMethod = ref(props.initialHttpMethod || 'POST')
const selectedLambda = ref('')

const lambdaOptions = computed(() => {
  return (props.lambdaFunctions || []).map(fn => ({ value: fn, label: fn }))
})

watch(selectedLambda, (val) => {
  if (val) {
    // For HTTP API, just the function name works. Try same for REST API
    localUri.value = val
  }
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    localType.value = props.initialType || 'MOCK'
    localUri.value = props.initialUri || ''
    localHttpMethod.value = props.initialHttpMethod || 'POST'
  }
})

function handleClose() {
  emit('update:open', false)
}

function handleSave() {
  emit('update:type', localType.value)
  emit('update:uri', localUri.value)
  emit('update:httpMethod', localHttpMethod.value)
  emit('save')
}

function handleTypeChange(event: Event) {
  const target = event.target as HTMLSelectElement
  localType.value = target.value
}
</script>

<template>
  <Modal
    :open="open"
    title="Setup Integration"
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
      v-else
      class="space-y-4"
    >
      <div>
        <label class="block text-sm font-medium mb-1">Integration Type</label>
        <select
          :value="localType"
          class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
          @change="handleTypeChange"
        >
          <option
            v-for="type in integrationTypes"
            :key="type.value"
            :value="type.value"
          >
            {{ type.label }}
          </option>
        </select>
      </div>
      
      <!-- Lambda dropdown for AWS type -->
      <div v-if="localType === 'AWS'">
        <FormSelect
          v-if="lambdaOptions.length > 0"
          v-model="selectedLambda"
          label="Lambda Function"
          :options="lambdaOptions"
          placeholder="Select a Lambda function"
        />
        <p
          v-else
          class="text-xs text-light-muted dark:text-dark-muted mb-2"
        >
          No Lambda functions found. Enter URI manually below.
        </p>
      </div>
      
      <FormInput
        v-if="localType === 'AWS' || localType === 'HTTP' || localType === 'HTTP_PROXY'"
        v-model="localUri"
        label="Integration URI"
        :placeholder="localType === 'AWS' ? 'functionName (Lambda function name)' : localType === 'HTTP_PROXY' ? 'http://localhost:4566/restapis/API_ID/STAGE/_user_request_/PATH' : 'https://example.com/path'"
        :hint="localType === 'AWS' ? 'Enter Lambda function name (same as HTTP API)' : localType === 'HTTP_PROXY' ? 'e.g., http://localhost:4566/restapis/API_ID/STAGE/_user_request_/path' : 'Required for HTTP and HTTP_PROXY types'"
      />
      
      <div>
        <label class="block text-sm font-medium mb-1">Integration HTTP Method</label>
        <select
          v-model="localHttpMethod"
          class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
        >
          <option
            v-for="method in httpMethods"
            :key="method.value"
            :value="method.value"
          >
            {{ method.label }}
          </option>
        </select>
      </div>
      
      <div
        v-if="currentIntegration"
        class="text-sm text-light-muted dark:text-dark-muted"
      >
        Current integration: {{ currentIntegration.type || 'None' }}
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="secondary"
          @click="handleClose"
        >
          Cancel
        </Button>
        <Button
          :loading="loading"
          @click="handleSave"
        >
          Save
        </Button>
      </div>
    </template>
  </Modal>
</template>