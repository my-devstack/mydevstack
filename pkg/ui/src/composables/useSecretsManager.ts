import { ref, watch, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useContentReload } from '@/composables/useContentReload'
import { useSettingsStore } from '@/stores/settings'
import * as secretsManager from '@/api/services/secrets-manager'

export interface SecretItem {
  Name: string
  Description?: string
  CreatedDate?: string
  [key: string]: any
}

export interface SecretDetails {
  secret: string
  versionId?: string
  createdDate?: string
}

export function useSecretsManager() {
  const toast = useToast()
  const settingsStore = useSettingsStore()
  const { reloadTrigger } = useContentReload()

  // State
  const secrets = ref<SecretItem[]>([])
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
  const selectedSecret = ref<SecretItem | null>(null)
  const secretValue = ref('')
  const secretLoading = ref(false)
  const secretError = ref<string | null>(null)
  const isEditing = ref(false)
  const editSecretValue = ref('')

  // Delete confirmation state
  const showDeleteModal = ref(false)
  const secretToDelete = ref('')

  // Accordion state (exclusive expansion)
  const expandedSecret = ref<string | null>(null)
  const secretDetailsMap = ref<Record<string, SecretDetails | null>>({})

  // Code examples computed
  const codeExamples = ref([
    {
      language: 'aws-cli',
      label: 'AWS CLI',
      code: `# List secrets
aws secretsmanager list-secrets --endpoint-url ${settingsStore.publicEndpoint}

# Get secret value
aws secretsmanager get-secret-value --secret-id my-secret --endpoint-url ${settingsStore.publicEndpoint}

# Create secret
aws secretsmanager create-secret \\
  --name my-secret \\
  --secret-string '{"username":"admin","password":"secret123"}' \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Delete secret
aws secretsmanager delete-secret --secret-id my-secret --endpoint-url ${settingsStore.publicEndpoint}`
    },
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `// Using AWS SDK v3
import { SecretsManagerClient, ListSecretsCommand, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({
  region: 'us-east-1',
  endpoint: '${settingsStore.publicEndpoint}',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
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
    region_name='us-east-1',
    endpoint_url='${settingsStore.publicEndpoint}',
    aws_access_key_id='test',
    aws_secret_access_key='test',
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
    config.WithRegion("us-east-1"),
    config.WithEndpointResolverWithOptions(
        aws.EndpointResolverWithOptionsFunc(
            func(service, region string, options ...interface{}) (
                aws.Endpoint, error,
            ) {
                return aws.Endpoint{
                    URL: "${settingsStore.publicEndpoint}",
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

  const selectedExample = ref(0)

  // Toggle secret expansion (exclusive)
  function toggleSecretExpansion(secretName: string) {
    if (expandedSecret.value === secretName) {
      expandedSecret.value = null
    } else {
      expandedSecret.value = secretName
      // Load secret value if not already loaded
      if (!secretDetailsMap.value[secretName]) {
        loadSecretDetailsForAccordion(secretName)
      }
    }
  }

  async function loadSecretDetailsForAccordion(secretName: string) {
    try {
      const data = await secretsManager.getSecretValue(secretName)
      secretDetailsMap.value[secretName] = {
        secret: data.SecretString || '',
        versionId: data.VersionId,
        createdDate: data.CreatedDate
      }
    } catch (e: any) {
      secretDetailsMap.value[secretName] = null
    }
  }

  // Load secrets
  async function loadSecrets() {
    loading.value = true
    error.value = null

    try {
      const response = await secretsManager.listSecrets()
      secrets.value = response.SecretList || []
    } catch (e: any) {
      error.value = e.message || 'Failed to load secrets'
      secrets.value = []
      toast.error('Failed to load secrets')
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
      toast.success(`Secret ${newSecretName.value} created successfully`)
    } catch (e: any) {
      toast.error('Failed to create secret: ' + (e.message || 'Unknown error'))
    } finally {
      creating.value = false
    }
  }

  // View secret
  async function viewSecret(secret: SecretItem) {
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
      secretError.value = 'Failed to get secret value: ' + (e.message || 'Unknown error')
      toast.error('Failed to get secret value')
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
        secretDetailsMap.value[selectedSecret.value.Name]!.secret = editSecretValue.value.trim()
      }
      // Close the modal
      showViewModal.value = false
      toast.success('Secret value updated successfully')
    } catch (e: any) {
      secretError.value = 'Failed to update secret: ' + (e.message || 'Unknown error')
      toast.error('Failed to update secret')
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
      toast.success('Secret deleted successfully')
    } catch (e: any) {
      toast.error('Failed to delete secret: ' + (e.message || 'Unknown error'))
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
    selectedSecret.value = { Name: name } as SecretItem
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

  // Lifecycle
  onMounted(() => {
    loadSecrets()
  })

  watch(reloadTrigger, () => {
    loadSecrets()
  })

  return {
    // State
    secrets,
    loading,
    error,
    showCreateModal,
    newSecretName,
    newSecretValue,
    newSecretDescription,
    creating,
    showViewModal,
    selectedSecret,
    secretValue,
    secretLoading,
    secretError,
    isEditing,
    editSecretValue,
    showDeleteModal,
    secretToDelete,
    expandedSecret,
    secretDetailsMap,

    // Computed
    codeExamples,
    selectedExample,

    // Functions
    loadSecrets,
    openCreateModal,
    createSecret,
    viewSecret,
    toggleEdit,
    saveSecretValue,
    openDeleteModal,
    confirmDeleteSecret,
    closeViewModal,
    openEditModal,
    toggleSecretExpansion,
    formatDate,
    formatSecretPreview,
    isJson,
  }
}
