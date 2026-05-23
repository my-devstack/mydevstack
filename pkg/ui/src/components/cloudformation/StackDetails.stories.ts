import type { Meta, StoryObj } from '@storybook/vue3';
import StackDetails from './StackDetails.vue';

const meta: Meta<typeof StackDetails> = {
  title: 'Services/CloudFormation/StackDetails',
  component: StackDetails,
  tags: ['autodocs'],
  args: {}
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockStack = {
  StackId: 'arn:aws:cloudformation:us-east-1:123456789012:stack/my-stack/abc123',
  StackName: 'my-stack',
  CreationTime: '2024-01-15T10:00:00Z',
  Description: 'My CloudFormation stack'
};

export const Default: Story = {
  args: { stack: mockStack },
  render: (args) => ({ components: { StackDetails }, setup: () => ({ args }), template: '<div class="h-64"><StackDetails v-bind="args" /></div>' })
};

export const Empty: Story = {
  args: { stack: {} },
  render: (args) => ({ components: { StackDetails }, setup: () => ({ args }), template: '<div class="h-64"><StackDetails v-bind="args" /></div>' })
};