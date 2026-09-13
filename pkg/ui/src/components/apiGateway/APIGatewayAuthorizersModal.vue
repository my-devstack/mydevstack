<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import { useApiGateway } from '@/composables/useApiGateway'

const props = defineProps<{
  open: boolean
  mode: 'create' | 'edit' | 'view'
  apiId: string
  apiName: string
  apiType: 'http' | 'rest'
  authorizer?: any
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const {
  loading,
  createHttpApiAuthorizer,
  updateHttpApiAuthorizer,
  deleteHttpApiAuthorizer,
  createRestApiAuthorizer,
  updateRestApiAuthorizer,
  deleteRestApiAuthorizer,
} = useApiGateway()

const name = ref('')
const authorizerType = ref('')
const issuer = ref('')
const audience = ref('')
const credentialsArn = ref('')
const ttl = ref('')
const authorizerUri = ref('')
const invokeMode = ref('')
const identitySource = ref('')

const httpTypeOptions = [
  { value: 'JWT', label: 'JWT' },
  { value: 'IAM', label: 'IAM' },
  { value: 'LAMBDA', label: 'Lambda' },
]

const restTypeOptions = [
  { value: 'TOKEN', label: 'Token' },
  { value: 'REQUEST', label: 'Request' },
]

const invokeModeOptions = [
  { value: 'BYPASS', label: 'BYPASS' },
  { value: 'WAIT_FOR_RESPONSE', label: 'WAIT_FOR_RESPONSE' },
]

const typeOptions = computed(() => props.apiType === 'http' ? httpTypeOptions : restTypeOptions)

const isEdit = computed(() => props.mode === 'edit')
const isView = computed(() => props.mode === 'view')

const showJwtFields = computed(() => props.apiType === 'http' && authorizerType.value === 'JWT')
const showLambdaFields = computed(() => props.apiType === 'http' && authorizerType.value === 'LAMBDA')
const showUriFields = computed(() => props.apiType === 'rest')
const showIdentitySource = computed(() => props.apiType === 'rest')

watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  const a = props.authorizer
  name.value = a?.name || ''
  authorizerType.value = a?.authorizerType || a?.type || (props.apiType === 'http' ? 'JWT' : 'TOKEN')
  issuer.value = a?.jwtConfiguration?.issuer || ''
  audience.value = (a?.jwtConfiguration?.audience || []).join(', ')
  credentialsArn.value = a?.authorizerCredentials || ''
  ttl.value = a?.authorizerResultTtlInSeconds !== undefined ? String(a.authorizerResultTtlInSeconds) : ''
  authorizerUri.value = a?.authorizerUri || ''
  invokeMode.value = a?.invokeMode || 'WAIT_FOR_RESPONSE'
  identitySource.value = a?.identitySource || ''
})

function authorizerId(): string {
  return props.authorizer?.authorizerId || props.authorizer?.id || ''
}

async function handleSubmit() {
  if (!name.value.trim()) return
  if (props.apiType === 'http') {
    const input: any = {
      name: name.value.trim(),
      authorizerType: authorizerType.value,
    }
    if (showJwtFields.value) {
      input.jwtConfiguration = {
        issuer: issuer.value.split(',')[0]?.trim() || undefined,
        audience: audience.value.split(',').map((s: string) => s.trim()).filter(Boolean),
      }
      if (credentialsArn.value) input.authorizerCredentials = credentialsArn.value.trim()
      if (ttl.value) input.authorizerResultTtlInSeconds = Number(ttl.value)
    } else if (authorizerType.value === 'LAMBDA') {
      if (authorizerUri.value) input.authorizerUri = authorizerUri.value.trim()
      if (credentialsArn.value) input.authorizerCredentials = credentialsArn.value.trim()
      if (invokeMode.value) input.invokeMode = invokeMode.value
    } else if (authorizerType.value === 'IAM') {
      if (credentialsArn.value) input.authorizerCredentials = credentialsArn.value.trim()
    }
    if (isEdit.value) {
      await updateHttpApiAuthorizer(props.apiId, authorizerId(), input)
    } else {
      await createHttpApiAuthorizer(props.apiId, input)
    }
  } else {
    const input: any = {
      name: name.value.trim(),
      type: authorizerType.value,
    }
    if (authorizerUri.value) input.authorizerUri = authorizerUri.value.trim()
    if (credentialsArn.value) input.authorizerCredentials = credentialsArn.value.trim()
    if (identitySource.value) input.identitySource = identitySource.value.trim()
    if (isEdit.value) {
      await updateRestApiAuthorizer(props.apiId, authorizerId(), input)
    } else {
      await createRestApiAuthorizer(props.apiId, input)
    }
  }
  emit('update:open', false)
}

