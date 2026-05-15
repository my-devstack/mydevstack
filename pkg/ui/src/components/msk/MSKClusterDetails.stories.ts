import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MSKClusterDetails from './MSKClusterDetails.vue';

const meta: Meta<typeof MSKClusterDetails> = {
  title: 'Services/MSK/ClusterDetails',
  component: MSKClusterDetails,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    clusterArn: 'arn:aws:kafka:us-east-1:123456789:cluster/test-cluster',
    details: null,
    brokers: [],
    nodes: [],
  }
};

export const Loading: Story = {
  args: {
    clusterArn: 'arn:aws:kafka:us-east-1:123456789:cluster/test-cluster',
    details: undefined,
    brokers: [],
  }
};

export const WithData: Story = {
  args: {
    clusterArn: 'arn:aws:kafka:us-east-1:123456789:cluster/analytics',
    details: {
      ClusterArn: 'arn:aws:kafka:us-east-1:123456789:cluster/analytics',
      ClusterName: 'analytics',
      State: 'ACTIVE',
      CurrentVersion: 'K3V6I1',
      NumberOfBrokerNodes: 3,
      CreationTime: '2024-06-15T10:30:00Z',
      Provisioned: {
        BrokerNodeGroupInfo: {
          InstanceType: 'kafka.m5.large',
          StorageInfo: { EbsStorageInfo: { VolumeSize: 100 } },
        },
      },
    },
    brokers: ['b-1.analytics:9092', 'b-2.analytics:9092', 'b-3.analytics:9092'],
  }
};

export const ServerlessCluster: Story = {
  args: {
    clusterArn: 'arn:aws:kafka:us-east-1:123456789:cluster/serverless-cluster',
    details: {
      ClusterArn: 'arn:aws:kafka:us-east-1:123456789:cluster/serverless-cluster',
      ClusterName: 'serverless-cluster',
      State: 'ACTIVE',
      CurrentVersion: 'KV1',
      CreationTime: '2024-07-01T12:00:00Z',
      Serverless: { /* serverless details */ },
    },
    brokers: ['b-1.serverless-cluster:9098'],
  }
};

export const FailedCluster: Story = {
  args: {
    clusterArn: 'arn:aws:kafka:us-east-1:123456789:cluster/failed-cluster',
    details: {
      ClusterArn: 'arn:aws:kafka:us-east-1:123456789:cluster/failed-cluster',
      ClusterName: 'failed-cluster',
      State: 'FAILED',
      CurrentVersion: 'KV1',
      CreationTime: '2024-05-01T08:00:00Z',
    },
    brokers: [],
  }
};
