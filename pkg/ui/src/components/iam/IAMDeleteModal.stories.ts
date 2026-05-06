import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IAMDeleteModal from './IAMDeleteModal.vue';

const meta: Meta<typeof IAMDeleteModal> = {
  title: 'Services/IAM/DeleteModal',
  component: IAMDeleteModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false, title: 'Delete User', message: 'Are you sure you want to delete', itemName: 'test-user' }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { IAMDeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMDeleteModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { IAMDeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMDeleteModal v-bind="args" /></div>' })
};

export const DeleteRole: Story = {
  args: { open: true, title: 'Delete Role', message: 'Are you sure you want to delete role', itemName: 'my-role' },
  render: (args) => ({ components: { IAMDeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMDeleteModal v-bind="args" /></div>' })
};

export const DeletePolicy: Story = {
  args: { open: true, title: 'Delete Policy', message: 'Are you sure you want to delete policy', itemName: 'my-policy' },
  render: (args) => ({ components: { IAMDeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMDeleteModal v-bind="args" /></div>' })
};