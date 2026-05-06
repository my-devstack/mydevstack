import type { Meta, StoryObj } from '@storybook/vue3-vite';
import SSMCreateModal from './SSMCreateModal.vue';

const meta: Meta<typeof SSMCreateModal> = {
  title: 'Services/SSM/CreateModal',
  component: SSMCreateModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, loading: { control: 'boolean' } },
  args: { open: false, loading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { SSMCreateModal }, setup: () => ({ args }), template: '<div class="h-64"><SSMCreateModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { SSMCreateModal }, setup: () => ({ args }), template: '<div class="h-64"><SSMCreateModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, loading: true },
  render: (args) => ({ components: { SSMCreateModal }, setup: () => ({ args }), template: '<div class="h-64"><SSMCreateModal v-bind="args" /></div>' })
};