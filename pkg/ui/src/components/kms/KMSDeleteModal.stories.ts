import type { Meta, StoryObj } from '@storybook/vue3-vite';
import KMSDeleteModal from './KMSDeleteModal.vue';

const meta: Meta<typeof KMSDeleteModal> = {
  title: 'Services/KMS/DeleteModal',
  component: KMSDeleteModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { KMSDeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><KMSDeleteModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { KMSDeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><KMSDeleteModal v-bind="args" /></div>' })
};