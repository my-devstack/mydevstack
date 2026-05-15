import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import * as mskApi from '@/api/services/msk'

// Types
export interface MSKClusterSummary {
  ClusterArn: string
  ClusterName: string
  State: string
  KafkaVersion?: string
  NumberOfBrokerNodes?: number
  ClusterType?: string
  CreationTime?: string
  Tags?: Record<string, string>
}

export interface MSKClusterDetails {
  ClusterArn: string
  ClusterName: string
  State: string
  KafkaVersion?: string
  NumberOfBrokerNodes?: number
  ClusterType?: string
  CreationTime?: string
  CurrentVersion?: string
  Provisioned?: {
    BrokerNodeGroupInfo?: {
      InstanceType?: string
      StorageInfo?: {
        EbsStorageInfo?: { VolumeSize?: number }
      }
    }
  }
  Serverless?: Record<string, any>
}

export interface MSKBrokerInfo {
  BrokerId?: number
  Endpoint?: string
  AttachedENIId?: string
}

export interface MSKNodeInfo {
  BrokerNodeInfo?: {
    ClientBroker?: string
    ClientSubnet?: string
    ClientVpcIpAddress?: string
  }
  NodeType?: string
  InstanceType?: string
}

export function useMSK() {
  const toast = useToast()

  // State
  const clusters = ref<MSKClusterSummary[]>([])
  const isLoading = ref(false)
  const isAvailable = ref(true)

  // Modal states
  const showCreateModal = ref(false)
  const showDeleteModal = ref(false)
  const clusterToDelete = ref<MSKClusterSummary | null>(null)

  // Expanded cluster details
  const expandedCluster = ref<string | null>(null)
  const clusterDetails = ref<Record<string, MSKClusterDetails>>({})
  const clusterBrokers = ref<Record<string, string[]>>({})

  // Create form state
  const newCluster = ref({
    name: '',
    kafkaVersion: '3.6.0',
    brokerCount: 2,
    instanceType: 'kafka.m5.large',
    storagePerBroker: 100,
    clientSubnets: 'subnet-123456',
  })

  // Computed
  const clusterCount = computed(() => clusters.value.length)

  const clusterColumns = computed(() => [
    { key: 'ClusterName', label: 'Cluster Name', sortable: true },
    { key: 'KafkaVersion', label: 'Kafka Version', sortable: true },
    { key: 'State', label: 'State', sortable: true },
    { key: 'ClusterType', label: 'Type', sortable: true },
    { key: 'NumberOfBrokerNodes', label: 'Brokers', sortable: true },
  ])

  // Helper functions
  function getStatusColor(state: string): string {
    const colors: Record<string, string> = {
      ACTIVE: 'text-green-600',
      CREATING: 'text-yellow-600',
      DELETING: 'text-red-600',
      FAILED: 'text-red-600',
    }
    return colors[state] || 'text-gray-600'
  }

  function getStatusBadge(status: string): 'active' | 'pending' | 'inactive' | 'error' {
    const statusMap: Record<string, 'active' | 'pending' | 'inactive' | 'error'> = {
      ACTIVE: 'active',
      CREATING: 'pending',
      DELETING: 'pending',
      UPDATING: 'pending',
    }
    return statusMap[status] || 'inactive'
  }

  // API functions
  async function loadClusters() {
    isLoading.value = true
    try {
      const result = await mskApi.listClustersV2()
      clusters.value = result.ClusterInfoList || []
      isAvailable.value = true
    } catch (err: any) {
      // If API fails entirely, mark as unavailable
      isAvailable.value = false
      clusters.value = []
      console.warn('MSK not available:', err.message || err)
    } finally {
      isLoading.value = false
    }
  }

  async function toggleCluster(arn: string) {
    if (expandedCluster.value === arn) {
      expandedCluster.value = null
      return
    }
    expandedCluster.value = arn

    // Lazy load details
    if (!clusterDetails.value[arn]) {
      try {
        const detail = await mskApi.describeClusterV2(arn)
        clusterDetails.value[arn] = detail
      } catch (err: any) {
        toast.error(`Failed to describe cluster: ${err.message || err}`)
      }
    }
    if (!clusterBrokers.value[arn]) {
      try {
        const brokers = await mskApi.getBootstrapBrokers(arn)
        clusterBrokers.value[arn] = brokers.BootstrapBrokerString?.split(',') || []
      } catch { /* ignore broker fetch failures */ }
    }
  }

  async function createCluster() {
    if (!newCluster.value.name) {
      toast.warning('Cluster name is required')
      return
    }

    isLoading.value = true
    try {
      const subnets = newCluster.value.clientSubnets
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
      const params = {
        ClusterName: newCluster.value.name,
        Provisioned: {
          KafkaVersion: newCluster.value.kafkaVersion,
          NumberOfBrokerNodes: newCluster.value.brokerCount,
          BrokerNodeGroupInfo: {
            InstanceType: newCluster.value.instanceType,
            ClientSubnets: subnets,
            StorageInfo: {
              EbsStorageInfo: {
                VolumeSize: newCluster.value.storagePerBroker,
              },
            },
          },
        },
      }
      await mskApi.createClusterV2(params)
      toast.success(`Cluster ${newCluster.value.name} creation initiated`)
      showCreateModal.value = false
      newCluster.value = {
        name: '',
        kafkaVersion: '3.6.0',
        brokerCount: 2,
        instanceType: 'kafka.m5.large',
        storagePerBroker: 100,
        clientSubnets: 'subnet-123456',
      }
      await loadClusters()
    } catch (err: any) {
      toast.error(`Failed to create cluster: ${err.message || err}`)
    } finally {
      isLoading.value = false
    }
  }

  function openDeleteModal(cluster: MSKClusterSummary) {
    clusterToDelete.value = cluster
    showDeleteModal.value = true
  }

  async function confirmDeleteCluster() {
    if (!clusterToDelete.value) return

    isLoading.value = true
    try {
      await mskApi.deleteCluster(clusterToDelete.value.ClusterArn)
      toast.success(`Deleting cluster ${clusterToDelete.value.ClusterName}`)
      showDeleteModal.value = false
      clusterToDelete.value = null
      await loadClusters()
    } catch (err: any) {
      toast.error(`Failed to delete cluster: ${err.message || err}`)
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    clusters,
    isLoading,
    isAvailable,
    showCreateModal,
    showDeleteModal,
    clusterToDelete,
    expandedCluster,
    clusterDetails,
    clusterBrokers,
    newCluster,

    // Computed
    clusterCount,
    clusterColumns,

    // Functions
    loadClusters,
    toggleCluster,
    createCluster,
    openDeleteModal,
    confirmDeleteCluster,
    getStatusColor,
    getStatusBadge,
  }
}
