import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStepFunctions } from './useStepFunctions'

// Mock the Step Functions API module
vi.mock('@/api/services/stepfunctions', () => ({
  listStateMachines: vi.fn(),
  createStateMachine: vi.fn(),
  describeStateMachine: vi.fn(),
  updateStateMachine: vi.fn(),
  deleteStateMachine: vi.fn(),
  startExecution: vi.fn(),
  listExecutions: vi.fn(),
  stopExecution: vi.fn(),
  describeExecution: vi.fn(),
  getExecutionHistory: vi.fn(),
}))

// Create shared mock functions for UI store
const mockNotifySuccess = vi.fn()
const mockNotifyError = vi.fn()
const mockNotifyWarning = vi.fn()

// Mock the useUIStore store
vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: mockNotifySuccess,
    notifyError: mockNotifyError,
    notifyWarning: mockNotifyWarning,
  })),
}))

// Mock the useContentReload composable
vi.mock('@/composables/useContentReload', () => ({
  useContentReload: vi.fn(() => ({
    reloadTrigger: { value: 0 },
  })),
}))

import * as stepFunctionsApi from '@/api/services/stepfunctions'

describe('useStepFunctions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('initializes with empty state', () => {
      const {
        loading,
        stateMachines,
        executions,
        selectedStateMachine,
        executionLoading,
        selectedExecution,
        executionHistory,
        historyLoading,
        showCreateModal,
        showDeleteModal,
        showStartExecutionModal,
        showExecutionDetailModal,
        showExecutionHistoryModal,
        newMachineName,
        newMachineDefinition,
        newMachineRoleArn,
        newMachineType,
        newExecutionInput,
        stateMachineToDelete,
      } = useStepFunctions()

      expect(loading.value).toBe(false)
      expect(stateMachines.value).toEqual([])
      expect(executions.value).toEqual([])
      expect(selectedStateMachine.value).toBeNull()
      expect(executionLoading.value).toBe(false)
      expect(selectedExecution.value).toBeNull()
      expect(executionHistory.value).toEqual([])
      expect(historyLoading.value).toBe(false)
      expect(showCreateModal.value).toBe(false)
      expect(showDeleteModal.value).toBe(false)
      expect(showStartExecutionModal.value).toBe(false)
      expect(showExecutionDetailModal.value).toBe(false)
      expect(showExecutionHistoryModal.value).toBe(false)
      expect(newMachineName.value).toBe('')
      expect(newMachineDefinition.value).toBe('')
      expect(newMachineRoleArn.value).toBe('')
      expect(newMachineType.value).toBe('STANDARD')
      expect(newExecutionInput.value).toBe('')
      expect(stateMachineToDelete.value).toBeNull()
    })
  })

  describe('loadStateMachines', () => {
    it('loads state machines successfully', async () => {
      const mockMachines = [
        { stateMachineArn: 'arn:1', name: 'sm-1', status: 'ACTIVE', type: 'STANDARD' },
        { stateMachineArn: 'arn:2', name: 'sm-2', status: 'ACTIVE', type: 'EXPRESS' },
      ]

      vi.mocked(stepFunctionsApi.listStateMachines).mockResolvedValue({
        stateMachines: mockMachines,
      })

      const { loadStateMachines, stateMachines, loading } = useStepFunctions()

      await loadStateMachines()

      expect(stepFunctionsApi.listStateMachines).toHaveBeenCalled()
      expect(stateMachines.value).toHaveLength(2)
      expect(stateMachines.value[0].name).toBe('sm-1')
      expect(loading.value).toBe(false)
    })

    it('handles empty state machines response', async () => {
      vi.mocked(stepFunctionsApi.listStateMachines).mockResolvedValue({
        stateMachines: null,
      })

      const { loadStateMachines, stateMachines } = useStepFunctions()

      await loadStateMachines()

      expect(stateMachines.value).toEqual([])
    })

    it('handles error when loading state machines fails', async () => {
      vi.mocked(stepFunctionsApi.listStateMachines).mockRejectedValue(new Error('Network error'))

      const { loadStateMachines, loading } = useStepFunctions()

      await loadStateMachines()

      expect(loading.value).toBe(false)
      expect(mockNotifyError).toHaveBeenCalledWith('Failed to load state machines', 'Network error')
    })

    it('handles PascalCase StateMachines from AWS SDK', async () => {
      const mockMachines = [
        { stateMachineArn: 'arn:1', name: 'sm-1', status: 'ACTIVE', type: 'STANDARD' },
      ]

      vi.mocked(stepFunctionsApi.listStateMachines).mockResolvedValue({
        StateMachines: mockMachines,
      })

      const { loadStateMachines, stateMachines } = useStepFunctions()

      await loadStateMachines()
      expect(stateMachines.value).toHaveLength(1)
    })

    it('handles state machine with no definition', async () => {
      const mockMachines = [
        { stateMachineArn: 'arn:1', name: 'sm-1', status: 'ACTIVE', definition: null },
        { stateMachineArn: 'arn:2', name: 'sm-2', status: 'ACTIVE', definition: undefined },
        { stateMachineArn: 'arn:3', name: 'sm-3', status: 'ACTIVE', definition: '' },
      ]

      vi.mocked(stepFunctionsApi.listStateMachines).mockResolvedValue({
        stateMachines: mockMachines,
      })

      const { loadStateMachines, stateMachines } = useStepFunctions()

      await loadStateMachines()

      expect(stateMachines.value).toHaveLength(3)
      // List API doesn't return definition - only describe does
      // So definition should be undefined from list
      expect(stateMachines.value[0].definition).toBeUndefined()
      expect(stateMachines.value[1].definition).toBeUndefined()
      expect(stateMachines.value[2].definition).toBeUndefined()
    })

    it('handles state machine with error object as definition', async () => {
      // AWS might return error object for definition in some cases
      const mockMachines = [
        { stateMachineArn: 'arn:1', name: 'sm-1', status: 'ACTIVE', definition: { error: 'No definition available' } },
      ]

      vi.mocked(stepFunctionsApi.listStateMachines).mockResolvedValue({
        stateMachines: mockMachines,
      })

      const { loadStateMachines, stateMachines } = useStepFunctions()

      await loadStateMachines()

      expect(stateMachines.value).toHaveLength(1)
      // List API doesn't return definition - only describe does
      expect(stateMachines.value[0].definition).toBeUndefined()
    })
  })

  describe('selectStateMachine', () => {
    it('selects state machine and loads executions', async () => {
      const machine: any = {
        stateMachineArn: 'arn:test',
        name: 'test-sm',
        status: 'ACTIVE',
      }

      vi.mocked(stepFunctionsApi.listExecutions).mockResolvedValue({
        executions: [
          { executionArn: 'exec-1', stateMachineArn: 'arn:test', status: 'RUNNING' },
        ],
      })

      const { selectStateMachine, selectedStateMachine, executions } = useStepFunctions()

      await selectStateMachine(machine)

      expect(selectedStateMachine.value).toEqual(machine)
      expect(stepFunctionsApi.listExecutions).toHaveBeenCalledWith('arn:test')
      expect(executions.value).toHaveLength(1)
    })
  })

  describe('createStateMachine', () => {
    it('creates state machine successfully', async () => {
      vi.mocked(stepFunctionsApi.createStateMachine).mockResolvedValue({
        stateMachineArn: 'arn:new',
      })
      vi.mocked(stepFunctionsApi.listStateMachines).mockResolvedValue({ stateMachines: [] })

      const {
        createStateMachine,
        newMachineName,
        newMachineDefinition,
        newMachineRoleArn,
        newMachineType,
        showCreateModal,
        loading,
      } = useStepFunctions()

      newMachineName.value = 'test-sm'
      newMachineDefinition.value = '{"StartAt": "HelloWorld"}'
      newMachineRoleArn.value = 'arn:aws:iam::123:role/test'
      newMachineType.value = 'STANDARD'

      await createStateMachine()

      expect(stepFunctionsApi.createStateMachine).toHaveBeenCalledWith({
        name: 'test-sm',
        definition: '{"StartAt": "HelloWorld"}',
        roleArn: 'arn:aws:iam::123:role/test',
        type: 'STANDARD',
      })
      expect(showCreateModal.value).toBe(false)
      expect(newMachineName.value).toBe('')
      expect(newMachineDefinition.value).toBe('')
      expect(newMachineRoleArn.value).toBe('')
      expect(mockNotifySuccess).toHaveBeenCalledWith('Success', 'State machine test-sm created successfully')
    })

    it('validates name, definition, and role ARN required', async () => {
      const { createStateMachine, newMachineName, newMachineDefinition, newMachineRoleArn } = useStepFunctions()

      newMachineName.value = ''
      newMachineDefinition.value = ''
      newMachineRoleArn.value = ''

      await createStateMachine()

      expect(stepFunctionsApi.createStateMachine).not.toHaveBeenCalled()
      expect(mockNotifyWarning).toHaveBeenCalledWith('Validation', 'Name, definition, and role ARN are required')
    })

    it('handles error when create fails', async () => {
      vi.mocked(stepFunctionsApi.createStateMachine).mockRejectedValue(new Error('Create failed'))

      const { createStateMachine, newMachineName, newMachineDefinition, newMachineRoleArn } = useStepFunctions()

      newMachineName.value = 'bad-sm'
      newMachineDefinition.value = '{}'
      newMachineRoleArn.value = 'arn:test'

      await createStateMachine()

      expect(mockNotifyError).toHaveBeenCalled()
    })
  })

  describe('deleteStateMachine', () => {
    it('deletes state machine successfully', async () => {
      vi.mocked(stepFunctionsApi.deleteStateMachine).mockResolvedValue(undefined)
      vi.mocked(stepFunctionsApi.listStateMachines).mockResolvedValue({ stateMachines: [] })

      const {
        deleteStateMachine,
        stateMachineToDelete,
        showDeleteModal,
        selectedStateMachine,
        loading,
      } = useStepFunctions()

      stateMachineToDelete.value = { stateMachineArn: 'arn:del', name: 'del-sm' }
      selectedStateMachine.value = { stateMachineArn: 'arn:del', name: 'del-sm' }

      await deleteStateMachine()

      expect(stepFunctionsApi.deleteStateMachine).toHaveBeenCalledWith('arn:del')
      expect(showDeleteModal.value).toBe(false)
      expect(stateMachineToDelete.value).toBeNull()
      expect(selectedStateMachine.value).toBeNull()
      expect(mockNotifySuccess).toHaveBeenCalledWith('Success', 'State machine del-sm deleted successfully')
    })

    it('clears selection if deleted machine was selected', async () => {
      vi.mocked(stepFunctionsApi.deleteStateMachine).mockResolvedValue(undefined)
      vi.mocked(stepFunctionsApi.listStateMachines).mockResolvedValue({ stateMachines: [] })

      const { deleteStateMachine, stateMachineToDelete, selectedStateMachine } = useStepFunctions()

      selectedStateMachine.value = { stateMachineArn: 'arn:del', name: 'del-sm' }
      stateMachineToDelete.value = { stateMachineArn: 'arn:del', name: 'del-sm' }

      await deleteStateMachine()

      expect(selectedStateMachine.value).toBeNull()
    })

    it('does nothing if no state machine to delete', async () => {
      const { deleteStateMachine, stateMachineToDelete } = useStepFunctions()

      stateMachineToDelete.value = null

      await deleteStateMachine()

      expect(stepFunctionsApi.deleteStateMachine).not.toHaveBeenCalled()
    })

    it('handles error when delete fails', async () => {
      vi.mocked(stepFunctionsApi.deleteStateMachine).mockRejectedValue(new Error('Delete failed'))

      const { deleteStateMachine, stateMachineToDelete } = useStepFunctions()

      stateMachineToDelete.value = { stateMachineArn: 'arn:bad', name: 'bad-sm' }

      await deleteStateMachine()

      expect(mockNotifyError).toHaveBeenCalled()
    })
  })

  describe('startExecution', () => {
    it('starts execution successfully', async () => {
      vi.mocked(stepFunctionsApi.startExecution).mockResolvedValue({ executionArn: 'arn:exec' })
      vi.mocked(stepFunctionsApi.listExecutions).mockResolvedValue({ executions: [] })

      const {
        startExecution,
        selectedStateMachine,
        newExecutionInput,
        showStartExecutionModal,
        executionLoading,
      } = useStepFunctions()

      selectedStateMachine.value = { stateMachineArn: 'arn:sm', name: 'test-sm' }
      newExecutionInput.value = '{"key": "value"}'

      await startExecution()

      expect(stepFunctionsApi.startExecution).toHaveBeenCalledWith('arn:sm', {
        input: '{"key": "value"}',
      })
      expect(showStartExecutionModal.value).toBe(false)
      expect(newExecutionInput.value).toBe('')
      expect(mockNotifySuccess).toHaveBeenCalledWith('Success', 'Execution started successfully')
    })

    it('does nothing if no state machine selected', async () => {
      const { startExecution } = useStepFunctions()

      await startExecution()

      expect(stepFunctionsApi.startExecution).not.toHaveBeenCalled()
    })

    it('starts execution without input', async () => {
      vi.mocked(stepFunctionsApi.startExecution).mockResolvedValue({ executionArn: 'arn:exec' })
      vi.mocked(stepFunctionsApi.listExecutions).mockResolvedValue({ executions: [] })

      const { startExecution, selectedStateMachine, showStartExecutionModal } = useStepFunctions()

      selectedStateMachine.value = { stateMachineArn: 'arn:sm', name: 'test-sm' }

      await startExecution()

      expect(stepFunctionsApi.startExecution).toHaveBeenCalledWith('arn:sm', {})
      expect(showStartExecutionModal.value).toBe(false)
    })

    it('handles error when start fails', async () => {
      vi.mocked(stepFunctionsApi.startExecution).mockRejectedValue(new Error('Start failed'))

      const { startExecution, selectedStateMachine } = useStepFunctions()

      selectedStateMachine.value = { stateMachineArn: 'arn:sm', name: 'test-sm' }

      await startExecution()

      expect(mockNotifyError).toHaveBeenCalled()
    })
  })

  describe('stopExecution', () => {
    it('stops execution successfully', async () => {
      vi.mocked(stepFunctionsApi.stopExecution).mockResolvedValue(undefined)
      vi.mocked(stepFunctionsApi.listExecutions).mockResolvedValue({ executions: [] })

      const { stopExecution, selectedStateMachine, executionLoading } = useStepFunctions()

      selectedStateMachine.value = { stateMachineArn: 'arn:sm', name: 'test-sm' }

      await stopExecution('exec-arn-1')

      expect(stepFunctionsApi.stopExecution).toHaveBeenCalledWith('arn:sm', 'exec-arn-1', {
        cause: 'Stopped by user',
      })
      expect(executionLoading.value).toBe(false)
    })

    it('handles error when stop fails', async () => {
      vi.mocked(stepFunctionsApi.stopExecution).mockRejectedValue(new Error('Stop failed'))

      const { stopExecution, selectedStateMachine } = useStepFunctions()

      selectedStateMachine.value = { stateMachineArn: 'arn:sm', name: 'test-sm' }

      await stopExecution('exec-bad')

      expect(mockNotifyError).toHaveBeenCalled()
    })
  })

  describe('loadExecutions', () => {
    it('loads executions for selected state machine', async () => {
      vi.mocked(stepFunctionsApi.listExecutions).mockResolvedValue({
        executions: [
          { executionArn: 'exec-1', stateMachineArn: 'arn:sm', status: 'SUCCEEDED' },
        ],
      })

      const { loadExecutions, selectedStateMachine, executions, executionLoading } = useStepFunctions()

      selectedStateMachine.value = { stateMachineArn: 'arn:sm', name: 'test-sm' }

      await loadExecutions()

      expect(stepFunctionsApi.listExecutions).toHaveBeenCalledWith('arn:sm')
      expect(executions.value).toHaveLength(1)
      expect(executions.value[0].status).toBe('SUCCEEDED')
      expect(executionLoading.value).toBe(false)
    })

    it('does nothing if no state machine selected', async () => {
      const { loadExecutions, executions } = useStepFunctions()

      await loadExecutions()

      expect(stepFunctionsApi.listExecutions).not.toHaveBeenCalled()
      expect(executions.value).toEqual([])
    })

    it('handles error when loading executions fails', async () => {
      vi.mocked(stepFunctionsApi.listExecutions).mockRejectedValue(new Error('List failed'))

      const { loadExecutions, selectedStateMachine } = useStepFunctions()

      selectedStateMachine.value = { stateMachineArn: 'arn:sm', name: 'test-sm' }

      await loadExecutions()

      expect(mockNotifyError).toHaveBeenCalled()
    })

    it('handles PascalCase Executions from AWS SDK', async () => {
      vi.mocked(stepFunctionsApi.listExecutions).mockResolvedValue({
        Executions: [
          { executionArn: 'exec-1', stateMachineArn: 'arn:sm', status: 'SUCCEEDED' },
        ],
      })

      const { loadExecutions, selectedStateMachine, executions } = useStepFunctions()

      selectedStateMachine.value = { stateMachineArn: 'arn:sm', name: 'test-sm' }

      await loadExecutions()
      expect(executions.value).toHaveLength(1)
    })
  })

  describe('describeExecution', () => {
    it('describes execution and opens detail modal', async () => {
      const mockDetail = {
        executionArn: 'exec-arn-1',
        stateMachineArn: 'arn:sm',
        name: 'exec-1',
        status: 'SUCCEEDED',
        startDate: '2024-01-01T00:00:00Z',
        stopDate: '2024-01-01T01:00:00Z',
      }

      vi.mocked(stepFunctionsApi.describeExecution).mockResolvedValue(mockDetail)

      const {
        describeExecution,
        selectedExecution,
        showExecutionDetailModal,
        selectedStateMachine,
      } = useStepFunctions()

      selectedStateMachine.value = { stateMachineArn: 'arn:sm', name: 'test-sm' }

      await describeExecution('exec-arn-1')

      expect(stepFunctionsApi.describeExecution).toHaveBeenCalledWith('arn:sm', 'exec-arn-1')
      expect(showExecutionDetailModal.value).toBe(true)
      expect(selectedExecution.value?.name).toBe('exec-1')
      expect(selectedExecution.value?.status).toBe('SUCCEEDED')
    })

    it('does nothing if no state machine selected', async () => {
      const { describeExecution, showExecutionDetailModal } = useStepFunctions()

      await describeExecution('exec-arn')

      expect(stepFunctionsApi.describeExecution).not.toHaveBeenCalled()
      expect(showExecutionDetailModal.value).toBe(false)
    })

    it('handles error when describe fails', async () => {
      vi.mocked(stepFunctionsApi.describeExecution).mockRejectedValue(new Error('Not found'))

      const { describeExecution, selectedStateMachine } = useStepFunctions()

      selectedStateMachine.value = { stateMachineArn: 'arn:sm', name: 'test-sm' }

      await describeExecution('bad-exec')

      expect(mockNotifyError).toHaveBeenCalled()
    })

    it('handles error object in execution response gracefully', async () => {
      // AWS might return error object instead of valid data
      const mockErrorResponse = { error: 'AccessDenied', message: 'Access denied' }

      vi.mocked(stepFunctionsApi.describeExecution).mockResolvedValue(mockErrorResponse as any)

      const {
        describeExecution,
        selectedExecution,
        selectedStateMachine,
      } = useStepFunctions()

      selectedStateMachine.value = { stateMachineArn: 'arn:sm', name: 'test-sm' }

      await describeExecution('exec-arn-1')

      // Should still set selectedExecution even with error response (falls back to params)
      expect(selectedExecution.value).not.toBeNull()
      expect(selectedExecution.value?.executionArn).toBe('exec-arn-1')
    })

    it('maps input and output from describeExecution correctly', async () => {
      const mockDetail = {
        executionArn: 'exec-arn-1',
        stateMachineArn: 'arn:sm',
        name: 'exec-1',
        status: 'SUCCEEDED',
        startDate: '2024-01-01T00:00:00Z',
        stopDate: '2024-01-01T01:00:00Z',
        input: '{"key": "value"}',
        output: '{"result": "success"}',
      }

      vi.mocked(stepFunctionsApi.describeExecution).mockResolvedValue(mockDetail)

      const {
        describeExecution,
        selectedExecution,
        selectedStateMachine,
      } = useStepFunctions()

      selectedStateMachine.value = { stateMachineArn: 'arn:sm', name: 'test-sm' }

      await describeExecution('exec-arn-1')

      expect(selectedExecution.value?.input).toBe('{"key": "value"}')
      expect(selectedExecution.value?.output).toBe('{"result": "success"}')
    })

    it('handles PascalCase Input and Output from AWS SDK', async () => {
      const mockDetail = {
        executionArn: 'exec-arn-1',
        stateMachineArn: 'arn:sm',
        name: 'exec-1',
        status: 'FAILED',
        StartDate: '2024-01-01T00:00:00Z',
        StopDate: '2024-01-01T00:30:00Z',
        Input: '{"orderId": "123"}',
        Output: '{"error": "failed"}',
      }

      vi.mocked(stepFunctionsApi.describeExecution).mockResolvedValue(mockDetail)

      const {
        describeExecution,
        selectedExecution,
        selectedStateMachine,
      } = useStepFunctions()

      selectedStateMachine.value = { stateMachineArn: 'arn:sm', name: 'test-sm' }

      await describeExecution('exec-arn-1')

      expect(selectedExecution.value?.input).toBe('{"orderId": "123"}')
      expect(selectedExecution.value?.output).toBe('{"error": "failed"}')
      expect(selectedExecution.value?.startDate).toBe('2024-01-01T00:00:00Z')
      expect(selectedExecution.value?.stopDate).toBe('2024-01-01T00:30:00Z')
    })
  })

  describe('getExecutionHistory', () => {
    it('loads execution history successfully', async () => {
      vi.mocked(stepFunctionsApi.getExecutionHistory).mockResolvedValue({
        events: [
          { id: '1', type: 'ExecutionStarted', timestamp: '2024-01-01T00:00:00Z' },
        ],
      })

      const {
        getExecutionHistory,
        executionHistory,
        showExecutionHistoryModal,
        historyLoading,
        selectedStateMachine,
      } = useStepFunctions()

      selectedStateMachine.value = { stateMachineArn: 'arn:sm', name: 'test-sm' }

      await getExecutionHistory('exec-arn')

      expect(stepFunctionsApi.getExecutionHistory).toHaveBeenCalledWith('arn:sm', 'exec-arn')
      expect(executionHistory.value).toHaveLength(1)
      expect(showExecutionHistoryModal.value).toBe(true)
      expect(historyLoading.value).toBe(false)
    })

    it('does nothing if no state machine selected', async () => {
      const { getExecutionHistory, showExecutionHistoryModal } = useStepFunctions()

      await getExecutionHistory('exec-arn')

      expect(stepFunctionsApi.getExecutionHistory).not.toHaveBeenCalled()
      expect(showExecutionHistoryModal.value).toBe(false)
    })

    it('handles error when getting history fails', async () => {
      vi.mocked(stepFunctionsApi.getExecutionHistory).mockRejectedValue(new Error('History error'))

      const { getExecutionHistory, selectedStateMachine, historyLoading } = useStepFunctions()

      selectedStateMachine.value = { stateMachineArn: 'arn:sm', name: 'test-sm' }

      await getExecutionHistory('bad-exec')

      expect(historyLoading.value).toBe(false)
      expect(mockNotifyError).toHaveBeenCalled()
    })

    it('handles PascalCase Events from AWS SDK', async () => {
      vi.mocked(stepFunctionsApi.getExecutionHistory).mockResolvedValue({
        Events: [
          { EventId: '1', Type: 'ExecutionStarted', Timestamp: '2024-01-01T00:00:00Z', PreviousEventId: '0' },
        ],
      })

      const {
        getExecutionHistory,
        executionHistory,
        selectedStateMachine,
      } = useStepFunctions()

      selectedStateMachine.value = { stateMachineArn: 'arn:sm', name: 'test-sm' }

      await getExecutionHistory('exec-arn')

      expect(executionHistory.value).toHaveLength(1)
      expect(executionHistory.value[0].id).toBe('1')
      expect(executionHistory.value[0].type).toBe('ExecutionStarted')
      expect(executionHistory.value[0].timestamp).toBe('2024-01-01T00:00:00Z')
      expect(executionHistory.value[0].previousEventId).toBe('0')
    })
  })

  describe('openDeleteModal', () => {
    it('opens delete modal with state machine', () => {
      const { openDeleteModal, showDeleteModal, stateMachineToDelete } = useStepFunctions()

      const machine: any = { stateMachineArn: 'arn:del', name: 'to-delete' }
      openDeleteModal(machine)

      expect(showDeleteModal.value).toBe(true)
      expect(stateMachineToDelete.value).toEqual(machine)
    })
  })

  describe('resetForm', () => {
    it('resets form fields', () => {
      const {
        resetForm,
        newMachineName,
        newMachineDefinition,
        newMachineRoleArn,
        newMachineType,
        newExecutionInput,
      } = useStepFunctions()

      newMachineName.value = 'test'
      newMachineDefinition.value = '{}'
      newMachineRoleArn.value = 'arn:test'
      newMachineType.value = 'EXPRESS'
      newExecutionInput.value = '{"key": "val"}'

      resetForm()

      expect(newMachineName.value).toBe('')
      expect(newMachineDefinition.value).toBe('')
      expect(newMachineRoleArn.value).toBe('')
      expect(newMachineType.value).toBe('STANDARD')
      expect(newExecutionInput.value).toBe('')
    })
  })

  describe('formatDate', () => {
    it('formats date string correctly', () => {
      const { formatDate } = useStepFunctions()

      const result = formatDate('2024-01-15T10:30:00Z')
      expect(result).toContain('2024')
    })

    it('returns dash for undefined date', () => {
      const { formatDate } = useStepFunctions()

      expect(formatDate(undefined)).toBe('-')
    })
  })

  describe('getStatusType', () => {
    it('returns active for ACTIVE status', () => {
      const { getStatusType } = useStepFunctions()

      expect(getStatusType('ACTIVE')).toBe('active')
    })

    it('returns pending for RUNNING status', () => {
      const { getStatusType } = useStepFunctions()

      expect(getStatusType('RUNNING')).toBe('pending')
    })

    it('returns active for SUCCEEDED status', () => {
      const { getStatusType } = useStepFunctions()

      expect(getStatusType('SUCCEEDED')).toBe('active')
    })

    it('returns inactive for FAILED status', () => {
      const { getStatusType } = useStepFunctions()

      expect(getStatusType('FAILED')).toBe('inactive')
    })

    it('returns inactive for TIMED_OUT status', () => {
      const { getStatusType } = useStepFunctions()

      expect(getStatusType('TIMED_OUT')).toBe('inactive')
    })

    it('returns inactive for ABORTED status', () => {
      const { getStatusType } = useStepFunctions()

      expect(getStatusType('ABORTED')).toBe('inactive')
    })

    it('returns inactive for unknown status', () => {
      const { getStatusType } = useStepFunctions()

      expect(getStatusType('Unknown')).toBe('inactive')
    })

    it('returns inactive for undefined status', () => {
      const { getStatusType } = useStepFunctions()

      expect(getStatusType(undefined)).toBe('inactive')
    })
  })

  describe('computed columns', () => {
    it('returns stateMachineColumns', () => {
      const { stateMachineColumns } = useStepFunctions()

      expect(stateMachineColumns.value).toBeInstanceOf(Array)
      expect(stateMachineColumns.value.length).toBeGreaterThan(0)
      expect(stateMachineColumns.value[0].key).toBe('name')
    })

    it('returns executionColumns', () => {
      const { executionColumns } = useStepFunctions()

      expect(executionColumns.value).toBeInstanceOf(Array)
      expect(executionColumns.value.length).toBeGreaterThan(0)
      expect(executionColumns.value[0].key).toBe('name')
    })

    it('returns executionHistoryColumns', () => {
      const { executionHistoryColumns } = useStepFunctions()

      expect(executionHistoryColumns.value).toBeInstanceOf(Array)
      expect(executionHistoryColumns.value.length).toBeGreaterThan(0)
      expect(executionHistoryColumns.value[0].key).toBe('id')
    })
  })
})
