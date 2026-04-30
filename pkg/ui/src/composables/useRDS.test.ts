import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRDS } from './useRDS'
import { useUIStore } from '@/stores/ui'
import type { RDSInstance } from '@/api/types/aws'

// Mock RDS API module
vi.mock('@/api/services/rds', () => ({
  describeDBInstances: vi.fn(),
  createDBInstance: vi.fn(),
  deleteDBInstance: vi.fn(),
  describeDBEngineVersions: vi.fn(),
  modifyDBInstance: vi.fn(),
  rdsService: {},
  RDSService: vi.fn(),
}))

// Mock UI store
const mockNotifySuccess = vi.fn()
const mockNotifyError = vi.fn()
const mockNotifyWarning = vi.fn()
const mockNotifyInfo = vi.fn()

vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: mockNotifySuccess,
    notifyError: mockNotifyError,
    notifyWarning: mockNotifyWarning,
    notifyInfo: mockNotifyInfo,
  })),
}))

// Mock useContentReload
vi.mock('@/composables/useContentReload', () => ({
  useContentReload: vi.fn(() => ({
    reloadTrigger: { value: 0 },
  })),
}))

import * as rdsApi from '@/api/services/rds'

describe('useRDS', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('initializes with empty state', () => {
      const {
        instances,
        loading,
        selectedInstance,
        expandedInstances,
        showCreateModal,
        showDeleteModal,
        creating,
        createForm,
        instanceToDelete,
        instanceCount,
      } = useRDS()

      expect(instances.value).toEqual([])
      expect(loading.value).toBe(false)
      expect(selectedInstance.value).toBeNull()
      expect(expandedInstances.value).toBeInstanceOf(Set)
      expect(expandedInstances.value.size).toBe(0)
      expect(showCreateModal.value).toBe(false)
      expect(showDeleteModal.value).toBe(false)
      expect(creating.value).toBe(false)
      expect(createForm.value).toEqual({
        instanceId: '',
        dbEngine: 'mysql',
        dbVersion: '8.0.36',
        masterUsername: 'root',
        masterPassword: '',
        instanceClass: 'db.t3.micro',
        port: '3306',
        allocatedStorage: '20',
      })
      expect(instanceToDelete.value).toBeNull()
      expect(instanceCount.value).toBe(0)
    })
  })

  describe('loadInstances', () => {
    it('loads instances successfully', async () => {
      const mockInstances: RDSInstance[] = [
        {
          DBInstanceIdentifier: 'db-1',
          DBInstanceClass: 'db.t3.micro',
          Engine: 'mysql',
          EngineVersion: '8.0.36',
          DBInstanceStatus: 'available',
          MasterUsername: 'root',
          Endpoint: { Address: 'localhost', Port: 3306 },
          AllocatedStorage: 20,
          StorageType: 'gp2',
          MultiAZ: false,
          PubliclyAccessible: false,
        },
        {
          DBInstanceIdentifier: 'db-2',
          DBInstanceClass: 'db.t3.small',
          Engine: 'postgres',
          EngineVersion: '15.3',
          DBInstanceStatus: 'available',
          MasterUsername: 'postgres',
          Endpoint: { Address: 'localhost', Port: 5432 },
          AllocatedStorage: 50,
          StorageType: 'gp2',
          MultiAZ: true,
          PubliclyAccessible: false,
        },
      ]

      vi.mocked(rdsApi.describeDBInstances).mockResolvedValue(mockInstances)

      const { loadInstances, instances, loading } = useRDS()

      await loadInstances()

      expect(rdsApi.describeDBInstances).toHaveBeenCalled()
      expect(instances.value).toEqual(mockInstances)
      expect(loading.value).toBe(false)
    })

    it('handles error when loading instances fails', async () => {
      vi.mocked(rdsApi.describeDBInstances).mockRejectedValue(new Error('Network error'))

      const { loadInstances, loading } = useRDS()

      await loadInstances()

      expect(loading.value).toBe(false)
      expect(mockNotifyError).toHaveBeenCalled()
    })

    it('sets loading true during request', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise<RDSInstance[]>((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(rdsApi.describeDBInstances).mockReturnValue(promise)

      const { loadInstances, loading } = useRDS()

      const loadPromise = loadInstances()
      expect(loading.value).toBe(true)

      resolvePromise!([])
      await loadPromise

      expect(loading.value).toBe(false)
    })
  })

  describe('createInstance', () => {
    it('creates instance successfully', async () => {
      const mockInstance: RDSInstance = {
        DBInstanceIdentifier: 'new-db',
        DBInstanceClass: 'db.t3.micro',
        Engine: 'mysql',
        EngineVersion: '8.0.36',
        DBInstanceStatus: 'creating',
        MasterUsername: 'root',
        AllocatedStorage: 20,
        StorageType: 'gp2',
        MultiAZ: false,
        PubliclyAccessible: false,
      }

      vi.mocked(rdsApi.createDBInstance).mockResolvedValue(mockInstance)
      vi.mocked(rdsApi.describeDBInstances).mockResolvedValue([mockInstance])

      const { createInstance, createForm, showCreateModal, creating } = useRDS()

      createForm.value = {
        instanceId: 'new-db',
        dbEngine: 'mysql',
        dbVersion: '8.0.36',
        masterUsername: 'root',
        masterPassword: 'password123',
        instanceClass: 'db.t3.micro',
        port: '3306',
        allocatedStorage: '20',
      }
      showCreateModal.value = true

      await createInstance()

      expect(rdsApi.createDBInstance).toHaveBeenCalledWith({
        DBInstanceIdentifier: 'new-db',
        DBInstanceClass: 'db.t3.micro',
        Engine: 'mysql',
        EngineVersion: '8.0.36',
        MasterUsername: 'root',
        MasterUserPassword: 'password123',
        Port: 3306,
        AllocatedStorage: 20,
      })
      expect(showCreateModal.value).toBe(false)
      expect(creating.value).toBe(false)
      expect(mockNotifySuccess).toHaveBeenCalled()
    })

    it('shows warning if instance ID missing', async () => {
      const { createInstance, createForm } = useRDS()

      createForm.value.instanceId = ''
      createForm.value.masterPassword = 'password123'

      await createInstance()

      expect(rdsApi.createDBInstance).not.toHaveBeenCalled()
      expect(mockNotifyWarning).toHaveBeenCalledWith('Validation', 'Instance ID and password are required')
    })

    it('shows warning if password missing', async () => {
      const { createInstance, createForm } = useRDS()

      createForm.value.instanceId = 'test-db'
      createForm.value.masterPassword = ''

      await createInstance()

      expect(rdsApi.createDBInstance).not.toHaveBeenCalled()
      expect(mockNotifyWarning).toHaveBeenCalledWith('Validation', 'Instance ID and password are required')
    })

    it('handles error when creating instance fails', async () => {
      vi.mocked(rdsApi.createDBInstance).mockRejectedValue(new Error('Creation failed'))

      const { createInstance, createForm, creating } = useRDS()

      createForm.value.instanceId = 'test-db'
      createForm.value.masterPassword = 'password123'

      await createInstance()

      expect(creating.value).toBe(false)
      expect(mockNotifyError).toHaveBeenCalled()
    })

    it('resets form after successful creation', async () => {
      vi.mocked(rdsApi.createDBInstance).mockResolvedValue({} as RDSInstance)
      vi.mocked(rdsApi.describeDBInstances).mockResolvedValue([])

      const { createInstance, createForm, resetForm } = useRDS()

      createForm.value = {
        instanceId: 'test-db',
        dbEngine: 'postgres',
        dbVersion: '15.3',
        masterUsername: 'admin',
        masterPassword: 'password123',
        instanceClass: 'db.t3.small',
        port: '5432',
        allocatedStorage: '50',
      }

      await createInstance()

      expect(createForm.value.instanceId).toBe('')
      expect(createForm.value.dbEngine).toBe('mysql')
      expect(createForm.value.masterPassword).toBe('')
    })
  })

  describe('deleteInstance', () => {
    it('deletes instance successfully', async () => {
      const mockInstance: RDSInstance = {
        DBInstanceIdentifier: 'db-to-delete',
        DBInstanceClass: 'db.t3.micro',
        Engine: 'mysql',
        EngineVersion: '8.0.36',
        DBInstanceStatus: 'available',
        MasterUsername: 'root',
        AllocatedStorage: 20,
        StorageType: 'gp2',
        MultiAZ: false,
        PubliclyAccessible: false,
      }

      vi.mocked(rdsApi.deleteDBInstance).mockResolvedValue(undefined)
      vi.mocked(rdsApi.describeDBInstances).mockResolvedValue([])

      const { deleteInstance, instanceToDelete, showDeleteModal, instances } = useRDS()

      instances.value = [mockInstance]
      instanceToDelete.value = mockInstance
      showDeleteModal.value = true

      await deleteInstance()

      expect(rdsApi.deleteDBInstance).toHaveBeenCalledWith('db-to-delete', { skipFinalSnapshot: true })
      expect(instances.value).toHaveLength(0)
      expect(showDeleteModal.value).toBe(false)
      expect(instanceToDelete.value).toBeNull()
      expect(mockNotifySuccess).toHaveBeenCalled()
    })

    it('does nothing if no instance to delete', async () => {
      const { deleteInstance, instanceToDelete } = useRDS()

      instanceToDelete.value = null

      await deleteInstance()

      expect(rdsApi.deleteDBInstance).not.toHaveBeenCalled()
    })

    it('handles error when deleting instance fails', async () => {
      vi.mocked(rdsApi.deleteDBInstance).mockRejectedValue(new Error('Delete failed'))

      const { deleteInstance, instanceToDelete } = useRDS()

      instanceToDelete.value = {
        DBInstanceIdentifier: 'db-1',
        DBInstanceClass: 'db.t3.micro',
        Engine: 'mysql',
        EngineVersion: '8.0.36',
        DBInstanceStatus: 'available',
        MasterUsername: 'root',
        AllocatedStorage: 20,
        StorageType: 'gp2',
        MultiAZ: false,
        PubliclyAccessible: false,
      }

      await deleteInstance()

      expect(mockNotifyError).toHaveBeenCalled()
    })

    it('removes instance from expanded set after delete', async () => {
      const mockInstance: RDSInstance = {
        DBInstanceIdentifier: 'db-1',
        DBInstanceClass: 'db.t3.micro',
        Engine: 'mysql',
        EngineVersion: '8.0.36',
        DBInstanceStatus: 'available',
        MasterUsername: 'root',
        AllocatedStorage: 20,
        StorageType: 'gp2',
        MultiAZ: false,
        PubliclyAccessible: false,
      }

      vi.mocked(rdsApi.deleteDBInstance).mockResolvedValue(undefined)

      const { deleteInstance, instanceToDelete, expandedInstances } = useRDS()

      instanceToDelete.value = mockInstance
      expandedInstances.value.add('db-1')

      await deleteInstance()

      expect(expandedInstances.value.has('db-1')).toBe(false)
    })
  })

  describe('toggleInstance', () => {
    it('expands instance on first toggle', () => {
      const { toggleInstance, expandedInstances } = useRDS()

      expect(expandedInstances.value.has('db-1')).toBe(false)

      toggleInstance('db-1')

      expect(expandedInstances.value.has('db-1')).toBe(true)
    })

    it('collapses instance on second toggle', () => {
      const { toggleInstance, expandedInstances } = useRDS()

      toggleInstance('db-1')
      expect(expandedInstances.value.has('db-1')).toBe(true)

      toggleInstance('db-1')
      expect(expandedInstances.value.has('db-1')).toBe(false)
    })

    it('can expand multiple instances', () => {
      const { toggleInstance, expandedInstances } = useRDS()

      toggleInstance('db-1')
      toggleInstance('db-2')

      expect(expandedInstances.value.has('db-1')).toBe(true)
      expect(expandedInstances.value.has('db-2')).toBe(true)
    })
  })

  describe('selectInstance and confirm functions', () => {
    it('selects instance correctly', () => {
      const { selectInstance, selectedInstance } = useRDS()

      const instance: RDSInstance = {
        DBInstanceIdentifier: 'db-1',
        DBInstanceClass: 'db.t3.micro',
        Engine: 'mysql',
        EngineVersion: '8.0.36',
        DBInstanceStatus: 'available',
        MasterUsername: 'root',
        AllocatedStorage: 20,
        StorageType: 'gp2',
        MultiAZ: false,
        PubliclyAccessible: false,
      }

      selectInstance(instance)

      expect(selectedInstance.value).toEqual(instance)
    })

    it('confirms delete sets instance and shows modal', () => {
      const { confirmDelete, instanceToDelete, showDeleteModal } = useRDS()

      const instance: RDSInstance = {
        DBInstanceIdentifier: 'db-1',
        DBInstanceClass: 'db.t3.micro',
        Engine: 'mysql',
        EngineVersion: '8.0.36',
        DBInstanceStatus: 'available',
        MasterUsername: 'root',
        AllocatedStorage: 20,
        StorageType: 'gp2',
        MultiAZ: false,
        PubliclyAccessible: false,
      }

      confirmDelete(instance)

      expect(instanceToDelete.value).toEqual(instance)
      expect(showDeleteModal.value).toBe(true)
    })

  })

  describe('getStatus', () => {
    it('returns active for available status', () => {
      const { getStatus } = useRDS()
      expect(getStatus('available')).toBe('active')
    })

    it('returns active for running status', () => {
      const { getStatus } = useRDS()
      expect(getStatus('running')).toBe('active')
    })

    it('returns pending for creating status', () => {
      const { getStatus } = useRDS()
      expect(getStatus('creating')).toBe('pending')
    })

    it('returns pending for deleting status', () => {
      const { getStatus } = useRDS()
      expect(getStatus('deleting')).toBe('pending')
    })

    it('returns inactive for deleted status', () => {
      const { getStatus } = useRDS()
      expect(getStatus('deleted')).toBe('inactive')
    })

    it('returns error for failed status', () => {
      const { getStatus } = useRDS()
      expect(getStatus('failed')).toBe('error')
    })

    it('returns inactive for unknown status', () => {
      const { getStatus } = useRDS()
      expect(getStatus('unknown')).toBe('inactive')
    })

    it('handles case insensitive status - converts to lowercase', () => {
      const { getStatus } = useRDS()
      expect(getStatus('AVAILABLE')).toBe('active') // Converts to lowercase
    })

    it('handles empty status', () => {
      const { getStatus } = useRDS()
      expect(getStatus('')).toBe('inactive')
    })
  })

  describe('instanceCount', () => {
    it('returns zero when no instances', () => {
      const { instanceCount } = useRDS()
      expect(instanceCount.value).toBe(0)
    })

    it('returns correct count with instances', () => {
      const { instanceCount, instances } = useRDS()

      instances.value = [
        { DBInstanceIdentifier: 'db-1' } as RDSInstance,
        { DBInstanceIdentifier: 'db-2' } as RDSInstance,
        { DBInstanceIdentifier: 'db-3' } as RDSInstance,
      ]

      expect(instanceCount.value).toBe(3)
    })
  })

  describe('resetForm', () => {
    it('resets form to default values', () => {
      const { resetForm, createForm } = useRDS()

      createForm.value = {
        instanceId: 'test',
        dbEngine: 'postgres',
        dbVersion: '15.3',
        masterUsername: 'admin',
        masterPassword: 'pass',
        instanceClass: 'db.t3.small',
        port: '5432',
        allocatedStorage: '50',
      }

      resetForm()

      expect(createForm.value).toEqual({
        instanceId: '',
        dbEngine: 'mysql',
        dbVersion: '8.0.36',
        masterUsername: 'root',
        masterPassword: '',
        instanceClass: 'db.t3.micro',
        port: '3306',
        allocatedStorage: '20',
      })
    })
  })

  describe('setupReloadWatcher', () => {
    it('returns reloadTrigger', () => {
      const { setupReloadWatcher } = useRDS()
      const result = setupReloadWatcher()
      expect(result).toBeDefined()
    })
  })
})
