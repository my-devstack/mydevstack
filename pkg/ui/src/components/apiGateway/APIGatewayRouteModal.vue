<script setup lang="ts">
import { ref, computed } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'

const props = defineProps<{
  open: boolean
  integrations?: string[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [routeKey: string, target: string]
}>()

const routeKey = ref('')
const targetType = ref('integration')
const selectedTarget = ref('')

const targetOptions = computed(() => {
  const options: { value: string; label: string }[] = []
  
  if (props.integrations?.length) {
    options.push({ value: 'integration', label: 'Existing Integration' })
  }
  
  options.push({ value: 'http', label: 'HTTP Proxy' })
  options.push({ value: 'mock', label: 'Mock Response' })
  
  return options
})

function handleCreate() {
  if (!routeKey.value.trim()) return
  
  let targetValue = ''
  
  if (targetType.value === 'integration' && selectedTarget.value) {
    targetValue = selectedTarget.value
  } else if (targetType.value === 'http') {
    targetValue = selectedTarget.value
  }
  
  emit('create', routeKey.value.trim(), targetValue)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    title="Create Route"
    size="md"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="routeKey"
        label="Route Key"
        placeholder="GET /items"
        help-text="Format: METHOD /path, e.g., GET /users"
      />
      
      <FormSelect
        v-model="targetType"
        label="Target Type"
        :options="targetOptions"
      />
      
      <div
        v-if="targetType === 'integration' && integrations?.length"
        class="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20"
      >
        <label class="block text-sm font-medium mb-1">Select Integration</label>
        <select
          v-model="selectedTarget"
          class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input"
        >
          <option value="">
            Select an integration...
          </option>
          <option
            v-for="int in integrations"
            :key="int"
            :value="int"
          >
            {{ int }}
          </option>
        </select>
      </div>
      
      <div
        v-if="targetType === 'http'"
        class="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20"
      >
        <FormInput
          v-model="selectedTarget"
          label="HTTP Proxy URL"
          placeholder="https://api.example.com"
        />
      </div>
      
      <div
        v-if="targetType === 'mock'"
        class="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20"
      >
        <p class="text-sm text-blue-800 dark:text-blue-200">
          Route will use mock integration.
        </p>
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
          :disabled="!routeKey.trim() || (targetType === 'integration' && !selectedTarget)"
          @click="handleCreate"
        >
          {{ loading ? 'Creating...' : 'Create' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>