<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Button from '@/components/common/Button.vue'

const props = defineProps<{
  open: boolean
  form: {
    AlarmName: string
    AlarmDescription: string
    Namespace: string
    MetricName: string
    Statistic: string
    Period: number
    EvaluationPeriods: number
    Threshold: number
    ComparisonOperator: string
    ActionsEnabled: boolean
    Dimensions: { Name: string; Value: string }[]
  }
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  'update:form': [val: any]
  create: [val: any]
}>()

const settingsStore = useSettingsStore()

const localForm = ref({ ...props.form })

watch(() => props.open, (val) => {
  if (val) {
    localForm.value = { ...props.form }
  }
})

watch(localForm, (val) => {
  emit('update:form', val)
}, { deep: true })

function addDimension() {
  localForm.value.Dimensions.push({ Name: '', Value: '' })
}

function removeDimension(index: number) {
  localForm.value.Dimensions.splice(index, 1)
}

function handleCreate() {
  if (!localForm.value.AlarmName.trim() || !localForm.value.Namespace.trim() || !localForm.value.MetricName.trim()) {
    return
  }
  emit('create', { ...localForm.value, Dimensions: localForm.value.Dimensions.filter(d => d.Name.trim()) })
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center"
  >
    <div
      class="absolute inset-0 bg-black/50"
      @click="close"
    />
    <div
      class="relative w-full max-w-lg mx-4 rounded-lg border shadow-xl"
      :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-white border-light-border'"
      role="dialog"
    >
      <div
        class="flex items-center justify-between px-6 py-4 border-b"
        :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
      >
        <h2
          class="text-lg font-semibold"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Create CloudWatch Alarm
        </h2>
        <button
          class="text-light-muted hover:text-light-text dark:hover:text-dark-text"
          @click="close"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div class="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
        <div>
          <label
            for="cw-alarm-name"
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Alarm Name <span class="text-red-500">*</span>
          </label>
          <input
            id="cw-alarm-name"
            v-model="localForm.AlarmName"
            type="text"
            class="w-full border rounded px-3 py-2 text-sm"
            :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
          >
        </div>
        <div>
          <label
            for="cw-alarm-description"
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >Description</label>
          <textarea
            id="cw-alarm-description"
            v-model="localForm.AlarmDescription"
            class="w-full border rounded px-3 py-2 text-sm"
            :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
            rows="2"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              for="cw-namespace"
              class="block text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Namespace <span class="text-red-500">*</span>
            </label>
            <input
              id="cw-namespace"
              v-model="localForm.Namespace"
              type="text"
              class="w-full border rounded px-3 py-2 text-sm"
              :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
            >
          </div>
          <div>
            <label
              for="cw-metric-name"
              class="block text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Metric Name <span class="text-red-500">*</span>
            </label>
            <input
              id="cw-metric-name"
              v-model="localForm.MetricName"
              type="text"
              class="w-full border rounded px-3 py-2 text-sm"
              :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
            >
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              for="cw-statistic"
              class="block text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >Statistic</label>
            <select
              id="cw-statistic"
              v-model="localForm.Statistic"
              class="w-full border rounded px-3 py-2 text-sm"
              :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
            >
              <option value="SampleCount">
                SampleCount
              </option>
              <option value="Average">
                Average
              </option>
              <option value="Sum">
                Sum
              </option>
              <option value="Minimum">
                Minimum
              </option>
              <option value="Maximum">
                Maximum
              </option>
            </select>
          </div>
          <div>
            <label
              for="cw-period"
              class="block text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >Period (seconds)</label>
            <input
              id="cw-period"
              v-model.number="localForm.Period"
              type="number"
              class="w-full border rounded px-3 py-2 text-sm"
              :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
            >
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              for="cw-eval-periods"
              class="block text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >Evaluation Periods</label>
            <input
              id="cw-eval-periods"
              v-model.number="localForm.EvaluationPeriods"
              type="number"
              class="w-full border rounded px-3 py-2 text-sm"
              :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
            >
          </div>
          <div>
            <label
              for="cw-threshold"
              class="block text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >Threshold</label>
            <input
              id="cw-threshold"
              v-model.number="localForm.Threshold"
              type="number"
              step="0.1"
              class="w-full border rounded px-3 py-2 text-sm"
              :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
            >
          </div>
        </div>
        <div>
          <label
            for="cw-comparison"
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >Comparison Operator</label>
          <select
            id="cw-comparison"
            v-model="localForm.ComparisonOperator"
            class="w-full border rounded px-3 py-2 text-sm"
            :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
          >
            <option value="GreaterThanOrEqualToThreshold">
              GreaterThanOrEqualToThreshold
            </option>
            <option value="GreaterThanThreshold">
              GreaterThanThreshold
            </option>
            <option value="LessThanThreshold">
              LessThanThreshold
            </option>
            <option value="LessThanOrEqualToThreshold">
              LessThanOrEqualToThreshold
            </option>
          </select>
        </div>
        <div>
          <label class="flex items-center gap-2">
            <input
              v-model="localForm.ActionsEnabled"
              type="checkbox"
            >
            <span
              class="text-sm font-medium"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >Actions Enabled</span>
          </label>
        </div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <label
              class="text-sm font-medium"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >Dimensions</label>
            <button
              class="text-xs text-primary-600 hover:text-primary-700"
              @click="addDimension"
            >
              + Add Dimension
            </button>
          </div>
          <div
            v-for="(dim, i) in localForm.Dimensions"
            :key="i"
            class="flex gap-2 mb-2"
          >
            <input
              v-model="dim.Name"
              type="text"
              placeholder="Key"
              class="flex-1 border rounded px-2 py-1 text-sm"
              :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
            >
            <input
              v-model="dim.Value"
              type="text"
              placeholder="Value"
              class="flex-1 border rounded px-2 py-1 text-sm"
              :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
            >
            <button
              class="text-red-500 hover:text-red-700 text-sm px-1"
              @click="removeDimension(i)"
            >
              X
            </button>
          </div>
        </div>
      </div>
      <div
        class="flex justify-end gap-2 px-6 py-4 border-t"
        :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
      >
        <Button
          variant="secondary"
          @click="close"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          :disabled="!localForm.AlarmName.trim() || !localForm.Namespace.trim() || !localForm.MetricName.trim()"
          @click="handleCreate"
        >
          Create
        </Button>
      </div>
    </div>
  </div>
</template>
