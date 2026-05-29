import type { Meta, StoryObj } from '@storybook/vue3';
import DynamoDBCodeExamples from './DynamoDBCodeExamples.vue';

const meta: Meta<typeof DynamoDBCodeExamples> = {
  title: 'Services/DynamoDB/CodeExamples',
  component: DynamoDBCodeExamples,
  tags: ['autodocs'],
  argTypes: { type: { control: 'select', options: ['table', 'stream'] } },
  args: { type: 'table' }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TableExample: Story = {
  args: { type: 'table' },
  render: (args) => ({ components: { DynamoDBCodeExamples }, setup: () => ({ args }), template: '<div class="h-96"><DynamoDBCodeExamples v-bind="args" /></div>' })
};

export const StreamExample: Story = {
  args: { type: 'stream' },
  render: (args) => ({ components: { DynamoDBCodeExamples }, setup: () => ({ args }), template: '<div class="h-96"><DynamoDBCodeExamples v-bind="args" /></div>' })
};