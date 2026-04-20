<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { useToast } from '@/composables/useToast'
import { useContentReload } from '@/composables/useContentReload'
import {
  listKeys,
  createKey,
  describeKey,
  encrypt,
  decrypt,
  enableKey,
  disableKey,
  scheduleKeyDeletion,
  getKeyPolicy,
  listKeyPolicies,
} from '@/api/services/kms'
import type { KMSKey } from '@/api/types/aws'

// Components
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import DataTable from '@/components/common/DataTable.vue'

// Icons
import {
  PlusIcon,
  TrashIcon,
  KeyIcon,
  EyeIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  LockClosedIcon,
  LockOpenIcon,
  ExclamationCircleIcon,
  PencilIcon,
} from '@heroicons/vue/24/outline'

// Stores
const settingsStore = useSettingsStore()
const toast = useToast()
const { reloadTrigger } = useContentReload()

// Types
interface KeyInfo {
  KeyId: string
  KeyArn: string
  keyMetadata?: KMSKey
}

// State
const keys = ref<KeyInfo[]>([])
const isLoading = ref(false)
const selectedKey = ref<KeyInfo | null>(null)
const showExamples = ref(false)

// Modals
const showCreateModal = ref(false)
const showDetailsModal = ref(false)
const showEncryptModal = ref(false)
const showDecryptModal = ref(false)
const showDeleteModal = ref(false)
const showPolicyModal = ref(false)

// Accordion state
const expandedKeys = ref<Set<string>>(new Set())

function toggleKeyExpansion(keyId: string) {
  if (expandedKeys.value.has(keyId)) {
    expandedKeys.value.delete(keyId)
  } else {
    expandedKeys.value.add(keyId)
  }
  expandedKeys.value = new Set(expandedKeys.value)
}

// Forms
const newKey = ref({
  description: '',
  keyUsage: 'ENCRYPT_DECRYPT',
  keySpec: 'SYMMETRIC_DEFAULT',
})

const encryptForm = ref({
  plaintext: '',
})

const decryptForm = ref({
  ciphertext: '',
})

const encryptedResult = ref('')
const decryptedResult = ref('')
const keyPolicy = ref('')
const keyPolicyMap = ref<Record<string, string>>({})

// Key specs
const keySpecs = [
  { value: 'SYMMETRIC_DEFAULT', label: 'Symmetric Key (Default)' },
  { value: 'RSA_2048', label: 'RSA 2048' },
  { value: 'RSA_3072', label: 'RSA 3072' },
  { value: 'RSA_4096', label: 'RSA 4096' },
]

// Columns
const columns = computed(() => [
  { key: 'KeyId', label: 'Key ID', sortable: true },
  { key: 'KeyArn', label: 'ARN', sortable: false },
  { key: 'KeyState', label: 'Status', sortable: true },
])

onMounted(() => {
  loadKeys()
})

watch(reloadTrigger, () => {
  loadKeys()
})

// Code examples
const selectedExample = ref(0)
const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List KMS keys
aws kms list-keys --endpoint-url http://127.0.0.1:4566

# Create key
aws kms create-key \\
  --description "My encryption key" \\
  --key-usage ENCRYPT_DECRYPT \\
  --endpoint-url http://127.0.0.1:4566

# Describe key
aws kms describe-key \\
  --key-id 1234abcd-12ab-12ab-12ab-1234567890ab \\
  --endpoint-url http://127.0.0.1:4566

# Enable/Disable key
aws kms enable-key --key-id 1234abcd-12ab-12ab-12ab-1234567890ab --endpoint-url http://127.0.0.1:4566
aws kms disable-key --key-id 1234abcd-12ab-12ab-12ab-1234567890ab --endpoint-url http://127.0.0.1:4566

# Encrypt data
aws kms encrypt \\
  --key-id 1234abcd-12ab-12ab-12ab-1234567890ab \\
  --plaintext fileb://plaintext.txt \\
  --endpoint-url http://127.0.0.1:4566

# Decrypt data
aws kms decrypt \\
  --ciphertext-blob fileb://ciphertext.bin \\
  --endpoint-url http://127.0.0.1:4566

# Get key policy
aws kms get-key-policy \\
  --key-id 1234abcd-12ab-12ab-12ab-1234567890ab \\
  --policy-name default \\
  --endpoint-url http://127.0.0.1:4566

