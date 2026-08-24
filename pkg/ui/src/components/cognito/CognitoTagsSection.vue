<script setup lang="ts">
import { ref, watch } from 'vue'
import { PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = defineProps<{
  tags: Record<string, string>
}>()

const emit = defineEmits<{
  update: [tags: Record<string, string>, removedKeys: string[]]
}>()

interface TagRow {
  key: string
  value: string
}

const rows = ref<TagRow[]>([])
const newKey = ref('')
const newValue = ref('')

watch(() => props.tags, (tags) => {
  rows.value = Object.entries(tags || {}).map(([key, value]) => ({ key, value }))
}, { immediate: true, deep: true })

function emitUpdate() {
  const tags: Record<string, string> = {}
  const removedKeys: string[] = []
  const seen = new Set<string>()

  for (const row of rows.value) {
    const key = row.key.trim()
    if (!key) continue
    if (seen.has(key)) continue
    seen.add(key)
    tags[key] = row.value
  }

  for (const key of Object.keys(props.tags || {})) {
    if (!seen.has(key)) {
      removedKeys.push(key)
    }
  }

  emit('update', tags, removedKeys)
}

function addRow() {
  const key = newKey.value.trim()
  if (!key) return
  rows.value.push({ key, value: newValue.value })
  newKey.value = ''
  newValue.value = ''
  emitUpdate()
}

function removeRow(index: number) {
  rows.value.splice(index, 1)
  emitUpdate()
}

function updateRow(index: number, field: 'key' | 'value', value: string) {
  rows.value[index][field] = value
  emitUpdate()
}
</script>

<template>
  <div class="space-y-3">
    <label class="block text-sm font-medium text-light-text dark:text-dark-text">Tags</label>

    <!-- Existing tags -->
    <div
      v-if="rows.length > 0"
      class="space-y-2"
    >
      <div
        v-for="(row, index) in rows"
        :key="index"
        class="flex items-center gap-2"
      >
        <input
          :value="row.key"
          placeholder="Key"
          class="flex-1 text-sm border rounded px-3 py-2 bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-text dark:text-dark-text focus:border-primary-500 focus:ring-primary-500 focus:ring-1 focus:outline-none"
          @input="updateRow(index, 'key', ($event.target as HTMLInputElement).value)"
        >
        <input
          :value="row.value"
          placeholder="Value"
          class="flex-1 text-sm border rounded px-3 py-2 bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-text dark:text-dark-text focus:border-primary-500 focus:ring-primary-500 focus:ring-1 focus:outline-none"
          @input="updateRow(index, 'value', ($event.target as HTMLInputElement).value)"
        >
        <Button
          variant="ghost"
          size="sm"
          @click="removeRow(index)"
        >
          <template #icon-left>
            <XMarkIcon class="h-4 w-4" />
          </template>
        </Button>
      </div>
    </div>

    <p
      v-else
      class="text-sm text-light-muted dark:text-dark-muted"
    >
      No tags configured.
    </p>

    <!-- Add new tag -->
    <div class="flex items-center gap-2">
      <input
        v-model="newKey"
        placeholder="New key"
        class="flex-1 text-sm border rounded px-3 py-2 bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-text dark:text-dark-text focus:border-primary-500 focus:ring-primary-500 focus:ring-1 focus:outline-none"
      >
      <input
        v-model="newValue"
        placeholder="New value"
        class="flex-1 text-sm border rounded px-3 py-2 bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-text dark:text-dark-text focus:border-primary-500 focus:ring-primary-500 focus:ring-1 focus:outline-none"
      >
      <Button
        variant="secondary"
        size="sm"
        :disabled="!newKey.trim()"
        @click="addRow"
      >
        <template #icon-left>
          <PlusIcon class="h-4 w-4" />
        </template>
        Add
      </Button>
    </div>
  </div>
</template>