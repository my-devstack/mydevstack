import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useKMS } from './useKMS'
import { useUIStore } from '@/stores/ui'
import type { KMSKey } from '@/api/types/aws'

// Mock the KMS API module
vi.mock('@/api/services/kms', () => ({
  listKeys: vi.fn(),
  createKey: vi.fn(),
  describeKey: vi.fn(),
  encrypt: vi.fn(),
  decrypt: vi.fn(),
  enableKey: vi.fn(),
  disableKey: vi.fn(),
  scheduleKeyDeletion: vi.fn(),
  getKeyPolicy: vi.fn(),
  listKeyPolicies: vi.fn(),
}))

// Create shared mock functions for UI store
const mockNotifySuccess = vi.fn()
const mockNotifyError = vi.fn()
const mockNotifyWarning = vi.fn()
const mockNotifyInfo = vi.fn()

// Mock the useUIStore store
vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: mockNotifySuccess,
    notifyError: mockNotifyError,
    notifyWarning: mockNotifyWarning,
    notifyInfo: mockNotifyInfo,
  })),
}))

// Mock the useContentReload composable
vi.mock('@/composables/useContentReload', () => ({
  useContentReload: vi.fn(() => ({
    reloadTrigger: { value: 0 },
  })),
}))

import * as kmsApi from '@/api/services/kms'

