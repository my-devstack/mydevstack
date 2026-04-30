import { ref, computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useContentReload } from '@/composables/useContentReload'
import * as rdsApi from '@/api/services/rds'
import type { RDSInstance, CreateDBInstanceInput } from '@/api/types/aws'

// Types
export interface RDSForm {
  instanceId: string
  dbEngine: string
  dbVersion: string
  masterUsername: string
  masterPassword: string
  instanceClass: string
  port: string
  allocatedStorage: string
}

export function useRDS() {
  const uiStore = useUIStore()
  const { reloadTrigger } = useContentReload()

  // State
  const instances = ref<RDSInstance[]>([])
  const loading = ref(false)
  const selectedInstance = ref<RDSInstance | null>(null)

  // Accordion state
  const expandedInstances = ref<Set<string>>(new Set())

  // Modal visibility states
  const showCreateModal = ref(false)
  const showDeleteModal = ref(false)
  const showRebootModal = ref(false)

  // Form state
  const creating = ref(false)
  const rebooting = ref(false)
  const createForm = ref<RDSForm>({
    instanceId: '',
    dbEngine: 'mysql',
    dbVersion: '8.0.36',
    masterUsername: 'root',
    masterPassword: '',
    instanceClass: 'db.t3.micro',
    port: '3306',
    allocatedStorage: '20',
  })

  // Confirmation instances
  const instanceToDelete = ref<RDSInstance | null>(null)
  const instanceToReboot = ref<RDSInstance | null>(null)

  // Computed
  const instanceCount = computed(() => instances.value.length)

  // Status helper
  function getStatus(status: string): 'active' | 'pending' | 'inactive' | 'error' {
    const statusMap: Record<string, 'active' | 'pending' | 'inactive' | 'error'> = {
      available: 'active',
      creating: 'pending',
      running: 'active',
      deleting: 'pending',
      deleted: 'inactive',
      modified: 'pending',
      failed: 'error',
      rebooting: 'pending',
    }
    const lowerStatus = status?.toLowerCase() || ''
    return statusMap[lowerStatus] || 'inactive'
  }

  // API functions
  async function loadInstances() {
    loading.value = true
    try {
      const result = await rdsApi.describeDBInstances()
      instances.value = result
    } catch (error) {
      uiStore.notifyError('Error', `Failed to load instances: ${error}`)
    } finally {
      loading.value = false
    }
  }

  async function createInstance() {
    if (!createForm.value.instanceId || !createForm.value.masterPassword) {
      uiStore.notifyWarning('Validation', 'Instance ID and password are required')
      return
    }

    creating.value = true
    try {
      await rdsApi.createDBInstance({
        DBInstanceIdentifier: createForm.value.instanceId,
        DBInstanceClass: createForm.value.instanceClass,
        Engine: createForm.value.dbEngine,
        EngineVersion: createForm.value.dbVersion,
        MasterUsername: createForm.value.masterUsername,
        MasterUserPassword: createForm.value.masterPassword,
        Port: Number(createForm.value.port),
        AllocatedStorage: Number(createForm.value.allocatedStorage),
      })

      await loadInstances()
      uiStore.notifySuccess('Success', `Instance ${createForm.value.instanceId} is being created`)
      showCreateModal.value = false
      resetForm()
    } catch (error) {
      uiStore.notifyError('Error', `Failed to create instance: ${error}`)
    } finally {
      creating.value = false
    }
  }

  async function deleteInstance() {
    if (!instanceToDelete.value) return
    try {
      await rdsApi.deleteDBInstance(instanceToDelete.value.DBInstanceIdentifier, { skipFinalSnapshot: true })
      instances.value = instances.value.filter(i => i.DBInstanceIdentifier !== instanceToDelete.value?.DBInstanceIdentifier)
      expandedInstances.value.delete(instanceToDelete.value.DBInstanceIdentifier)
      uiStore.notifySuccess('Success', `Instance ${instanceToDelete.value.DBInstanceIdentifier} is being deleted`)
      showDeleteModal.value = false
      instanceToDelete.value = null
    } catch (error) {
      uiStore.notifyError('Error', `Failed to delete instance: ${error}`)
    }
  }

  async function rebootInstance() {
    if (!instanceToReboot.value) return
    rebooting.value = true
    try {
      await rdsApi.rebootDBInstance(instanceToReboot.value.DBInstanceIdentifier)
      await loadInstances()
      uiStore.notifySuccess('Success', `Instance ${instanceToReboot.value.DBInstanceIdentifier} is rebooting`)
      showRebootModal.value = false
      instanceToReboot.value = null
    } catch (error: any) {
      uiStore.notifyError('Error', `Failed to reboot instance: ${error.message || error}`)
    } finally {
      rebooting.value = false
    }
  }

  // Selection and toggle functions
  function toggleInstance(instanceId: string) {
    if (expandedInstances.value.has(instanceId)) {
      expandedInstances.value.delete(instanceId)
    } else {
      expandedInstances.value.add(instanceId)
    }
    expandedInstances.value = new Set(expandedInstances.value)
  }

  function selectInstance(instance: RDSInstance) {
    selectedInstance.value = instance
  }

  function confirmDelete(instance: RDSInstance) {
    instanceToDelete.value = instance
    showDeleteModal.value = true
  }

  function confirmReboot(instance: RDSInstance) {
    instanceToReboot.value = instance
    showRebootModal.value = true
  }

  function resetForm() {
    createForm.value = {
      instanceId: '',
      dbEngine: 'mysql',
      dbVersion: '8.0.36',
      masterUsername: 'root',
      masterPassword: '',
      instanceClass: 'db.t3.micro',
      port: '3306',
      allocatedStorage: '20',
    }
  }

  // Watch for reload trigger
  function setupReloadWatcher() {
    return reloadTrigger
  }

  return {
    // State
    instances,
    loading,
    selectedInstance,
    expandedInstances,
    showCreateModal,
    showDeleteModal,
    showRebootModal,
    creating,
    rebooting,
    createForm,
    instanceToDelete,
    instanceToReboot,

    // Computed
    instanceCount,
    getStatus,

    // Functions
    loadInstances,
    createInstance,
    deleteInstance,
    rebootInstance,
    toggleInstance,
    selectInstance,
    confirmDelete,
    confirmReboot,
    resetForm,
    setupReloadWatcher,
  }
}
