import type { Meta, StoryObj } from '@storybook/vue3-vite';
import DynamoDBViewTableModal from './DynamoDBViewTableModal.vue';

const meta: Meta<typeof DynamoDBViewTableModal> = {
  title: 'Services/DynamoDB/ViewTableModal',
  component: DynamoDBViewTableModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockDetails = {
  TableName: 'users',
  ItemCount: 150,
  SizeBytes: 2048,
  BillingMode: 'PAY_PER_REQUEST',
  KeySchema: [
    { AttributeName: 'userId', KeyType: 'HASH' },
    { AttributeName: 'createdAt', KeyType: 'RANGE' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'userId', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'S' }
  ],
  StreamSpecification: { StreamEnabled: true, StreamViewType: 'NEW_AND_OLD_IMAGES' }
};

export const Open: Story = {
  args: { open: true, tableName: 'users', tableDetails: mockDetails, loading: false, error: null },
  render: (args) => ({ components: { DynamoDBViewTableModal }, setup: () => ({ args }), template: '<div class="h-96"><DynamoDBViewTableModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, tableName: 'users', tableDetails: null, loading: true, error: null },
  render: (args) => ({ components: { DynamoDBViewTableModal }, setup: () => ({ args }), template: '<div class="h-96"><DynamoDBViewTableModal v-bind="args" /></div>' })
};

export const Error: Story = {
  args: { open: true, tableName: 'users', tableDetails: null, loading: false, error: 'Failed to load table' },
  render: (args) => ({ components: { DynamoDBViewTableModal }, setup: () => ({ args }), template: '<div class="h-96"><DynamoDBViewTableModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, tableName: 'users', tableDetails: mockDetails, loading: false, error: null },
  render: (args) => ({ components: { DynamoDBViewTableModal }, setup: () => ({ args }), template: '<div class="h-96"><DynamoDBViewTableModal v-bind="args" /></div>' })
};