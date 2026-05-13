import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSSM } from './useSSM'

// Mock the SSM API module
vi.mock('@/api/services/ssm', () => ({
  describeParameters: vi.fn(),
  getParameter: vi.fn(),
  getParameterHistory: vi.fn(),
  putParameter: vi.fn(),
  deleteParameter: vi.fn(),
}))

// Create shared mock functions for toast
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
const mockToastWarning = vi.fn()

// Mock the useToast composable
vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(() => ({
    success: mockToastSuccess,
    error: mockToastError,
    warning: mockToastWarning,
  })),
}))

// Mock the useContentReload composable
vi.mock('@/composables/useContentReload', () => ({
  useContentReload: vi.fn(() => ({
    reloadTrigger: { value: 0 },
  })),
}))

import * as ssmApi from '@/api/services/ssm'

describe('useSSM', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('initializes with empty state', () => {
      const {
        loading,
        parameters,
        selectedParameter,
        parameterHistory,
        historyLoading,
        showCreateModal,
        showValueModal,
        showHistoryModal,
        showDeleteModal,
        newParamName,
        newParamValue,
        newParamType,
        newParamDescription,
        getWithDecryption,
        parameterToDelete,
      } = useSSM()

      expect(loading.value).toBe(false)
      expect(parameters.value).toEqual([])
      expect(selectedParameter.value).toBeNull()
      expect(parameterHistory.value).toEqual([])
      expect(historyLoading.value).toBe(false)
      expect(showCreateModal.value).toBe(false)
      expect(showValueModal.value).toBe(false)
      expect(showHistoryModal.value).toBe(false)
      expect(showDeleteModal.value).toBe(false)
      expect(newParamName.value).toBe('')
      expect(newParamValue.value).toBe('')
      expect(newParamType.value).toBe('String')
      expect(newParamDescription.value).toBe('')
      expect(getWithDecryption.value).toBe(false)
      expect(parameterToDelete.value).toBeNull()
    })
  })

  describe('loadParameters', () => {
    it('loads parameters successfully', async () => {
      const mockParams = [
        { Name: 'param-1', Type: 'String', Version: 1 },
        { Name: 'param-2', Type: 'SecureString', Version: 2 },
      ]

      vi.mocked(ssmApi.describeParameters).mockResolvedValue({
        Parameters: mockParams,
      })

      const { loadParameters, parameters, loading } = useSSM()

      await loadParameters()

      expect(ssmApi.describeParameters).toHaveBeenCalled()
      expect(parameters.value).toHaveLength(2)
      expect(parameters.value[0].Name).toBe('param-1')
      expect(loading.value).toBe(false)
    })

    it('handles empty parameters response', async () => {
      vi.mocked(ssmApi.describeParameters).mockResolvedValue({
        Parameters: null,
      })

      const { loadParameters, parameters } = useSSM()

      await loadParameters()

      expect(parameters.value).toEqual([])
    })

    it('handles error when loading parameters fails', async () => {
      vi.mocked(ssmApi.describeParameters).mockRejectedValue(new Error('Network error'))

      const { loadParameters, loading } = useSSM()

      await loadParameters()

      expect(loading.value).toBe(false)
      expect(mockToastError).toHaveBeenCalledWith('Failed to load parameters: Error: Network error')
    })
  })

  describe('selectParameter', () => {
    it('selects parameter', async () => {
      const param = { Name: 'test-param', Type: 'String' as const }

      const { selectParameter, selectedParameter } = useSSM()

      await selectParameter(param)

      expect(selectedParameter.value).toEqual(param)
    })
  })

  describe('getParameterValue', () => {
    it('gets parameter value and opens modal', async () => {
      const param = { Name: 'test-param', Type: 'String' as const }

      vi.mocked(ssmApi.getParameter).mockResolvedValue({
        Parameter: { Value: 'test-value' },
      })

      const { getParameterValue, selectedParameter, showValueModal } = useSSM()

      await getParameterValue(param)

      expect(selectedParameter.value).toEqual(param)
      expect(showValueModal.value).toBe(true)
      expect(ssmApi.getParameter).toHaveBeenCalledWith('test-param', { WithDecryption: true })
    })

    it('updates selected parameter value from response', async () => {
      const param = { Name: 'test-param', Type: 'String' as const }

      vi.mocked(ssmApi.getParameter).mockResolvedValue({
        Parameter: { Value: 'new-value' },
      })

      const { getParameterValue, selectedParameter } = useSSM()

      await getParameterValue(param)

      expect(selectedParameter.value?.Value).toBe('new-value')
    })

    it('handles error when getting parameter value fails', async () => {
      const param = { Name: 'bad-param', Type: 'String' as const }

      vi.mocked(ssmApi.getParameter).mockRejectedValue(new Error('Not found'))

      const { getParameterValue, showValueModal } = useSSM()

      await getParameterValue(param)

      expect(showValueModal.value).toBe(true)
    })
  })

  describe('loadParameterHistory', () => {
    it('loads parameter history successfully', async () => {
      const { loadParameterHistory, selectedParameter, parameterHistory, historyLoading, showHistoryModal } = useSSM()

      selectedParameter.value = { Name: 'test-param', Type: 'String' as const }

      vi.mocked(ssmApi.getParameterHistory).mockResolvedValue({
        Parameters: [
          { Name: 'test-param', Type: 'String', Value: 'v1', Version: 1, LastModifiedDate: '2024-01-01' },
        ],
      })

      await loadParameterHistory()

      expect(ssmApi.getParameterHistory).toHaveBeenCalledWith('test-param', { WithDecryption: true })
      expect(parameterHistory.value).toHaveLength(1)
      expect(showHistoryModal.value).toBe(true)
      expect(historyLoading.value).toBe(false)
    })

    it('does nothing if no parameter selected', async () => {
      const { loadParameterHistory, showHistoryModal } = useSSM()

      await loadParameterHistory()

      expect(showHistoryModal.value).toBe(false)
      expect(ssmApi.getParameterHistory).not.toHaveBeenCalled()
    })

    it('handles error when loading history fails', async () => {
      const { loadParameterHistory, selectedParameter, historyLoading } = useSSM()

      selectedParameter.value = { Name: 'bad-param', Type: 'String' as const }

      vi.mocked(ssmApi.getParameterHistory).mockRejectedValue(new Error('History not found'))

      await loadParameterHistory()

      expect(historyLoading.value).toBe(false)
      expect(mockToastError).toHaveBeenCalled()
    })
  })

  describe('createParameter', () => {
    it('creates parameter successfully', async () => {
      vi.mocked(ssmApi.putParameter).mockResolvedValue({})
      vi.mocked(ssmApi.describeParameters).mockResolvedValue({ Parameters: [] })

      const { createParameter, newParamName, newParamValue, newParamType, newParamDescription, showCreateModal, loading } = useSSM()

      newParamName.value = 'new-param'
      newParamValue.value = 'value123'
      newParamType.value = 'String'
      newParamDescription.value = 'Test param'

      await createParameter()

      expect(ssmApi.putParameter).toHaveBeenCalledWith({
        Name: 'new-param',
        Value: 'value123',
        Type: 'String',
        Description: 'Test param',
      })
      expect(showCreateModal.value).toBe(false)
      expect(newParamName.value).toBe('')
      expect(newParamValue.value).toBe('')
    })

    it('validates name and value required', async () => {
      const { createParameter, newParamName, newParamValue } = useSSM()

      newParamName.value = ''
      newParamValue.value = ''

      await createParameter()

      expect(ssmApi.putParameter).not.toHaveBeenCalled()
      expect(mockToastWarning).toHaveBeenCalledWith('Name and value are required')
    })

    it('handles error when create fails', async () => {
      vi.mocked(ssmApi.putParameter).mockRejectedValue(new Error('Create failed'))

      const { createParameter, newParamName, newParamValue, loading } = useSSM()

      newParamName.value = 'bad-param'
      newParamValue.value = 'value'

      await createParameter()

      expect(mockToastError).toHaveBeenCalled()
    })
  })

  describe('updateParameter', () => {
    it('updates parameter successfully', async () => {
      vi.mocked(ssmApi.putParameter).mockResolvedValue({})
      vi.mocked(ssmApi.describeParameters).mockResolvedValue({ Parameters: [] })
      vi.mocked(ssmApi.getParameter).mockResolvedValue({ Parameter: { Value: 'updated' } })

      const { updateParameter, selectedParameter, newParamValue, loading } = useSSM()

      selectedParameter.value = { Name: 'test-param', Type: 'String' as const, Version: 1 }
      newParamValue.value = 'new-value'

      await updateParameter()

      expect(ssmApi.putParameter).toHaveBeenCalledWith({
        Name: 'test-param',
        Value: 'new-value',
        Type: 'String',
        Overwrite: true,
      })
      expect(newParamValue.value).toBe('')
    })

    it('validates value required', async () => {
      const { updateParameter, selectedParameter, newParamValue } = useSSM()

      selectedParameter.value = { Name: 'test-param', Type: 'String' as const }
      newParamValue.value = ''

      await updateParameter()

      expect(ssmApi.putParameter).not.toHaveBeenCalled()
      expect(mockToastWarning).toHaveBeenCalledWith('Value is required')
    })

    it('does nothing if no parameter selected', async () => {
      const { updateParameter, newParamValue } = useSSM()

      newParamValue.value = 'value'

      await updateParameter()

      expect(ssmApi.putParameter).not.toHaveBeenCalled()
    })

    it('handles error when update fails', async () => {
      vi.mocked(ssmApi.putParameter).mockRejectedValue(new Error('Update failed'))

      const { updateParameter, selectedParameter, newParamValue } = useSSM()

      selectedParameter.value = { Name: 'test-param', Type: 'String' as const }
      newParamValue.value = 'new-value'

      await updateParameter()

      expect(mockToastError).toHaveBeenCalled()
    })
  })

  describe('deleteParameter', () => {
    it('deletes parameter successfully', async () => {
      vi.mocked(ssmApi.deleteParameter).mockResolvedValue({})
      vi.mocked(ssmApi.describeParameters).mockResolvedValue({ Parameters: [] })

      const { deleteParameter, parameterToDelete, showDeleteModal, selectedParameter, loading } = useSSM()

      parameterToDelete.value = { Name: 'del-param', Type: 'String' as const }
      selectedParameter.value = { Name: 'del-param', Type: 'String' as const }

      await deleteParameter()

      expect(ssmApi.deleteParameter).toHaveBeenCalledWith('del-param')
      expect(showDeleteModal.value).toBe(false)
      expect(parameterToDelete.value).toBeNull()
      expect(selectedParameter.value).toBeNull()
    })

    it('clears selection if deleted param was selected', async () => {
      vi.mocked(ssmApi.deleteParameter).mockResolvedValue({})
      vi.mocked(ssmApi.describeParameters).mockResolvedValue({ Parameters: [] })

      const { deleteParameter, parameterToDelete, selectedParameter } = useSSM()

      selectedParameter.value = { Name: 'del-param', Type: 'String' as const }
      parameterToDelete.value = { Name: 'del-param', Type: 'String' as const }

      await deleteParameter()

      expect(selectedParameter.value).toBeNull()
    })

    it('does nothing if no parameter to delete', async () => {
      const { deleteParameter, parameterToDelete } = useSSM()

      parameterToDelete.value = null

      await deleteParameter()

      expect(ssmApi.deleteParameter).not.toHaveBeenCalled()
    })

    it('handles error when delete fails', async () => {
      vi.mocked(ssmApi.deleteParameter).mockRejectedValue(new Error('Delete failed'))

      const { deleteParameter, parameterToDelete, loading } = useSSM()

      parameterToDelete.value = { Name: 'bad-param', Type: 'String' as const }

      await deleteParameter()

      expect(mockToastError).toHaveBeenCalled()
    })
  })

  describe('openDeleteModal', () => {
    it('opens delete modal with parameter', () => {
      const { openDeleteModal, showDeleteModal, parameterToDelete } = useSSM()

      const param = { Name: 'to-delete', Type: 'String' as const }
      openDeleteModal(param)

      expect(showDeleteModal.value).toBe(true)
      expect(parameterToDelete.value).toEqual(param)
    })
  })

  describe('resetForm', () => {
    it('resets form fields', () => {
      const { resetForm, newParamName, newParamValue, newParamType, newParamDescription } = useSSM()

      newParamName.value = 'test'
      newParamValue.value = 'value'
      newParamType.value = 'SecureString'
      newParamDescription.value = 'desc'

      resetForm()

      expect(newParamName.value).toBe('')
      expect(newParamValue.value).toBe('')
      expect(newParamType.value).toBe('String')
      expect(newParamDescription.value).toBe('')
    })
  })

  describe('formatDate', () => {
    it('formats date string correctly', () => {
      const { formatDate } = useSSM()

      const result = formatDate('2024-01-15T10:30:00Z')
      expect(result).toContain('2024')
    })

    it('returns dash for undefined date', () => {
      const { formatDate } = useSSM()

      expect(formatDate(undefined)).toBe('-')
    })
  })

  describe('getParamTypeStatus', () => {
    it('returns active for String type', () => {
      const { getParamTypeStatus } = useSSM()

      expect(getParamTypeStatus('String')).toBe('active')
    })

    it('returns active for StringList type', () => {
      const { getParamTypeStatus } = useSSM()

      expect(getParamTypeStatus('StringList')).toBe('active')
    })

    it('returns warning for SecureString type', () => {
      const { getParamTypeStatus } = useSSM()

      expect(getParamTypeStatus('SecureString')).toBe('warning')
    })

    it('returns inactive for unknown type', () => {
      const { getParamTypeStatus } = useSSM()

      expect(getParamTypeStatus('Unknown')).toBe('inactive')
    })
  })

  describe('computed columns', () => {
    it('returns paramColumns', () => {
      const { paramColumns } = useSSM()

      expect(paramColumns.value).toBeInstanceOf(Array)
      expect(paramColumns.value.length).toBeGreaterThan(0)
      expect(paramColumns.value[0].key).toBe('Name')
    })

    it('returns historyColumns', () => {
      const { historyColumns } = useSSM()

      expect(historyColumns.value).toBeInstanceOf(Array)
      expect(historyColumns.value.length).toBeGreaterThan(0)
      expect(historyColumns.value[0].key).toBe('Version')
    })
  })
})
