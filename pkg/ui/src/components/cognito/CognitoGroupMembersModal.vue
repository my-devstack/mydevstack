<script setup lang="ts">
import { ref, computed } from 'vue'
import { UserGroupIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import type { CognitoUser } from '@/api/services/cognito'

const props = defineProps<{
  open: boolean
  userPoolId?: string
  groupName?: string
  users: CognitoUser[]
  members: CognitoUser[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'add-user': [username: string]
  'remove-user': [username: string]
}>()

const selectedUsername = ref('')

const availableUsers = computed(() => {
  const memberNames = new Set(props.members.map((m) => m.Username))
  return props.users.filter((u) => !memberNames.has(u.Username))
})

function handleAdd() {
  if (!selectedUsername.value) return
  emit('add-user', selectedUsername.value)
  selectedUsername.value = ''
}

function handleClose() {
  selectedUsername.value = ''
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    :title="`Group Members — ${groupName || ''}`"
    size="lg"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <!-- Loading -->
      <div
        v-if="loading && members.length === 0"
        class="flex items-center justify-center py-8"
      >
        <LoadingSpinner size="lg" />
      </div>

      <template v-else>
        <!-- Members list -->
        <div>
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
            Members ({{ members.length }})
          </label>
          <div
            v-if="members.length === 0"
            class="rounded-lg border border-dashed border-light-border dark:border-dark-border p-4 text-sm text-light-muted dark:text-dark-muted"
          >
            No members in this group yet.
          </div>
          <div
            v-else
            class="space-y-2"
          >
            <div
              v-for="member in members"
              :key="member.Username"
              class="flex items-center justify-between rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-4 py-2"
            >
              <div class="flex items-center gap-3">
                <div class="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                  <UserGroupIcon class="h-4 w-4" />
                </div>
                <div>
                  <p class="text-sm font-medium text-light-text dark:text-dark-text">
                    {{ member.Username }}
                  </p>
                  <p class="text-xs text-light-muted dark:text-dark-muted">
                    {{ member.UserStatus || '-' }}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                @click="emit('remove-user', member.Username)"
              >
                <template #icon-left>
                  <XMarkIcon class="h-4 w-4" />
                </template>
                Remove
              </Button>
            </div>
          </div>
        </div>

        <!-- Add user -->
        <div class="border-t border-light-border dark:border-dark-border pt-4">
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-2">Add User</label>
          <div class="flex items-center gap-2">
            <select
              v-model="selectedUsername"
              class="flex-1 text-sm border rounded px-3 py-2 bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-text dark:text-dark-text"
            >
              <option value="">
                Select a user...
              </option>
              <option
                v-for="user in availableUsers"
                :key="user.Username"
                :value="user.Username"
              >
                {{ user.Username }}
              </option>
            </select>
            <Button
              variant="primary"
              :disabled="!selectedUsername"
              @click="handleAdd"
            >
              Add
            </Button>
          </div>
          <p
            v-if="availableUsers.length === 0"
            class="mt-2 text-xs text-light-muted dark:text-dark-muted"
          >
            All users are already members of this group.
          </p>
        </div>
      </template>
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