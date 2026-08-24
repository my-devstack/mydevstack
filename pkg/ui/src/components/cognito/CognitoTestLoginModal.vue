<script setup lang="ts">
import { ref } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import type { CognitoUserPoolClient } from '@/api/services/cognito'

const props = defineProps<{
  open: boolean
  username?: string
  userPoolId?: string
  clients: CognitoUserPoolClient[]
  authResult?: any
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  test: [password: string, clientId?: string]
}>()

const password = ref('')
const clientId = ref('')

function handleTest() {
  emit('test', password.value, clientId.value || undefined)
}

function handleClose() {
  password.value = ''
  clientId.value = ''
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    :title="`Test Login — ${username || ''}`"
    size="lg"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="password"
        label="Password"
        type="password"
        placeholder="Pass123!"
        required
      />
      <div>
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1">Client ID</label>
        <select
          v-model="clientId"
          class="w-full text-sm border rounded px-3 py-2 bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-text dark:text-dark-text"
        >
          <option value="">
            Select a client...
          </option>
          <option
            v-for="client in clients"
            :key="client.ClientId"
            :value="client.ClientId"
          >
            {{ client.ClientName }} ({{ client.ClientId }})
          </option>
        </select>
        <p class="mt-1.5 text-sm text-light-muted dark:text-dark-muted">
          Optional — required for ADMIN_USER_PASSWORD_AUTH flow
        </p>
      </div>

      <!-- Auth result -->
      <div
        v-if="authResult"
        class="rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/20 p-4"
      >
        <label class="block text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase mb-2">
          Authentication Result
        </label>
        <pre class="text-xs font-mono text-emerald-800 dark:text-emerald-300 whitespace-pre-wrap break-all">{{ JSON.stringify(authResult, null, 2) }}</pre>
      </div>
    </div>
    <template #footer>
      <Button
        variant="secondary"
        @click="handleClose"
      >
        Close
      </Button>
      <Button
        variant="primary"
        :disabled="!password"
        @click="handleTest"
      >
        Test Login
      </Button>
    </template>
  </Modal>
</template>