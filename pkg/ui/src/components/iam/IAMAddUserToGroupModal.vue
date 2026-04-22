<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'

interface IAMUser {
  UserName: string
}

const props = defineProps<{
  open: boolean
  groupName: string
  users: IAMUser[]
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'add': [userName: string]
}>()

const selectedUser = defineModel<string>('selectedUser', { default: '' })

function handleClose() {
  selectedUser.value = ''
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Add User to Group"
    size="md"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <p class="text-sm text-light-muted dark:text-dark-muted">
        Select a user to add to group "{{ props.groupName }}"
      </p>
      <select
        v-model="selectedUser"
        class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
      >
        <option value="">
          Select a user...
        </option>
        <option
          v-for="user in props.users"
          :key="user.UserName"
          :value="user.UserName"
        >
          {{ user.UserName }}
        </option>
      </select>
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
        :loading="props.loading"
        :disabled="!selectedUser"
        @click="emit('add', selectedUser)"
      >
        Add User
      </Button>
    </template>
  </Modal>
</template>