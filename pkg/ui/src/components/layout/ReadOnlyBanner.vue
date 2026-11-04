<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import { computed } from 'vue'

const settingsStore = useSettingsStore()
const visible = computed(() => settingsStore.readOnly)
</script>

<template>
  <div
    v-if="visible"
    role="status"
    data-testid="read-only-banner"
    class="px-4 py-2 text-center text-sm font-medium border-b"
    :class="[
      'bg-amber-100 text-amber-900 border-amber-200',
      'dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800',
    ]"
  >
    Read-only mode — create, edit and delete are disabled
  </div>
</template>
