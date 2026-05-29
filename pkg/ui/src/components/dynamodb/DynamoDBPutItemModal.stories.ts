import type { Meta, StoryObj } from '@storybook/vue3';
import DynamoDBPutItemModal from './DynamoDBPutItemModal.vue';

const meta: Meta<typeof DynamoDBPutItemModal> = {
  title: 'Services/DynamoDB/PutItemModal',
  component: DynamoDBPutItemModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockKeySchema = [
  { AttributeName: 'userId', KeyType: 'HASH' },
  { AttributeName: 'createdAt', KeyType: 'RANGE' }
];

export const Open: Story = {
  args: { open: true, keySchema: mockKeySchema, loading: false, error: null, modelValue: '{}' },
  render: (args) => ({ components: { DynamoDBPutItemModal }, setup: () => ({ args }), template: '<div class="h-64"><DynamoDBPutItemModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, keySchema: mockKeySchema, loading: true, error: null, modelValue: '{}' },
  render: (args) => ({ components: { DynamoDBPutItemModal }, setup: () => ({ args }), template: '<div class="h-64"><DynamoDBPutItemModal v-bind="args" /></div>' })
};

export const Error: Story = {
  args: { open: true, keySchema: mockKeySchema, loading: false, error: 'Invalid JSON syntax', modelValue: '{' },
  render: (args) => ({ components: { DynamoDBPutItemModal }, setup: () => ({ args }), template: '<div class="h-64"><DynamoDBPutItemModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, keySchema: mockKeySchema, loading: false, error: null, modelValue: '{}' },
  render: (args) => ({ components: { DynamoDBPutItemModal }, setup: () => ({ args }), template: '<div class="h-64"><DynamoDBPutItemModal v-bind="args" /></div>' })
};