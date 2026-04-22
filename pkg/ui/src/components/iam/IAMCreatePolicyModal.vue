<script setup lang="ts">
import { ref } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  create: [data: { PolicyName: string; PolicyDocument: string; Description?: string }]
}>()

const newPolicy = ref({
  PolicyName: '',
  PolicyDocument: '',
  Description: '',
})

function handleCreate() {
  emit('create', {
    PolicyName: newPolicy.value.PolicyName,
    PolicyDocument: newPolicy.value.PolicyDocument,
    Description: newPolicy.value.Description || undefined,
  })
}

function handleClose() {
  newPolicy.value = { PolicyName: '', PolicyDocument: '', Description: '' }
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create Policy"
    size="lg"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="newPolicy.PolicyName"
        label="Policy Name"
        placeholder="MyPolicy"
      />
      <div>
        <label class="block text-sm font-medium mb-1 text-light-text dark:text-dark-text">
          Policy Document (JSON)
        </label>
        <textarea
          v-model="newPolicy.PolicyDocument"
          rows="10"
          class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border font-mono text-sm"
          placeholder="{&quot;Version&quot;: &quot;2012-10-17&quot;, &quot;Statement&quot;: [{&quot;Effect&quot;: &quot;Allow&quot;, &quot;Action&quot;: [&quot;s3:GetObject&quot;], &quot;Resource&quot;: &quot;*&quot;}]}"
        />
        <p class="text-xs text-light-muted dark:text-dark-muted mt-1">
          Enter the IAM policy JSON document
        </p>
      </div>
      <FormInput
        v-model="newPolicy.Description"
        label="Description (optional)"
        placeholder="My custom policy"
      />
    </div>
    <template #footer>
      <Button
        variant="secondary"
        @click="handleClose"
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        @click="handleCreate"
      >
        Create Policy
      </Button>
    </template>
  </Modal>
</template>