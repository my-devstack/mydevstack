import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useContentReload } from '@/composables/useContentReload'
import * as ssmApi from '@/api/services/ssm'

// Types
export interface SSMParameterItem {
  Name: string
  Type: 'String' | 'StringList' | 'SecureString'
  Value?: string
  Version?: number
  Tier?: string
  DataType?: string
  Description?: string
  LastModifiedDate?: string
}

export interface SSMParameterHistoryItem {
  Name: string
  Type: string
  Value: string
  Version: number
  LastModifiedDate: string
  LastModifiedUser?: string
}

export function useSSM() {
  const toast = useToast()
  const { reloadTrigger } = useContentReload()

  // State
  const loading = ref(false)
  const parameters = ref<SSMParameterItem[]>([])
  const selectedParameter = ref<SSMParameterItem | null>(null)
  const parameterHistory = ref<SSMParameterHistoryItem[]>([])
  const historyLoading = ref(false)

  // Modal states
  const showCreateModal = ref(false)
  const showValueModal = ref(false)
  const showHistoryModal = ref(false)
  const showDeleteModal = ref(false)

  // Form state
  const newParamName = ref('')
  const newParamValue = ref('')
  const newParamType = ref<'String' | 'StringList' | 'SecureString'>('String')
  const newParamDescription = ref('')
  const getWithDecryption = ref(false)
  const parameterToDelete = ref<SSMParameterItem | null>(null)

  // Computed columns
  const paramColumns = computed(() => [
    { key: 'Name', label: 'Name', sortable: true },
    { key: 'Type', label: 'Type', sortable: true },
    { key: 'Version', label: 'Version', sortable: true },
    { key: 'Tier', label: 'Tier', sortable: true },
    { key: 'LastModifiedDate', label: 'Modified', sortable: true },
  ])

  const historyColumns = computed(() => [
    { key: 'Version', label: 'Version', sortable: true },
    { key: 'Value', label: 'Value', sortable: false },
    { key: 'LastModifiedDate', label: 'Modified', sortable: true },
    { key: 'LastModifiedUser', label: 'Modified By', sortable: false },
  ])

  // Helper functions
  function formatDate(dateString: string | undefined): string {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString()
  }

  function getParamTypeStatus(type: string): 'active' | 'pending' | 'inactive' {
    const typeMap: Record<string, 'active' | 'pending' | 'inactive'> = {
      String: 'active',
      StringList: 'active',
      SecureString: 'warning',
    }
    return typeMap[type] || 'inactive'
  }

  // API functions
  async function loadParameters() {
    loading.value = true
    try {
      const result = await ssmApi.describeParameters()
      parameters.value = result.Parameters || []
    } catch (error) {
      toast.error(`Failed to load parameters: ${error}`)
    } finally {
      loading.value = false
    }
  }

  async function selectParameter(param: SSMParameterItem) {
    selectedParameter.value = param
  }

  async function getParameterValue(param: SSMParameterItem) {
    selectedParameter.value = param
    showValueModal.value = true

    try {
      const result = await ssmApi.getParameter(param.Name, { WithDecryption: true })
      if (result.Parameter) {
        selectedParameter.value.Value = result.Parameter.Value
      }
    } catch (error) {
      toast.error(`Failed to load parameter value: ${error}`)
    }
  }

  async function loadParameterHistory() {
    if (!selectedParameter.value) return

    historyLoading.value = true
    showHistoryModal.value = true
    try {
      const result = await ssmApi.getParameterHistory(selectedParameter.value.Name, {
        WithDecryption: true,
      })
      parameterHistory.value = result.Parameters || (result.Parameter ? [result.Parameter] : [])
    } catch (error) {
      toast.error(`Failed to load parameter history: ${error}`)
    } finally {
      historyLoading.value = false
    }
  }

  async function createParameter() {
    if (!newParamName.value || !newParamValue.value) {
      toast.warning('Name and value are required')
      return
    }

    loading.value = true
    try {
      await ssmApi.putParameter({
        Name: newParamName.value,
        Value: newParamValue.value,
        Type: newParamType.value,
        Description: newParamDescription.value,
      })

      toast.success(`Parameter ${newParamName.value} created successfully`)
      showCreateModal.value = false
      resetForm()
      await loadParameters()
    } catch (error) {
      toast.error(`Failed to create parameter: ${error}`)
    } finally {
      loading.value = false
    }
  }

  async function updateParameter() {
    if (!selectedParameter.value || !newParamValue.value) {
      toast.warning('Value is required')
      return
    }

    loading.value = true
    try {
      await ssmApi.putParameter({
        Name: selectedParameter.value.Name,
        Value: newParamValue.value,
        Type: selectedParameter.value.Type,
        Overwrite: true,
      })

      toast.success(`Parameter ${selectedParameter.value.Name} updated successfully`)
      showValueModal.value = false
      newParamValue.value = ''
      await loadParameters()

      const updatedParam = parameters.value.find(p => p.Name === selectedParameter.value!.Name)
      if (updatedParam) {
        selectedParameter.value = updatedParam
        await getParameterValue(updatedParam)
      }
    } catch (error) {
      toast.error(`Failed to update parameter: ${error}`)
    } finally {
      loading.value = false
    }
  }

  async function deleteParameter() {
    if (!parameterToDelete.value) return

    loading.value = true
    try {
      await ssmApi.deleteParameter(parameterToDelete.value.Name)
      toast.success(`Parameter ${parameterToDelete.value.Name} deleted successfully`)

      if (selectedParameter.value?.Name === parameterToDelete.value.Name) {
        selectedParameter.value = null
      }

      showDeleteModal.value = false
      parameterToDelete.value = null
      await loadParameters()
    } catch (error) {
      toast.error(`Failed to delete parameter: ${error}`)
    } finally {
      loading.value = false
    }
  }

  function openDeleteModal(param: SSMParameterItem) {
    parameterToDelete.value = param
    showDeleteModal.value = true
  }

  function resetForm() {
    newParamName.value = ''
    newParamValue.value = ''
    newParamType.value = 'String'
    newParamDescription.value = ''
  }

  // Lifecycle
  onMounted(() => {
    loadParameters()
  })

  watch(reloadTrigger, () => {
    loadParameters()
  })

  return {
    // State
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

    // Computed
    paramColumns,
    historyColumns,

    // Functions
    loadParameters,
    selectParameter,
    getParameterValue,
    loadParameterHistory,
    createParameter,
    updateParameter,
    deleteParameter,
    openDeleteModal,
    resetForm,
    formatDate,
    getParamTypeStatus,
  }
}
