import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import { useContentReload } from '@/composables/useContentReload'
import * as rdsApi from '@/api/services/rds'
import type { RDSInstance, CreateDBInstanceInput } from '@/api/types/aws'
import type { VpcSelection } from '@/types/vpc'

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
  vpcSelection: VpcSelection | null
}

export function useRDS() {
  const toast = useToast()
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
    vpcSelection: null,
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
      toast.error(`Failed to load instances: ${error}`)
    } finally {
      loading.value = false
    }
  }

  async function createInstance() {
    if (!createForm.value.instanceId || !createForm.value.masterPassword) {
      toast.warning('Instance ID and password are required')
      return
    }

    creating.value = true
    try {
      const apiInput: CreateDBInstanceInput = {
        DBInstanceIdentifier: createForm.value.instanceId,
        DBInstanceClass: createForm.value.instanceClass,
        Engine: createForm.value.dbEngine,
        EngineVersion: createForm.value.dbVersion,
        MasterUsername: createForm.value.masterUsername,
        MasterUserPassword: createForm.value.masterPassword,
        Port: Number(createForm.value.port),
        AllocatedStorage: Number(createForm.value.allocatedStorage),
      }

      // Map VPC selection if set
      if (createForm.value.vpcSelection) {
        apiInput.DBSubnetGroupName = createForm.value.vpcSelection.subnetIds[0]
        if (createForm.value.vpcSelection.securityGroupIds.length > 0) {
          apiInput.VpcSecurityGroupIds = createForm.value.vpcSelection.securityGroupIds
        }
      }

      await rdsApi.createDBInstance(apiInput)

      await loadInstances()
      toast.success(`Instance ${createForm.value.instanceId} is being created`)
      showCreateModal.value = false
      resetForm()
    } catch (error) {
      toast.error(`Failed to create instance: ${error}`)
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
      toast.success(`Instance ${instanceToDelete.value.DBInstanceIdentifier} is being deleted`)
      showDeleteModal.value = false
      instanceToDelete.value = null
    } catch (error) {
      toast.error(`Failed to delete instance: ${error}`)
    }
  }

  async function rebootInstance() {
    if (!instanceToReboot.value) return
    rebooting.value = true
    try {
      await rdsApi.rebootDBInstance(instanceToReboot.value.DBInstanceIdentifier)
      await loadInstances()
      toast.success(`Instance ${instanceToReboot.value.DBInstanceIdentifier} is rebooting`)
      showRebootModal.value = false
      instanceToReboot.value = null
    } catch (error: any) {
      toast.error(`Failed to reboot instance: ${error.message || error}`)
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
      vpcSelection: null,
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
