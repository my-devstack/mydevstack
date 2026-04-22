<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import Button from '@/components/common/Button.vue'

const props = defineProps<{
  open: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [data: {
    functionName: string
    runtime: string
    handler: string
    memory: number
    timeout: number
    roleArn: string
    zipFile: File | null
    architecture: string
    environment: string
  }]
}>()

const settingsStore = useSettingsStore()

const DEFAULT_ROLE_ARN = 'arn:aws:iam::123456789012:role/test'

const form = ref({
  functionName: '',
  runtime: 'nodejs22.x',
  handler: 'index.handler',
  memory: 128,
  timeout: 30,
  roleArn: DEFAULT_ROLE_ARN,
  zipFile: null as File | null,
  architecture: 'amd64',
  environment: '',
})

const runtimeOptions = [
  { value: 'nodejs22.x', label: 'Node.js 22' },
  { value: 'nodejs20.x', label: 'Node.js 20' },
  { value: 'python3.14', label: 'Python 3.14' },
  { value: 'python3.13', label: 'Python 3.13' },
  { value: 'python3.12', label: 'Python 3.12' },
  { value: 'java21', label: 'Java 21' },
  { value: 'java17', label: 'Java 17' },
  { value: 'dotnet8', label: '.NET 8' },
  { value: 'ruby3.3', label: 'Ruby 3.3' },
  { value: 'provided.al2023', label: 'provided.al2023' },
]

const architectureOptions = [
  { value: 'amd64', label: 'x86_64 (amd64)' },
  { value: 'arm64', label: 'arm64' },
]

function handleZipFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    form.value.zipFile = target.files[0]
  }
}

function handleCreate() {
  if (!form.value.functionName.trim()) return
  emit('create', { ...form.value })
}

function handleClose() {
  form.value = {
    functionName: '',
    runtime: 'nodejs22.x',
    handler: 'index.handler',
    memory: 128,
    timeout: 30,
    roleArn: DEFAULT_ROLE_ARN,
    zipFile: null,
    architecture: 'amd64',
    environment: '',
  }
  emit('update:open', false)
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="handleClose"
  >
    <div
      class="p-6 rounded-lg w-[500px] max-h-[90vh] overflow-y-auto shadow-xl"
      :class="settingsStore.darkMode ? 'bg-gray-800' : 'bg-white'"
    >
      <h2
        class="text-xl font-bold mb-4"
        :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
      >
        Create Lambda Function
      </h2>

      <FormInput
        v-model="form.functionName"
        label="Function Name"
        placeholder="my-function"
        required
      />

      <FormSelect
        v-model="form.runtime"
        label="Runtime"
        :options="runtimeOptions"
        class="mt-4"
      />

      <FormInput
        v-model="form.handler"
        label="Handler"
        placeholder="index.handler"
        required
        class="mt-4"
      />

      <FormInput
        v-model.number="form.memory"
        label="Memory (MB)"
        type="number"
        class="mt-4"
      />

      <FormInput
        v-model.number="form.timeout"
        label="Timeout (seconds)"
        type="number"
        class="mt-4"
      />

      <FormInput
        v-model="form.roleArn"
        label="Role ARN"
        placeholder="arn:aws:iam::123456789012:role/test"
        class="mt-4"
      />

      <FormSelect
        v-model="form.architecture"
        label="Architecture"
        :options="architectureOptions"
        class="mt-4"
      />

      <div class="mt-4">
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
          ZIP File
        </label>
        <input
          type="file"
          accept=".zip"
          class="w-full"
          @change="handleZipFileChange"
        >
      </div>

      <FormInput
        v-model="form.environment"
        label="Environment (JSON)"
        placeholder="{&quot;KEY&quot;: &quot;value&quot;}"
        class="mt-4"
      />

      <div class="flex gap-2 justify-end mt-6">
        <Button
          variant="secondary"
          @click="handleClose"
        >
          Cancel
        </Button>
        <Button
          :disabled="!form.functionName.trim() || loading"
          @click="handleCreate"
        >
          {{ loading ? 'Creating...' : 'Create' }}
        </Button>
      </div>
    </div>
  </div>
</template>