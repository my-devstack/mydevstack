<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

interface Props {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'danger' | 'secondary'
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  confirmVariant: 'danger'
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  cancel: []
}>()

function handleConfirm() {
  emit('confirm')
  emit('update:open', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:open', false)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <!-- Backdrop -->
      <div 
        class="absolute inset-0 bg-black/50"
        @click="handleCancel"
      />
      
      <!-- Modal -->
      <div
        class="relative bg-light-surface dark:bg-dark-surface rounded-lg shadow-xl max-w-md w-full p-6"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        <h3 class="text-lg font-semibold mb-4">
          {{ props.title }}
        </h3>
        
        <p 
          class="text-sm mb-6"
          v-html="props.message"
        />
        
        <div class="flex justify-end gap-3">
          <button
            @click="handleCancel"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="settingsStore.darkMode 
              ? 'bg-dark-border text-dark-text hover:bg-dark-border/80' 
              : 'bg-light-border text-light-text hover:bg-light-border/80'"
          >
            {{ props.cancelText }}
          </button>
          <button
            @click="handleConfirm"
            class="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            :class="props.confirmVariant === 'danger' 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600'"
          >
            {{ props.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>