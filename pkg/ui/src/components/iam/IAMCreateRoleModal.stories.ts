import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IAMCreateRoleModal from './IAMCreateRoleModal.vue';

const meta: Meta<typeof IAMCreateRoleModal> = {
  title: 'Services/IAM/CreateRoleModal',
  component: IAMCreateRoleModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, loading: { control: 'boolean' } },
  args: { open: false, loading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { IAMCreateRoleModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMCreateRoleModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { IAMCreateRoleModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMCreateRoleModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, loading: true },
  render: (args) => ({ components: { IAMCreateRoleModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMCreateRoleModal v-bind="args" /></div>' })
};