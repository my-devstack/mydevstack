<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import { TrashIcon, PlusIcon, CalendarDaysIcon } from '@heroicons/vue/24/outline'

export interface LifecycleRuleForm {
  ID: string
  Status: 'Enabled' | 'Disabled'
  Prefix: string
  ExpirationDays: number | null
  TransitionStorageClass: string
  TransitionDays: number | null
}

const props = defineProps<{
  open: boolean
  bucketName: string
  rules: Array<{
    ID?: string
    Status: string
    Filter?: { Prefix?: string }
    Expiration?: { Days?: number }
    Transitions?: Array<{ StorageClass: string; Days?: number }>
  }>
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [rules: Array<{
    ID?: string
    Status: string
    Filter?: { Prefix?: string }
    Expiration?: { Days?: number }
    Transitions?: Array<{ StorageClass: string; Days?: number }>
  }>]
  'delete': [bucketName: string]
}>()

const settingsStore = useSettingsStore()

const showAddForm = ref(false)
const confirmDeleteAll = ref(false)

const newRule = reactive<LifecycleRuleForm>({
  ID: '',
  Status: 'Enabled',
  Prefix: '',
  ExpirationDays: null,
  TransitionStorageClass: '',
  TransitionDays: null,
})

const storageClassOptions = [
  { value: 'GLACIER', label: 'GLACIER' },
  { value: 'DEEP_ARCHIVE', label: 'DEEP_ARCHIVE' },
  { value: 'INTELLIGENT_TIERING', label: 'INTELLIGENT_TIERING' },
]

watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    showAddForm.value = false
    confirmDeleteAll.value = false
    resetNewRule()
  }
})

function resetNewRule() {
  newRule.ID = ''
  newRule.Status = 'Enabled'
  newRule.Prefix = ''
  newRule.ExpirationDays = null
  newRule.TransitionStorageClass = ''
  newRule.TransitionDays = null
}

function handleClose() {
  emit('update:open', false)
}

function addRule() {
  if (!newRule.ID) return

  const rule: any = {
    ID: newRule.ID,
    Status: newRule.Status,
  }

  if (newRule.Prefix) {
    rule.Filter = { Prefix: newRule.Prefix }
  }

  if (newRule.ExpirationDays !== null && newRule.ExpirationDays > 0) {
    rule.Expiration = { Days: newRule.ExpirationDays }
  }

  if (newRule.TransitionStorageClass && newRule.TransitionDays !== null && newRule.TransitionDays > 0) {
    rule.Transitions = [{ StorageClass: newRule.TransitionStorageClass, Days: newRule.TransitionDays }]
  }

  const updatedRules = [...props.rules, rule]
  updatedRules.forEach((r, i) => {
    if (!r.ID) r.ID = `Rule-${i + 1}`
  })
  // Emit save with updated rules immediately so parent sees the change
  emit('save', updatedRules)
  resetNewRule()
  showAddForm.value = false
}

function removeRule(index: number) {
  const updatedRules = props.rules.filter((_, i) => i !== index)
  emit('save', updatedRules)
}

function handleSaveChanges() {
  if (props.rules.length === 0) return
  emit('save', [...props.rules])
  handleClose()
}

function handleDeleteAll() {
  confirmDeleteAll.value = false
  emit('delete', props.bucketName)
  handleClose()
}

function getStatusBadgeClass(status: string): string {
  return status === 'Enabled'
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
}
</script>

