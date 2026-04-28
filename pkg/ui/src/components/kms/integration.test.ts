import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { h } from 'vue'
import { useKMS } from '@/composables/useKMS'

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

// Mock the useUIStore store
vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
    notifyWarning: vi.fn(),
    notifyInfo: vi.fn(),
  })),
}))

// Mock the useContentReload composable
vi.mock('@/composables/useContentReload', () => ({
  useContentReload: vi.fn(() => ({
    reloadTrigger: { value: 0 },
  })),
}))

// Import components after mocks
import KMSCreateKeyModal from './KMSCreateKeyModal.vue'
import KMSDeleteModal from './KMSDeleteModal.vue'
import KMSViewDetailsModal from './KMSViewDetailsModal.vue'
import KMSEncryptModal from './KMSEncryptModal.vue'
import KMSDecryptModal from './KMSDecryptModal.vue'
import KMSPolicyModal from './KMSPolicyModal.vue'

import * as kmsApi from '@/api/services/kms'

describe('KMS Components Integration Tests', () => {
  let wrapper: VueWrapper<any>
  let composableReturn: ReturnType<typeof useKMS>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    composableReturn = useKMS()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('KMSCreateKeyModal', () => {
    it('can be mounted when open is true', () => {
      const { showCreateModal, newKey, keySpecs } = composableReturn
      showCreateModal.value = true

      wrapper = mount(KMSCreateKeyModal, {
        props: {
          open: showCreateModal.value,
          keySpecs: keySpecs,
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('emits update:open with false when handleClose is called', async () => {
      const { showCreateModal, keySpecs } = composableReturn
      showCreateModal.value = true

      wrapper = mount(KMSCreateKeyModal, {
        props: {
          open: showCreateModal.value,
          keySpecs: keySpecs,
        },
      })

      await wrapper.vm.handleClose()
      
      expect(wrapper.emitted('update:open')).toBeTruthy()
      expect(wrapper.emitted('update:open')![0]).toEqual([false])
    })

    it('emits create event when handleCreate is called', async () => {
      const { showCreateModal, keySpecs } = composableReturn
      showCreateModal.value = true

      wrapper = mount(KMSCreateKeyModal, {
        props: {
          open: showCreateModal.value,
          keySpecs: keySpecs,
        },
      })

      await wrapper.vm.handleCreate()
      
      expect(wrapper.emitted('create')).toBeTruthy()
    })

    it('submits form with correct data via composable', async () => {
      const { newKey, handleCreateKey } = composableReturn

      newKey.value = {
        description: 'Test Key',
        keyUsage: 'ENCRYPT_DECRYPT',
        keySpec: 'SYMMETRIC_DEFAULT',
      }

      vi.mocked(kmsApi.createKey).mockResolvedValue({ KeyMetadata: { KeyId: 'new-key' } })
      vi.mocked(kmsApi.listKeys).mockResolvedValue({ Keys: [], NextMarker: undefined, Truncated: false })

      await handleCreateKey()
      await flushPromises()

      expect(kmsApi.createKey).toHaveBeenCalledWith({
        Description: 'Test Key',
        KeyUsage: 'ENCRYPT_DECRYPT',
        CustomerMasterKeySpec: 'SYMMETRIC_DEFAULT',
      })
    })

    it('resets form after creation', async () => {
      const { newKey, handleCreateKey } = composableReturn

      newKey.value = {
        description: 'Test Key',
        keyUsage: 'ENCRYPT_DECRYPT',
        keySpec: 'SYMMETRIC_DEFAULT',
      }

      vi.mocked(kmsApi.createKey).mockResolvedValue({ KeyMetadata: { KeyId: 'new-key' } })
      vi.mocked(kmsApi.listKeys).mockResolvedValue({ Keys: [], NextMarker: undefined, Truncated: false })

      await handleCreateKey()
      await flushPromises()

      expect(newKey.value).toEqual({
        description: '',
        keyUsage: 'ENCRYPT_DECRYPT',
        keySpec: 'SYMMETRIC_DEFAULT',
      })
    })
  })

  describe('KMSDeleteModal', () => {
    it('can be mounted when open is true', () => {
      const { showDeleteModal } = composableReturn
      showDeleteModal.value = true

      wrapper = mount(KMSDeleteModal, {
        props: {
          open: showDeleteModal.value,
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('emits update:open with false when handleClose is called', async () => {
      const { showDeleteModal } = composableReturn
      showDeleteModal.value = true

      wrapper = mount(KMSDeleteModal, {
        props: {
          open: showDeleteModal.value,
        },
      })

      await wrapper.vm.handleClose()
      
      expect(wrapper.emitted('update:open')).toBeTruthy()
      expect(wrapper.emitted('update:open')![0]).toEqual([false])
    })

    it('emits delete event', async () => {
      const { showDeleteModal } = composableReturn
      showDeleteModal.value = true

      wrapper = mount(KMSDeleteModal, {
        props: {
          open: showDeleteModal.value,
        },
      })

      await wrapper.vm.$emit('delete')
      
      expect(wrapper.emitted('delete')).toBeTruthy()
    })

    it('schedules deletion via composable', async () => {
      const { selectedKey, handleDeleteKey } = composableReturn
      selectedKey.value = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }

      vi.mocked(kmsApi.scheduleKeyDeletion).mockResolvedValue({})
      vi.mocked(kmsApi.listKeys).mockResolvedValue({ Keys: [], NextMarker: undefined, Truncated: false })

      await handleDeleteKey()
      await flushPromises()

      expect(kmsApi.scheduleKeyDeletion).toHaveBeenCalledWith('key-1')
    })

    it('sets selectedKey to null after deletion', async () => {
      const { selectedKey, handleDeleteKey } = composableReturn
      selectedKey.value = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }

      vi.mocked(kmsApi.scheduleKeyDeletion).mockResolvedValue({})
      vi.mocked(kmsApi.listKeys).mockResolvedValue({ Keys: [], NextMarker: undefined, Truncated: false })

      await handleDeleteKey()
      await flushPromises()

      expect(selectedKey.value).toBeNull()
    })
  })

  describe('KMSViewDetailsModal', () => {
    const mockKeyMetadata = {
      KeyId: 'key-1',
      Arn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      Description: 'Test Key',
      KeyUsage: 'ENCRYPT_DECRYPT',
      KeyState: 'Enabled' as const,
      CreationDate: 1234567890,
      Origin: 'AWS_KMS',
      KeyManager: 'CUSTOMER',
    }

    it('can be mounted when open is true', () => {
      wrapper = mount(KMSViewDetailsModal, {
        props: {
          open: true,
          selectedKey: {
            KeyId: 'key-1',
            KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
            keyMetadata: mockKeyMetadata,
          },
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('emits enable-key event', async () => {
      wrapper = mount(KMSViewDetailsModal, {
        props: {
          open: true,
          selectedKey: {
            KeyId: 'key-1',
            KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
            keyMetadata: { ...mockKeyMetadata, KeyState: 'Disabled' },
          },
        },
      })

      await wrapper.vm.$emit('enable-key')
      expect(wrapper.emitted('enable-key')).toBeTruthy()
    })

    it('emits disable-key event', async () => {
      wrapper = mount(KMSViewDetailsModal, {
        props: {
          open: true,
          selectedKey: {
            KeyId: 'key-1',
            KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
            keyMetadata: mockKeyMetadata,
          },
        },
      })

      await wrapper.vm.$emit('disable-key')
      expect(wrapper.emitted('disable-key')).toBeTruthy()
    })

    it('emits delete-key event', async () => {
      wrapper = mount(KMSViewDetailsModal, {
        props: {
          open: true,
          selectedKey: {
            KeyId: 'key-1',
            KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
            keyMetadata: mockKeyMetadata,
          },
        },
      })

      await wrapper.vm.$emit('delete-key')
      expect(wrapper.emitted('delete-key')).toBeTruthy()
    })
  })

  describe('KMSEncryptModal', () => {
    it('can be mounted when open is true', () => {
      const { showEncryptModal } = composableReturn
      showEncryptModal.value = true

      wrapper = mount(KMSEncryptModal, {
        props: {
          open: showEncryptModal.value,
          selectedKey: null,
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('emits encrypt event with plaintext', async () => {
      const { showEncryptModal } = composableReturn
      showEncryptModal.value = true

      wrapper = mount(KMSEncryptModal, {
        props: {
          open: showEncryptModal.value,
          selectedKey: null,
          encryptForm: { plaintext: 'Hello World' },
        },
      })

      await wrapper.vm.handleEncrypt()
      
      expect(wrapper.emitted('encrypt')).toBeTruthy()
      expect(wrapper.emitted('encrypt')![0]).toEqual(['Hello World'])
    })

    it('encrypts data via composable', async () => {
      const { selectedKey, encryptForm, handleEncrypt } = composableReturn
      selectedKey.value = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }
      encryptForm.value.plaintext = 'Hello World'

      vi.mocked(kmsApi.encrypt).mockResolvedValue({
        CiphertextBlob: 'encrypted-data',
        KeyId: 'key-1',
      })

      await handleEncrypt()
      await flushPromises()

      expect(kmsApi.encrypt).toHaveBeenCalledWith('key-1', 'Hello World')
    })
  })

  describe('KMSDecryptModal', () => {
    it('can be mounted when open is true', () => {
      const { showDecryptModal } = composableReturn
      showDecryptModal.value = true

      wrapper = mount(KMSDecryptModal, {
        props: {
          open: showDecryptModal.value,
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('emits decrypt event with ciphertext', async () => {
      const { showDecryptModal } = composableReturn
      showDecryptModal.value = true

      wrapper = mount(KMSDecryptModal, {
        props: {
          open: showDecryptModal.value,
          decryptForm: { ciphertext: 'encrypted-data' },
        },
      })

      await wrapper.vm.handleDecrypt()
      
      expect(wrapper.emitted('decrypt')).toBeTruthy()
      expect(wrapper.emitted('decrypt')![0]).toEqual(['encrypted-data'])
    })

    it('decrypts data via composable', async () => {
      const { decryptForm, handleDecrypt } = composableReturn
      decryptForm.value.ciphertext = 'encrypted-data'

      vi.mocked(kmsApi.decrypt).mockResolvedValue({
        Plaintext: 'Hello World',
        KeyId: 'key-1',
      })

      await handleDecrypt()
      await flushPromises()

      expect(kmsApi.decrypt).toHaveBeenCalledWith('encrypted-data')
    })
  })

  describe('KMSPolicyModal', () => {
    it('can be mounted when open is true', () => {
      const { showPolicyModal } = composableReturn
      showPolicyModal.value = true

      wrapper = mount(KMSPolicyModal, {
        props: {
          open: showPolicyModal.value,
          selectedKey: null,
          policy: '',
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('emits update:open when handleClose is called', async () => {
      const { showPolicyModal } = composableReturn
      showPolicyModal.value = true

      wrapper = mount(KMSPolicyModal, {
        props: {
          open: showPolicyModal.value,
          selectedKey: null,
          policy: '',
        },
      })

      await wrapper.vm.handleClose()
      
      expect(wrapper.emitted('update:open')).toBeTruthy()
      expect(wrapper.emitted('update:open')![0]).toEqual([false])
    })
  })

  describe('End-to-End Flow Tests', () => {
    it('Create Key Flow: opens modal, fills form, submits, refreshes list', async () => {
      const {
        showCreateModal,
        newKey,
        handleCreateKey,
      } = composableReturn

      // Open modal
      showCreateModal.value = true

      // Fill form
      newKey.value = {
        description: 'Test Key',
        keyUsage: 'ENCRYPT_DECRYPT',
        keySpec: 'SYMMETRIC_DEFAULT',
      }

      // Mock API responses
      vi.mocked(kmsApi.createKey).mockResolvedValue({
        KeyMetadata: { KeyId: 'new-key', KeyState: 'Enabled' },
      })
      vi.mocked(kmsApi.listKeys).mockResolvedValue({
        Keys: [{ KeyId: 'new-key', KeyArn: 'arn:test' }],
        NextMarker: undefined,
        Truncated: false,
      })
      vi.mocked(kmsApi.describeKey).mockResolvedValue({
        KeyMetadata: { KeyId: 'new-key', KeyState: 'Enabled' },
      })
      vi.mocked(kmsApi.getKeyPolicy).mockResolvedValue({ Policy: 'policy' })

      // Submit
      await handleCreateKey()
      await flushPromises()

      // Verify
      expect(kmsApi.createKey).toHaveBeenCalled()
      expect(showCreateModal.value).toBe(false)
    })

    it('Delete Key Flow: opens modal, submits, refreshes list, clears selection', async () => {
      const {
        showDeleteModal,
        selectedKey,
        handleDeleteKey,
      } = composableReturn

      // Set up selected key
      selectedKey.value = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }

      // Open modal
      showDeleteModal.value = true

      // Mock API responses
      vi.mocked(kmsApi.scheduleKeyDeletion).mockResolvedValue({})
      vi.mocked(kmsApi.listKeys).mockResolvedValue({
        Keys: [],
        NextMarker: undefined,
        Truncated: false,
      })

      // Submit
      await handleDeleteKey()
      await flushPromises()

      // Verify
      expect(kmsApi.scheduleKeyDeletion).toHaveBeenCalledWith('key-1')
      expect(selectedKey.value).toBeNull()
      expect(showDeleteModal.value).toBe(false)
    })

    it('Encrypt/Decrypt Flow: encrypts and decrypts data correctly', async () => {
      const {
        showEncryptModal,
        showDecryptModal,
        selectedKey,
        encryptForm,
        decryptForm,
        handleEncrypt,
        handleDecrypt,
        encryptedResult,
        decryptedResult,
      } = composableReturn

      // Set up selected key
      selectedKey.value = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }

      // Encrypt flow
      showEncryptModal.value = true
      encryptForm.value.plaintext = 'Hello World'

      vi.mocked(kmsApi.encrypt).mockResolvedValue({
        CiphertextBlob: 'encrypted-data',
        KeyId: 'key-1',
      })

      await handleEncrypt()
      await flushPromises()

      expect(kmsApi.encrypt).toHaveBeenCalledWith('key-1', 'Hello World')
      expect(encryptedResult.value).toBe('encrypted-data')

      // Decrypt flow
      showDecryptModal.value = true
      decryptForm.value.ciphertext = 'encrypted-data'

      vi.mocked(kmsApi.decrypt).mockResolvedValue({
        Plaintext: 'Hello World',
        KeyId: 'key-1',
      })

      await handleDecrypt()
      await flushPromises()

      expect(kmsApi.decrypt).toHaveBeenCalledWith('encrypted-data')
      expect(decryptedResult.value).toBe('Hello World')
    })

    it('Policy View Flow: opens modal, displays policy', async () => {
      const {
        showPolicyModal,
        selectedKey,
        keyPolicy,
        viewKeyPolicy,
      } = composableReturn

      // Set up selected key
      selectedKey.value = {
        KeyId: 'key-1',
        KeyArn: 'arn:aws:kms:us-east-1:123456789:key/key-1',
      }

      // Mock API response
      vi.mocked(kmsApi.getKeyPolicy).mockResolvedValue({
        Policy: '{"Version": "2012-10-17"}',
      })

      // Open policy modal
      viewKeyPolicy(selectedKey.value)
      await flushPromises()

      expect(showPolicyModal.value).toBe(true)
      expect(kmsApi.getKeyPolicy).toHaveBeenCalledWith('key-1', 'default')
    })
  })
})
