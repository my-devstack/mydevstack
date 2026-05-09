import { ref, computed, watch, onMounted } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useContentReload } from '@/composables/useContentReload'
import * as stepFunctionsApi from '@/api/services/stepfunctions'

// Types
export interface StateMachineItem {
  stateMachineArn: string
  name: string
  status?: string
  type?: string
  creationDate?: string
  description?: string
  definition?: string
}

export interface ExecutionItem {
  executionArn: string
  stateMachineArn: string
  name?: string
  status?: string
  startDate?: string
  stopDate?: string
  input?: string
  output?: string
}

export function useStepFunctions() {
  const uiStore = useUIStore()
  const { reloadTrigger } = useContentReload()

  // State
  const loading = ref(false)
  const stateMachines = ref<StateMachineItem[]>([])
  const executions = ref<ExecutionItem[]>([])
  const selectedStateMachine = ref<StateMachineItem | null>(null)
  const executionLoading = ref(false)
  const selectedExecution = ref<ExecutionItem | null>(null)
  const executionHistory = ref<any[]>([])
  const historyLoading = ref(false)

  // Modal states
  const showCreateModal = ref(false)
  const showDeleteModal = ref(false)
  const showStartExecutionModal = ref(false)
  const showExecutionDetailModal = ref(false)
  const showExecutionHistoryModal = ref(false)

  // Form state
  const newMachineName = ref('')
  const newMachineDefinition = ref('')
  const newMachineRoleArn = ref('')
  const newMachineType = ref<'STANDARD' | 'EXPRESS'>('STANDARD')
  const newExecutionInput = ref('')
  const stateMachineToDelete = ref<StateMachineItem | null>(null)

  // Computed columns
  const stateMachineColumns = computed(() => [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'creationDate', label: 'Created', sortable: true },
  ])

  const executionColumns = computed(() => [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'startDate', label: 'Start', sortable: true },
    { key: 'stopDate', label: 'Stop', sortable: true },
  ])

  const executionHistoryColumns = computed(() => [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'timestamp', label: 'Timestamp', sortable: true },
    { key: 'previousEventId', label: 'Previous Event', sortable: false },
  ])

  // Helper functions
  function formatDate(dateString: string | undefined): string {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString()
  }

  function getStatusType(status: string | undefined): 'active' | 'pending' | 'inactive' {
    const map: Record<string, 'active' | 'pending' | 'inactive'> = {
      ACTIVE: 'active',
      RUNNING: 'pending',
      SUCCEEDED: 'active',
      FAILED: 'inactive',
      TIMED_OUT: 'inactive',
      ABORTED: 'inactive',
    }
    return map[status || ''] || 'inactive'
  }

  // API functions
  async function loadStateMachines() {
    loading.value = true
    try {
      const result = await stepFunctionsApi.listStateMachines()
      // Handle PascalCase from AWS SDK v2 JSON - normalize to our interface
      const machines = result.stateMachines || result.StateMachines || []
      stateMachines.value = machines.map((m: any) => ({
        stateMachineArn: m.stateMachineArn || m.StateMachineArn || '',
        name: m.name || m.Name || '',
        status: m.status || m.Status,
        type: m.type || m.Type || 'STANDARD',
        creationDate: m.creationDate || m.CreationDate,
        description: m.description || m.Description,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      uiStore.notifyError('Failed to load state machines', message)
    } finally {
      loading.value = false
    }
  }

  async function selectStateMachine(machine: StateMachineItem) {
    // Fetch full details including definition
    try {
      const details = await stepFunctionsApi.describeStateMachine(machine.stateMachineArn)
      selectedStateMachine.value = {
        ...machine,
        definition: details.definition || details.Definition,
        description: details.description || details.Description,
        status: details.status || details.Status,
        type: details.type || details.Type,
        creationDate: details.creationDate || details.CreationDate,
        roleArn: details.roleArn || details.RoleArn,
      }
    } catch (error) {
      // If describe fails, still show basic info from list
      selectedStateMachine.value = machine
      const message = error instanceof Error ? error.message : 'Unknown error'
      uiStore.notifyError('Failed to load state machine details', message)
    }
    await loadExecutions()
  }

  async function loadStateMachineDetails(arn: string): Promise<StateMachineItem | null> {
    try {
      const details = await stepFunctionsApi.describeStateMachine(arn)
      return {
        stateMachineArn: arn,
        name: details.name || details.Name || '',
        definition: details.definition || details.Definition,
        description: details.description || details.Description,
        status: details.status || details.Status,
        type: details.type || details.Type,
        creationDate: details.creationDate || details.CreationDate,
        roleArn: details.roleArn || details.RoleArn,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      uiStore.notifyError('Failed to load state machine details', message)
      return null
    }
  }

  async function createStateMachine() {
    if (!newMachineName.value || !newMachineDefinition.value || !newMachineRoleArn.value) {
      uiStore.notifyWarning('Validation', 'Name, definition, and role ARN are required')
      return
    }

    loading.value = true
    try {
      await stepFunctionsApi.createStateMachine({
        name: newMachineName.value,
        definition: newMachineDefinition.value,
        roleArn: newMachineRoleArn.value,
        type: newMachineType.value,
      })

      uiStore.notifySuccess('Success', `State machine ${newMachineName.value} created successfully`)
      showCreateModal.value = false
      resetForm()
      await loadStateMachines()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      uiStore.notifyError('Failed to create state machine', message)
    } finally {
      loading.value = false
    }
  }

  async function deleteStateMachine() {
    if (!stateMachineToDelete.value) return

    loading.value = true
    try {
      await stepFunctionsApi.deleteStateMachine(stateMachineToDelete.value.stateMachineArn)

      uiStore.notifySuccess('Success', `State machine ${stateMachineToDelete.value.name} deleted successfully`)

      if (selectedStateMachine.value?.stateMachineArn === stateMachineToDelete.value.stateMachineArn) {
        selectedStateMachine.value = null
        executions.value = []
      }

      showDeleteModal.value = false
      stateMachineToDelete.value = null
      await loadStateMachines()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      uiStore.notifyError('Failed to delete state machine', message)
    } finally {
      loading.value = false
    }
  }

  async function startExecution() {
    if (!selectedStateMachine.value) return

    executionLoading.value = true
    try {
      const body: Record<string, unknown> = {}
      if (newExecutionInput.value) {
        body.input = newExecutionInput.value
      }

      await stepFunctionsApi.startExecution(selectedStateMachine.value.stateMachineArn, body)

      uiStore.notifySuccess('Success', 'Execution started successfully')
      showStartExecutionModal.value = false
      newExecutionInput.value = ''
      await loadExecutions()
    } catch (error) {
      const startMsg = error instanceof Error ? error.message : 'Unknown error'
      uiStore.notifyError('Failed to start execution', startMsg)
    } finally {
      executionLoading.value = false
    }
  }

  async function stopExecution(executionArn: string) {
    executionLoading.value = true
    try {
      await stepFunctionsApi.stopExecution(selectedStateMachine.value!.stateMachineArn, executionArn, {
        cause: 'Stopped by user',
      })

      uiStore.notifySuccess('Success', 'Execution stopped successfully')
      await loadExecutions()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      uiStore.notifyError('Failed to stop execution', message)
    } finally {
      executionLoading.value = false
    }
  }

  async function loadExecutions() {
    if (!selectedStateMachine.value) return

    executionLoading.value = true
    try {
      const result = await stepFunctionsApi.listExecutions(selectedStateMachine.value.stateMachineArn)
      // Handle PascalCase from AWS SDK v2 JSON - normalize to our interface
      const execList = result.executions || result.Executions || []
      executions.value = execList.map((e: any) => ({
        executionArn: e.executionArn || e.ExecutionArn || '',
        stateMachineArn: e.stateMachineArn || e.StateMachineArn || '',
        name: e.name || e.Name,
        status: e.status || e.Status,
        startDate: e.startDate || e.StartDate,
        stopDate: e.stopDate || e.StopDate,
        input: e.input || e.Input,
        output: e.output || e.Output,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      uiStore.notifyError('Failed to load executions', message)
    } finally {
      executionLoading.value = false
    }
  }

  async function describeExecution(executionArn: string) {
    if (!selectedStateMachine.value) return

    showExecutionDetailModal.value = true
    try {
      const result = await stepFunctionsApi.describeExecution(
        selectedStateMachine.value.stateMachineArn,
        executionArn
      )
      selectedExecution.value = {
        executionArn: result.executionArn || result.ExecutionArn || executionArn,
        stateMachineArn: result.stateMachineArn || result.StateMachineArn || selectedStateMachine.value.stateMachineArn,
        name: result.name || result.Name,
        status: result.status || result.Status,
        startDate: result.startDate || result.StartDate,
        stopDate: result.stopDate || result.StopDate,
        input: result.input || result.Input,
        output: result.output || result.Output,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      uiStore.notifyError('Failed to describe execution', message)
    }
  }

  async function getExecutionHistory(executionArn: string) {
    if (!selectedStateMachine.value) return

    historyLoading.value = true
    showExecutionHistoryModal.value = true
    try {
      const result = await stepFunctionsApi.getExecutionHistory(
        selectedStateMachine.value.stateMachineArn,
        executionArn
      )
      // Handle PascalCase from AWS SDK v2 JSON - normalize to modal expectations
      const events = result.events || result.Events || []
      executionHistory.value = events.map((e: any) => ({
        id: e.eventId || e.EventId,
        type: e.type || e.Type,
        timestamp: e.timestamp || e.Timestamp,
        previousEventId: e.previousEventId || e.PreviousEventId,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      uiStore.notifyError('Failed to get execution history', message)
    } finally {
      historyLoading.value = false
    }
  }

  function openDeleteModal(machine: StateMachineItem) {
    stateMachineToDelete.value = machine
    showDeleteModal.value = true
  }

  function resetForm() {
    newMachineName.value = ''
    newMachineDefinition.value = ''
    newMachineRoleArn.value = ''
    newMachineType.value = 'STANDARD'
    newExecutionInput.value = ''
  }

  // Lifecycle
  onMounted(() => {
    loadStateMachines()
  })

  watch(reloadTrigger, () => {
    loadStateMachines()
  })

  // Clear executions when returning to list view
  watch(selectedStateMachine, (newVal) => {
    if (!newVal) {
      executions.value = []
      selectedExecution.value = null
      executionHistory.value = []
      showExecutionDetailModal.value = false
      showExecutionHistoryModal.value = false
    }
  })

  return {
    // State
    loading,
    stateMachines,
    executions,
    selectedStateMachine,
    executionLoading,
    selectedExecution,
    executionHistory,
    historyLoading,

    // Modal states
    showCreateModal,
    showDeleteModal,
    showStartExecutionModal,
    showExecutionDetailModal,
    showExecutionHistoryModal,

    // Form state
    newMachineName,
    newMachineDefinition,
    newMachineRoleArn,
    newMachineType,
    newExecutionInput,
    stateMachineToDelete,

    // Computed
    stateMachineColumns,
    executionColumns,
    executionHistoryColumns,

    // Functions
    loadStateMachines,
    selectStateMachine,
    loadStateMachineDetails,
    createStateMachine,
    deleteStateMachine,
    startExecution,
    stopExecution,
    loadExecutions,
    describeExecution,
    getExecutionHistory,
    openDeleteModal,
    resetForm,
    formatDate,
    getStatusType,
  }
}
