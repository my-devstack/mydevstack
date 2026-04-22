<script setup lang="ts">
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const props = defineProps<{
  open: boolean
  groupName: string
  users: { UserName: string; Arn: string }[]
  availableUsers: { UserName: string }[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'add-user': [userName: string]
  'remove-user': [userName: string]
}>()

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Group Users"
    size="lg"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-light-text dark:text-dark-text">
          Users in {{ props.groupName }}
        </h3>
        <div class="flex items-center gap-2">
          <select
            v-if="props.availableUsers.length > 0"
            class="px-2 py-1 rounded border border-light-border dark:border-dark-border text-sm"
            @change="emit('add-user', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">
              Add user...
            </option>
            <option
              v-for="user in props.availableUsers"
              :key="user.UserName"
              :value="user.UserName"
            >
              {{ user.UserName }}
            </option>
          </select>
        </div>
      </div>

      <EmptyState
        v-if="props.users.length === 0"
        icon="user"
        title="No users"
        description="This group has no users"
        compact
      />

      <div
        v-else
        class="space-y-2"
      >
        <div
          v-for="user in props.users"
          :key="user.UserName"
          class="flex items-center justify-between p-3 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg"
        >
          <div>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ user.UserName }}
            </p>
            <p class="text-xs text-light-muted dark:text-dark-muted">
              {{ user.Arn }}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            @click="emit('remove-user', user.UserName)"
          >
            <template #icon-left>
              <TrashIcon class="h-4 w-4" />
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