<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{
  examples: Array<{ language: string; label: string; code: string }>
}>()

const settingsStore = useSettingsStore()
const selectedExample = ref(0)
</script>

<template>
  <div class="mt-8">
    <h2
      class="text-lg font-semibold mb-4"
      :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
    >
      Usage Examples
    </h2>
    <div
      class="rounded-lg border overflow-hidden"
      :class="settingsStore.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
    >
      <div
        class="flex border-b"
        :class="settingsStore.darkMode ? 'border-gray-700' : 'border-gray-200'"
      >
        <button
          v-for="(example, index) in props.examples"
          :key="example.language"
          class="px-4 py-2 text-sm font-medium transition-colors"
          :class="[
            selectedExample === index
              ? settingsStore.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
              : settingsStore.darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          ]"
          @click="selectedExample = index"
        >
          {{ example.label }}
        </button>
      </div>
      <div class="p-4 overflow-x-auto">
        <pre
          class="text-sm font-mono"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >{{ props.examples[selectedExample].code }}</pre>
      </div>
    </div>
  </div>
</template>