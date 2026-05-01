import { ref, computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useContentReload } from '@/composables/useContentReload'
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
  const uiStore = useUIStore()
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
      const keysList = (result.Keys || []).map((key: { KeyId: string; KeyArn: string }) => ({
        KeyId: key.KeyId,
        KeyArn: key.KeyArn,
      }))

      // Load metadata and policy for each key
      for (const key of keysList) {
        try {
          const metaResult = await kmsApi.describeKey(key.KeyId)
          key.keyMetadata = metaResult.KeyMetadata
        } catch (error) {
          uiStore.notifyError('Error', `Failed to load key metadata: ${error}`)
          key.keyMetadata = undefined
        }

        try {
          const policyResult = await kmsApi.getKeyPolicy(key.KeyId, 'default')
          keyPolicyMap.value[key.KeyId] = policyResult.Policy || 'No policy'
        } catch (error) {
          uiStore.notifyError('Error', `Failed to load key policy: ${error}`)
          keyPolicyMap.value[key.KeyId] = 'No policy'
        }
      }

      keys.value = keysList
    } catch (error) {
      uiStore.notifyError('Failed to load keys', error instanceof Error ? error.message : 'Unknown error')
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
      uiStore.notifyError('Failed to load key details', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async function handleCreateKey() {
    try {
      const result = await kmsApi.createKey({
        Description: newKey.value.description || undefined,
        KeyUsage: newKey.value.keyUsage as 'SIGN_VERIFY' | 'ENCRYPT_DECRYPT',
        CustomerMasterKeySpec: newKey.value.keySpec as 'SYMMETRIC_DEFAULT' | 'RSA_2048' | 'RSA_3072' | 'RSA_4096',
      })
      uiStore.notifySuccess('Key created', `Key created successfully`)
      showCreateModal.value = false
      newKey.value = { description: '', keyUsage: 'ENCRYPT_DECRYPT', keySpec: 'SYMMETRIC_DEFAULT' }
      await loadKeys()
    } catch (error) {
      uiStore.notifyError('Failed to create key', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async function handleEnableKey() {
    if (!selectedKey.value) return

    try {
      await kmsApi.enableKey(selectedKey.value.KeyId)
      uiStore.notifySuccess('Key enabled', 'Key enabled successfully')
      await loadKeyDetails()
    } catch (error) {
      uiStore.notifyError('Failed to enable key', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async function handleDisableKey() {
    if (!selectedKey.value) return

    try {
      await kmsApi.disableKey(selectedKey.value.KeyId)
      uiStore.notifySuccess('Key disabled', 'Key disabled successfully')
      await loadKeyDetails()
    } catch (error) {
      uiStore.notifyError('Failed to disable key', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async function handleDeleteKey() {
    if (!selectedKey.value) return

    try {
      await kmsApi.scheduleKeyDeletion(selectedKey.value.KeyId)
      uiStore.notifySuccess('Key deletion scheduled', 'Key will be deleted in 7 days')
      showDeleteModal.value = false
      selectedKey.value = null
      await loadKeys()
    } catch (error) {
      uiStore.notifyError('Failed to schedule deletion', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async function handleEncrypt() {
    if (!selectedKey.value || !encryptForm.value.plaintext) return

    try {
      const result = await kmsApi.encrypt(selectedKey.value.KeyId, encryptForm.value.plaintext)
      encryptedResult.value = result.CiphertextBlob
      uiStore.notifySuccess('Data encrypted', 'Data encrypted successfully')
    } catch (error) {
      uiStore.notifyError('Encryption failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async function handleDecrypt() {
    if (!decryptForm.value.ciphertext) return

    try {
      const result = await kmsApi.decrypt(decryptForm.value.ciphertext)
      decryptedResult.value = result.Plaintext
      uiStore.notifySuccess('Data decrypted', 'Data decrypted successfully')
    } catch (error) {
      uiStore.notifyError('Decryption failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async function loadKeyPolicy() {
    if (!selectedKey.value) return

    try {
      const result = await kmsApi.getKeyPolicy(selectedKey.value.KeyId, 'default')
      keyPolicy.value = result.Policy || ''
    } catch (error) {
      uiStore.notifyError('Failed to load key policy', error instanceof Error ? error.message : 'Unknown error')
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
      uiStore.notifySuccess('Copied', 'Copied to clipboard')
    }).catch(() => {
      uiStore.notifyError('Failed to copy', 'Could not copy to clipboard')
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
