<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'

interface LambdaInput {
  FunctionName: string
  FunctionArn?: string
}

const props = withDefaults(defineProps<{
  open: boolean
  type: 'rest' | 'http' | string
  lambdaFunctions?: any
  lambdaLoading?: boolean
  integrationId?: string
  integrationData?: any
  loading?: boolean
}>(), {
  lambdaFunctions: () => [],
  lambdaLoading: false,
})

const _props = props // workaround

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [integrationType: string, httpMethod: string, uri: string, mappingTemplate?: string]
  'update': [integrationType: string, httpMethod: string, uri: string, payloadFormat: string]
  'confirm': []
}>()

const settingsStore = useSettingsStore()

const integrationType = ref('MOCK')
const integrationHttpMethod = ref('POST')
const uri = ref('')
const payloadFormat = ref('2.0')
const selectedLambdaFunction = ref('')
const selectedLambdaArn = ref('')
const mappingTemplate = ref('')

const isEditMode = computed(() => !!props.integrationId)

interface LambdaFunctionOption {
  value: string
  label: string
  arn?: string
}

const allIntegrationTypes = [
  { value: 'AWS_PROXY', label: 'Lambda (AWS_PROXY)' },
  { value: 'MOCK', label: 'Mock' },
]

const integrationTypes = computed(() => {
  if (props.type === 'http') {
    return [
      { value: 'AWS_PROXY', label: 'Lambda (AWS_PROXY)' },
      { value: 'AWS', label: 'Lambda (AWS with VTL)' },
      { value: 'HTTP_PROXY', label: 'HTTP Proxy' },
      { value: 'HTTP', label: 'HTTP (with VTL)' },
      { value: 'MOCK', label: 'Mock' },
    ]
  }
  return allIntegrationTypes
})

const payloadFormats = [
  { value: '1.0', label: 'Lambda (1.0)' },
  { value: '2.0', label: 'Lambda (2.0)' },
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

const lambdaFunctionOptions = computed(() => {
  let funcs: any[] = []
  if (!props.lambdaFunctions) {
    return []
  }
  if (Array.isArray(props.lambdaFunctions)) {
    funcs = props.lambdaFunctions
  } else if (props.lambdaFunctions?.functions) {
    funcs = props.lambdaFunctions.functions
  } else if (props.lambdaFunctions?.Functions) {
    funcs = props.lambdaFunctions.Functions
  }
  return funcs.map((fn: string | LambdaInput) => {
    const name = typeof fn === 'string' ? fn : fn.FunctionName
    const arn = typeof fn === 'string' ? '' : fn.FunctionArn || ''
    return { value: name, label: name, arn }
  })
})

watch(selectedLambdaFunction, (newVal) => {
  if (newVal) {
    const selected = lambdaFunctionOptions.value.find(f => f.value === newVal)
    const arn = selected?.arn || ''
    if (arn) {
      if (props.type === 'http') {
        uri.value = arn
      } else {
        const region = settingsStore.region
        uri.value = `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${arn}/invocations`
      }
      selectedLambdaArn.value = arn
    } else if (newVal) {
      if (props.type === 'http') {
        uri.value = newVal
      } else {
        const region = settingsStore.region
        uri.value = `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${newVal}/invocations`
      }
      selectedLambdaArn.value = ''
    }
  }
})

watch(() => props.open, (newVal) => {
  if (!newVal) {
    selectedLambdaFunction.value = ''
    uri.value = ''
    integrationType.value = 'MOCK'
    integrationHttpMethod.value = 'POST'
    payloadFormat.value = '2.0'
    mappingTemplate.value = ''
  } else if (props.integrationId && props.integrationData) {
    const data = props.integrationData
    integrationType.value = data.integrationType || data.integrationType || (props.type === 'http' ? 'lambda' : 'AWS_PROXY')
    uri.value = data.integrationUri || data.IntegrationUri || ''
    if (data.integrationType === 'AWS_PROXY' || data.IntegrationType === 'AWS_PROXY') {
      integrationType.value = 'AWS_PROXY'
    }
    if (data.integrationType === 'lambda' || data.IntegrationType === 'lambda') {
      integrationType.value = 'lambda'
    }
  }
})

function handleCreate() {
  if (integrationType.value !== 'MOCK' && !selectedLambdaFunction.value && !uri.value.trim()) return
  if (integrationType.value === 'MOCK' && isEditMode.value) {
    emit('update', 'MOCK', 'POST', '', '')
    return
  }
  if (integrationType.value === 'MOCK' && !isEditMode.value) {
    emit('create', 'MOCK', 'POST', '')
    return
  }
  
  const httpMethod = integrationHttpMethod.value || 'POST'
  // Pass integration type directly for both REST and HTTP API v2
  const integrationTypeStr = integrationType.value
  
  const payloadFmt = payloadFormat.value || '2.0'
  if (isEditMode.value) {
    emit('update', integrationTypeStr, httpMethod, uri.value, payloadFmt)
  } else {
    emit('create', integrationTypeStr, httpMethod, uri.value, mappingTemplate.value || undefined)
  }
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
      
      <!-- Lambda dropdown for AWS_PROXY type -->
      <div v-if="(integrationType === 'AWS_PROXY') && (props.lambdaLoading || lambdaFunctionOptions.length > 0)">
        <FormSelect
          v-model="selectedLambdaFunction"
          label="Lambda Function"
          :options="lambdaFunctionOptions"
          :loading="props.lambdaLoading"
          placeholder="Select a Lambda function"
        />
        <p
          v-if="!props.lambdaLoading"
          class="text-xs text-light-muted dark:text-dark-muted mt-1"
        >
          Select a Lambda function to use as the integration target
        </p>
      </div>
      
      <!-- URI input for AWS_PROXY -->
      <FormInput
        v-if="integrationType === 'AWS_PROXY'"
        v-model="uri"
        label="URI"
        placeholder="arn:aws:apigateway:region:lambda:path/function_name"
      />
      
      <!-- URI input for AWS (with VTL) -->
      <FormInput
        v-if="integrationType === 'AWS'"
        v-model="uri"
        label="URI"
        placeholder="arn:aws:apigateway:region:lambda:path/function_name"
      />

      <!-- URI input for HTTP_PROXY -->
      <FormInput
        v-if="integrationType === 'HTTP_PROXY'"
        v-model="uri"
        label="URI"
        placeholder="https://api.example.com"
      />

      <!-- URI input for HTTP (with VTL) -->
      <FormInput
        v-if="integrationType === 'HTTP'"
        v-model="uri"
        label="URI"
        placeholder="https://api.example.com"
      />

      <!-- VTL Mapping Template for AWS and HTTP types -->
      <FormInput
        v-if="integrationType === 'AWS' || integrationType === 'HTTP'"
        v-model="mappingTemplate"
        label="Mapping Template (VTL)"
        placeholder='{"statusCode": 200}'
        type="textarea"
      />

      <!-- HTTP Method for non-Mock integrations -->
      <FormSelect
        v-if="integrationType !== 'MOCK'"
        v-model="integrationHttpMethod"
        label="Integration HTTP Method"
        :options="httpMethods"
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
          :disabled="integrationType !== 'MOCK' && !uri.trim()"
          @click="handleCreate"
        >
          {{ loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update' : 'Create') }}
        </Button>
      </div>
    </template>
  </Modal>
</template>