async function handleDelete() {
  if (props.apiType === 'http') {
    await deleteHttpApiAuthorizer(props.apiId, authorizerId())
  } else {
    await deleteRestApiAuthorizer(props.apiId, authorizerId())
  }
  emit('update:open', false)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    :title="`${mode === 'create' ? 'Create' : mode === 'edit' ? 'Edit' : 'View'} Authorizer: ${apiName}`"
    size="md"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="space-y-4">
      <FormSelect
        v-model="authorizerType"
        label="Authorizer Type"
        :options="typeOptions"
        :disabled="isView"
        required
      />

      <FormInput
        v-model="name"
        label="Name"
        placeholder="my-authorizer"
        :disabled="isView"
        required
      />

      <template v-if="showJwtFields">
        <FormInput
          v-model="issuer"
          label="Issuer"
          placeholder="https://cognito-idp.us-east-1.amazonaws.com/us-east-1_xxxx"
          :disabled="isView"
        />
        <FormInput
          v-model="audience"
          label="Audiences (comma-separated)"
          placeholder="client-id-1, client-id-2"
          :disabled="isView"
        />
        <FormInput
          v-model="credentialsArn"
          label="Credentials ARN"
          placeholder="arn:aws:iam::123456789012:role/authorizer-role"
          :disabled="isView"
        />
        <FormInput
          v-model="ttl"
          label="Authorizer Result TTL (seconds)"
          placeholder="300"
          type="number"
          :disabled="isView"
        />
      </template>

      <template v-if="showLambdaFields">
        <FormInput
          v-model="authorizerUri"
          label="Authorizer URI"
          placeholder="arn:aws:lambda:us-east-1:123456789012:function/my-authorizer"
          :disabled="isView"
        />
        <FormInput
          v-model="credentialsArn"
          label="Credentials ARN"
          placeholder="arn:aws:iam::123456789012:role/authorizer-role"
          :disabled="isView"
        />
        <FormSelect
          v-model="invokeMode"
          label="Invoke Mode"
          :options="invokeModeOptions"
          :disabled="isView"
        />
      </template>

      <template v-if="apiType === 'http' && authorizerType === 'IAM'">
        <FormInput
          v-model="credentialsArn"
          label="Credentials ARN"
          placeholder="arn:aws:iam::123456789012:role/authorizer-role"
          :disabled="isView"
        />
      </template>

      <template v-if="showUriFields">
        <FormInput
          v-model="authorizerUri"
          label="Authorizer URI"
          placeholder="arn:aws:lambda:us-east-1:123456789012:function/my-authorizer"
          :disabled="isView"
        />
        <FormInput
          v-model="credentialsArn"
          label="Credentials ARN"
          placeholder="arn:aws:iam::123456789012:role/authorizer-role"
          :disabled="isView"
        />
      </template>

      <template v-if="showIdentitySource">
        <FormInput
          v-model="identitySource"
          :label="authorizerType === 'TOKEN' ? 'Identity Source Header' : 'Identity Source (comma-separated)'"
          :placeholder="authorizerType === 'TOKEN' ? 'method.request.header.Authorization' : 'method.request.header.Authorization, method.request.header.X-Api-Key'"
          :disabled="isView"
        />
      </template>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          v-if="isEdit"
          variant="danger"
          :loading="loading"
          @click="handleDelete"
        >
          Delete
        </Button>
        <Button
          variant="secondary"
          @click="handleClose"
        >
          Cancel
        </Button>
        <Button
          v-if="!isView"
          :loading="loading"
          :disabled="!name.trim()"
          @click="handleSubmit"
        >
          {{ loading ? 'Saving...' : isEdit ? 'Save' : 'Create' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>