<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import { useToast } from '@/composables/useToast'

type SendMode = 'simple' | 'template'

interface SendEmailForm {
  from: string
  to: string
  subject: string
  body: string
  htmlBody: string
}

interface SendEmailTemplateForm {
  from: string
  to: string
  templateName: string
  templateData: string
}

const props = defineProps<{
  open: boolean
  templatesList?: { TemplateName: string }[]
  mode?: 'simple' | 'template'
  sending?: boolean
  identityName?: string
  identityType?: 'EMAIL_ADDRESS' | 'DOMAIN'
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'send': [form: SendEmailForm]
  'send-template': [form: SendEmailTemplateForm]
}>()

const toast = useToast()

const form = defineModel<SendEmailForm>('form', { default: { from: '', to: '', subject: '', body: '', htmlBody: '' } })

const mode = ref<SendMode>(props.mode || 'simple')

const isDomain = computed(() => props.identityType === 'DOMAIN')

watch(() => props.mode, (newMode) => {
  if (newMode) mode.value = newMode
})

const templateForm = ref<SendEmailTemplateForm>({ from: '', to: '', templateName: '', templateData: '' })

function handleClose() {
  emit('update:open', false)
}

function fromIsValid(): boolean {
  if (!isDomain.value || !props.identityName) return true
  const val = (mode.value === 'simple' ? form.value.from : templateForm.value.from).trim()
  if (val.endsWith(`@${props.identityName}`) && val !== `@${props.identityName}`) return true
  return false
}

function handleSend() {
  if (mode.value === 'simple') {
    if (isDomain.value && !fromIsValid()) {
      toast.error(`From must be user@${props.identityName}`)
      return
    }
    emit('send', form.value)
  } else {
    if (isDomain.value && !fromIsValid()) {
      toast.error(`From must be user@${props.identityName}`)
      return
    }
    emit('send-template', templateForm.value)
  }
}

function switchMode(newMode: SendMode) {
  mode.value = newMode
  if (newMode === 'template') {
    templateForm.value.from = form.value.from
    templateForm.value.to = form.value.to
  }
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Send Email"
    size="lg"
    @update:open="handleClose"
  >
    <!-- Mode Toggle -->
    <div class="flex gap-1 mb-4 p-1 bg-light-border dark:bg-dark-border rounded-lg">
      <button
        class="flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
        :class="mode === 'simple'
          ? 'bg-white dark:bg-dark-surface text-light-text dark:text-dark-text shadow-sm'
          : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'"
        @click="switchMode('simple')"
      >
        Simple
      </button>
      <button
        class="flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
        :class="mode === 'template'
          ? 'bg-white dark:bg-dark-surface text-light-text dark:text-dark-text shadow-sm'
          : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'"
        @click="switchMode('template')"
      >
        Template
      </button>
    </div>

    <!-- Simple Mode Fields -->
    <template v-if="mode === 'simple'">
      <div class="space-y-4">
        <FormInput
          v-model="form.from"
          :label="isDomain ? `From (user@${props.identityName})` : 'From Email Address'"
          :placeholder="isDomain ? `user@${props.identityName}` : 'sender@example.com'"
          required
        />
        <FormInput
          v-model="form.to"
          label="To (comma-separated)"
          placeholder="recipient1@example.com, recipient2@example.com"
          required
        />
        <FormInput
          v-model="form.subject"
          label="Subject"
          placeholder="Email subject"
          required
        />
        <div class="w-full">
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Body (Text)
          </label>
          <textarea
            v-model="form.body"
            class="block w-full rounded-md shadow-sm border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:border-primary-500 focus:ring-primary-500 focus:ring-1 focus:outline-none px-3 py-2 text-sm"
            rows="4"
            placeholder="Plain text body"
          />
        </div>
        <div class="w-full">
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Body (HTML) <span class="text-light-muted dark:text-dark-muted">optional</span>
          </label>
          <textarea
            v-model="form.htmlBody"
            class="block w-full rounded-md shadow-sm border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:border-primary-500 focus:ring-primary-500 focus:ring-1 focus:outline-none px-3 py-2 text-sm"
            rows="6"
            placeholder="<p>HTML body</p>"
          />
        </div>
      </div>
    </template>

    <!-- Template Mode Fields -->
    <template v-if="mode === 'template'">
      <div class="space-y-4">
        <FormInput
          v-model="templateForm.from"
          :label="isDomain ? `From (user@${props.identityName})` : 'From Email Address'"
          :placeholder="isDomain ? `user@${props.identityName}` : 'sender@example.com'"
          required
        />
        <FormInput
          v-model="templateForm.to"
          label="To (comma-separated)"
          placeholder="recipient1@example.com, recipient2@example.com"
          required
        />
        <div class="w-full">
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Template Name <span class="text-red-500">*</span>
          </label>
          <select
            v-model="templateForm.templateName"
            class="block w-full rounded-md shadow-sm border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:border-primary-500 focus:ring-primary-500 focus:ring-1 focus:outline-none px-3 py-2 text-sm"
            required
          >
            <option
              value=""
              disabled
            >
              Select a template...
            </option>
            <option
              v-for="tpl in props.templatesList"
              :key="tpl.TemplateName"
              :value="tpl.TemplateName"
            >
              {{ tpl.TemplateName }}
            </option>
          </select>
        </div>
        <div class="w-full">
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Template Data (JSON) <span class="text-light-muted dark:text-dark-muted">optional</span>
          </label>
          <textarea
            v-model="templateForm.templateData"
            class="block w-full rounded-md shadow-sm border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:border-primary-500 focus:ring-primary-500 focus:ring-1 focus:outline-none px-3 py-2 text-sm font-mono"
            rows="6"
            placeholder="{&quot;key&quot;: &quot;value&quot;}"
          />
          <p class="mt-1 text-xs text-light-muted dark:text-dark-muted">
            JSON key-value pairs to merge into the template.
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="secondary"
          @click="handleClose"
        >
          Cancel
        </Button>
        <Button
          :loading="props.sending"
          @click="handleSend"
        >
          {{ mode === 'simple' ? 'Send Email' : 'Send with Template' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
