<script setup lang="ts">
import { PlusCircleIcon, MinusCircleIcon } from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const props = defineProps<{
  open: boolean
  roleName: string
  policies: { PolicyName: string; PolicyArn: string }[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'open-attach': []
  'detach-policy': [policyArn: string]
}>()

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Attached Policies"
    size="lg"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-light-text dark:text-dark-text">
          Policies for {{ props.roleName }}
        </h3>
        <Button
          variant="primary"
          size="sm"
          @click="emit('open-attach')"
        >
          <template #icon-left>
            <PlusCircleIcon class="h-4 w-4" />
          </template>
          Attach Policy
        </Button>
      </div>

      <EmptyState
        v-if="props.policies.length === 0"
        icon="key"
        title="No attached policies"
        description="Attach a policy to this role"
        compact
      />

      <div
        v-else
        class="space-y-2"
      >
        <div
          v-for="policy in props.policies"
          :key="policy.PolicyArn"
          class="flex items-center justify-between p-3 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg"
        >
          <div>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ policy.PolicyName }}
            </p>
            <p class="text-xs text-light-muted dark:text-dark-muted font-mono truncate">
              {{ policy.PolicyArn }}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            @click="emit('detach-policy', policy.PolicyArn)"
          >
            <template #icon-left>
              <MinusCircleIcon class="h-4 w-4" />
            </template>
          </Button>
        </div>
      </div>
    </div>
    <template #footer>
      <Button
        variant="secondary"
        @click="handleClose"
      >
        Close
      </Button>
    </template>
  </Modal>
</template>