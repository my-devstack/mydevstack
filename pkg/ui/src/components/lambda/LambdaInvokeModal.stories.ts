import type { Meta, StoryObj } from '@storybook/vue3-vite';
import LambdaInvokeModal from './LambdaInvokeModal.vue';

const meta: Meta<typeof LambdaInvokeModal> = {
  title: 'Services/Lambda/InvokeModal',
  component: LambdaInvokeModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true, functionName: 'my-function', loading: false, result: '' },
  render: (args) => ({ components: { LambdaInvokeModal }, setup: () => ({ args }), template: '<div class="h-64"><LambdaInvokeModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, functionName: 'my-function', loading: true, result: '' },
  render: (args) => ({ components: { LambdaInvokeModal }, setup: () => ({ args }), template: '<div class="h-64"><LambdaInvokeModal v-bind="args" /></div>' })
};

export const WithResult: Story = {
  args: { open: true, functionName: 'my-function', loading: false, result: '{"statusCode": 200, "body": "Hello World"}' },
  render: (args) => ({ components: { LambdaInvokeModal }, setup: () => ({ args }), template: '<div class="h-64"><LambdaInvokeModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, functionName: 'my-function', loading: false, result: '' },
  render: (args) => ({ components: { LambdaInvokeModal }, setup: () => ({ args }), template: '<div class="h-64"><LambdaInvokeModal v-bind="args" /></div>' })
};