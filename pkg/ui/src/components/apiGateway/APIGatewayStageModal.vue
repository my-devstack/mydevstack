<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'

interface Deployment {
  id: string
  createdDate?: string
  description?: string
}

const props = defineProps<{
  open: boolean
  type: 'rest' | 'http'
  loading?: boolean
  autoDeploy?: boolean
  deployments?: Deployment[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create-rest': [stageName: string, deploymentId: string]
  'create-http': [stageName: string, autoDeploy?: boolean, description?: string]
}>()

const settingsStore = useSettingsStore()
const stageName = ref('')
const description = ref('')
const autoDeploy = ref(props.autoDeploy ?? true)
const selectedDeploymentId = ref('')

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    stageName.value = ''
    description.value = ''
    selectedDeploymentId.value = ''
    autoDeploy.value = props.autoDeploy ?? true
  }
})

const deploymentOptions = computed(() => {
  return (props.deployments || []).map(d => ({
    value: d.id,
    label: d.id + (d.description ? ` - ${d.description}` : '')
  }))
})

function handleCreate() {
  if (!stageName.value.trim()) return
  if (props.type === 'rest') {
    emit('create-rest', stageName.value.trim(), selectedDeploymentId.value)
  } else {
    emit('create-http', stageName.value.trim(), autoDeploy.value, description.value)
  }
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    :title="type === 'rest' ? 'Create Stage' : 'Create Stage'"
    size="sm"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="stageName"
        label="Stage Name"
        placeholder="prod"
        required
      />
      
      <FormSelect
        v-if="type === 'rest'"
        v-model="selectedDeploymentId"
        label="Deployment"
        :options="deploymentOptions"
        placeholder="Select a deployment"
        required
      />
      
      <FormInput
        v-if="type === 'http'"
        v-model="description"
        label="Description"
        placeholder="Production stage"
      />
      
      <div v-if="type === 'http'">
        <label class="block text-sm font-medium mb-1">Auto Deploy</label>
        <select
          v-model="autoDeploy"
          class="w-full px-3 py-2 rounded-lg border"
        >
          <option :value="true">
            Enabled
          </option>
          <option :value="false">
            Disabled
          </option>
        </select>
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
          :disabled="!stageName.trim() || (type === 'rest' && !selectedDeploymentId)"
          @click="handleCreate"
        >
          {{ loading ? 'Creating...' : 'Create' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>