<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import EmptyState from '@/components/common/EmptyState.vue'

interface IAMPolicy {
  PolicyName: string
  Arn: string
}

const props = defineProps<{
  open: boolean
  policies: IAMPolicy[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'attach': [policyArn: string]
}>()

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Attach Policy to Role"
    size="lg"
    @update:open="handleClose"
  >
    <div class="space-y-3">
      <EmptyState
        v-if="props.policies.length === 0"
        icon="key"
        title="No policies available"
        description="No policies found"
        compact
      />
      <div
        v-else
        class="max-h-96 overflow-auto"
      >
        <div
          v-for="policy in props.policies"
          :key="policy.PolicyArn"
          class="flex items-center justify-between p-3 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg mb-2"
        >
          <div>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ policy.PolicyName }}
            </p>
            <p class="text-xs text-light-muted dark:text-dark-muted">
              {{ policy.PolicyArn }}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            @click="emit('attach', policy.PolicyArn)"
          >
            Attach
          </Button>
        </div>
      </div>
    </div>
    <template #footer>
      <Button
        variant="secondary"
        @click="handleClose"
      >
        Cancel
      </Button>
    </template>
  </Modal>
</template>