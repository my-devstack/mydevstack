import type { Meta, StoryObj } from '@storybook/vue3';
import MSKList from './MSKList.vue';

const meta: Meta<typeof MSKList> = {
  title: 'Services/MSK/List',
  component: MSKList,
  tags: ['autodocs'],
  argTypes: { isLoading: { control: 'boolean' } },
  args: { isLoading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockClusters = [
  { ClusterArn: 'arn:aws:kafka:us-east-1:123456789:cluster/analytics-cluster', ClusterName: 'analytics-cluster', State: 'ACTIVE', KafkaVersion: '3.6.0', NumberOfBrokerNodes: 3, ClusterType: 'PROVISIONED' },
  { ClusterArn: 'arn:aws:kafka:us-east-1:123456789:cluster/streaming-cluster', ClusterName: 'streaming-cluster', State: 'ACTIVE', KafkaVersion: '3.5.1', NumberOfBrokerNodes: 2, ClusterType: 'PROVISIONED' },
  { ClusterArn: 'arn:aws:kafka:us-east-1:123456789:cluster/new-cluster', ClusterName: 'new-cluster', State: 'CREATING', KafkaVersion: '3.6.0', NumberOfBrokerNodes: 2, ClusterType: 'PROVISIONED' },
];

export const Default: Story = {
  args: {
    clusters: mockClusters,
    columns: [
      { key: 'ClusterName', label: 'Cluster Name', sortable: true },
      { key: 'KafkaVersion', label: 'Kafka Version', sortable: true },
      { key: 'State', label: 'State', sortable: true },
      { key: 'ClusterType', label: 'Type', sortable: true },
      { key: 'NumberOfBrokerNodes', label: 'Brokers', sortable: true },
    ],
  }
};

export const Loading: Story = {
  args: { clusters: [], isLoading: true, columns: [] }
};

export const Empty: Story = {
  args: { clusters: [], isLoading: false, columns: [] }
};

export const SingleCluster: Story = {
  args: {
    clusters: [mockClusters[0]],
    columns: [
      { key: 'ClusterName', label: 'Cluster Name', sortable: true },
      { key: 'KafkaVersion', label: 'Kafka Version', sortable: true },
      { key: 'State', label: 'State', sortable: true },
      { key: 'ClusterType', label: 'Type', sortable: true },
      { key: 'NumberOfBrokerNodes', label: 'Brokers', sortable: true },
    ],
  }
};

export const WithExpanded: Story = {
  args: {
    clusters: mockClusters,
    expandedCluster: mockClusters[0].ClusterArn,
    clusterDetails: {
      [mockClusters[0].ClusterArn]: {
        ClusterArn: mockClusters[0].ClusterArn,
        ClusterName: mockClusters[0].ClusterName,
        State: 'ACTIVE',
        KafkaVersion: '3.6.0',
        NumberOfBrokerNodes: 3,
        ClusterType: 'PROVISIONED',
        CreationTime: '2024-06-15T10:30:00Z',
        Provisioned: {
          BrokerNodeGroupInfo: {
            InstanceType: 'kafka.m5.large',
            StorageInfo: { EbsStorageInfo: { VolumeSize: 100 } },
          },
        },
      },
    },
    clusterBrokers: {
      [mockClusters[0].ClusterArn]: ['b-1.analytics-cluster:9092', 'b-2.analytics-cluster:9092', 'b-3.analytics-cluster:9092'],
    },
    clusterNodes: {
      [mockClusters[0].ClusterArn]: [
        { NodeType: 'BROKER', BrokerNodeInfo: { ClientVpcIpAddress: '10.0.1.10', ClientSubnet: 'subnet-abc' } },
        { NodeType: 'BROKER', BrokerNodeInfo: { ClientVpcIpAddress: '10.0.2.10', ClientSubnet: 'subnet-def' } },
      ],
    },
    columns: [
      { key: 'ClusterName', label: 'Cluster Name', sortable: true },
      { key: 'KafkaVersion', label: 'Kafka Version', sortable: true },
      { key: 'State', label: 'State', sortable: true },
      { key: 'ClusterType', label: 'Type', sortable: true },
      { key: 'NumberOfBrokerNodes', label: 'Brokers', sortable: true },
    ],
  }
};
