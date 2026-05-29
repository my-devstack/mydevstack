import type { Meta, StoryObj } from '@storybook/vue3';
import SSMValueModal from './SSMValueModal.vue';

const meta: Meta<typeof SSMValueModal> = {
  title: 'Services/SSM/ValueModal',
  component: SSMValueModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockParameter = {
  Name: '/my/parameter',
  Value: 'my-secret-value',
  Type: 'SecureString',
  Version: 1
};

export const Open: Story = {
  args: { open: true, loading: false, parameter: mockParameter },
  render: (args) => ({ components: { SSMValueModal }, setup: () => ({ args }), template: '<div class="h-64"><SSMValueModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, loading: true, parameter: null },
  render: (args) => ({ components: { SSMValueModal }, setup: () => ({ args }), template: '<div class="h-64"><SSMValueModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, loading: false, parameter: mockParameter },
  render: (args) => ({ components: { SSMValueModal }, setup: () => ({ args }), template: '<div class="h-64"><SSMValueModal v-bind="args" /></div>' })
};