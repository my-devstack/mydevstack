<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useContentReload } from '@/composables/useContentReload'
import { ShieldCheckIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import * as secretsManager from '@/api/services/secrets-manager'

const settingsStore = useSettingsStore()
const { reloadTrigger } = useContentReload()

const secrets = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Create modal state
const showCreateModal = ref(false)
const newSecretName = ref('')
const newSecretValue = ref('')
const newSecretDescription = ref('')
const creating = ref(false)

// View/Edit modal state
const showViewModal = ref(false)
const selectedSecret = ref<any>(null)
const secretValue = ref('')
const secretLoading = ref(false)
const secretError = ref<string | null>(null)
const isEditing = ref(false)
const editSecretValue = ref('')

// Delete confirmation state
const showDeleteModal = ref(false)
const secretToDelete = ref('')

// Accordion state for secrets
const expandedSecrets = ref<Set<string>>(new Set())
const secretDetailsMap = ref<Record<string, any>>({})

function toggleSecretExpansion(secretName: string) {
  if (expandedSecrets.value.has(secretName)) {
    expandedSecrets.value.delete(secretName)
  } else {
    expandedSecrets.value.add(secretName)
    // Load secret value if not already loaded
    if (!secretDetailsMap.value[secretName]) {
      loadSecretDetailsForAccordion(secretName)
    }
  }
  expandedSecrets.value = new Set(expandedSecrets.value)
}

async function loadSecretDetailsForAccordion(secretName: string) {
  try {
    const data = await secretsManager.getSecretValue(secretName)
    secretDetailsMap.value[secretName] = {
      secret: data.SecretString,
      versionId: data.VersionId,
      createdDate: data.CreatedDate
    }
  } catch (e: any) {
    console.error('Failed to load secret details:', e)
    secretDetailsMap.value[secretName] = null
  }
}

// Code examples
const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List secrets
aws secretsmanager list-secrets --endpoint-url http://127.0.0.1:4566

# Get secret value
aws secretsmanager get-secret-value --secret-id my-secret --endpoint-url http://127.0.0.1:4566

# Create secret
aws secretsmanager create-secret \\
  --name my-secret \\
  --secret-string '{"username":"admin","password":"secret123"}' \\
  --endpoint-url http://127.0.0.1:4566

# Delete secret
aws secretsmanager delete-secret --secret-id my-secret --endpoint-url http://127.0.0.1:4566`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { SecretsManagerClient, ListSecretsCommand, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({
  region: '${settingsStore.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List secrets
const listResponse = await client.send(new ListSecretsCommand({}));
console.log(listResponse.SecretList);

// Get secret value
const valueResponse = await client.send(new GetSecretValueCommand({
  SecretId: 'my-secret',
}));
console.log(valueResponse.SecretString);`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3

client = boto3.client(
    'secretsmanager',
    region_name='${settingsStore.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List secrets
response = client.list_secrets()
for secret in response['SecretList']:
    print(secret['Name'])

# Get secret value
response = client.get_secret_value(SecretId='my-secret')
print(response['SecretString'])`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
    config.WithEndpointResolverWithOptions(
        aws.EndpointResolverWithOptionsFunc(
            func(service, region string, options ...interface{}) (
                aws.Endpoint, error,
            ) {
                return aws.Endpoint{
                    URL: "http://127.0.0.1:4566",
                }, nil
            },
        ),
    ),
)

client := secretsmanager.NewFromConfig(cfg)

// List secrets
listOutput, _ := client.ListSecrets(context.Background(), 
    &secretsmanager.ListSecretsInput{})
fmt.Println(listOutput.SecretList)

// Get secret value
valueOutput, _ := client.GetSecretValue(context.Background(),
    &secretsmanager.GetSecretValueInput{SecretId: "my-secret"})
