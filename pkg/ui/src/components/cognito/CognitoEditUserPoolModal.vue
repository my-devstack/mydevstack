<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import CognitoTagsSection from './CognitoTagsSection.vue'

const props = defineProps<{
  open: boolean
  userPoolId?: string
  poolName?: string
  mfaConfiguration?: string
  deletionProtection?: string
  tags?: Record<string, string>
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update': [userPoolId: string, params: { PoolName?: string; MfaConfiguration?: string; DeletionProtection?: string; Tags?: Record<string, string>; RemovedKeys?: string[] }]
}>()

const form = ref({
  PoolName: '',
  MfaConfiguration: 'OFF',
  DeletionProtection: 'INACTIVE',
  Tags: {} as Record<string, string>,
  RemovedKeys: [] as string[],
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    form.value = {
      PoolName: props.poolName || '',
      MfaConfiguration: props.mfaConfiguration || 'OFF',
      DeletionProtection: props.deletionProtection || 'INACTIVE',
      Tags: { ...(props.tags || {}) },
      RemovedKeys: [],
    }
  }
}, { immediate: true })

function handleTagsUpdate(tags: Record<string, string>, removedKeys: string[]) {
  form.value.Tags = tags
  form.value.RemovedKeys = removedKeys
}

function handleUpdate() {
  emit('update', props.userPoolId || '', {
    PoolName: form.value.PoolName,
    MfaConfiguration: form.value.MfaConfiguration,
    DeletionProtection: form.value.DeletionProtection,
    Tags: form.value.Tags,
    RemovedKeys: form.value.RemovedKeys,
  })
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    title="Edit User Pool"
    size="md"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="form.PoolName"
        label="Pool Name"
        placeholder="My User Pool"
        required
      />
      <div>
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1">MFA Configuration</label>
        <select
          v-model="form.MfaConfiguration"
          class="w-full text-sm border rounded px-3 py-2 bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-text dark:text-dark-text"
        >
          <option value="OFF">
            OFF
          </option>
          <option value="ON">
            ON
          </option>
          <option value="OPTIONAL">
            OPTIONAL
          </option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1">Deletion Protection</label>
        <select
          v-model="form.DeletionProtection"
          class="w-full text-sm border rounded px-3 py-2 bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-text dark:text-dark-text"
        >
          <option value="INACTIVE">
            INACTIVE
          </option>
          <option value="ACTIVE">
            ACTIVE
          </option>
        </select>
      </div>
      <div class="border-t border-light-border dark:border-dark-border pt-4">
        <CognitoTagsSection
          :tags="form.Tags"
          @update="handleTagsUpdate"
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
        <Button
          :disabled="!form.PoolName.trim()"
          @click="handleUpdate"
        >
          Save
        </Button>
      </div>
    </template>
  </Modal>
</template>