import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { useMSK } from '@/composables/useMSK'
import MSKCreateClusterModal from '@/components/msk/MSKCreateClusterModal.vue'
import MSKDeleteClusterModal from '@/components/msk/MSKDeleteClusterModal.vue'
import MSKClusterDetails from '@/components/msk/MSKClusterDetails.vue'

// Mock services
vi.mock('@/api/services/msk', () => ({
  listClustersV2: vi.fn(),
  describeClusterV2: vi.fn(),
  createClusterV2: vi.fn(),
  deleteCluster: vi.fn(),
  getBootstrapBrokers: vi.fn(),
}))

// Mock toast
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
const mockToastWarning = vi.fn()

vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(() => ({
    success: mockToastSuccess,
    error: mockToastError,
    warning: mockToastWarning,
  })),
}))

import * as mskApi from '@/api/services/msk'

describe('MSK Integration Flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Create Cluster Flow', () => {
    it('opens create modal and creates cluster', async () => {
      vi.mocked(mskApi.createClusterV2).mockResolvedValue({})
      vi.mocked(mskApi.listClustersV2).mockResolvedValue({ ClusterInfoList: [] })

      const { showCreateModal, newCluster, createCluster } = useMSK()

      // Open modal
      showCreateModal.value = true
      expect(showCreateModal.value).toBe(true)

      // Fill form
      newCluster.value = {
        name: 'test-cluster',
        kafkaVersion: '3.6.0',
        brokerCount: 3,
        instanceType: 'kafka.m5.xlarge',
        storagePerBroker: 200,
        clientSubnets: 'subnet-123456',
      }
      expect(newCluster.value.name).toBe('test-cluster')

      // Create
      await createCluster()

      expect(mskApi.createClusterV2).toHaveBeenCalled()
      expect(mockToastSuccess).toHaveBeenCalledWith('Cluster test-cluster creation initiated')
      expect(showCreateModal.value).toBe(false)
    })

    it('validates cluster name before creation', async () => {
      const { createCluster } = useMSK()

      await createCluster()

      expect(mskApi.createClusterV2).not.toHaveBeenCalled()
      expect(mockToastWarning).toHaveBeenCalledWith('Cluster name is required')
    })

    it('handles creation error', async () => {
      vi.mocked(mskApi.createClusterV2).mockRejectedValue(new Error('Create failed'))

      const { newCluster, createCluster } = useMSK()

      newCluster.value.name = 'bad-cluster'
      await createCluster()

      expect(mockToastError).toHaveBeenCalled()
    })
  })

  describe('Delete Cluster Flow', () => {
    it('opens delete modal and deletes cluster', async () => {
      vi.mocked(mskApi.deleteCluster).mockResolvedValue({})
      vi.mocked(mskApi.listClustersV2).mockResolvedValue({ ClusterInfoList: [] })

      const { showDeleteModal, clusterToDelete, confirmDeleteCluster } = useMSK()

      // Open modal
      clusterToDelete.value = { ClusterArn: 'arn:delete', ClusterName: 'cluster-to-del', State: 'ACTIVE' }
      showDeleteModal.value = true
      expect(showDeleteModal.value).toBe(true)

      // Confirm delete
      await confirmDeleteCluster()

      expect(mskApi.deleteCluster).toHaveBeenCalledWith('arn:delete')
      expect(mockToastSuccess).toHaveBeenCalledWith('Deleting cluster cluster-to-del')
      expect(showDeleteModal.value).toBe(false)
      expect(clusterToDelete.value).toBeNull()
    })

    it('does nothing when no cluster selected for delete', async () => {
      const { confirmDeleteCluster } = useMSK()

      await confirmDeleteCluster()

      expect(mskApi.deleteCluster).not.toHaveBeenCalled()
    })
  })

  describe('Load Clusters Flow', () => {
    it('loads clusters successfully', async () => {
      const mockClusters = [
        { ClusterArn: 'arn:1', ClusterName: 'cluster-1', State: 'ACTIVE', KafkaVersion: '3.6.0', NumberOfBrokerNodes: 2, ClusterType: 'PROVISIONED' },
      ]

      vi.mocked(mskApi.listClustersV2).mockResolvedValue({
        ClusterInfoList: mockClusters,
      })

      const { loadClusters, clusters, isAvailable } = useMSK()

      await loadClusters()

      expect(clusters.value).toHaveLength(1)
      expect(clusters.value[0].ClusterName).toBe('cluster-1')
      expect(isAvailable.value).toBe(true)
    })

    it('handles API unavailability', async () => {
      vi.mocked(mskApi.listClustersV2).mockRejectedValue(new Error('MSK not available'))

      const { loadClusters, clusters, isAvailable } = useMSK()

      await loadClusters()

      expect(clusters.value).toEqual([])
      expect(isAvailable.value).toBe(false)
    })
  })

  describe('Expand Cluster Flow', () => {
    it('expands cluster and loads details', async () => {
      vi.mocked(mskApi.describeClusterV2).mockResolvedValue({
        ClusterArn: 'arn:test',
        ClusterName: 'test-cluster',
        State: 'ACTIVE',
        KafkaVersion: '3.6.0',
      })
      vi.mocked(mskApi.getBootstrapBrokers).mockResolvedValue({
        BootstrapBrokerString: 'broker1:9092',
      })

      const { toggleCluster, expandedCluster, clusterDetails, clusterBrokers } = useMSK()

      await toggleCluster('arn:test')

      expect(expandedCluster.value).toBe('arn:test')
      expect(clusterDetails.value['arn:test']).toBeDefined()
      expect(clusterDetails.value['arn:test'].ClusterName).toBe('test-cluster')
      expect(clusterBrokers.value['arn:test']).toEqual(['broker1:9092'])
    })

    it('collapses cluster when clicking again', async () => {
      const { toggleCluster, expandedCluster } = useMSK()

      expandedCluster.value = 'arn:test'
      await toggleCluster('arn:test')

      expect(expandedCluster.value).toBeNull()
    })
  })

  describe('MSKClusterDetails', () => {
    it('renders cluster ARN and details', () => {
      const wrapper = mount(MSKClusterDetails, {
        props: {
          clusterArn: 'arn:aws:kafka:us-east-1:123:cluster/test',
          details: {
            ClusterArn: 'arn:aws:kafka:us-east-1:123:cluster/test',
            ClusterName: 'test',
            State: 'ACTIVE',
            CurrentVersion: 'K3V6I1',
            NumberOfBrokerNodes: 2,
            CreationTime: '2024-01-01T00:00:00Z',
          },
          brokers: ['broker1:9092', 'broker2:9092'],
        },
      })

      expect(wrapper.text()).toContain('test')
      expect(wrapper.text()).toContain('ACTIVE')
      expect(wrapper.text()).toContain('K3V6I1')
      expect(wrapper.text()).toContain('broker1:9092')
    })

    it('shows loading state when no details', () => {
      const wrapper = mount(MSKClusterDetails, {
        props: {
          clusterArn: 'arn:test',
          details: null,
          brokers: [],
        },
      })

      expect(wrapper.text()).toContain('Loading cluster details')
    })
  })

  describe('Full User Flow', () => {
    it('completes full flow: load clusters -> expand -> view details', async () => {
      vi.mocked(mskApi.listClustersV2).mockResolvedValue({
        ClusterInfoList: [
          { ClusterArn: 'arn:1', ClusterName: 'cluster-1', State: 'ACTIVE', KafkaVersion: '3.6.0', NumberOfBrokerNodes: 2, ClusterType: 'PROVISIONED' },
        ],
      })

      vi.mocked(mskApi.describeClusterV2).mockResolvedValue({
        ClusterArn: 'arn:1',
        ClusterName: 'cluster-1',
        State: 'ACTIVE',
        KafkaVersion: '3.6.0',
        NumberOfBrokerNodes: 2,
        ClusterType: 'PROVISIONED',
        CreationTime: '2024-01-01T00:00:00Z',
      })
      vi.mocked(mskApi.getBootstrapBrokers).mockResolvedValue({
        BootstrapBrokerString: 'b-1.cluster-1:9092',
      })

      const { loadClusters, toggleCluster, clusters, expandedCluster, clusterDetails, clusterBrokers } = useMSK()

      // Load clusters
      await loadClusters()
      expect(clusters.value).toHaveLength(1)
      expect(clusters.value[0].ClusterName).toBe('cluster-1')

      // Expand cluster
      await toggleCluster('arn:1')
      expect(expandedCluster.value).toBe('arn:1')
      expect(clusterDetails.value['arn:1'].ClusterName).toBe('cluster-1')
      expect(clusterBrokers.value['arn:1']).toEqual(['b-1.cluster-1:9092'])

      // Collapse cluster
      await toggleCluster('arn:1')
      expect(expandedCluster.value).toBeNull()
    })
  })
})
