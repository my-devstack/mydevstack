import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { useMSK } from './useMSK'

// Mock the MSK API module
vi.mock('@/api/services/msk', () => ({
  listClustersV2: vi.fn(),
  describeClusterV2: vi.fn(),
  createClusterV2: vi.fn(),
  deleteCluster: vi.fn(),
  getBootstrapBrokers: vi.fn(),
  listNodes: vi.fn(),
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

import * as mskApi from '@/api/services/msk'

describe('useMSK', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('initializes with empty state', () => {
      const {
        clusters,
        isLoading,
        isAvailable,
        showCreateModal,
        showDeleteModal,
        clusterToDelete,
        expandedCluster,
        clusterDetails,
        clusterBrokers,
        clusterCount,
      } = useMSK()

      expect(clusters.value).toEqual([])
      expect(isLoading.value).toBe(false)
      expect(isAvailable.value).toBe(true)
      expect(showCreateModal.value).toBe(false)
      expect(showDeleteModal.value).toBe(false)
      expect(clusterToDelete.value).toBeNull()
      expect(expandedCluster.value).toBeNull()
      expect(clusterDetails.value).toEqual({})
      expect(clusterBrokers.value).toEqual({})
      expect(clusterCount.value).toBe(0)
    })
  })

  describe('loadClusters', () => {
    it('loads clusters successfully', async () => {
      const mockClusters = [
        { ClusterArn: 'arn:1', ClusterName: 'cluster-1', State: 'ACTIVE', KafkaVersion: '3.6.0', NumberOfBrokerNodes: 2, ClusterType: 'PROVISIONED' },
        { ClusterArn: 'arn:2', ClusterName: 'cluster-2', State: 'CREATING', KafkaVersion: '3.5.1', NumberOfBrokerNodes: 3, ClusterType: 'PROVISIONED' },
      ]

      vi.mocked(mskApi.listClustersV2).mockResolvedValue({
        ClusterInfoList: mockClusters,
      })

      const { loadClusters, clusters, isLoading, isAvailable } = useMSK()

      await loadClusters()

      expect(mskApi.listClustersV2).toHaveBeenCalled()
      expect(clusters.value).toHaveLength(2)
      expect(clusters.value[0].ClusterName).toBe('cluster-1')
      expect(clusters.value[1].State).toBe('CREATING')
      expect(isLoading.value).toBe(false)
      expect(isAvailable.value).toBe(true)
    })

    it('handles empty cluster list', async () => {
      vi.mocked(mskApi.listClustersV2).mockResolvedValue({
        ClusterInfoList: [],
      })

      const { loadClusters, clusters } = useMSK()

      await loadClusters()

      expect(clusters.value).toEqual([])
      expect(mskApi.listClustersV2).toHaveBeenCalled()
    })

    it('sets isAvailable to false when API fails', async () => {
      vi.mocked(mskApi.listClustersV2).mockRejectedValue(new Error('MSK not available'))

      const { loadClusters, clusters, isAvailable, isLoading } = useMSK()

      await loadClusters()

      expect(clusters.value).toEqual([])
      expect(isAvailable.value).toBe(false)
      expect(isLoading.value).toBe(false)
    })

    it('skips API call and sets unavailable when emulator is ministack', async () => {
      const settingsStore = useSettingsStore()
      settingsStore.emulator = 'MINISTACK'

      const { loadClusters, clusters, isAvailable, isLoading } = useMSK()

      await loadClusters()

      expect(mskApi.listClustersV2).not.toHaveBeenCalled()
      expect(clusters.value).toEqual([])
      expect(isAvailable.value).toBe(false)
      expect(isLoading.value).toBe(false)
    })
  })

  describe('toggleCluster', () => {
    it('expands and collapses cluster', async () => {
      vi.mocked(mskApi.describeClusterV2).mockResolvedValue({ ClusterName: 'test-cluster', State: 'ACTIVE' })
      vi.mocked(mskApi.getBootstrapBrokers).mockResolvedValue({ BootstrapBrokerString: 'broker1:9092,broker2:9092' })

      const { toggleCluster, expandedCluster, clusterDetails, clusterBrokers } = useMSK()

      // Expand
      await toggleCluster('arn:test')
      expect(expandedCluster.value).toBe('arn:test')
      expect(clusterDetails.value['arn:test'].ClusterName).toBe('test-cluster')
      expect(clusterBrokers.value['arn:test']).toEqual(['broker1:9092', 'broker2:9092'])

      // Collapse
      await toggleCluster('arn:test')
      expect(expandedCluster.value).toBeNull()
    })

    it('lazy loads details only once', async () => {
      vi.mocked(mskApi.describeClusterV2).mockResolvedValue({ ClusterName: 'test', State: 'ACTIVE' })
      vi.mocked(mskApi.getBootstrapBrokers).mockResolvedValue({ BootstrapBrokerString: '' })

      const { toggleCluster, expandedCluster } = useMSK()

      // Expand
      await toggleCluster('arn:test')
      expect(mskApi.describeClusterV2).toHaveBeenCalledTimes(1)

      // Collapse and re-expand
      await toggleCluster('arn:test')
      await toggleCluster('arn:test')
      // Should not call describeClusterV2 again (cached)
      expect(mskApi.describeClusterV2).toHaveBeenCalledTimes(1)
    })

    it('handles describe error gracefully', async () => {
      vi.mocked(mskApi.describeClusterV2).mockRejectedValue(new Error('Not found'))

      const { toggleCluster, expandedCluster } = useMSK()

      await toggleCluster('arn:bad')
      expect(expandedCluster.value).toBe('arn:bad')
      expect(mockToastError).toHaveBeenCalled()
    })
  })

  describe('createCluster', () => {
    it('creates cluster successfully', async () => {
      vi.mocked(mskApi.createClusterV2).mockResolvedValue({})
      vi.mocked(mskApi.listClustersV2).mockResolvedValue({ ClusterInfoList: [] })

      const { createCluster, newCluster, showCreateModal, isLoading } = useMSK()

      newCluster.value = {
        name: 'test-cluster',
        kafkaVersion: '3.6.0',
        brokerCount: 3,
        instanceType: 'kafka.m5.xlarge',
        storagePerBroker: 200,
        clientSubnets: 'subnet-123456',
      }

      await createCluster()

      expect(mskApi.createClusterV2).toHaveBeenCalled()
      expect(showCreateModal.value).toBe(false)
      expect(mockToastSuccess).toHaveBeenCalledWith('Cluster test-cluster creation initiated')
    })

    it('validates cluster name required', async () => {
      const { createCluster } = useMSK()

      await createCluster()

      expect(mskApi.createClusterV2).not.toHaveBeenCalled()
      expect(mockToastWarning).toHaveBeenCalledWith('Cluster name is required')
    })

    it('handles error when creating cluster fails', async () => {
      vi.mocked(mskApi.createClusterV2).mockRejectedValue(new Error('Create failed'))

      const { createCluster, newCluster } = useMSK()

      newCluster.value.name = 'bad-cluster'
      await createCluster()

      expect(mockToastError).toHaveBeenCalled()
    })
  })

  describe('openDeleteModal and confirmDeleteCluster', () => {
    it('opens delete modal with cluster', () => {
      const { openDeleteModal, showDeleteModal, clusterToDelete } = useMSK()

      const cluster = { ClusterArn: 'arn:del', ClusterName: 'to-delete', State: 'ACTIVE' }
      openDeleteModal(cluster)

      expect(showDeleteModal.value).toBe(true)
      expect(clusterToDelete.value).toEqual(cluster)
    })

    it('deletes cluster successfully', async () => {
      vi.mocked(mskApi.deleteCluster).mockResolvedValue({})
      vi.mocked(mskApi.listClustersV2).mockResolvedValue({ ClusterInfoList: [] })

      const { confirmDeleteCluster, clusterToDelete, showDeleteModal } = useMSK()

      clusterToDelete.value = { ClusterArn: 'arn:del', ClusterName: 'del-cluster', State: 'ACTIVE' }

      await confirmDeleteCluster()

      expect(mskApi.deleteCluster).toHaveBeenCalledWith('arn:del')
      expect(showDeleteModal.value).toBe(false)
      expect(clusterToDelete.value).toBeNull()
      expect(mockToastSuccess).toHaveBeenCalledWith('Deleting cluster del-cluster')
    })

    it('does nothing if no cluster to delete', async () => {
      const { confirmDeleteCluster } = useMSK()

      await confirmDeleteCluster()

      expect(mskApi.deleteCluster).not.toHaveBeenCalled()
    })

    it('handles error when delete fails', async () => {
      vi.mocked(mskApi.deleteCluster).mockRejectedValue(new Error('Delete failed'))

      const { confirmDeleteCluster, clusterToDelete } = useMSK()

      clusterToDelete.value = { ClusterArn: 'arn:del', ClusterName: 'del-cluster', State: 'ACTIVE' }

      await confirmDeleteCluster()

      expect(mockToastError).toHaveBeenCalled()
    })
  })

  describe('getStatusColor', () => {
    it('returns correct color for ACTIVE', () => {
      const { getStatusColor } = useMSK()
      expect(getStatusColor('ACTIVE')).toBe('text-green-600')
    })

    it('returns correct color for CREATING', () => {
      const { getStatusColor } = useMSK()
      expect(getStatusColor('CREATING')).toBe('text-yellow-600')
    })

    it('returns correct color for DELETING', () => {
      const { getStatusColor } = useMSK()
      expect(getStatusColor('DELETING')).toBe('text-red-600')
    })

    it('returns correct color for FAILED', () => {
      const { getStatusColor } = useMSK()
      expect(getStatusColor('FAILED')).toBe('text-red-600')
    })

    it('returns default gray for unknown state', () => {
      const { getStatusColor } = useMSK()
      expect(getStatusColor('UNKNOWN')).toBe('text-gray-600')
    })
  })

  describe('getStatusBadge', () => {
    it('returns active for ACTIVE', () => {
      const { getStatusBadge } = useMSK()
      expect(getStatusBadge('ACTIVE')).toBe('active')
    })

    it('returns pending for CREATING', () => {
      const { getStatusBadge } = useMSK()
      expect(getStatusBadge('CREATING')).toBe('pending')
    })

    it('returns pending for DELETING', () => {
      const { getStatusBadge } = useMSK()
      expect(getStatusBadge('DELETING')).toBe('pending')
    })

    it('returns pending for UPDATING', () => {
      const { getStatusBadge } = useMSK()
      expect(getStatusBadge('UPDATING')).toBe('pending')
    })

    it('returns inactive for unknown state', () => {
      const { getStatusBadge } = useMSK()
      expect(getStatusBadge('UNKNOWN')).toBe('inactive')
      expect(getStatusBadge('RANDOM')).toBe('inactive')
    })
  })

  describe('clusterCount', () => {
    it('returns correct count', () => {
      const { clusters, clusterCount } = useMSK()

      expect(clusterCount.value).toBe(0)

      clusters.value = [
        { ClusterArn: 'a1', ClusterName: 'c1', State: 'ACTIVE' },
        { ClusterArn: 'a2', ClusterName: 'c2', State: 'ACTIVE' },
      ]

      expect(clusterCount.value).toBe(2)
    })
  })
})
