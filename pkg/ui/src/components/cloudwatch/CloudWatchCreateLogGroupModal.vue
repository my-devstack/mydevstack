<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Button from '@/components/common/Button.vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  create: [val: { logGroupName: string; retentionInDays: number; tags: { Key: string; Value: string }[] }]
}>()

const settingsStore = useSettingsStore()

const retentionOptions = [0, 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653]

const logGroupName = ref('')
const retentionInDays = ref(0)
const tags = ref<{ Key: string; Value: string }[]>([])

watch(() => props.open, (val) => {
  if (val) {
    logGroupName.value = ''
    retentionInDays.value = 0
    tags.value = []
  }
})

function addTag() {
  tags.value.push({ Key: '', Value: '' })
}

function removeTag(index: number) {
  tags.value.splice(index, 1)
}

function handleCreate() {
  if (!logGroupName.value.trim()) return
  emit('create', {
    logGroupName: logGroupName.value.trim(),
    retentionInDays: retentionInDays.value,
    tags: tags.value.filter(t => t.Key.trim()),
  })
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
    <div class="absolute inset-0 bg-black/50" @click="close" />
    <div
      class="relative w-full max-w-lg mx-4 rounded-lg border shadow-xl"
      :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-white border-light-border'"
      role="dialog"
    >
      <div
        class="flex items-center justify-between px-6 py-4 border-b"
        :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
      >
        <h2 class="text-lg font-semibold" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">Create Log Group</h2>
        <button class="text-light-muted hover:text-light-text dark:hover:text-dark-text" @click="close">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
        <div>
          <label for="cw-log-group-name" class="block text-sm font-medium mb-1" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
            Log Group Name <span class="text-red-500">*</span>
          </label>
          <input
            id="cw-log-group-name"
            v-model="logGroupName"
            type="text"
            class="w-full border rounded px-3 py-2 text-sm"
            :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
            placeholder="/aws/myapp"
          />
        </div>
        <div>
          <label for="cw-log-retention" class="block text-sm font-medium mb-1" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">Retention Period</label>
          <select
            id="cw-log-retention"
            v-model.number="retentionInDays"
            class="w-full border rounded px-3 py-2 text-sm"
            :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
          >
            <option :value="0">Never expire</option>
            <option v-for="days in retentionOptions.filter(d => d > 0)" :key="days" :value="days">{{ days }} days</option>
          </select>
        </div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">Tags</label>
            <button class="text-xs text-primary-600 hover:text-primary-700" @click="addTag">+ Add Tag</button>
          </div>
          <div v-for="(tag, i) in tags" :key="i" class="flex gap-2 mb-2">
            <input
              :id="`cw-tag-key-${i}`"
              v-model="tag.Key"
              type="text"
              placeholder="Key"
              class="flex-1 border rounded px-2 py-1 text-sm"
              :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
            />
            <input
              :id="`cw-tag-value-${i}`"
              v-model="tag.Value"
              type="text"
              placeholder="Value"
              class="flex-1 border rounded px-2 py-1 text-sm"
              :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
            />
            <button class="text-red-500 hover:text-red-700 text-sm px-1" @click="removeTag(i)">X</button>
          </div>
        </div>
      </div>
      <div
        class="flex justify-end gap-2 px-6 py-4 border-t"
        :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
      >
        <Button variant="secondary" @click="close">Cancel</Button>
        <Button
          variant="primary"
          :disabled="!logGroupName.trim()"
          @click="handleCreate"
        >Create</Button>
      </div>
    </div>
  </div>
</template>
