import type { Meta, StoryObj } from '@storybook/vue3';
import DynamoDBStreamModal from './DynamoDBStreamModal.vue';

const meta: Meta<typeof DynamoDBStreamModal> = {
  title: 'Services/DynamoDB/StreamModal',
  component: DynamoDBStreamModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockStreams = [
  { StreamArn: 'arn:aws:dynamodb:us-east-1:123456789012:stream/users', StreamStatus: 'ACTIVE', StreamViewType: 'NEW_AND_OLD_IMAGES', TableName: 'users' }
];

const mockShards = [
  { ShardId: 'shardId-001', SequenceNumberRange: { StartingSequenceNumber: '100000000000000000001' } }
];

const mockRecords = [
  { eventName: 'INSERT', dynamodb: { ApproximateCreationDateTime: 1704067200 } },
  { eventName: 'MODIFY', dynamodb: { ApproximateCreationDateTime: 1704067201 } }
];

export const Open: Story = {
  args: { open: true, tableName: 'users', streams: mockStreams, shards: mockShards, loading: false, error: null, records: mockRecords, selectedStream: mockStreams[0] },
  render: (args) => ({ components: { DynamoDBStreamModal }, setup: () => ({ args }), template: '<div class="h-96"><DynamoDBStreamModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, tableName: 'users', streams: mockStreams, shards: [], loading: true, error: null, records: [], selectedStream: mockStreams[0] },
  render: (args) => ({ components: { DynamoDBStreamModal }, setup: () => ({ args }), template: '<div class="h-96"><DynamoDBStreamModal v-bind="args" /></div>' })
};

export const Empty: Story = {
  args: { open: true, tableName: 'users', streams: [], shards: [], loading: false, error: null, records: [], selectedStream: null },
  render: (args) => ({ components: { DynamoDBStreamModal }, setup: () => ({ args }), template: '<div class="h-96"><DynamoDBStreamModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, tableName: 'users', streams: mockStreams, shards: mockShards, loading: false, error: null, records: mockRecords, selectedStream: mockStreams[0] },
  render: (args) => ({ components: { DynamoDBStreamModal }, setup: () => ({ args }), template: '<div class="h-96"><DynamoDBStreamModal v-bind="args" /></div>' })
};