<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormSelect from '@/components/common/FormSelect.vue'

interface Stage {
  stageName: string
}

const props = defineProps<{
  show: boolean
  title: string
  invokeUrl: string
  loading?: boolean
  stages: Stage[]
  apiType: 'rest' | 'http'
  apiId: string
}>()

const emit = defineEmits<{
  'close': []
  'copy': []
  'update:selectedStage': [stage: string]
  'fetch-url': []
}>()

const settingsStore = useSettingsStore()
const copied = ref(false)
const selectedStage = ref('')

const emulatorType = computed(() => settingsStore.emulator?.toUpperCase() || '')

const emulatorUrl = computed(() => {
  if (!emulatorType.value || !props.apiId || !selectedStage.value) {
    return ''
  }
  
  if (emulatorType.value === 'FLOCI') {
    return `http://localhost:4566/restapis/${props.apiId}/${selectedStage.value}/_user_request_/`
  }
  
  if (emulatorType.value === 'LOCALSTACK') {
    return `http://${props.apiId}.execute-api.localhost.localstack.cloud:4566/${selectedStage.value}/`
  }
  
  if (emulatorType.value === 'MINISTACK') {
    return `http://localhost:4566/_aws/execute-api/${props.apiId}/${selectedStage.value}/`
  }
  
  return ''
})

watch(() => props.stages, (newStages) => {
  if (newStages && newStages.length > 0 && !selectedStage.value) {
    selectedStage.value = newStages[0].stageName
    emit('update:selectedStage', selectedStage.value)
    emit('fetch-url')
  }
})

watch(() => props.show, (isOpen) => {
  if (isOpen && props.stages?.length > 0) {
    selectedStage.value = props.stages[0].stageName
    emit('update:selectedStage', selectedStage.value)
    emit('fetch-url')
  } else if (!isOpen) {
    selectedStage.value = ''
  }
})

function handleStageChange(stage: string) {
  selectedStage.value = stage
  emit('update:selectedStage', stage)
  emit('fetch-url')
}

const copiedText = computed(() => copied.value ? 'Copied!' : 'Copy')

function copyUrl() {
  if (!props.invokeUrl) return
  
  navigator.clipboard.writeText(props.invokeUrl).then(() => {
    copied.value = true
    emit('copy')
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }).catch((err) => {
    console.error('Failed to copy:', err)
  })
}

function copyEmulatorUrl() {
  if (!emulatorUrl.value) return
  
  navigator.clipboard.writeText(emulatorUrl.value).then(() => {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }).catch((err) => {
    console.error('Failed to copy emulator URL:', err)
  })
}
</script>

<template>
  <Modal
    :open="show"
    :title="title"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <!-- Stage Select -->
      <FormSelect
        v-model="selectedStage"
        label="Stage"
        :options="stages.map(s => ({ value: s.stageName, label: s.stageName }))"
        @update:model-value="handleStageChange"
      />

      <div
        v-if="loading"
        class="flex justify-center py-4"
      >
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2"
          :class="settingsStore.darkMode ? 'border-dark-primary' : 'border-light-primary'"
        />
      </div>

      <div v-else-if="invokeUrl">
        <label
          class="block text-sm font-medium mb-2"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Invoke URL
        </label>
        <div
          class="flex items-center gap-2 p-3 rounded-lg border mb-4"
          :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border' : 'bg-light-bg border-light-border'"
        >
          <code
            class="flex-1 text-sm font-mono break-all"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ invokeUrl }}
          </code>
          <button
            type="button"
            class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            :class="copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'"
            @click="copyUrl"
          >
            {{ copiedText }}
          </button>
        </div>

        <!-- Emulator URL -->
        <div v-if="emulatorUrl">
          <label
            class="block text-sm font-medium mb-2"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            Emulator URL ({{ emulatorType }})
          </label>
          <div
            class="flex items-center gap-2 p-3 rounded-lg border"
            :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border' : 'bg-light-bg border-light-border'"
          >
            <code
              class="flex-1 text-sm font-mono break-all"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              {{ emulatorUrl }}
            </code>
            <button
              type="button"
              class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
              :class="copied ? 'bg-green-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'"
              @click="copyEmulatorUrl"
            >
              {{ copiedText }}
            </button>
          </div>
        </div>
      </div>

      <div
        v-else-if="!loading && stages.length === 0"
        class="text-center py-4"
      >
        <p :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
          No stages available. Create a deployment/stage first.
        </p>
      </div>

      <div
        v-else-if="!loading && !invokeUrl"
        class="text-center py-4"
      >
        <p :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
          No invoke URL available for this stage
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <Button
          variant="secondary"
          @click="emit('close')"
        >
          Close
        </Button>
      </div>
    </template>
  </Modal>
</template>