fmt.Println(*valueOutput.SecretString)`
  },
])

async function loadSecrets() {
  loading.value = true
  error.value = null
  
  try {
    const response = await secretsManager.listSecrets()
    secrets.value = response.SecretList || []
  } catch (e: any) {
    error.value = e.message
    secrets.value = []
  } finally {
    loading.value = false
  }
}

// Open create modal
function openCreateModal() {
  newSecretName.value = ''
  newSecretValue.value = ''
  newSecretDescription.value = ''
  showCreateModal.value = true
}

// Create secret
async function createSecret() {
  if (!newSecretName.value.trim() || !newSecretValue.value.trim()) return
  
  creating.value = true
  error.value = null
  try {
    await secretsManager.createSecret({
      Name: newSecretName.value.trim(),
      SecretString: newSecretValue.value.trim(),
      Description: newSecretDescription.value.trim() || undefined,
    })
    showCreateModal.value = false
    newSecretName.value = ''
    newSecretValue.value = ''
    newSecretDescription.value = ''
    await loadSecrets()
  } catch (e: any) {
    error.value = 'Failed to create secret: ' + e.message
  } finally {
    creating.value = false
  }
}

// View secret
async function viewSecret(secret: any) {
  selectedSecret.value = secret
  secretValue.value = ''
  secretError.value = null
  isEditing.value = false
  showViewModal.value = true
  secretLoading.value = true

  try {
    const response = await secretsManager.getSecretValue(secret.Name)
    secretValue.value = response.SecretString || ''
    editSecretValue.value = response.SecretString || ''
  } catch (e: any) {
    secretError.value = 'Failed to get secret value: ' + e.message
  } finally {
    secretLoading.value = false
  }
}

// Toggle edit mode
function toggleEdit() {
  if (isEditing.value) {
    // Cancel editing - restore original value
    editSecretValue.value = secretValue.value
  }
  isEditing.value = !isEditing.value
}

// Save secret changes
async function saveSecretValue() {
  if (!selectedSecret.value) return
  
  secretLoading.value = true
  secretError.value = null
  
  try {
    await secretsManager.putSecretValue({
      SecretId: selectedSecret.value.Name,
      SecretString: editSecretValue.value.trim()
    })
    secretValue.value = editSecretValue.value.trim()
    isEditing.value = false
    // Update the accordion state as well
    if (selectedSecret.value.Name && secretDetailsMap.value[selectedSecret.value.Name]) {
      secretDetailsMap.value[selectedSecret.value.Name].secret = editSecretValue.value.trim()
    }
    // Close the modal
    showViewModal.value = false
  } catch (e: any) {
    secretError.value = 'Failed to update secret: ' + e.message
  } finally {
    secretLoading.value = false
  }
}

// Delete secret
function openDeleteModal(name: string) {
  secretToDelete.value = name
  showDeleteModal.value = true
}

async function confirmDeleteSecret() {
  if (!secretToDelete.value) return
  
  loading.value = true
  try {
    await secretsManager.deleteSecret(secretToDelete.value)
    showDeleteModal.value = false
    secretToDelete.value = ''
    await loadSecrets()
  } catch (e: any) {
    error.value = 'Failed to delete secret: ' + e.message
  } finally {
    loading.value = false
  }
}

// Close view modal
function closeViewModal() {
  showViewModal.value = false
  selectedSecret.value = null
  secretValue.value = ''
  editSecretValue.value = ''
  isEditing.value = false
}

// Open edit modal for accordion
function openEditModal(name: string, secretString: string) {
  selectedSecret.value = { Name: name }
  secretValue.value = secretString
  editSecretValue.value = secretString
  isEditing.value = true
  showViewModal.value = true
}

// Format date
function formatDate(dateStr: string): string {
  if (!dateStr) return 'Unknown'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

// Format secret value preview
function formatSecretPreview(value: string): string {
  try {
    const parsed = JSON.parse(value)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return value.length > 100 ? value.substring(0, 100) + '...' : value
  }
}

// Check if value is JSON
function isJson(value: string): boolean {
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}

onMounted(() => {
  loadSecrets()
})

watch(reloadTrigger, () => {
  loadSecrets()
})

// Example code tabs
const selectedExample = ref(0)
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4 -mx-6 -mt-6 mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <ShieldCheckIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            Secrets Manager
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ secrets.length }} secret{{ secrets.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            @click="openCreateModal"
          >
            + Create Secret
          </button>
          <button
            class="p-2 text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border rounded"
            title="Refresh"
            @click="loadSecrets"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="error"
      class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
    >
      {{ error }}
    </div>

    <div
      v-if="loading"
      class="text-center py-12"
    >
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      <p
        class="mt-2"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
      >
        Loading...
      </p>
    </div>

    <div v-if="!loading">
      <div
        v-if="secrets.length === 0"
        class="text-center py-12"
      >
        <p
          class="text-lg"
          :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        >
          No secrets found. Create one to get started!
        </p>
      </div>
      
      <div
        v-else
        class="space-y-4"
      >
        <div
          v-for="secret in secrets"
          :key="secret.Name"
          class="border rounded-lg overflow-hidden"
          :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
        >
          <!-- Accordion Header -->
          <div 
            class="grid grid-cols-12 gap-4 px-4 py-4 items-center cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg"
            :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-light-surface'"
            @click="toggleSecretExpansion(secret.Name)"
          >
            <div class="col-span-9 flex items-center gap-2">
              <ShieldCheckIcon class="h-5 w-5 text-primary-500" />
              <div class="min-w-0">
                <span class="font-medium text-light-text dark:text-dark-text">{{ secret.Name }}</span>
                <p
                  v-if="secret.Description"
                  class="text-sm truncate"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  {{ secret.Description }}
                </p>
              </div>
            </div>
            <div class="col-span-3 flex items-center justify-end gap-2">
              <button
                class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                title="Delete"
                @click.stop="openDeleteModal(secret.Name)"
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
              <ChevronRightIcon
                class="h-5 w-5 transition-transform"
                :class="expandedSecrets.has(secret.Name) ? 'rotate-90' : ''"
              />
            </div>
          </div>
        
          <!-- Accordion Content -->
          <div
            v-if="expandedSecrets.has(secret.Name)"
            class="px-4 pb-4 border-t"
            :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
          >
            <div class="mt-4 space-y-4">
              <!-- Created Date -->
              <div>
                <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Created Date</label>
                <p class="text-sm text-light-text dark:text-dark-text">
                  {{ formatDate(secret.CreatedDate) }}
                </p>
              </div>
              
              <!-- Secret Value -->
              <div v-if="secretDetailsMap[secret.Name]">
                <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Secret Value</label>
                <div
                  class="p-4 rounded-lg font-mono text-sm whitespace-pre-wrap break-all"
                  :class="settingsStore.darkMode ? 'bg-dark-bg' : 'bg-gray-50'"
                >
                  {{ secretDetailsMap[secret.Name].secret }}
                </div>
                <div class="mt-2 flex items-center gap-2">
                  <button
                    class="px-3 py-1 text-sm text-blue-500 hover:text-blue-700 border border-blue-500 rounded hover:bg-blue-50"
                    @click="openEditModal(secret.Name, secretDetailsMap[secret.Name].secret)"
                  >
                    Edit Value
                  </button>
                </div>
              </div>
              <div
                v-else-if="!secretDetailsMap[secret.Name]"
                class="text-center py-4"
              >
                <div class="inline-block animate-spin rounded-full h-6 w-6 border-4 border-blue-600 border-t-transparent" />
                <p class="mt-2 text-sm text-light-muted dark:text-dark-muted">
                  Loading secret value...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Example Code Section -->
    <div
      v-if="!loading && secrets.length > 0"
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
                : settingsStore.darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
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

  <!-- Create Secret Modal -->
  <Modal
    :open="showCreateModal"
    title="Create Secret"
    @update:open="showCreateModal = $event"
    @close="showCreateModal = false"
  >
    <div class="space-y-4">
      <div>
        <label
          class="block text-sm font-medium mb-1"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Secret Name *
        </label>
        <input
          v-model="newSecretName"
          type="text"
          placeholder="my-secret"
          class="w-full px-3 py-2 rounded-lg border"
          :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
        >
      </div>
      <div>
        <label
          class="block text-sm font-medium mb-1"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Secret Value * (JSON or plain text)
        </label>
        <textarea
          v-model="newSecretValue"
          rows="4"
          placeholder="{&quot;username&quot;: &quot;admin&quot;, &quot;password&quot;: &quot;secret123&quot;}"
          class="w-full px-3 py-2 rounded-lg border font-mono text-sm"
          :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
        />
      </div>
      <div>
        <label
          class="block text-sm font-medium mb-1"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Description (optional)
        </label>
        <input
          v-model="newSecretDescription"
          type="text"
          placeholder="Database credentials for production"
          class="w-full px-3 py-2 rounded-lg border"
          :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
        >
      </div>
    </div>
    <template #footer>
      <button
        class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 mr-2"
        @click="showCreateModal = false"
      >
        Cancel
      </button>
      <button
        :disabled="!newSecretName.trim() || !newSecretValue.trim() || creating"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        @click="createSecret"
      >
        {{ creating ? 'Creating...' : 'Create' }}
      </button>
    </template>
  </Modal>

  <!-- Edit Secret Modal -->
  <Modal
    :open="showViewModal"
    :title="'Edit: ' + (selectedSecret?.Name || 'Secret')"
    size="lg"
    @update:open="showViewModal = $event"
    @close="closeViewModal"
  >
    <!-- Secret Value Edit -->
    <div>
      <label
        class="text-sm font-medium mb-2 block"
        :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
      >
        Secret Value
      </label>
      <span
        v-if="editSecretValue && isJson(editSecretValue)"
        class="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 mb-2 inline-block"
      >
        JSON
      </span>
      <textarea
        v-model="editSecretValue"
        rows="8"
        class="w-full px-3 py-2 rounded-lg border font-mono text-sm"
        :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
      />
    </div>
    
    <template #footer>
      <div class="flex gap-2">
        <button
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          @click="closeViewModal"
        >
          Cancel
        </button>
        <button
          :disabled="secretLoading"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          @click="saveSecretValue"
        >
          {{ secretLoading ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </template>
  </Modal>

  <!-- Delete Confirmation Modal -->
  <ConfirmModal
    v-model:open="showDeleteModal"
    title="Delete Secret"
    message="Are you sure you want to delete this secret? This action cannot be undone."
    confirm-text="Delete"
    @confirm="confirmDeleteSecret"
  />
</template>