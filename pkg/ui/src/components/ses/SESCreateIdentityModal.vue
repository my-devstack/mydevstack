<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import type { Option } from '@/components/common/FormSelect.vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [name: string, type: string, tags?: { Key: string; Value: string }[]]
}>()

const form = defineModel<{ name: string; type: string; tags: { Key: string; Value: string }[] }>('form', { default: { name: '', type: 'EMAIL_ADDRESS', tags: [] } })

const identityTypeOptions: Option[] = [
  { value: 'EMAIL_ADDRESS', label: 'Email Address' },
  { value: 'DOMAIN', label: 'Domain' },
]

function addTag() {
  form.value.tags.push({ Key: '', Value: '' })
}

function removeTag(index: number) {
  form.value.tags.splice(index, 1)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create SES Identity"
    size="md"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <FormSelect
        v-model="form.type"
        label="Identity Type"
        :options="identityTypeOptions"
        required
      />
      <FormInput
        v-model="form.name"
        :label="form.type === 'DOMAIN' ? 'Domain Name' : 'Email Address'"
        :placeholder="form.type === 'DOMAIN' ? 'example.com' : 'user@example.com'"
        required
      />

      <!-- Tags Section -->
      <div>
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-2">Tags</label>
        <div class="space-y-2">
          <div
            v-for="(tag, index) in form.tags"
            :key="index"
            class="flex items-center gap-2"
          >
            <FormInput
              v-model="tag.Key"
              placeholder="Key"
              class="flex-1"
            />
            <FormInput
              v-model="tag.Value"
              placeholder="Value"
              class="flex-1"
            />
            <button
              type="button"
              class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded flex-shrink-0"
              title="Remove tag"
              @click="removeTag(index)"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <button
          type="button"
          class="mt-2 text-sm text-primary-500 hover:text-primary-700 flex items-center gap-1"
          @click="addTag"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Tag
        </button>
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
        <Button @click="emit('create', form.name, form.type, form.tags)">
          Create
        </Button>
      </div>
    </template>
  </Modal>
</template>
