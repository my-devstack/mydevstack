import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IAMDeleteRoleModal from './IAMDeleteRoleModal.vue';

const meta: Meta<typeof IAMDeleteRoleModal> = {
  title: 'Services/IAM/DeleteRoleModal',
  component: IAMDeleteRoleModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false, roleName: 'my-role' }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { IAMDeleteRoleModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMDeleteRoleModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { IAMDeleteRoleModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMDeleteRoleModal v-bind="args" /></div>' })
};