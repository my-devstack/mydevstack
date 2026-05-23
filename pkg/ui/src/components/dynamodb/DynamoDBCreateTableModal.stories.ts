import type { Meta, StoryObj } from '@storybook/vue3';
import DynamoDBCreateTableModal from './DynamoDBCreateTableModal.vue';

const meta: Meta<typeof DynamoDBCreateTableModal> = {
  title: 'Services/DynamoDB/CreateTableModal',
  component: DynamoDBCreateTableModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, loading: { control: 'boolean' } },
  args: { open: false, loading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { DynamoDBCreateTableModal }, setup: () => ({ args }), template: '<div class="h-96"><DynamoDBCreateTableModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { DynamoDBCreateTableModal }, setup: () => ({ args }), template: '<div class="h-96"><DynamoDBCreateTableModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, loading: true },
  render: (args) => ({ components: { DynamoDBCreateTableModal }, setup: () => ({ args }), template: '<div class="h-96"><DynamoDBCreateTableModal v-bind="args" /></div>' })
};