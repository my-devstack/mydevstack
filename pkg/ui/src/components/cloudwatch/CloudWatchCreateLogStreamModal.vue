<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Button from '@/components/common/Button.vue'

const props = defineProps<{
  open: boolean
  logGroupName: string
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  create: [val: { logGroupName: string; logStreamName: string }]
}>()

const settingsStore = useSettingsStore()
const streamName = ref('')

watch(() => props.open, (val) => {
  if (val) streamName.value = ''
})

function handleCreate() {
  if (!streamName.value.trim()) return
  emit('create', {
    logGroupName: props.logGroupName,
    logStreamName: streamName.value.trim(),
  })
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/50" @click="close" />
    <div class="relative w-full max-w-md mx-4 rounded-lg border shadow-xl"
      :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-white border-light-border'"
      role="dialog"
    >
      <div class="flex items-center justify-between px-6 py-4 border-b"
        :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
      >
        <h2 class="text-lg font-semibold" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">Create Log Stream</h2>
        <button class="text-light-muted hover:text-light-text dark:hover:text-dark-text" @click="close">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="px-6 py-4 space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">Log Group</label>
          <p class="text-sm text-light-muted dark:text-dark-muted px-3 py-2 bg-light-border/30 dark:bg-dark-border/30 rounded">{{ logGroupName }}</p>
        </div>
        <div>
          <label for="cw-stream-name" class="block text-sm font-medium mb-1" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
            Stream Name <span class="text-red-500">*</span>
          </label>
          <input
            id="cw-stream-name"
            v-model="streamName"
            type="text"
            class="w-full border rounded px-3 py-2 text-sm"
            :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
            placeholder="2025/01/01/[$LATEST]my-stream"
          />
        </div>
      </div>
      <div class="flex justify-end gap-2 px-6 py-4 border-t"
        :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
      >
        <Button variant="secondary" @click="close">Cancel</Button>
        <Button variant="primary" :disabled="!streamName.trim()" @click="handleCreate">Create</Button>
      </div>
    </div>
  </div>
</template>
