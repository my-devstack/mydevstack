import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import { useContentReload } from '@/composables/useContentReload'
import { useSettingsStore } from '@/stores/settings'
import * as kmsApi from '@/api/services/kms'
import type { KMSKey } from '@/api/types/aws'

// Types
export interface KeyInfo {
  KeyId: string
  KeyArn: string
  keyMetadata?: KMSKey
}

export interface KeyForm {
  description: string
  keyUsage: string
  keySpec: string
}

export interface EncryptForm {
  plaintext: string
}

export interface DecryptForm {
  ciphertext: string
}

export function useKMS() {
  const toast = useToast()
  const settingsStore = useSettingsStore()
  const { reloadTrigger } = useContentReload()

  // State
  const keys = ref<KeyInfo[]>([])
  const isLoading = ref(false)
  const selectedKey = ref<KeyInfo | null>(null)

  // Modal visibility states
  const showCreateModal = ref(false)
  const showDetailsModal = ref(false)
  const showEncryptModal = ref(false)
  const showDecryptModal = ref(false)
  const showDeleteModal = ref(false)
  const showPolicyModal = ref(false)

  // Accordion state
  const expandedKeys = ref<Set<string>>(new Set())

  // Forms
  const newKey = ref<KeyForm>({
    description: '',
    keyUsage: 'ENCRYPT_DECRYPT',
    keySpec: 'SYMMETRIC_DEFAULT',
  })

  const encryptForm = ref<EncryptForm>({
    plaintext: '',
  })

  const decryptForm = ref<DecryptForm>({
    ciphertext: '',
  })

  // Results
  const encryptedResult = ref('')
  const decryptedResult = ref('')
  const keyPolicy = ref('')
  const keyPolicyMap = ref<Record<string, string>>({})

  // Key specs for dropdown
  const keySpecs = [
    { value: 'SYMMETRIC_DEFAULT', label: 'Symmetric Key (Default)' },
    { value: 'RSA_2048', label: 'RSA 2048' },
    { value: 'RSA_3072', label: 'RSA 3072' },
    { value: 'RSA_4096', label: 'RSA 4096' },
  ]

  // Computed
  const keyCount = computed(() => keys.value.length)

  // Functions
  async function loadKeys() {
    isLoading.value = true
    try {
      const result = await kmsApi.listKeys()
      const keysList: KeyInfo[] = (result.Keys || []).map((key: { KeyId: string; KeyArn: string }) => ({
        KeyId: key.KeyId,
        KeyArn: key.KeyArn,
      }))

      // Load metadata and policy for each key
      for (const key of keysList) {
        try {
          const metaResult = await kmsApi.describeKey(key.KeyId)
          key.keyMetadata = metaResult.KeyMetadata
        } catch (error) {
          toast.error(`Failed to load key metadata: ${error}`)
          key.keyMetadata = undefined
        }

        try {
          const policyResult = await kmsApi.getKeyPolicy(key.KeyId, 'default')
          keyPolicyMap.value[key.KeyId] = policyResult.Policy || 'No policy'
        } catch (error) {
          toast.error(`Failed to load key policy: ${error}`)
          keyPolicyMap.value[key.KeyId] = 'No policy'
        }
      }

      keys.value = keysList
    } catch (error) {
      toast.error('Failed to load keys: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      isLoading.value = false
    }
  }

  async function loadKeyDetails() {
    if (!selectedKey.value) return

    try {
      const result = await kmsApi.describeKey(selectedKey.value.KeyId)
      selectedKey.value = { ...selectedKey.value, keyMetadata: result.KeyMetadata }
    } catch (error) {
      toast.error('Failed to load key details: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  async function handleCreateKey() {
    try {
      const result = await kmsApi.createKey({
        Description: newKey.value.description || undefined,
        KeyUsage: newKey.value.keyUsage as 'SIGN_VERIFY' | 'ENCRYPT_DECRYPT',
        CustomerMasterKeySpec: newKey.value.keySpec as 'SYMMETRIC_DEFAULT' | 'RSA_2048' | 'RSA_3072' | 'RSA_4096',
      })
      toast.success('Key created successfully')
      showCreateModal.value = false
      newKey.value = { description: '', keyUsage: 'ENCRYPT_DECRYPT', keySpec: 'SYMMETRIC_DEFAULT' }
      await loadKeys()
    } catch (error) {
      toast.error('Failed to create key: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  async function handleEnableKey() {
    if (!selectedKey.value) return

    try {
      await kmsApi.enableKey(selectedKey.value.KeyId)
      toast.success('Key enabled successfully')
      await loadKeyDetails()
    } catch (error) {
      toast.error('Failed to enable key: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  async function handleDisableKey() {
    if (!selectedKey.value) return

    try {
      await kmsApi.disableKey(selectedKey.value.KeyId)
      toast.success('Key disabled successfully')
      await loadKeyDetails()
    } catch (error) {
      toast.error('Failed to disable key: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  async function handleDeleteKey() {
    if (!selectedKey.value) return

    try {
      await kmsApi.scheduleKeyDeletion(selectedKey.value.KeyId)
      toast.success('Key will be deleted in 7 days')
      showDeleteModal.value = false
      selectedKey.value = null
      await loadKeys()
    } catch (error) {
      toast.error('Failed to schedule deletion: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  async function handleEncrypt() {
    if (!selectedKey.value || !encryptForm.value.plaintext) return

    try {
      const result = await kmsApi.encrypt(selectedKey.value.KeyId, encryptForm.value.plaintext)
      encryptedResult.value = result.CiphertextBlob
      toast.success('Data encrypted successfully')
    } catch (error) {
      toast.error('Encryption failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  async function handleDecrypt() {
    if (!decryptForm.value.ciphertext) return

    try {
      const result = await kmsApi.decrypt(decryptForm.value.ciphertext)
      decryptedResult.value = result.Plaintext
      toast.success('Data decrypted successfully')
    } catch (error) {
      toast.error('Decryption failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  async function loadKeyPolicy() {
    if (!selectedKey.value) return

    try {
      const result = await kmsApi.getKeyPolicy(selectedKey.value.KeyId, 'default')
      keyPolicy.value = result.Policy || ''
    } catch (error) {
      toast.error('Failed to load key policy: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  function toggleKeyExpansion(keyId: string) {
    if (expandedKeys.value.has(keyId)) {
      expandedKeys.value.delete(keyId)
    } else {
      expandedKeys.value.add(keyId)
    }
    expandedKeys.value = new Set(expandedKeys.value)
  }

  function getKeyStatus(key: KeyInfo): 'enabled' | 'disabled' | 'pending' | 'unknown' {
    const state = (key.keyMetadata?.KeyState as string) || 'unknown'
    switch (state) {
      case 'Enabled':
        return 'enabled'
      case 'Disabled':
        return 'disabled'
      case 'PendingDeletion':
      case 'PendingReplicaDeletion':
        return 'pending'
      default:
        return 'unknown'
    }
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
    return navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard')
    }).catch(() => {
      toast.error('Failed to copy: Could not copy to clipboard')
    })
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

  // Watch for reload trigger
  // Note: This should be set up in the component using onMounted
  function setupReloadWatcher() {
    // This is a helper function that components can call in onMounted
    return reloadTrigger
  }

  // Code examples
  const codeExamples = computed(() => [
    {
      language: 'aws-cli',
      label: 'AWS CLI',
      code: `# List KMS keys
aws kms list-keys --endpoint-url ${settingsStore.publicEndpoint}

# Create key
aws kms create-key \\
  --description "My encryption key" \\
  --key-usage ENCRYPT_DECRYPT \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Describe key
aws kms describe-key \\
  --key-id 1234abcd-12ab-12ab-12ab-1234567890ab \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Enable/Disable key
aws kms enable-key --key-id 1234abcd-12ab-12ab-12ab-1234567890ab --endpoint-url ${settingsStore.publicEndpoint}
aws kms disable-key --key-id 1234abcd-12ab-12ab-12ab-1234567890ab --endpoint-url ${settingsStore.publicEndpoint}

# Encrypt data
aws kms encrypt \\
  --key-id 1234abcd-12ab-12ab-12ab-1234567890ab \\
  --plaintext fileb://plaintext.txt \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Decrypt data
aws kms decrypt \\
  --ciphertext-blob fileb://ciphertext.bin \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Get key policy
aws kms get-key-policy \\
  --key-id 1234abcd-12ab-12ab-12ab-1234567890ab \\
  --policy-name default \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Schedule key deletion
aws kms schedule-key-deletion \\
  --key-id 1234abcd-12ab-12ab-12ab-1234567890ab \\
  --pending-window-in-days 7 \\
  --endpoint-url ${settingsStore.publicEndpoint}`
    },
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `// Using AWS SDK v3
import { KMSClient, ListKeysCommand, CreateKeyCommand, EncryptCommand, DecryptCommand, DescribeKeyCommand, EnableKeyCommand, DisableKeyCommand } from "@aws-sdk/client-kms";

const client = new KMSClient({
  region: '${settingsStore.region}',
  endpoint: '${settingsStore.publicEndpoint}',
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
    endpoint_url='${settingsStore.publicEndpoint}',
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
    o.BaseURL = aws.String("${settingsStore.publicEndpoint}")
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

  return {
    // State
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

    // Computed
    keyCount,
    codeExamples,

    // Functions
    loadKeys,
    loadKeyDetails,
    handleCreateKey,
    handleEnableKey,
    handleDisableKey,
    handleDeleteKey,
    handleEncrypt,
    handleDecrypt,
    loadKeyPolicy,
    toggleKeyExpansion,
    getKeyStatus,
    getKeyStatusLabel,
    copyToClipboard,
    viewKeyDetails,
    viewKeyPolicy,
    selectKeyForAction,
    setupReloadWatcher,
  }
}
