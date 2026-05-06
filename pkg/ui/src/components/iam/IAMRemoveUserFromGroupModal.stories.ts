import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IAMRemoveUserFromGroupModal from './IAMRemoveUserFromGroupModal.vue';

const meta: Meta<typeof IAMRemoveUserFromGroupModal> = {
  title: 'Services/IAM/RemoveUserFromGroupModal',
  component: IAMRemoveUserFromGroupModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true, userName: 'john@example.com', groupName: 'developers' },
  render: (args) => ({ components: { IAMRemoveUserFromGroupModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMRemoveUserFromGroupModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, userName: 'john@example.com', groupName: 'developers' },
  render: (args) => ({ components: { IAMRemoveUserFromGroupModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMRemoveUserFromGroupModal v-bind="args" /></div>' })
};