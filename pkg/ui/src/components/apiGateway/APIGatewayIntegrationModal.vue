<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'

const props = defineProps<{
  open: boolean
  type: 'rest' | 'http' | string
  'lambda-functions': string[]
  integrationId?: string
  loading?: boolean
}>()

const _props = props // workaround

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [integrationType: string, uri: string, payloadFormat: string]
  'confirm': []
}>()

const settingsStore = useSettingsStore()

const integrationType = ref('lambda')
const uri = ref('')
const payloadFormat = ref('1.0')
const selectedLambdaFunction = ref('')

const integrationTypes = [
  { value: 'lambda', label: 'Lambda Function' },
  { value: 'http', label: 'HTTP' },
  { value: 'mock', label: 'Mock' },
]

const payloadFormats = [
  { value: '1.0', label: 'Lambda (1.0)' },
  { value: '2.0', label: 'Lambda (2.0)' },
]

const lambdaFunctionOptions = computed(() => {
  const funcs = props['lambda-functions'] || []
  return funcs.map(fn => ({ value: fn, label: fn }))
})

watch(selectedLambdaFunction, (newVal) => {
  if (newVal) {
    uri.value = newVal
  }
})

watch(() => props.open, (newVal) => {
  if (!newVal) {
    selectedLambdaFunction.value = ''
    uri.value = ''
    integrationType.value = 'lambda'
    payloadFormat.value = '1.0'
  }
})

function handleCreate() {
  if (!uri.value.trim()) return
  emit('create', integrationType.value, uri.value, payloadFormat.value)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    :title="integrationId ? 'Update Integration' : 'Create Integration'"
    size="md"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="space-y-4">
      <FormSelect
        v-model="integrationType"
        label="Integration Type"
        :options="integrationTypes"
      />
      
      <!-- Lambda dropdown for lambda type -->
      <div v-if="integrationType === 'lambda' && lambdaFunctionOptions.length > 0">
        <FormSelect
          v-model="selectedLambdaFunction"
          label="Lambda Function"
          :options="lambdaFunctionOptions"
          placeholder="Select a Lambda function"
        />
        <p class="text-xs text-light-muted dark:text-dark-muted mt-1">
          Select a Lambda function to use as the integration target
        </p>
      </div>
      
      <!-- Manual URI input for lambda when no functions available -->
      <FormInput
        v-else-if="integrationType === 'lambda'"
        v-model="uri"
        label="URI"
        placeholder="arn:aws:apigateway:region:lambda:path/function_name"
      />
      
      <!-- URI input for HTTP -->
      <FormInput
        v-if="integrationType === 'http'"
        v-model="uri"
        label="URI"
        placeholder="https://api.example.com"
      />
      
      <FormSelect
        v-if="integrationType === 'lambda'"
        v-model="payloadFormat"
        label="Payload Format"
        :options="payloadFormats"
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
        <Button
          :loading="loading"
          :disabled="!uri.trim()"
          @click="handleCreate"
        >
          {{ loading ? 'Creating...' : 'Create' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>