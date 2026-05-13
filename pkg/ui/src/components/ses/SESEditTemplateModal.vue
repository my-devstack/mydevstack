<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = defineProps<{
  open: boolean
  template?: any
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update': [name: string, subject: string, htmlBody: string, textBody: string]
}>()

const form = ref({ name: '', subject: '', htmlBody: '', textBody: '' })

// Pre-fill form when modal opens or template data arrives async
watch([() => props.open, () => props.template], ([isOpen, template]) => {
  if (isOpen && template) {
    form.value = {
      name: template.TemplateName || '',
      subject: template.TemplateContent?.Subject || '',
      htmlBody: template.TemplateContent?.Html || '',
      textBody: template.TemplateContent?.Text || '',
    }
  }
})

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Edit Template"
    size="lg"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="form.name"
        label="Template Name"
        placeholder="my-template"
        required
        disabled
      />
      <FormInput
        v-model="form.subject"
        label="Subject"
        placeholder="Email subject line"
        required
      />
      <div class="w-full">
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
          HTML Body <span class="text-light-muted dark:text-dark-muted">optional</span>
        </label>
        <textarea
          v-model="form.htmlBody"
          class="block w-full rounded-md shadow-sm border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:border-primary-500 focus:ring-primary-500 focus:ring-1 focus:outline-none px-3 py-2 text-sm"
          rows="6"
          placeholder="<h1>Hello</h1>"
        />
      </div>
      <div class="w-full">
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
          Text Body <span class="text-light-muted dark:text-dark-muted">optional</span>
        </label>
        <textarea
          v-model="form.textBody"
          class="block w-full rounded-md shadow-sm border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:border-primary-500 focus:ring-primary-500 focus:ring-1 focus:outline-none px-3 py-2 text-sm"
          rows="4"
          placeholder="Plain text version"
        />
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="secondary"
          @click="handleClose"
        >
          Cancel
        </Button>
        <Button @click="emit('update', props.template?.TemplateName || form.name, form.subject, form.htmlBody, form.textBody)">
          Save Changes
        </Button>
      </div>
    </template>
  </Modal>
</template>
