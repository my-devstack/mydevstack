import type { Meta, StoryObj } from '@storybook/vue3-vite';
import DynamoDBDeleteTableModal from './DynamoDBDeleteTableModal.vue';

const meta: Meta<typeof DynamoDBDeleteTableModal> = {
  title: 'Services/DynamoDB/DeleteTableModal',
  component: DynamoDBDeleteTableModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { DynamoDBDeleteTableModal }, setup: () => ({ args }), template: '<div class="h-64"><DynamoDBDeleteTableModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { DynamoDBDeleteTableModal }, setup: () => ({ args }), template: '<div class="h-64"><DynamoDBDeleteTableModal v-bind="args" /></div>' })
};