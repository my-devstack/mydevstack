<script setup lang="ts">
import { ref } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = withDefaults(defineProps<{
  open: boolean
  creating?: boolean
  newKeyMaterial?: string | null
}>(), {
  creating: false,
  newKeyMaterial: null,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create-key-pair': [keyName: string]
  'import-key-pair': [keyName: string, publicKeyMaterial: string]
}>()

const activeSubTab = ref<'create' | 'import'>('create')
const createKeyName = ref('')
const importKeyName = ref('')
const importPublicKey = ref('')

function handleClose() {
  emit('update:open', false)
  resetTabs()
}

function resetTabs() {
  activeSubTab.value = 'create'
  createKeyName.value = ''
  importKeyName.value = ''
  importPublicKey.value = ''
}

function handleCreate() {
  if (!createKeyName.value.trim()) return
  emit('create-key-pair', createKeyName.value.trim())
}

function handleImport() {
  if (!importKeyName.value.trim() || !importPublicKey.value.trim()) return
  emit('import-key-pair', importKeyName.value.trim(), importPublicKey.value.trim())
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Manage Key Pairs"
    size="md"
    @update:open="handleClose"
  >
    <!-- Sub-tabs -->
    <div class="flex border-b border-light-border dark:border-dark-border mb-4">
      <button
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
        :class="activeSubTab === 'create'
          ? 'border-primary-500 text-primary-500'
          : 'border-transparent text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'"
        @click="activeSubTab = 'create'"
      >
        Create Key Pair
      </button>
      <button
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
        :class="activeSubTab === 'import'
          ? 'border-primary-500 text-primary-500'
          : 'border-transparent text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'"
        @click="activeSubTab = 'import'"
      >
        Import Key Pair
      </button>
    </div>

    <!-- Create Tab -->
    <template v-if="activeSubTab === 'create'">
      <div class="space-y-4">
        <FormInput
          v-model="createKeyName"
          label="Key Pair Name"
          placeholder="my-key-pair"
          required
        />

        <div
          v-if="props.newKeyMaterial"
          class="space-y-2"
        >
          <div class="p-3 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p class="text-sm text-amber-700 dark:text-amber-400 font-medium">
              ⚠️ Save this key now — it will not be shown again
            </p>
          </div>
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Private Key Material
          </label>
          <textarea
            class="block w-full rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text p-3 text-xs font-mono"
            :value="props.newKeyMaterial"
            rows="8"
            readonly
          />
        </div>
      </div>
    </template>

    <!-- Import Tab -->
    <template v-else>
      <div class="space-y-4">
        <FormInput
          v-model="importKeyName"
          label="Key Pair Name"
          placeholder="my-imported-key"
          required
        />

        <div class="w-full">
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Public Key Material
            <span class="text-red-500 ml-0.5">*</span>
          </label>
          <textarea
            v-model="importPublicKey"
            class="block w-full rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text p-3 text-sm font-mono"
            placeholder="ssh-rsa AAAAB3NzaC1yc2E..."
            rows="5"
          />
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
          v-if="activeSubTab === 'create'"
          :loading="props.creating"
          @click="handleCreate"
        >
          Create
        </Button>
        <Button
          v-else
          :loading="props.creating"
          @click="handleImport"
        >
          Import
        </Button>
      </div>
    </template>
  </Modal>
</template>