<template>
  <Modal
    :open="open"
    :title="`Lifecycle Rules — ${bucketName}`"
    size="lg"
    @update:open="handleClose"
  >
    <!-- Loading State -->
    <div
      v-if="loading"
      class="text-center py-8"
    >
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      <p
        class="mt-2 text-sm"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
      >
        Loading lifecycle rules...
      </p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="rules.length === 0 && !showAddForm"
      class="text-center py-8"
    >
      <CalendarDaysIcon class="w-12 h-12 mx-auto mb-3 text-light-muted dark:text-dark-muted" />
      <p
        class="text-sm"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
      >
        No lifecycle rules configured
      </p>
    </div>

    <!-- Rules List -->
    <div
      v-else
      class="space-y-3"
    >
      <div
        v-for="(rule, index) in rules"
        :key="index"
        class="p-3 rounded-lg border"
        :class="settingsStore.darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-light-text dark:text-dark-text">{{ rule.ID || `Rule ${index + 1}` }}</span>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusBadgeClass(rule.Status)"
              >
                {{ rule.Status }}
              </span>
            </div>
            <div class="text-xs text-light-muted dark:text-dark-muted space-y-0.5">
              <p v-if="rule.Filter?.Prefix">
                Prefix: <span class="font-mono">{{ rule.Filter.Prefix }}</span>
              </p>
              <p v-if="rule.Expiration?.Days">
                Expire after {{ rule.Expiration.Days }} day(s)
              </p>
              <p v-if="rule.Transitions && rule.Transitions.length > 0">
                Transition{{ rule.Transitions.length > 1 ? 's' : '' }}:
                <span
                  v-for="(t, ti) in rule.Transitions"
                  :key="ti"
                  class="font-mono"
                >
                  {{ t.StorageClass }}{{ t.Days ? ` (${t.Days}d)` : '' }}{{ ti < rule.Transitions.length - 1 ? ', ' : '' }}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            class="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
            title="Remove rule"
            @click="removeRule(index)"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Add Rule Form -->
    <div
      v-if="showAddForm"
      class="mt-4 p-4 rounded-lg border"
      :class="settingsStore.darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'"
    >
      <h4
        class="text-sm font-medium mb-3"
        :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
      >
        New Rule
      </h4>
      <div class="space-y-3">
        <div>
          <label
            class="block text-xs font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
          >
            Rule ID
          </label>
          <input
            v-model="newRule.ID"
            placeholder="e.g., ExpireLogs"
            class="w-full px-3 py-2 text-sm border rounded-lg"
            :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 placeholder-gray-400'"
          >
        </div>
        <div>
          <label
            class="block text-xs font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
          >
            Status
          </label>
          <select
            v-model="newRule.Status"
            class="w-full px-3 py-2 text-sm border rounded-lg"
            :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
          >
            <option value="Enabled">
              Enabled
            </option>
            <option value="Disabled">
              Disabled
            </option>
          </select>
        </div>
        <div>
          <label
            class="block text-xs font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
          >
            Prefix Filter (optional)
          </label>
          <input
            v-model="newRule.Prefix"
            placeholder="e.g., logs/"
            class="w-full px-3 py-2 text-sm border rounded-lg"
            :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 placeholder-gray-400'"
          >
        </div>
        <div>
          <label
            class="block text-xs font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
          >
            Expiration Days (optional)
          </label>
          <input
            v-model.number="newRule.ExpirationDays"
            type="number"
            min="1"
            placeholder="e.g., 30"
            class="w-full px-3 py-2 text-sm border rounded-lg"
            :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 placeholder-gray-400'"
          >
        </div>
        <div>
          <label
            class="block text-xs font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
          >
            Storage Class Transition (optional)
          </label>
          <div class="flex gap-2">
            <select
              v-model="newRule.TransitionStorageClass"
              class="flex-1 px-3 py-2 text-sm border rounded-lg"
              :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
            >
              <option value="">
                Select class
              </option>
              <option
                v-for="opt in storageClassOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
            <input
              v-model.number="newRule.TransitionDays"
              type="number"
              min="1"
              placeholder="Days"
              class="w-28 px-3 py-2 text-sm border rounded-lg"
              :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 placeholder-gray-400'"
            >
          </div>
        </div>
      </div>
      <div class="flex gap-2 justify-end mt-4">
        <button
          type="button"
          class="px-3 py-1.5 text-xs rounded-lg bg-gray-500 text-white hover:bg-gray-600"
          @click="showAddForm = false"
        >
          Cancel
        </button>
        <button
          type="button"
          :disabled="!newRule.ID"
          class="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="addRule"
        >
          Add Rule
        </button>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="flex gap-2 flex-wrap">
        <!-- Delete All Confirmation -->
        <div
          v-if="confirmDeleteAll"
          class="flex items-center gap-2"
        >
          <span class="text-xs text-red-600 dark:text-red-400">Delete all rules?</span>
          <button
            type="button"
            class="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700"
            @click="handleDeleteAll"
          >
            Confirm
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-xs rounded-lg bg-gray-500 text-white hover:bg-gray-600"
            @click="confirmDeleteAll = false"
          >
            Cancel
          </button>
        </div>
        <button
          v-else
          type="button"
          :disabled="loading"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="confirmDeleteAll = true"
        >
          <TrashIcon class="w-3.5 h-3.5" />
          Delete All
        </button>
        <button
          v-if="!showAddForm"
          type="button"
          :disabled="loading"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="showAddForm = true"
        >
          <PlusIcon class="w-3.5 h-3.5" />
          Add Rule
        </button>
        <button
          type="button"
          :disabled="rules.length === 0 || loading"
          class="px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleSaveChanges"
        >
          Save Changes
        </button>
      </div>
    </template>
  </Modal>
</template>
