<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'

const props = defineProps<{
  open: boolean
  keySchema: Record<string, any>[]
  loading: boolean
  error: string | null
  modelValue: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:modelValue': [value: string]
  'submit': []
}>()

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Add Item"
    size="lg"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <div
        v-if="error"
        class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm"
      >
        {{ error }}
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-1 text-light-text dark:text-dark-text">
          Item (DynamoDB JSON format)
        </label>
        <p class="text-xs mb-2 text-light-muted dark:text-dark-muted">
          Use DynamoDB attribute format: {"key": {"S": "value"}} or {"count": {"N": "42"}}
        </p>
        <textarea
          :value="modelValue"
          rows="12"
          placeholder="{&quot;pk&quot;: {&quot;S&quot;: &quot;user1&quot;}, &quot;name&quot;: {&quot;S&quot;: &quot;John&quot;}, &quot;age&quot;: {&quot;N&quot;: &quot;30&quot;}}"
          class="w-full px-3 py-2 rounded-lg border font-mono text-sm bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border-light-border dark:border-dark-border"
          @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        />
      </div>

      <!-- Key Info -->
      <div class="p-3 rounded-lg text-xs bg-light-bg dark:bg-dark-bg">
        <span class="font-medium text-light-text dark:text-dark-text">Required Keys:</span>
        <span class="text-light-muted dark:text-dark-muted">
          {{ keySchema?.map((k: any) => k.AttributeName).join(', ') }}
        </span>
      </div>
    </div>
    
    <template #footer>
      <Button
        variant="secondary"
        @click="handleClose"
      >
        Cancel
      </Button>
      <Button
        :disabled="loading"
        @click="emit('submit')"
      >
        {{ loading ? 'Adding...' : 'Add Item' }}
      </Button>
    </template>
  </Modal>
</template>