describe('useKMS', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('initializes with empty state', () => {
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
        keyCount,
      } = useKMS()

      expect(keys.value).toEqual([])
      expect(isLoading.value).toBe(false)
      expect(selectedKey.value).toBeNull()
      expect(showCreateModal.value).toBe(false)
      expect(showDetailsModal.value).toBe(false)
      expect(showEncryptModal.value).toBe(false)
      expect(showDecryptModal.value).toBe(false)
      expect(showDeleteModal.value).toBe(false)
      expect(showPolicyModal.value).toBe(false)
      expect(expandedKeys.value).toBeInstanceOf(Set)
      expect(expandedKeys.value.size).toBe(0)
      expect(newKey.value).toEqual({
        description: '',
        keyUsage: 'ENCRYPT_DECRYPT',
        keySpec: 'SYMMETRIC_DEFAULT',
      })
      expect(encryptForm.value).toEqual({ plaintext: '' })
      expect(decryptForm.value).toEqual({ ciphertext: '' })
      expect(encryptedResult.value).toBe('')
      expect(decryptedResult.value).toBe('')
      expect(keyPolicy.value).toBe('')
      expect(keyPolicyMap.value).toEqual({})
      expect(keyCount.value).toBe(0)
    })
  })

  describe('loadKeys', () => {
    it('loads keys successfully with metadata and policies', async () => {
      const mockKeys = [
        { KeyId: 'key-1', KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1' },
        { KeyId: 'key-2', KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-2' },
      ]

      const mockKeyMetadata1: KMSKey = {
        KeyId: 'key-1',
        Arn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
        Description: 'Test Key 1',
        KeyUsage: 'ENCRYPT_DECRYPT',
        KeyState: 'Enabled',
        CreationDate: 1234567890,
        Origin: 'AWS_KMS',
        KeyManager: 'CUSTOMER',
      }

      const mockKeyMetadata2: KMSKey = {
        KeyId: 'key-2',
        Arn: 'arn:aws:kms:us-east-1:123456789:key/key-2',
        Description: 'Test Key 2',
        KeyUsage: 'SIGN_VERIFY',
        KeyState: 'Disabled',
        CreationDate: 1234567891,
        Origin: 'AWS_KMS',
        KeyManager: 'CUSTOMER',
      }

      vi.mocked(kmsApi.listKeys).mockResolvedValue({ Keys: mockKeys, NextMarker: undefined, Truncated: false })
      vi.mocked(kmsApi.describeKey).mockImplementation((keyId: string) => {
        if (keyId === 'key-1') return Promise.resolve({ KeyMetadata: mockKeyMetadata1 })
        return Promise.resolve({ KeyMetadata: mockKeyMetadata2 })
      })
      vi.mocked(kmsApi.getKeyPolicy).mockResolvedValue({ Policy: '{"Version": "2012-10-17"}' })

      const { loadKeys, keys, isLoading } = useKMS()

      await loadKeys()

      expect(kmsApi.listKeys).toHaveBeenCalled()
      expect(kmsApi.describeKey).toHaveBeenCalledTimes(2)
      expect(kmsApi.getKeyPolicy).toHaveBeenCalledTimes(2)
      expect(keys.value).toHaveLength(2)
      expect(keys.value[0].keyMetadata).toEqual(mockKeyMetadata1)
      expect(keys.value[1].keyMetadata).toEqual(mockKeyMetadata2)
      expect(isLoading.value).toBe(false)
    })

    it('handles error when loading keys fails', async () => {
      vi.mocked(kmsApi.listKeys).mockRejectedValue(new Error('Network error'))

      const { loadKeys, isLoading } = useKMS()

      await loadKeys()

      expect(isLoading.value).toBe(false)
    })

    it('handles errors when loading key metadata', async () => {
      const mockKeys = [
        { KeyId: 'key-1', KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1' },
      ]

      vi.mocked(kmsApi.listKeys).mockResolvedValue({ Keys: mockKeys, NextMarker: undefined, Truncated: false })
      vi.mocked(kmsApi.describeKey).mockRejectedValue(new Error('Key not found'))
      vi.mocked(kmsApi.getKeyPolicy).mockResolvedValue({ Policy: 'policy' })

      const { loadKeys, keys } = useKMS()

      await loadKeys()

      expect(keys.value).toHaveLength(1)
      expect(keys.value[0].keyMetadata).toBeUndefined()
    })

    it('handles errors when loading key policy', async () => {
      const mockKeys = [
        { KeyId: 'key-1', KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1' },
      ]

      const mockKeyMetadata: KMSKey = {
        KeyId: 'key-1',
        Arn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
        Description: 'Test Key',
        KeyUsage: 'ENCRYPT_DECRYPT',
        KeyState: 'Enabled',
        CreationDate: 1234567890,
        Origin: 'AWS_KMS',
        KeyManager: 'CUSTOMER',
      }

      vi.mocked(kmsApi.listKeys).mockResolvedValue({ Keys: mockKeys, NextMarker: undefined, Truncated: false })
      vi.mocked(kmsApi.describeKey).mockResolvedValue({ KeyMetadata: mockKeyMetadata })
      vi.mocked(kmsApi.getKeyPolicy).mockRejectedValue(new Error('Policy not found'))

      const { loadKeys, keyPolicyMap } = useKMS()

      await loadKeys()

      expect(keyPolicyMap.value['key-1']).toBe('No policy')
    })
  })

  describe('handleCreateKey', () => {
    it('creates key successfully and reloads list', async () => {
      vi.mocked(kmsApi.createKey).mockResolvedValue({ KeyMetadata: { KeyId: 'new-key' } })
      vi.mocked(kmsApi.listKeys).mockResolvedValue({ Keys: [], NextMarker: undefined, Truncated: false })

      const { handleCreateKey, newKey, showCreateModal } = useKMS()

      newKey.value = {
        description: 'Test Key',
        keyUsage: 'ENCRYPT_DECRYPT',
        keySpec: 'SYMMETRIC_DEFAULT',
      }
      showCreateModal.value = true

      await handleCreateKey()

      expect(kmsApi.createKey).toHaveBeenCalledWith({
        Description: 'Test Key',
        KeyUsage: 'ENCRYPT_DECRYPT',
        CustomerMasterKeySpec: 'SYMMETRIC_DEFAULT',
      })
      expect(showCreateModal.value).toBe(false)
      expect(newKey.value).toEqual({
        description: '',
        keyUsage: 'ENCRYPT_DECRYPT',
        keySpec: 'SYMMETRIC_DEFAULT',
      })
    })

    it('handles error when creating key fails', async () => {
      vi.mocked(kmsApi.createKey).mockRejectedValue(new Error('Creation failed'))

      const { handleCreateKey } = useKMS()

      await expect(handleCreateKey()).resolves.not.toThrow()
    })
  })

  describe('handleEnableKey and handleDisableKey', () => {
    it('enables key successfully', async () => {
      vi.mocked(kmsApi.enableKey).mockResolvedValue({})
      vi.mocked(kmsApi.describeKey).mockResolvedValue({ KeyMetadata: { KeyState: 'Enabled' } })

      const { handleEnableKey, selectedKey } = useKMS()
      selectedKey.value = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }

      await handleEnableKey()

      expect(kmsApi.enableKey).toHaveBeenCalledWith('key-1')
    })

    it('handles error when enabling key fails', async () => {
      vi.mocked(kmsApi.enableKey).mockRejectedValue(new Error('Enable failed'))

      const { handleEnableKey, selectedKey } = useKMS()
      selectedKey.value = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }

      await expect(handleEnableKey()).resolves.not.toThrow()
    })

    it('disables key successfully', async () => {
      vi.mocked(kmsApi.disableKey).mockResolvedValue({})
      vi.mocked(kmsApi.describeKey).mockResolvedValue({ KeyMetadata: { KeyState: 'Disabled' } })

      const { handleDisableKey, selectedKey } = useKMS()
      selectedKey.value = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }

      await handleDisableKey()

      expect(kmsApi.disableKey).toHaveBeenCalledWith('key-1')
    })

    it('handles error when disabling key fails', async () => {
      vi.mocked(kmsApi.disableKey).mockRejectedValue(new Error('Disable failed'))

      const { handleDisableKey, selectedKey } = useKMS()
      selectedKey.value = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }

      await expect(handleDisableKey()).resolves.not.toThrow()
    })

    it('does nothing if no key is selected for enable/disable', async () => {
      const { handleEnableKey, handleDisableKey, selectedKey } = useKMS()
      selectedKey.value = null

      await handleEnableKey()
      await handleDisableKey()

      expect(kmsApi.enableKey).not.toHaveBeenCalled()
      expect(kmsApi.disableKey).not.toHaveBeenCalled()
    })
  })

  describe('handleDeleteKey', () => {
    it('schedules key deletion and reloads list', async () => {
      vi.mocked(kmsApi.scheduleKeyDeletion).mockResolvedValue({})
      vi.mocked(kmsApi.listKeys).mockResolvedValue({ Keys: [], NextMarker: undefined, Truncated: false })

      const { handleDeleteKey, selectedKey, showDeleteModal } = useKMS()
      selectedKey.value = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }
      showDeleteModal.value = true

      await handleDeleteKey()

      expect(kmsApi.scheduleKeyDeletion).toHaveBeenCalledWith('key-1')
      expect(showDeleteModal.value).toBe(false)
      expect(selectedKey.value).toBeNull()
    })

    it('handles error when deleting key fails', async () => {
      vi.mocked(kmsApi.scheduleKeyDeletion).mockRejectedValue(new Error('Deletion failed'))

      const { handleDeleteKey, selectedKey } = useKMS()
      selectedKey.value = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }

      await expect(handleDeleteKey()).resolves.not.toThrow()
    })

    it('does nothing if no key is selected for deletion', async () => {
      const { handleDeleteKey } = useKMS()

      await handleDeleteKey()

      expect(kmsApi.scheduleKeyDeletion).not.toHaveBeenCalled()
    })
  })

  describe('handleEncrypt and handleDecrypt', () => {
    it('encrypts data successfully', async () => {
      vi.mocked(kmsApi.encrypt).mockResolvedValue({
        CiphertextBlob: 'encrypted-data',
        KeyId: 'key-1',
      })

      const { handleEncrypt, encryptForm, selectedKey, encryptedResult } = useKMS()
      selectedKey.value = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }
      encryptForm.value.plaintext = 'Hello World'

      await handleEncrypt()

      expect(kmsApi.encrypt).toHaveBeenCalledWith('key-1', 'Hello World')
      expect(encryptedResult.value).toBe('encrypted-data')
    })

    it('does not encrypt if no key selected or no plaintext', async () => {
      const { handleEncrypt, encryptForm, selectedKey } = useKMS()
      
      // Scenario 1: Key selected but no plaintext
      selectedKey.value = { KeyId: 'key-123', KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-123' }
      encryptForm.value.plaintext = ''
      await handleEncrypt()
      expect(kmsApi.encrypt).not.toHaveBeenCalled()
      
      // Scenario 2: No key selected but has plaintext
      selectedKey.value = null
      encryptForm.value.plaintext = 'Hello World'
      await handleEncrypt()
      expect(kmsApi.encrypt).not.toHaveBeenCalled()
      
      // Scenario 3: Neither key nor plaintext
      selectedKey.value = null
      encryptForm.value.plaintext = ''
      await handleEncrypt()
      expect(kmsApi.encrypt).not.toHaveBeenCalled()
    })

    it('handles error when encryption fails', async () => {
      vi.mocked(kmsApi.encrypt).mockRejectedValue(new Error('Encryption failed'))

      const { handleEncrypt, selectedKey } = useKMS()
      selectedKey.value = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }

      await expect(handleEncrypt()).resolves.not.toThrow()
    })

    it('decrypts data successfully', async () => {
      vi.mocked(kmsApi.decrypt).mockResolvedValue({
        Plaintext: 'Hello World',
        KeyId: 'key-1',
      })

      const { handleDecrypt, decryptForm, decryptedResult } = useKMS()
      decryptForm.value.ciphertext = 'encrypted-data'

      await handleDecrypt()

      expect(kmsApi.decrypt).toHaveBeenCalledWith('encrypted-data')
      expect(decryptedResult.value).toBe('Hello World')
    })

    it('does not decrypt if no ciphertext', async () => {
      const { handleDecrypt, decryptForm } = useKMS()
      decryptForm.value.ciphertext = ''

      await handleDecrypt()

      expect(kmsApi.decrypt).not.toHaveBeenCalled()
    })

    it('handles error when decryption fails', async () => {
      vi.mocked(kmsApi.decrypt).mockRejectedValue(new Error('Decryption failed'))

      const { handleDecrypt } = useKMS()

      await expect(handleDecrypt()).resolves.not.toThrow()
    })
  })

  describe('toggleKeyExpansion', () => {
    it('toggles key expansion correctly', () => {
      const { toggleKeyExpansion, expandedKeys } = useKMS()

      // Initially empty
      expect(expandedKeys.value.has('key-1')).toBe(false)

      // Toggle on
      toggleKeyExpansion('key-1')
      expect(expandedKeys.value.has('key-1')).toBe(true)

      // Toggle off
      toggleKeyExpansion('key-1')
      expect(expandedKeys.value.has('key-1')).toBe(false)
    })

    it('can expand multiple keys', () => {
      const { toggleKeyExpansion, expandedKeys } = useKMS()

      toggleKeyExpansion('key-1')
      toggleKeyExpansion('key-2')

      expect(expandedKeys.value.has('key-1')).toBe(true)
      expect(expandedKeys.value.has('key-2')).toBe(true)
    })
  })

  describe('getKeyStatus and getKeyStatusLabel', () => {
    it('returns correct status for enabled key', () => {
      const { getKeyStatus } = useKMS()

      const key: { keyMetadata?: KMSKey } = {
        keyMetadata: {
          KeyId: 'key-1',
          Arn: 'arn:test',
          KeyUsage: 'ENCRYPT_DECRYPT',
          KeyState: 'Enabled',
          CreationDate: 1234567890,
          Origin: 'AWS_KMS',
          KeyManager: 'CUSTOMER',
        },
      }

      expect(getKeyStatus(key as any)).toBe('enabled')
    })

    it('returns correct status for disabled key', () => {
      const { getKeyStatus } = useKMS()

      const key: { keyMetadata?: KMSKey } = {
        keyMetadata: {
          KeyId: 'key-1',
          Arn: 'arn:test',
          KeyUsage: 'ENCRYPT_DECRYPT',
          KeyState: 'Disabled',
          CreationDate: 1234567890,
          Origin: 'AWS_KMS',
          KeyManager: 'CUSTOMER',
        },
      }

      expect(getKeyStatus(key as any)).toBe('disabled')
    })

    it('returns correct status for pending deletion key', () => {
      const { getKeyStatus } = useKMS()

      const key: { keyMetadata?: KMSKey } = {
        keyMetadata: {
          KeyId: 'key-1',
          Arn: 'arn:test',
          KeyUsage: 'ENCRYPT_DECRYPT',
          KeyState: 'PendingDeletion',
          CreationDate: 1234567890,
          Origin: 'AWS_KMS',
          KeyManager: 'CUSTOMER',
        },
      }

      expect(getKeyStatus(key as any)).toBe('pending')
    })

    it('returns unknown for key without metadata', () => {
      const { getKeyStatus } = useKMS()

      const key: { keyMetadata?: KMSKey } = {}

      expect(getKeyStatus(key as any)).toBe('unknown')
    })

    it('returns correct label for status', () => {
      const { getKeyStatusLabel } = useKMS()

      expect(getKeyStatusLabel('Enabled')).toBe('Enabled')
      expect(getKeyStatusLabel('Disabled')).toBe('Disabled')
      expect(getKeyStatusLabel('PendingDeletion')).toBe('Pending Deletion')
      expect(getKeyStatusLabel('PendingReplicaDeletion')).toBe('Pending Replica Deletion')
      expect(getKeyStatusLabel('Unknown')).toBe('Unknown')
    })
  })

  describe('viewKeyDetails and viewKeyPolicy', () => {
    it('sets selected key and shows details modal', async () => {
      vi.mocked(kmsApi.describeKey).mockResolvedValue({
        KeyMetadata: { KeyState: 'Enabled' },
      })

      const { viewKeyDetails, selectedKey, showDetailsModal } = useKMS()

      const key = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }

      viewKeyDetails(key as any)

      expect(selectedKey.value).toEqual(key)
      expect(showDetailsModal.value).toBe(true)
    })

    it('sets selected key and shows policy modal', async () => {
      vi.mocked(kmsApi.getKeyPolicy).mockResolvedValue({ Policy: 'policy' })

      const { viewKeyPolicy, selectedKey, showPolicyModal } = useKMS()

      const key = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }

      viewKeyPolicy(key as any)

      expect(selectedKey.value).toEqual(key)
      expect(showPolicyModal.value).toBe(true)
    })
  })

  describe('selectKeyForAction', () => {
    it('selects key for encrypt action', () => {
      const { selectKeyForAction, selectedKey, showEncryptModal, showDecryptModal, showDeleteModal } = useKMS()

      const key = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }

      selectKeyForAction(key as any, 'encrypt')

      expect(selectedKey.value).toEqual(key)
      expect(showEncryptModal.value).toBe(true)
      expect(showDecryptModal.value).toBe(false)
      expect(showDeleteModal.value).toBe(false)
    })

    it('selects key for decrypt action', () => {
      const { selectKeyForAction, selectedKey, showEncryptModal, showDecryptModal } = useKMS()

      const key = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }

      selectKeyForAction(key as any, 'decrypt')

      expect(selectedKey.value).toEqual(key)
      expect(showDecryptModal.value).toBe(true)
      expect(showEncryptModal.value).toBe(false)
    })

    it('selects key for delete action', () => {
      const { selectKeyForAction, selectedKey, showDeleteModal } = useKMS()

      const key = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }

      selectKeyForAction(key as any, 'delete')

      expect(selectedKey.value).toEqual(key)
      expect(showDeleteModal.value).toBe(true)
    })
  })

  describe('loadKeyDetails', () => {
    it('loads key details when key is selected', async () => {
      vi.mocked(kmsApi.describeKey).mockResolvedValue({
        KeyMetadata: { KeyState: 'Enabled', KeyId: 'key-1' },
      })

      const { loadKeyDetails, selectedKey } = useKMS()
      selectedKey.value = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }

      await loadKeyDetails()

      expect(kmsApi.describeKey).toHaveBeenCalledWith('key-1')
      expect(selectedKey.value.keyMetadata).toEqual({ KeyState: 'Enabled', KeyId: 'key-1' })
    })

    it('does nothing if no key is selected', async () => {
      const { loadKeyDetails, selectedKey } = useKMS()
      selectedKey.value = null

      await loadKeyDetails()

      expect(kmsApi.describeKey).not.toHaveBeenCalled()
    })
  })

  describe('loadKeyPolicy', () => {
    it('loads key policy when key is selected', async () => {
      vi.mocked(kmsApi.getKeyPolicy).mockResolvedValue({
        Policy: '{"Version": "2012-10-17"}',
      })

      const { loadKeyPolicy, selectedKey, keyPolicy } = useKMS()
      selectedKey.value = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }

      await loadKeyPolicy()

      expect(kmsApi.getKeyPolicy).toHaveBeenCalledWith('key-1', 'default')
      expect(keyPolicy.value).toBe('{"Version": "2012-10-17"}')
    })

    it('handles empty policy', async () => {
      vi.mocked(kmsApi.getKeyPolicy).mockResolvedValue({
        Policy: '',
      })

      const { loadKeyPolicy, selectedKey, keyPolicy } = useKMS()
      selectedKey.value = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }

      await loadKeyPolicy()

      expect(keyPolicy.value).toBe('')
    })

    it('does nothing if no key is selected', async () => {
      const { loadKeyPolicy, selectedKey } = useKMS()
      selectedKey.value = null

      await loadKeyPolicy()

      expect(kmsApi.getKeyPolicy).not.toHaveBeenCalled()
    })
  })

  describe('keyCount', () => {
    it('returns correct count of keys', () => {
      const { keys, keyCount } = useKMS()

      expect(keyCount.value).toBe(0)

      keys.value = [
        { KeyId: 'key-1', KeyArn: 'arn:test' },
        { KeyId: 'key-2', KeyArn: 'arn:test' },
      ]

      expect(keyCount.value).toBe(2)
    })
  })

  describe('copyToClipboard', () => {
    it('calls navigator.clipboard.writeText with correct text', async () => {
      const { copyToClipboard } = useKMS()
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      
      // Mock clipboard API
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      })

      await copyToClipboard('test text')

      expect(mockWriteText).toHaveBeenCalledWith('test text')
    })

    it('shows success notification when copy succeeds', async () => {
      const { copyToClipboard } = useKMS()
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      })

      await copyToClipboard('test text')

      expect(mockNotifySuccess).toHaveBeenCalledWith('Copied', 'Copied to clipboard')
    })

    it('shows error notification when copy fails', async () => {
      const { copyToClipboard } = useKMS()
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard error'))
      
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      })

      await copyToClipboard('test text')

      expect(mockNotifyError).toHaveBeenCalledWith('Failed to copy', 'Could not copy to clipboard')
    })
  })

  describe('setupReloadWatcher', () => {
    it('returns the reloadTrigger ref', () => {
      const { setupReloadWatcher } = useKMS()
      const result = setupReloadWatcher()
      
      // setupReloadWatcher should return the reloadTrigger from useContentReload
      expect(result).toBeDefined()
    })
  })
})
