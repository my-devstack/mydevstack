import type { Meta, StoryObj } from '@storybook/vue3';
import IAMAddUserToGroupModal from './IAMAddUserToGroupModal.vue';

const meta: Meta<typeof IAMAddUserToGroupModal> = {
  title: 'Services/IAM/AddUserToGroupModal',
  component: IAMAddUserToGroupModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const users = [
  { UserName: 'john@example.com' },
  { UserName: 'jane@example.com' },
  { UserName: 'bob@example.com' }
];

export const Open: Story = {
  args: { open: true, groupName: 'developers', users, loading: false, selectedUser: '' },
  render: (args) => ({ components: { IAMAddUserToGroupModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMAddUserToGroupModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, groupName: 'developers', users, loading: true },
  render: (args) => ({ components: { IAMAddUserToGroupModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMAddUserToGroupModal v-bind="args" /></div>' })
};

export const Empty: Story = {
  args: { open: true, groupName: 'developers', users: [], loading: false },
  render: (args) => ({ components: { IAMAddUserToGroupModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMAddUserToGroupModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, groupName: 'developers', users, loading: false },
  render: (args) => ({ components: { IAMAddUserToGroupModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMAddUserToGroupModal v-bind="args" /></div>' })
};