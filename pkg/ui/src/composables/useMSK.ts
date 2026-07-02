import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import { useSettingsStore } from '@/stores/settings'
import * as mskApi from '@/api/services/msk'
import type { VpcSelection } from '@/types/vpc'

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
  const settingsStore = useSettingsStore()

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
    vpcSelection: null as VpcSelection | null,
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
    // Check if emulator is ministack — skip API calls
    if (settingsStore.emulator && settingsStore.emulator.toLowerCase() === 'ministack') {
      isAvailable.value = false
      clusters.value = []
      isLoading.value = false
      return
    }
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

    if (!newCluster.value.vpcSelection || !newCluster.value.vpcSelection.vpcId) {
      toast.warning('VPC configuration is required for MSK clusters')
      return
    }

    isLoading.value = true
    try {
      const vpcSelection = newCluster.value.vpcSelection
      const params: Record<string, any> = {
        ClusterName: newCluster.value.name,
        Provisioned: {
          KafkaVersion: newCluster.value.kafkaVersion,
          NumberOfBrokerNodes: newCluster.value.brokerCount,
          BrokerNodeGroupInfo: {
            InstanceType: newCluster.value.instanceType,
            BrokerAZDistribution: 'DEFAULT',
            StorageInfo: {
              EbsStorageInfo: {
                VolumeSize: newCluster.value.storagePerBroker,
              },
            },
          },
        },
      }
      if (vpcSelection) {
        params.Provisioned.BrokerNodeGroupInfo.ClientSubnets = vpcSelection.subnetIds
        params.Provisioned.BrokerNodeGroupInfo.SecurityGroups = vpcSelection.securityGroupIds
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
        vpcSelection: null,
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

  // Code examples
  const codeExamples = computed(() => [
    {
      language: 'aws-cli',
      label: 'AWS CLI',
      code: `# List MSK clusters
aws kafka list-clusters-v2 --endpoint-url http://localhost:4566

# Create cluster
aws kafka create-cluster-v2 \\
  --cluster-name my-cluster \\
  --provisioned '{
    "KafkaVersion": "3.6.0",
    "NumberOfBrokerNodes": 2,
    "BrokerNodeGroupInfo": {
      "InstanceType": "kafka.m5.large",
      "ClientSubnets": ["subnet-123456"],
      "StorageInfo": {
        "EbsStorageInfo": { "VolumeSize": 100 }
      }
    }
  }' \\
  --endpoint-url http://localhost:4566

# Describe cluster
aws kafka describe-cluster-v2 \\
  --cluster-arn arn:aws:kafka:us-east-1:123456789:cluster/my-cluster \\
  --endpoint-url http://localhost:4566

# Get bootstrap brokers
aws kafka get-bootstrap-brokers \\
  --cluster-arn arn:aws:kafka:us-east-1:123456789:cluster/my-cluster \\
  --endpoint-url http://localhost:4566

# List nodes
aws kafka list-nodes \\
  --cluster-arn arn:aws:kafka:us-east-1:123456789:cluster/my-cluster \\
  --endpoint-url http://localhost:4566

# Delete cluster
aws kafka delete-cluster \\
  --cluster-arn arn:aws:kafka:us-east-1:123456789:cluster/my-cluster \\
  --endpoint-url http://localhost:4566`
    },
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `// Using AWS SDK v3
import { KafkaClient, CreateClusterV2Command, ListClustersV2Command, DeleteClusterCommand } from "@aws-sdk/client-kafka";

const client = new KafkaClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:4566',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

// Create cluster (type is PROVISIONED when Provisioned field is set)
await client.send(new CreateClusterV2Command({
  ClusterName: 'my-cluster',
  Provisioned: {
    KafkaVersion: '3.6.0',
    NumberOfBrokerNodes: 2,
    BrokerNodeGroupInfo: {
      InstanceType: 'kafka.m5.large',
      ClientSubnets: ['subnet-123456'],
      StorageInfo: {
        EbsStorageInfo: { VolumeSize: 100 },
      },
    },
  },
}));

// List clusters
const { ClusterInfoList } = await client.send(new ListClustersV2Command({}));
console.log(ClusterInfoList);

// Delete cluster
await client.send(new DeleteClusterCommand({
  ClusterArn: 'arn:aws:kafka:us-east-1:123456789:cluster/my-cluster',
}));`
    },
    {
      language: 'python',
      label: 'Python',
      code: `# Using boto3
import boto3
import json

client = boto3.client(
    'kafka',
    region_name='us-east-1',
    endpoint_url='http://localhost:4566',
    aws_access_key_id='test',
    aws_secret_access_key='test',
)

# List clusters
response = client.list_clusters_v2()
for cluster in response['ClusterInfoList']:
    print(cluster['ClusterName'], cluster['State'])

# Create cluster (type is PROVISIONED when Provisioned is provided)
client.create_cluster_v2(
    ClusterName='my-cluster',
    Provisioned={
        'KafkaVersion': '3.6.0',
        'NumberOfBrokerNodes': 2,
        'BrokerNodeGroupInfo': {
            'InstanceType': 'kafka.m5.large',
            'ClientSubnets': ['subnet-123456'],
            'StorageInfo': {
                'EbsStorageInfo': {'VolumeSize': 100},
            },
        },
    },
)

# Get bootstrap brokers
brokers = client.get_bootstrap_brokers(
    ClusterArn='arn:aws:kafka:us-east-1:123456789:cluster/my-cluster'
)
print(brokers['BootstrapBrokerString'])

# Delete cluster
client.delete_cluster(
    ClusterArn='arn:aws:kafka:us-east-1:123456789:cluster/my-cluster'
)`
    },
    {
      language: 'go',
      label: 'Go',
      code: `// Using AWS SDK for Go v2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/kafka"
    "github.com/aws/aws-sdk-go-v2/service/kafka/types"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("us-east-1"),
)

client := kafka.NewFromConfig(cfg, func(o *kafka.Options) {
    o.BaseEndpoint = aws.String("http://localhost:4566")
})

// List clusters
clusters, _ := client.ListClustersV2(context.Background(), &kafka.ListClustersV2Input{})
for _, c := range clusters.ClusterInfoList {
    fmt.Println(*c.ClusterName, *c.State)
}

// Create cluster (type is PROVISIONED when Provisioned is set)
client.CreateClusterV2(context.Background(), &kafka.CreateClusterV2Input{
    ClusterName: aws.String("my-cluster"),
    Provisioned: &types.ProvisionedRequest{
        KafkaVersion:       aws.String("3.6.0"),
        NumberOfBrokerNodes: aws.Int32(2),
        BrokerNodeGroupInfo: &types.BrokerNodeGroupInfo{
            InstanceType:   aws.String("kafka.m5.large"),
            ClientSubnets:  []string{"subnet-123456"},
            StorageInfo: &types.StorageInfo{
                EbsStorageInfo: &types.EBSStorageInfo{
                    VolumeSize: aws.Int32(100),
                },
            },
        },
    },
})

// Get bootstrap brokers
brokers, _ := client.GetBootstrapBrokers(context.Background(), &kafka.GetBootstrapBrokersInput{
    ClusterArn: aws.String("arn:aws:kafka:us-east-1:123456789:cluster/my-cluster"),
})
fmt.Println(*brokers.BootstrapBrokerString)

// Delete cluster
client.DeleteCluster(context.Background(), &kafka.DeleteClusterInput{
    ClusterArn: aws.String("arn:aws:kafka:us-east-1:123456789:cluster/my-cluster"),
})`
    },
  ])

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
    codeExamples,

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
