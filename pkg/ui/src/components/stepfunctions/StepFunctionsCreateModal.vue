<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'

const settingsStore = useSettingsStore()

const props = defineProps<{
  open: boolean
  loading: boolean
  newMachineName: string
  newMachineDefinition: string
  newMachineRoleArn: string
  newMachineType: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:new-machine-name', value: string): void
  (e: 'update:new-machine-definition', value: string): void
  (e: 'update:new-machine-role-arn', value: string): void
  (e: 'update:new-machine-type', value: string): void
  (e: 'create'): void
}>()
</script>

<template>
  <Modal
    :open="open"
    title="Create State Machine"
    size="lg"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-4">
      <FormInput
        :model-value="newMachineName"
        label="Name"
        placeholder="MyStateMachine"
        required
        help-text="Must be unique within your AWS account"
        @update:model-value="emit('update:new-machine-name', $event)"
      />

      <FormSelect
        :model-value="newMachineType"
        label="Type"
        :options="[
          { value: 'STANDARD', label: 'STANDARD - Long-running workflows' },
          { value: 'EXPRESS', label: 'EXPRESS - Short-lived, at-most-once execution' },
        ]"
        @update:model-value="emit('update:new-machine-type', $event)"
      />

      <FormInput
        :model-value="newMachineRoleArn"
        label="Role ARN"
        placeholder="arn:aws:iam::123456789012:role/my-step-functions-role"
        required
        help-text="IAM role ARN that grants Step Functions access to AWS resources"
        @update:model-value="emit('update:new-machine-role-arn', $event)"
      />

      <FormInput
        :model-value="newMachineDefinition"
        label="Definition"
        placeholder="{&quot;StartAt&quot;: &quot;HelloWorld&quot;, &quot;States&quot;: {&quot;HelloWorld&quot;: {&quot;Type&quot;: &quot;Pass&quot;, &quot;End&quot;: true}}}"
        required
        help-text="Define your state machine using Amazon States Language (JSON)"
        class="font-mono text-sm"
        @update:model-value="emit('update:new-machine-definition', $event)"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="secondary"
          @click="emit('update:open', false)"
        >
          Cancel
        </Button>
        <Button
          aria-label="Create"
          :loading="loading"
          @click="emit('create')"
        >
          Create
        </Button>
      </div>
    </template>
  </Modal>
</template>
