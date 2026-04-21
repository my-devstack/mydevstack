<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'

interface Resource {
  id: string
  path: string
  pathPart: string
}

const props = defineProps<{
  open: boolean
  resources: Resource[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [resourceId: string, httpMethod: string, authorizationType: string, authorizerId: string]
}>()

const settingsStore = useSettingsStore()

const resourceId = ref('')
const httpMethod = ref('GET')
const authType = ref('NONE')
const authorizerId = ref('')

const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
const authTypes = [
  { value: 'NONE', label: 'NONE - No authorization' },
  { value: 'AWS_IAM', label: 'AWS_IAM - IAM role based' },
  { value: 'CUSTOM', label: 'CUSTOM - Custom authorizer' },
  { value: 'COGNITO_USER_POOLS', label: 'COGNITO_USER_POOLS - Cognito' },
]

function handleCreate() {
  if (!resourceId.value) return
  emit('create', resourceId.value, httpMethod.value, authType.value, authorizerId.value)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    title="Create Method"
    size="md"
    :z-index="60"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">Resource</label>
        <select
          v-model="resourceId"
          class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
        >
          <option value="">
            Select a resource...
          </option>
          <option
            v-for="r in resources"
            :key="r.id"
            :value="r.id"
          >
            {{ r.path }} ({{ r.pathPart }})
          </option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">HTTP Method</label>
        <select
          v-model="httpMethod"
          class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
        >
          <option
            v-for="m in httpMethods"
            :key="m"
            :value="m"
          >
            {{ m }}
          </option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Authorization Type</label>
        <select
          v-model="authType"
          class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
        >
          <option
            v-for="a in authTypes"
            :key="a.value"
            :value="a.value"
          >
            {{ a.label }}
          </option>
        </select>
      </div>
      <div v-if="authType === 'CUSTOM' || authType === 'COGNITO_USER_POOLS'">
        <label class="block text-sm font-medium mb-1">Authorizer ID</label>
        <input
          v-model="authorizerId"
          type="text"
          class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
          placeholder="authorizer-id"
        >
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
          :disabled="!resourceId"
          @click="handleCreate"
        >
          {{ loading ? 'Creating...' : 'Create' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>