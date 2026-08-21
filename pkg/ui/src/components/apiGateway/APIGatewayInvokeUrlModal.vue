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
  open: boolean
  api: { id?: string; apiId?: string; name: string; protocolType?: string }
  apiType: 'rest' | 'http'
  invokeUrl: string
  loading?: boolean
  stages: Stage[]
  protocolType?: string
}>()

const emit = defineEmits<{
  'close': []
  'copy': []
  'update:selectedStage': [stage: string]
  'fetch-url': []
  'update:open': [value: boolean]
}>()

const settingsStore = useSettingsStore()
const copied = ref(false)
const selectedStage = ref('')

const apiId = computed(() => props.api?.id || props.api?.apiId || '')
const title = computed(() => props.api?.name ? `Invoke URL - ${props.api.name}` : 'Invoke URL')

const activeProtocol = computed(() => props.api?.protocolType || props.protocolType || 'HTTP')
const emulatorType = computed(() => settingsStore.emulator?.toUpperCase() || 'FLOCI')

const emulatorUrl = computed(() => {
  if (!apiId.value || !selectedStage.value) {
    return ''
  }
  
  const emulator = emulatorType.value
  const isWebSocket = activeProtocol.value === 'WEBSOCKET'
  
  const endpoint = settingsStore.publicEndpoint
  
  if (isWebSocket) {
    if (emulator === 'FLOCI') {
      return `ws://${endpoint}/ws/${apiId.value}/${selectedStage.value}`
    }
    if (emulator === 'LOCALSTACK' || emulator === 'MINISTACK') {
      return `ws://${endpoint}/_aws/execute-api/${apiId.value}/${selectedStage.value}`
    }
    return ''
  }
  
  if (emulator === 'FLOCI') {
    return `http://${endpoint}/restapis/${apiId.value}/${selectedStage.value}/_user_request_/`
  }
  
  if (emulator === 'LOCALSTACK' || emulator === 'MINISTACK') {
    return `http://${endpoint}/restapis/${apiId.value}/${selectedStage.value}/_user_request_/`
  }
  
  // Default: don't show emulator URL for unknown emulator types
  return ''
})

watch(() => props.stages, (newStages) => {
  if (newStages && newStages.length > 0 && !selectedStage.value) {
    selectedStage.value = newStages[0].stageName
    emit('update:selectedStage', selectedStage.value)
    emit('fetch-url')
  }
})

watch(() => props.open, (isOpen) => {
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
    :open="open"
    :title="title"
    @close="emit('close')"
    @update:open="emit('update:open', $event)"
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
            Emulator URL ({{ emulatorType }}) - {{ activeProtocol === 'WEBSOCKET' ? 'WebSocket' : 'HTTP' }}
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