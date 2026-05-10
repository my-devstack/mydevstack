<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useKMS } from '@/composables/useKMS'

// Components
import {
  KMSCreateKeyModal,
  KMSDeleteModal,
  KMSViewDetailsModal,
  KMSEncryptModal,
  KMSDecryptModal,
  KMSPolicyModal,
} from '@/components/kms'
import Button from '@/components/common/Button.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import DataTable from '@/components/common/DataTable.vue'

// Icons
import {
  PlusIcon,
  KeyIcon,
} from '@heroicons/vue/24/outline'

// Use KMS composable
const {
  keys,
  isLoading,
  selectedKey,
  showCreateModal,
  showDetailsModal,
  showEncryptModal,
  showDecryptModal,
  showDeleteModal,
  showPolicyModal,
  expandedKeys,
  newKey,
  encryptForm,
  decryptForm,
  encryptedResult,
  decryptedResult,
  keyPolicy,
  keyPolicyMap,
  keySpecs,
  keyCount,
  loadKeys,
  handleCreateKey,
  handleEnableKey,
  handleDisableKey,
  handleDeleteKey,
  handleEncrypt,
  handleDecrypt,
  toggleKeyExpansion,
  getKeyStatus,
  getKeyStatusLabel,
  copyToClipboard,
  viewKeyDetails,
  viewKeyPolicy,
  selectKeyForAction,
  setupReloadWatcher,
} = useKMS()

// Stores
const settingsStore = useSettingsStore()

// Pagination
const keyPage = ref(1)
const keysPerPage = 15
const totalKeyPages = computed(() => Math.ceil(keys.value.length / keysPerPage))
const paginatedKeys = computed(() => {
  const start = (keyPage.value - 1) * keysPerPage
  return keys.value.slice(start, start + keysPerPage)
})

// UI-specific refs (not extracted to composable)
const showExamples = ref(false)
const selectedExample = ref(0)

async function handleCreateKeyWrapper() {
  await handleCreateKey()
  keyPage.value = 1
}

// Columns
const columns = computed(() => [
  { key: 'KeyId', label: 'Key ID', sortable: true },
  { key: 'KeyArn', label: 'ARN', sortable: false },
  { key: 'KeyState', label: 'Status', sortable: true },
])

onMounted(() => {
  loadKeys()
  
  // Watch for reload trigger
  watch(setupReloadWatcher(), () => {
    loadKeys()
  })
})

// Code examples
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
      <div
        v-else
        class="space-y-4"
      >
        <!-- Column Headers -->
        <div 
          class="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b"
          :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
        >
          <div class="col-span-5">
            Key ID
          </div>
          <div class="col-span-5">
            Status
          </div>
          <div class="col-span-2 text-right">
            Actions
          </div>
        </div>

        <!-- Key Rows with Accordion -->
        <div
          v-for="key in paginatedKeys"
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
            <div class="col-span-8 flex items-center gap-2">
              <div class="p-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <KeyIcon class="h-4 w-4" />
              </div>
              <span class="font-medium text-light-text dark:text-dark-text">{{ key.KeyId }}</span>
            </div>
            <div class="col-span-2">
              <StatusBadge 
                :status="key.keyMetadata?.KeyState === 'Enabled' ? 'active' : key.keyMetadata?.KeyState === 'PendingDeletion' ? 'pending' : 'inactive'" 
                :label="getKeyStatusLabel(key.keyMetadata?.KeyState || '')" 
              />
            </div>
            <div
              class="col-span-2 text-right"
              @click.stop
            >
              <div class="flex items-center justify-end gap-1">
                <button
                  class="p-2 text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border rounded"
                  title="Encrypt"
                  @click="selectKeyForAction(key, 'encrypt')"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </button>
                <button
                  class="p-2 text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border rounded"
                  title="Decrypt"
                  @click="selectKeyForAction(key, 'decrypt')"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                </button>
                <button
                  class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Delete"
                  @click="selectKeyForAction(key, 'delete')"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
                <svg
                  class="w-5 h-5 transition-transform"
                  :class="{ 'rotate-90': expandedKeys.has(key.KeyId) }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
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
              <h4
                class="text-sm font-semibold mb-3"
                :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
              >
                Key Details
              </h4>
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
                      <svg
                        class="w-4 h-4 text-light-muted dark:text-dark-muted"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
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
                <div
                  v-if="key.keyMetadata?.Description"
                  class="col-span-2"
                >
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Description</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ key.keyMetadata.Description }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Key Policy -->
            <div>
              <h4
                class="text-sm font-semibold mb-3"
                :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
              >
                Key Policy
              </h4>
              <pre class="p-4 rounded-lg bg-light-bg dark:bg-dark-bg text-xs font-mono overflow-auto max-h-48 text-light-text dark:text-dark-text">{{ keyPolicyMap[key.KeyId] || 'Loading policy...' }}</pre>
            </div>
          </div>
        </div>
        <!-- Pagination -->
        <div
          v-if="!isLoading && totalKeyPages > 1"
          class="flex justify-center items-center gap-2 py-4"
        >
          <button
            class="px-3 py-1 rounded border disabled:opacity-50"
            :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
            :disabled="keyPage === 1"
            @click="keyPage--"
          >
            Previous
          </button>
          <span
            class="text-sm"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            Page {{ keyPage }} of {{ totalKeyPages }}
          </span>
          <button
            class="px-3 py-1 rounded border disabled:opacity-50"
            :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
            :disabled="keyPage === totalKeyPages"
            @click="keyPage++"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Create Key Modal -->
    <KMSCreateKeyModal
      v-model:open="showCreateModal"
      v-model:form="newKey"
      :key-specs="keySpecs"
      @create="handleCreateKeyWrapper"
    />

    <!-- Key Details Modal -->
    <KMSViewDetailsModal
      :open="showDetailsModal"
      :selected-key="selectedKey"
      @update:open="showDetailsModal = $event"
      @enable-key="handleEnableKey"
      @disable-key="handleDisableKey"
      @delete-key="showDeleteModal = true"
    />

    <!-- Key Policy Modal -->
    <KMSPolicyModal
      :open="showPolicyModal"
      :selected-key="selectedKey"
      :policy="keyPolicy"
      @update:open="showPolicyModal = $event"
    />

    <!-- Encrypt Modal -->
    <KMSEncryptModal
      v-model:encrypt-form="encryptForm"
      v-model:encrypted-result="encryptedResult"
      :open="showEncryptModal"
      :selected-key="selectedKey"
      @update:open="showEncryptModal = $event"
      @encrypt="handleEncrypt"
    />

    <!-- Decrypt Modal -->
    <KMSDecryptModal
      v-model:decrypt-form="decryptForm"
      v-model:decrypted-result="decryptedResult"
      :open="showDecryptModal"
      @update:open="showDecryptModal = $event"
      @decrypt="handleDecrypt"
    />

    <!-- Delete Key Modal -->
    <KMSDeleteModal
      v-model:open="showDeleteModal"
      @delete="handleDeleteKey"
    />

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