# Schedule key deletion
aws kms schedule-key-deletion \\
  --key-id 1234abcd-12ab-12ab-12ab-1234567890ab \\
  --pending-window-in-days 7 \\
  --endpoint-url http://127.0.0.1:4566`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { KMSClient, ListKeysCommand, CreateKeyCommand, EncryptCommand, DecryptCommand, DescribeKeyCommand, EnableKeyCommand, DisableKeyCommand } from "@aws-sdk/client-kms";

const client = new KMSClient({
  region: '${settingsStore.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List keys
const keys = await client.send(new ListKeysCommand({}));
console.log(keys.Keys);

// Create key
const createResponse = await client.send(new CreateKeyCommand({
  Description: 'My encryption key',
  KeyUsage: 'ENCRYPT_DECRYPT',
}));
console.log(createResponse.KeyMetadata);

// Encrypt data
const encryptResponse = await client.send(new EncryptCommand({
  KeyId: '1234abcd-12ab-12ab-12ab-1234567890ab',
  Plaintext: Buffer.from('Hello World'),
}));
console.log(encryptResponse.CiphertextBlob);

// Decrypt data
const decryptResponse = await client.send(new DecryptCommand({
  CiphertextBlob: encryptResponse.CiphertextBlob,
}));
console.log(decryptResponse.Plaintext.toString());`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3

client = boto3.client(
    'kms',
    region_name='${settingsStore.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List keys
response = client.list_keys()
for key in response['Keys']:
    print(key['KeyId'])

# Create key
response = client.create_key(
    Description='My encryption key',
    KeyUsage='ENCRYPT_DECRYPT'
)
print(response['KeyMetadata'])

# Encrypt data
response = client.encrypt(
    KeyId='1234abcd-12ab-12ab-12ab-1234567890ab',
    Plaintext=b'Hello World'
)
print(response['CiphertextBlob'])

# Decrypt data
response = client.decrypt(
    CiphertextBlob=response['CiphertextBlob']
)
print(response['Plaintext'])`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
import (
    "context"
    "encoding/base64"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/kms"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

client := kms.NewFromConfig(cfg, func(o *kms.Options) {
    o.BaseURL = aws.String("http://127.0.0.1:4566")
})

// List keys
listOutput, _ := client.ListKeys(context.Background(), &kms.ListKeysInput{})
fmt.Println(listOutput.Keys)

// Create key
createOutput, _ := client.CreateKey(context.Background(), &kms.CreateKeyInput{
    Description: aws.String("My encryption key"),
    KeyUsage:    kms.KeyUsageTypeEncryptDecrypt,
})
fmt.Println(createOutput.KeyMetadata)

// Encrypt data
encryptOutput, _ := client.Encrypt(context.Background(), &kms.EncryptInput{
    KeyId:     aws.String("1234abcd-12ab-12ab-12ab-1234567890ab"),
    Plaintext: []byte("Hello World"),
})
fmt.Println(base64.StdEncoding.EncodeToString(encryptOutput.CiphertextBlob))

// Decrypt data
decryptOutput, _ := client.Decrypt(context.Background(), &kms.DecryptInput{
    CiphertextBlob: encryptOutput.CiphertextBlob,
})
fmt.Println(string(decryptOutput.Plaintext))`
  },
])

// Computed
const keyCount = computed(() => keys.value.length)

async function loadKeys() {
  isLoading.value = true
  try {
    const result = await listKeys()
    const keysList = (result.Keys || []).map((key) => ({
      KeyId: key.KeyId,
      KeyArn: key.KeyArn,
    }))
    
    // Load metadata and policy for each key
    for (const key of keysList) {
      try {
        const metaResult = await describeKey(key.KeyId)
        key.keyMetadata = metaResult.KeyMetadata
      } catch {
        key.keyMetadata = null
      }
      
      try {
        const policyResult = await getKeyPolicy(key.KeyId, 'default')
        keyPolicyMap.value[key.KeyId] = policyResult.Policy || 'No policy'
      } catch {
        keyPolicyMap.value[key.KeyId] = 'No policy'
      }
    }
    
    keys.value = keysList
  } catch (error) {
    toast.error('Failed to load keys', error instanceof Error ? error.message : 'Unknown error')
  } finally {
    isLoading.value = false
  }
}

async function handleCreateKey() {
  try {
    const result = await createKey({
      Description: newKey.value.description || undefined,
      KeyUsage: newKey.value.keyUsage as 'SIGN_VERIFY' | 'ENCRYPT_DECRYPT',
      CustomerMasterKeySpec: newKey.value.keySpec as 'SYMMETRIC_DEFAULT' | 'RSA_2048' | 'RSA_3072' | 'RSA_4096',
    })
    toast.success('Key created', `Key created successfully`)
    showCreateModal.value = false
    newKey.value = { description: '', keyUsage: 'ENCRYPT_DECRYPT', keySpec: 'SYMMETRIC_DEFAULT' }
    await loadKeys()
  } catch (error) {
    toast.error('Failed to create key', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function loadKeyDetails() {
  if (!selectedKey.value) return

  try {
    const result = await describeKey(selectedKey.value.KeyId)
    selectedKey.value = { ...selectedKey.value, keyMetadata: result.KeyMetadata }
  } catch (error) {
    toast.error('Failed to load key details', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleEnableKey() {
  if (!selectedKey.value) return

  try {
    await enableKey(selectedKey.value.KeyId)
    toast.success('Key enabled', 'Key enabled successfully')
    await loadKeyDetails()
  } catch (error) {
    toast.error('Failed to enable key', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleDisableKey() {
  if (!selectedKey.value) return

  try {
    await disableKey(selectedKey.value.KeyId)
    toast.success('Key disabled', 'Key disabled successfully')
    await loadKeyDetails()
  } catch (error) {
    toast.error('Failed to disable key', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleDeleteKey() {
  if (!selectedKey.value) return

  try {
    await scheduleKeyDeletion(selectedKey.value.KeyId)
    toast.success('Key deletion scheduled', 'Key will be deleted in 7 days')
    showDeleteModal.value = false
    selectedKey.value = null
    await loadKeys()
  } catch (error) {
    toast.error('Failed to schedule deletion', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleEncrypt() {
  if (!selectedKey.value || !encryptForm.value.plaintext) return

  try {
    const plaintext = btoa(encryptForm.value.plaintext)
    const result = await encrypt({
      KeyId: selectedKey.value.KeyId,
      Plaintext: plaintext,
    })
    encryptedResult.value = result.CiphertextBlob
    toast.success('Data encrypted', 'Data encrypted successfully')
  } catch (error) {
    toast.error('Encryption failed', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleDecrypt() {
  if (!decryptForm.value.ciphertext) return

  try {
    const result = await decrypt({
      CiphertextBlob: decryptForm.value.ciphertext,
    })
    decryptedResult.value = atob(result.Plaintext)
    toast.success('Data decrypted', 'Data decrypted successfully')
  } catch (error) {
    toast.error('Decryption failed', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function loadKeyPolicy() {
  if (!selectedKey.value) return

  try {
    const result = await getKeyPolicy(selectedKey.value.KeyId, 'default')
    keyPolicy.value = result.Policy || ''
  } catch (error) {
    toast.error('Failed to load key policy', error instanceof Error ? error.message : 'Unknown error')
  }
}

function viewKeyDetails(key: KeyInfo) {
  selectedKey.value = key
  loadKeyDetails()
  showDetailsModal.value = true
}

function viewKeyPolicy(key: KeyInfo) {
  selectedKey.value = key
  loadKeyPolicy()
  showPolicyModal.value = true
}

function selectKeyForAction(key: KeyInfo, action: 'encrypt' | 'decrypt' | 'delete') {
  selectedKey.value = key
  switch (action) {
    case 'encrypt':
      showEncryptModal.value = true
      break
    case 'decrypt':
      showDecryptModal.value = true
      break
    case 'delete':
      showDeleteModal.value = true
      break
  }
}

function getKeyStatus(key: KeyInfo): 'enabled' | 'disabled' | 'pending' | 'unknown' {
  return key.keyMetadata?.KeyState as 'Enabled' | 'Disabled' | 'PendingDeletion' | 'unknown' || 'unknown'
}

function getKeyStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    Enabled: 'Enabled',
    Disabled: 'Disabled',
    PendingDeletion: 'Pending Deletion',
    PendingReplicaDeletion: 'Pending Replica Deletion',
  }
  return labels[status] || status
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success('Copied', 'Copied to clipboard')
  }).catch(() => {
    toast.error('Failed to copy', 'Could not copy to clipboard')
  })
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <KeyIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            KMS Keys
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ keyCount }} key{{ keyCount !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="primary"
            @click="showCreateModal = true"
          >
            <template #icon-left>
              <PlusIcon class="h-4 w-4" />
            </template>
            Create Key
          </Button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6">
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="flex items-center justify-center py-12"
      >
        <LoadingSpinner size="lg" />
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else-if="keys.length === 0"
        icon="key"
        title="No KMS keys"
        description="Create your first KMS key to get started"
        action-label="Create Key"
        @action="showCreateModal = true"
      />

      <!-- Keys List with Accordion -->
      <div v-else class="space-y-4">
        <!-- Column Headers -->
        <div 
          class="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b"
          :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
        >
          <div class="col-span-5">Key ID</div>
          <div class="col-span-5">Status</div>
          <div class="col-span-2 text-right">Actions</div>
        </div>

        <!-- Key Rows with Accordion -->
        <div
          v-for="key in keys"
          :key="key.KeyId"
          class="border rounded-lg overflow-hidden"
          :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
        >
          <!-- Accordion Header -->
          <div 
            class="grid grid-cols-12 gap-4 px-4 py-4 items-center cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg"
            :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-light-surface'"
            @click="toggleKeyExpansion(key.KeyId)"
          >
            <div class="col-span-5 flex items-center gap-2">
              <svg
                class="w-5 h-5 text-amber-500 transition-transform"
                :class="{ 'rotate-90': expandedKeys.has(key.KeyId) }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <div class="p-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <KeyIcon class="h-4 w-4" />
              </div>
              <span class="font-medium text-light-text dark:text-dark-text">{{ key.KeyId }}</span>
            </div>
            <div class="col-span-5">
              <StatusBadge 
                :status="key.keyMetadata?.KeyState === 'Enabled' ? 'active' : key.keyMetadata?.KeyState === 'PendingDeletion' ? 'pending' : 'inactive'" 
                :label="getKeyStatusLabel(key.keyMetadata?.KeyState || '')" 
              />
            </div>
            <div class="col-span-2 text-right" @click.stop>
              <div class="flex items-center justify-end gap-1">
                <button
                  class="p-2 text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border rounded"
                  title="Encrypt"
                  @click="selectKeyForAction(key, 'encrypt')"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </button>
                <button
                  class="p-2 text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border rounded"
                  title="Decrypt"
                  @click="selectKeyForAction(key, 'decrypt')"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Delete"
                  @click="selectKeyForAction(key, 'delete')"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Accordion Content (View & Policy details) -->
          <div
            v-if="expandedKeys.has(key.KeyId)"
            class="border-t p-4"
            :class="settingsStore.darkMode ? 'border-dark-border bg-dark-bg' : 'border-light-border bg-light-bg'"
          >
            <!-- Key Details -->
            <div class="mb-6">
              <h4 class="text-sm font-semibold mb-3" :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'">Key Details</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Key Usage</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ key.keyMetadata?.KeyUsage || '-' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Origin</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ key.keyMetadata?.Origin || '-' }}
                  </p>
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">ARN</label>
                  <div class="flex items-center gap-2">
                    <code class="text-xs text-light-muted dark:text-dark-muted bg-light-border dark:bg-dark-border px-2 py-1 rounded flex-1 break-all">{{ key.keyMetadata?.Arn || key.KeyArn }}</code>
                    <button
                      class="p-2 rounded hover:bg-light-border dark:hover:bg-dark-border"
                      title="Copy ARN"
                      @click="copyToClipboard(key.keyMetadata?.Arn || key.KeyArn)"
                    >
                      <svg class="w-4 h-4 text-light-muted dark:text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Creation Date</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ key.keyMetadata?.CreationDate ? new Date(key.keyMetadata.CreationDate).toLocaleDateString() : '-' }}
                  </p>
                </div>
                <div v-if="key.keyMetadata?.DeletionDate">
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Deletion Date</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ new Date(key.keyMetadata.DeletionDate).toLocaleDateString() }}
                  </p>
                </div>
                <div v-if="key.keyMetadata?.Description" class="col-span-2">
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Description</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ key.keyMetadata.Description }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Key Policy -->
            <div>
              <h4 class="text-sm font-semibold mb-3" :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'">Key Policy</h4>
              <pre class="p-4 rounded-lg bg-light-bg dark:bg-dark-bg text-xs font-mono overflow-auto max-h-48 text-light-text dark:text-dark-text">{{ keyPolicyMap[key.KeyId] || 'Loading policy...' }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Key Modal -->
    <Modal
      :open="showCreateModal"
      title="Create KMS Key"
      size="md"
      @update:open="showCreateModal = $event"
    >
      <form
        class="space-y-4"
        @submit.prevent="handleCreateKey"
      >
        <FormInput
          v-model="newKey.description"
          label="Description"
          placeholder="Key description"
        />

        <div>
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Key Usage
          </label>
          <select
            v-model="newKey.keyUsage"
            class="block w-full rounded-md shadow-sm border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="ENCRYPT_DECRYPT">
              Encrypt and Decrypt
            </option>
            <option value="SIGN_VERIFY">
              Sign and Verify
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Key Spec
          </label>
          <select
            v-model="newKey.keySpec"
            class="block w-full rounded-md shadow-sm border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option
              v-for="spec in keySpecs"
              :key="spec.value"
              :value="spec.value"
            >
              {{ spec.label }}
            </option>
          </select>
        </div>
      </form>

      <template #footer>
        <Button
          variant="secondary"
          @click="showCreateModal = false"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          @click="handleCreateKey"
        >
          Create Key
        </Button>
      </template>
    </Modal>

    <!-- Key Details Modal -->
    <Modal
      :open="showDetailsModal"
      title="Key Details"
      size="lg"
      @update:open="showDetailsModal = $event"
    >
      <div
        v-if="selectedKey?.keyMetadata"
        class="space-y-6"
      >
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Key ID</label>
            <p class="text-sm text-light-text dark:text-dark-text font-mono">
              {{ selectedKey.keyMetadata.KeyId }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Status</label>
            <StatusBadge
              :status="getKeyStatus(selectedKey) === 'Enabled' ? 'active' : getKeyStatus(selectedKey) === 'Pending Deletion' ? 'pending' : 'inactive'"
              :label="getKeyStatusLabel(selectedKey.keyMetadata.KeyState || '')"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Key Usage</label>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ selectedKey.keyMetadata.KeyUsage }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Origin</label>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ selectedKey.keyMetadata.Origin }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Creation Date</label>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ selectedKey.keyMetadata.CreationDate ? new Date(selectedKey.keyMetadata.CreationDate).toLocaleDateString() : '-' }}
            </p>
          </div>
          <div v-if="selectedKey.keyMetadata.DeletionDate">
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Deletion Date</label>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ new Date(selectedKey.keyMetadata.DeletionDate).toLocaleDateString() }}
            </p>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">ARN</label>
          <p class="text-sm text-light-text dark:text-dark-text font-mono break-all">
            {{ selectedKey.keyMetadata.Arn }}
          </p>
        </div>

        <div v-if="selectedKey.keyMetadata.Description">
          <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Description</label>
          <p class="text-sm text-light-text dark:text-dark-text">
            {{ selectedKey.keyMetadata.Description }}
          </p>
        </div>

        <div class="flex items-center gap-2 pt-4 border-t border-light-border dark:border-dark-border">
          <Button
            v-if="selectedKey.keyMetadata.KeyState === 'Disabled'"
            variant="primary"
            @click="handleEnableKey"
          >
            <template #icon-left>
              <ShieldCheckIcon class="h-4 w-4" />
            </template>
            Enable Key
          </Button>
          <Button
            v-else-if="selectedKey.keyMetadata.KeyState === 'Enabled'"
            variant="secondary"
            @click="handleDisableKey"
          >
            <template #icon-left>
              <ShieldExclamationIcon class="h-4 w-4" />
            </template>
            Disable Key
          </Button>
          <Button
            variant="danger"
            :disabled="selectedKey.keyMetadata.KeyState === 'PendingDeletion'"
            @click="showDeleteModal = true"
          >
            <template #icon-left>
              <TrashIcon class="h-4 w-4" />
            </template>
            Schedule Deletion
          </Button>
        </div>
      </div>
      <div
        v-else
        class="flex items-center justify-center py-8"
      >
        <LoadingSpinner size="lg" />
      </div>

      <template #footer>
        <Button
          variant="secondary"
          @click="showDetailsModal = false"
        >
          Close
        </Button>
      </template>
    </Modal>

    <!-- Key Policy Modal -->
    <Modal
      :open="showPolicyModal"
      title="Key Policy"
      size="lg"
      @update:open="showPolicyModal = $event"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Key ID</label>
          <p class="text-sm text-light-text dark:text-dark-text font-mono">
            {{ selectedKey?.KeyId }}
          </p>
        </div>
        <div>
          <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Policy</label>
          <pre class="p-4 rounded-lg bg-light-bg dark:bg-dark-bg text-sm font-mono overflow-auto max-h-96 text-light-text dark:text-dark-text">{{ keyPolicy || 'No policy found' }}</pre>
        </div>
      </div>
      <template #footer>
        <Button
          variant="secondary"
          @click="showPolicyModal = false"
        >
          Close
        </Button>
      </template>
    </Modal>

    <!-- Encrypt Modal -->
    <Modal
      :open="showEncryptModal"
      title="Encrypt Data"
      size="lg"
      @update:open="showEncryptModal = $event"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Plaintext
          </label>
          <textarea
            v-model="encryptForm.plaintext"
            rows="4"
            placeholder="Enter text to encrypt..."
            class="block w-full rounded-md shadow-sm border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div
          v-if="encryptedResult"
          class="space-y-2"
        >
          <label class="block text-sm font-medium text-light-text dark:text-dark-text">
            Encrypted Result
          </label>
          <div class="p-4 rounded-lg bg-light-bg dark:bg-dark-bg">
            <p class="text-sm font-mono text-light-text dark:text-dark-text break-all">
              {{ encryptedResult }}
            </p>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          variant="secondary"
          @click="encryptedResult = ''; showEncryptModal = false"
        >
          Close
        </Button>
        <Button
          variant="primary"
          @click="handleEncrypt"
        >
          <template #icon-left>
            <LockClosedIcon class="h-4 w-4" />
          </template>
          Encrypt
        </Button>
      </template>
    </Modal>

    <!-- Decrypt Modal -->
    <Modal
      :open="showDecryptModal"
      title="Decrypt Data"
      size="lg"
      @update:open="showDecryptModal = $event"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Ciphertext
          </label>
          <textarea
            v-model="decryptForm.ciphertext"
            rows="4"
            placeholder="Enter ciphertext to decrypt..."
            class="block w-full rounded-md shadow-sm border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div
          v-if="decryptedResult"
          class="space-y-2"
        >
          <label class="block text-sm font-medium text-light-text dark:text-dark-text">
            Decrypted Result
          </label>
          <div class="p-4 rounded-lg bg-light-bg dark:bg-dark-bg">
            <p class="text-sm font-mono text-light-text dark:text-dark-text break-all">
              {{ decryptedResult }}
            </p>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          variant="secondary"
          @click="decryptedResult = ''; showDecryptModal = false"
        >
          Close
        </Button>
        <Button
          variant="primary"
          @click="handleDecrypt"
        >
          <template #icon-left>
            <LockOpenIcon class="h-4 w-4" />
          </template>
          Decrypt
        </Button>
      </template>
    </Modal>

    <!-- Delete Key Modal -->
    <Modal
      :open="showDeleteModal"
      title="Schedule Key Deletion"
      size="md"
      @update:open="showDeleteModal = $event"
    >
      <div class="space-y-4">
        <div class="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
          <ExclamationCircleIcon class="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm text-yellow-800 dark:text-yellow-200">
              Are you sure you want to schedule deletion of this key?
            </p>
            <p class="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              The key will be scheduled for deletion and cannot be recovered after the waiting period (7-30 days).
            </p>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          variant="secondary"
          @click="showDeleteModal = false"
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          @click="handleDeleteKey"
        >
          Schedule Deletion
        </Button>
      </template>
    </Modal>

    <!-- Usage Examples Section -->
    <div
      v-if="!isLoading && keys.length > 0"
      class="mt-8"
    >
      <h2
        class="text-lg font-semibold mb-4"
        :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
      >
        Usage Examples
      </h2>
      <div
        class="rounded-lg border overflow-hidden"
        :class="settingsStore.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
      >
        <div
          class="flex border-b"
          :class="settingsStore.darkMode ? 'border-gray-700' : 'border-gray-200'"
        >
          <button
            v-for="(example, index) in codeExamples"
            :key="example.language"
            class="px-4 py-2 text-sm font-medium transition-colors"
            :class="[
              selectedExample === index
                ? settingsStore.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                : settingsStore.darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            ]"
            @click="selectedExample = index"
          >
            {{ example.label }}
          </button>
        </div>
        <div class="p-4 overflow-x-auto">
          <pre
            class="text-sm font-mono"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >{{ codeExamples[selectedExample].code }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>
