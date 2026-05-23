import type { Meta, StoryObj } from '@storybook/vue3';
import IAMGroupUsersModal from './IAMGroupUsersModal.vue';

const meta: Meta<typeof IAMGroupUsersModal> = {
  title: 'Services/IAM/GroupUsersModal',
  component: IAMGroupUsersModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const testUsers = [
  { UserName: 'john@example.com', Arn: 'arn:aws:iam::123456789012:user/john' },
  { UserName: 'jane@example.com', Arn: 'arn:aws:iam::123456789012:user/jane' }
];

const availableUsers = [{ UserName: 'new-user' }, { UserName: 'another-user' }];

export const OpenWithUsers: Story = {
  args: { open: true, groupName: 'developers', users: testUsers, availableUsers },
  render: (args) => ({ components: { IAMGroupUsersModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMGroupUsersModal v-bind="args" /></div>' })
};

export const OpenEmpty: Story = {
  args: { open: true, groupName: 'developers', users: [], availableUsers },
  render: (args) => ({ components: { IAMGroupUsersModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMGroupUsersModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, groupName: 'developers', users: testUsers, availableUsers: [] },
  render: (args) => ({ components: { IAMGroupUsersModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMGroupUsersModal v-bind="args" /></div>' })
};