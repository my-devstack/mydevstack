import type { Meta, StoryObj } from '@storybook/vue3-vite';
import KMSCreateKeyModal from './KMSCreateKeyModal.vue';

const meta: Meta<typeof KMSCreateKeyModal> = {
  title: 'Services/KMS/CreateKeyModal',
  component: KMSCreateKeyModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, loading: { control: 'boolean' } },
  args: { open: false, loading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { KMSCreateKeyModal }, setup: () => ({ args }), template: '<div class="h-64"><KMSCreateKeyModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { KMSCreateKeyModal }, setup: () => ({ args }), template: '<div class="h-64"><KMSCreateKeyModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, loading: true },
  render: (args) => ({ components: { KMSCreateKeyModal }, setup: () => ({ args }), template: '<div class="h-64"><KMSCreateKeyModal v-bind="args" /></div>' })
};