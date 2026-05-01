import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSecretsManager } from './useSecretsManager'

// Mock the secrets-manager API module
vi.mock('@/api/services/secrets-manager', () => ({
  listSecrets: vi.fn(),
  createSecret: vi.fn(),
  getSecretValue: vi.fn(),
  putSecretValue: vi.fn(),
  deleteSecret: vi.fn(),
}))

// Create shared mock functions for UI store
const mockNotifySuccess = vi.fn()
const mockNotifyError = vi.fn()

// Mock the useUIStore store
vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: mockNotifySuccess,
    notifyError: mockNotifyError,
  })),
}))

// Mock the useContentReload composable
vi.mock('@/composables/useContentReload', () => ({
  useContentReload: vi.fn(() => ({
    reloadTrigger: { value: 0 },
  })),
}))

import * as secretsManagerApi from '@/api/services/secrets-manager'

describe('useSecretsManager', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('initializes with empty state', () => {
      const {
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
      } = useSecretsManager()

      expect(loading.value).toBe(false)
      expect(secrets.value).toEqual([])
      expect(error.value).toBeNull()
      expect(showCreateModal.value).toBe(false)
      expect(newSecretName.value).toBe('')
      expect(newSecretValue.value).toBe('')
      expect(newSecretDescription.value).toBe('')
      expect(creating.value).toBe(false)
      expect(showViewModal.value).toBe(false)
      expect(selectedSecret.value).toBeNull()
      expect(secretValue.value).toBe('')
      expect(secretLoading.value).toBe(false)
      expect(secretError.value).toBeNull()
      expect(isEditing.value).toBe(false)
      expect(editSecretValue.value).toBe('')
      expect(showDeleteModal.value).toBe(false)
      expect(secretToDelete.value).toBe('')
      expect(expandedSecret.value).toBeNull()
      expect(secretDetailsMap.value).toEqual({})
    })
  })

  describe('loadSecrets', () => {
    it('loads secrets successfully', async () => {
      const mockSecrets = [
        { Name: 'secret-1', CreatedDate: '2024-01-01' },
        { Name: 'secret-2', CreatedDate: '2024-01-02' },
      ]

      vi.mocked(secretsManagerApi.listSecrets).mockResolvedValue({
        SecretList: mockSecrets,
      })

      const { loadSecrets, secrets, loading } = useSecretsManager()

      await loadSecrets()

      expect(secretsManagerApi.listSecrets).toHaveBeenCalled()
      expect(secrets.value).toHaveLength(2)
      expect(secrets.value[0].Name).toBe('secret-1')
      expect(loading.value).toBe(false)
    })

    it('handles empty secrets response', async () => {
      vi.mocked(secretsManagerApi.listSecrets).mockResolvedValue({
        SecretList: null,
      })

      const { loadSecrets, secrets } = useSecretsManager()

      await loadSecrets()

      expect(secrets.value).toEqual([])
    })

    it('handles error when loading secrets fails', async () => {
      vi.mocked(secretsManagerApi.listSecrets).mockRejectedValue(new Error('Network error'))

      const { loadSecrets, loading } = useSecretsManager()

      await loadSecrets()

      expect(loading.value).toBe(false)
      expect(mockNotifyError).toHaveBeenCalledWith('Error', 'Failed to load secrets')
    })
  })

  describe('createSecret', () => {
    it('creates secret successfully', async () => {
      vi.mocked(secretsManagerApi.createSecret).mockResolvedValue({})
      vi.mocked(secretsManagerApi.listSecrets).mockResolvedValue({ SecretList: [] })

      const {
        createSecret,
        newSecretName,
        newSecretValue,
        newSecretDescription,
        showCreateModal,
        creating,
      } = useSecretsManager()

      newSecretName.value = 'new-secret'
      newSecretValue.value = 'secret-value'
      newSecretDescription.value = 'Test secret'

      await createSecret()

      expect(secretsManagerApi.createSecret).toHaveBeenCalledWith({
        Name: 'new-secret',
        SecretString: 'secret-value',
        Description: 'Test secret',
      })
      expect(showCreateModal.value).toBe(false)
      expect(newSecretName.value).toBe('')
      expect(newSecretValue.value).toBe('')
      expect(newSecretDescription.value).toBe('')
    })

    it('does nothing if name or value is empty', async () => {
      const { createSecret, newSecretName, newSecretValue } = useSecretsManager()

      newSecretName.value = ''
      newSecretValue.value = ''

      await createSecret()

      expect(secretsManagerApi.createSecret).not.toHaveBeenCalled()
    })

    it('handles error when create fails', async () => {
      vi.mocked(secretsManagerApi.createSecret).mockRejectedValue(new Error('Create failed'))

      const { createSecret, newSecretName, newSecretValue } = useSecretsManager()

      newSecretName.value = 'bad-secret'
      newSecretValue.value = 'value'

      await createSecret()

      expect(mockNotifyError).toHaveBeenCalled()
    })
  })

  describe('viewSecret', () => {
    it('gets secret value and opens modal', async () => {
      const secret = { Name: 'test-secret', CreatedDate: '2024-01-01' }

      vi.mocked(secretsManagerApi.getSecretValue).mockResolvedValue({
        SecretString: 'test-value',
      })

      const { viewSecret, selectedSecret, showViewModal, secretValue, secretLoading } = useSecretsManager()

      await viewSecret(secret)

      expect(selectedSecret.value).toEqual(secret)
      expect(showViewModal.value).toBe(true)
      expect(secretValue.value).toBe('test-value')
      expect(secretLoading.value).toBe(false)
    })

    it('handles error when getting secret value fails', async () => {
      const secret = { Name: 'bad-secret' }

      vi.mocked(secretsManagerApi.getSecretValue).mockRejectedValue(new Error('Not found'))

      const { viewSecret, showViewModal, secretError } = useSecretsManager()

      await viewSecret(secret)

      expect(showViewModal.value).toBe(true)
      expect(secretError.value).toContain('Failed to get secret value')
    })
  })

  describe('saveSecretValue', () => {
    it('saves secret value successfully', async () => {
      vi.mocked(secretsManagerApi.putSecretValue).mockResolvedValue({})
      vi.mocked(secretsManagerApi.listSecrets).mockResolvedValue({ SecretList: [] })

      const {
        saveSecretValue,
        selectedSecret,
        secretValue,
        editSecretValue,
        isEditing,
        showViewModal,
        secretDetailsMap,
      } = useSecretsManager()

      selectedSecret.value = { Name: 'test-secret' }
      secretValue.value = 'old-value'
      editSecretValue.value = 'new-value'
      secretDetailsMap.value = { 'test-secret': { secret: 'old-value' } }

      await saveSecretValue()

      expect(secretsManagerApi.putSecretValue).toHaveBeenCalledWith({
        SecretId: 'test-secret',
        SecretString: 'new-value',
      })
      expect(secretValue.value).toBe('new-value')
      expect(isEditing.value).toBe(false)
      expect(showViewModal.value).toBe(false)
    })

    it('does nothing if no secret selected', async () => {
      const { saveSecretValue } = useSecretsManager()

      await saveSecretValue()

      expect(secretsManagerApi.putSecretValue).not.toHaveBeenCalled()
    })

    it('handles error when save fails', async () => {
      vi.mocked(secretsManagerApi.putSecretValue).mockRejectedValue(new Error('Update failed'))

      const { saveSecretValue, selectedSecret } = useSecretsManager()

      selectedSecret.value = { Name: 'test-secret' }

      await saveSecretValue()

      expect(mockNotifyError).toHaveBeenCalled()
    })
  })

  describe('deleteSecret', () => {
    it('deletes secret successfully', async () => {
      vi.mocked(secretsManagerApi.deleteSecret).mockResolvedValue({})
      vi.mocked(secretsManagerApi.listSecrets).mockResolvedValue({ SecretList: [] })

      const { confirmDeleteSecret, secretToDelete, showDeleteModal, loading } = useSecretsManager()

      secretToDelete.value = 'del-secret'

      await confirmDeleteSecret()

      expect(secretsManagerApi.deleteSecret).toHaveBeenCalledWith('del-secret')
      expect(showDeleteModal.value).toBe(false)
      expect(secretToDelete.value).toBe('')
    })

    it('does nothing if no secret to delete', async () => {
      const { confirmDeleteSecret } = useSecretsManager()

      await confirmDeleteSecret()

      expect(secretsManagerApi.deleteSecret).not.toHaveBeenCalled()
    })

    it('handles error when delete fails', async () => {
      vi.mocked(secretsManagerApi.deleteSecret).mockRejectedValue(new Error('Delete failed'))

      const { confirmDeleteSecret, secretToDelete } = useSecretsManager()

      secretToDelete.value = 'bad-secret'

      await confirmDeleteSecret()

      expect(mockNotifyError).toHaveBeenCalled()
    })
  })

  describe('openDeleteModal', () => {
    it('opens delete modal with secret name', () => {
      const { openDeleteModal, showDeleteModal, secretToDelete } = useSecretsManager()

      openDeleteModal('to-delete')

      expect(showDeleteModal.value).toBe(true)
      expect(secretToDelete.value).toBe('to-delete')
    })
  })

  describe('toggleEdit', () => {
    it('toggles edit mode on', () => {
      const { toggleEdit, isEditing, secretValue, editSecretValue } = useSecretsManager()

      secretValue.value = 'test-value'
      editSecretValue.value = 'test-value'

      toggleEdit()

      expect(isEditing.value).toBe(true)
    })

    it('toggles edit mode off and restores original value', () => {
      const { toggleEdit, isEditing, secretValue, editSecretValue } = useSecretsManager()

      secretValue.value = 'original-value'
      editSecretValue.value = 'modified-value'
      isEditing.value = true

      toggleEdit()

      expect(isEditing.value).toBe(false)
      expect(editSecretValue.value).toBe('original-value')
    })
  })

  describe('closeViewModal', () => {
    it('closes modal and resets state', () => {
      const {
        closeViewModal,
        showViewModal,
        selectedSecret,
        secretValue,
        editSecretValue,
        isEditing,
      } = useSecretsManager()

      showViewModal.value = true
      selectedSecret.value = { Name: 'test' }
      secretValue.value = 'value'
      editSecretValue.value = 'value'
      isEditing.value = true

      closeViewModal()

      expect(showViewModal.value).toBe(false)
      expect(selectedSecret.value).toBeNull()
      expect(secretValue.value).toBe('')
      expect(editSecretValue.value).toBe('')
      expect(isEditing.value).toBe(false)
    })
  })

  describe('toggleSecretExpansion', () => {
    it('expands secret when collapsed', () => {
      const { toggleSecretExpansion, expandedSecret } = useSecretsManager()

      toggleSecretExpansion('secret-1')

      expect(expandedSecret.value).toBe('secret-1')
    })

    it('collapses secret when expanded', () => {
      const { toggleSecretExpansion, expandedSecret } = useSecretsManager()

      expandedSecret.value = 'secret-1'

      toggleSecretExpansion('secret-1')

      expect(expandedSecret.value).toBeNull()
    })

    it('switches expansion exclusively', () => {
      const { toggleSecretExpansion, expandedSecret } = useSecretsManager()

      expandedSecret.value = 'secret-1'

      toggleSecretExpansion('secret-2')

      expect(expandedSecret.value).toBe('secret-2')
    })
  })

  describe('formatDate', () => {
    it('formats date string correctly', () => {
      const { formatDate } = useSecretsManager()

      const result = formatDate('2024-01-15T10:30:00Z')
      expect(result).toContain('2024')
    })

    it('returns Unknown for empty date', () => {
      const { formatDate } = useSecretsManager()

      expect(formatDate('')).toBe('Unknown')
      expect(formatDate(undefined as any)).toBe('Unknown')
    })
  })

  describe('formatSecretPreview', () => {
    it('formats JSON correctly', () => {
      const { formatSecretPreview } = useSecretsManager()

      const json = '{"key": "value"}'
      const result = formatSecretPreview(json)
      expect(result).toContain('key')
    })

    it('truncates long plain text', () => {
      const { formatSecretPreview } = useSecretsManager()

      const longText = 'a'.repeat(200)
      const result = formatSecretPreview(longText)
      expect(result).toContain('...')
    })
  })

  describe('isJson', () => {
    it('returns true for valid JSON', () => {
      const { isJson } = useSecretsManager()

      expect(isJson('{"key": "value"}')).toBe(true)
      expect(isJson('[1,2,3]')).toBe(true)
    })

    it('returns false for invalid JSON', () => {
      const { isJson } = useSecretsManager()

      expect(isJson('not json')).toBe(false)
      expect(isJson('')).toBe(false)
    })
  })
})
