<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'

const props = defineProps<{
  open: boolean
  routeKey: string
  target?: string
  integrations?: string[]
  authorizationType?: string
  authorizerId?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update': [routeKey: string, target: string, authorizationType: string, authorizerId: string]
}>()

const form = ref({
  routeKey: '',
  targetType: 'http',
  selectedTarget: '',
  authorizationType: 'NONE',
  authorizerId: '',
})

const authOptions = [
  { value: 'NONE', label: 'None' },
  { value: 'AWS_IAM', label: 'AWS IAM' },
  { value: 'CUSTOM', label: 'Custom Authorizer' },
]

const targetTypeOptions = computed(() => {
  const options: { value: string; label: string }[] = []
  if (props.integrations?.length) {
    options.push({ value: 'integration', label: 'Existing Integration' })
  }
  options.push({ value: 'http', label: 'HTTP Proxy' })
  return options
})

const integrationOptions = computed(() =>
  (props.integrations || []).map((id) => ({ value: id, label: id })),
)

const resolvedTarget = computed(() => {
  if (form.value.targetType === 'integration') {
    return form.value.selectedTarget ? `integrations/${form.value.selectedTarget}` : ''
  }
  return form.value.selectedTarget.trim()
})

const isSubmitDisabled = computed(() => {
  if (!form.value.routeKey.trim()) return true
  if (form.value.targetType === 'integration') return !form.value.selectedTarget
  return !form.value.selectedTarget.trim()
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    const raw = props.target || ''
    let targetType = 'http'
    let selectedTarget = raw

    if (raw.startsWith('integrations/')) {
      targetType = 'integration'
      selectedTarget = raw.slice('integrations/'.length)
    } else if (!raw) {
      targetType = props.integrations?.length ? 'integration' : 'http'
      selectedTarget = ''
    }

    form.value = {
      routeKey: props.routeKey || '',
      targetType,
      selectedTarget,
      authorizationType: props.authorizationType || 'NONE',
      authorizerId: props.authorizerId || '',
    }
  }
}, { immediate: true })

function handleUpdate() {
  emit('update', form.value.routeKey, resolvedTarget.value, form.value.authorizationType, form.value.authorizerId)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    title="Edit Route"
    size="md"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="form.routeKey"
        label="Route Key"
        placeholder="GET /items"
        help-text="Format: METHOD /path"
      />

      <FormSelect
        v-model="form.targetType"
        label="Target Type"
        :options="targetTypeOptions"
      />

      <FormSelect
        v-if="form.targetType === 'integration'"
        v-model="form.selectedTarget"
        label="Integration"
        :options="integrationOptions"
        placeholder="Select an integration..."
      />

      <FormInput
        v-if="form.targetType === 'http'"
        v-model="form.selectedTarget"
        label="HTTP Proxy URL"
        placeholder="https://api.example.com"
      />

      <FormSelect
        v-model="form.authorizationType"
        label="Authorization"
        :options="authOptions"
      />

      <FormInput
        v-if="form.authorizationType === 'CUSTOM'"
        v-model="form.authorizerId"
        label="Authorizer ID"
        placeholder="abc123"
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
          :disabled="isSubmitDisabled"
          @click="handleUpdate"
        >
          {{ loading ? 'Saving...' : 'Save' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
