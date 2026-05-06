import type { Meta, StoryObj } from '@storybook/vue3-vite';
import DynamoDBExploreModal from './DynamoDBExploreModal.vue';

const meta: Meta<typeof DynamoDBExploreModal> = {
  title: 'Services/DynamoDB/ExploreModal',
  component: DynamoDBExploreModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, scanMode: { control: 'select', options: ['scan', 'query'] } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockItems = [
  { userId: { S: 'user-123' }, name: { S: 'John Doe' }, age: { N: '30' } },
  { userId: { S: 'user-456' }, name: { S: 'Jane Smith' }, age: { N: '25' } }
];

const mockTableDetails = {
  TableName: 'users',
  ItemCount: 150,
  SizeBytes: 2048,
  KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
  AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' }]
};

export const Open: Story = {
  args: { open: true, tableName: 'users', scanMode: 'scan', error: null, loading: false, items: mockItems, lastEvaluatedKey: null, tableDetails: mockTableDetails, pkName: 'userId', skName: null },
  render: (args) => ({ components: { DynamoDBExploreModal }, setup: () => ({ args }), template: '<div class="h-96"><DynamoDBExploreModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, tableName: 'users', scanMode: 'scan', error: null, loading: true, items: [], lastEvaluatedKey: null, tableDetails: mockTableDetails, pkName: 'userId', skName: null },
  render: (args) => ({ components: { DynamoDBExploreModal }, setup: () => ({ args }), template: '<div class="h-96"><DynamoDBExploreModal v-bind="args" /></div>' })
};

export const Error: Story = {
  args: { open: true, tableName: 'users', scanMode: 'scan', error: 'Access denied to table', loading: false, items: [], lastEvaluatedKey: null, tableDetails: null, pkName: 'userId', skName: null },
  render: (args) => ({ components: { DynamoDBExploreModal }, setup: () => ({ args }), template: '<div class="h-96"><DynamoDBExploreModal v-bind="args" /></div>' })
};

export const Empty: Story = {
  args: { open: true, tableName: 'users', scanMode: 'scan', error: null, loading: false, items: [], lastEvaluatedKey: null, tableDetails: mockTableDetails, pkName: 'userId', skName: null },
  render: (args) => ({ components: { DynamoDBExploreModal }, setup: () => ({ args }), template: '<div class="h-96"><DynamoDBExploreModal v-bind="args" /></div>' })
};

export const QueryMode: Story = {
  args: { open: true, tableName: 'users', scanMode: 'query', error: null, loading: false, items: mockItems, lastEvaluatedKey: null, tableDetails: mockTableDetails, pkName: 'userId', skName: 'createdAt' },
  render: (args) => ({ components: { DynamoDBExploreModal }, setup: () => ({ args }), template: '<div class="h-96"><DynamoDBExploreModal v-bind="args" /></div>' })
};