import type { Meta, StoryObj } from '@storybook/vue3-vite';
import DynamoDBDeleteItemModal from './DynamoDBDeleteItemModal.vue';

const meta: Meta<typeof DynamoDBDeleteItemModal> = {
  title: 'Services/DynamoDB/DeleteItemModal',
  component: DynamoDBDeleteItemModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { DynamoDBDeleteItemModal }, setup: () => ({ args }), template: '<div class="h-64"><DynamoDBDeleteItemModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { DynamoDBDeleteItemModal }, setup: () => ({ args }), template: '<div class="h-64"><DynamoDBDeleteItemModal v-bind="args" /></div>' })
};