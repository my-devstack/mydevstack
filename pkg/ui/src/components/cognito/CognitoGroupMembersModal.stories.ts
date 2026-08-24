import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoGroupMembersModal from './CognitoGroupMembersModal.vue';

const meta: Meta<typeof CognitoGroupMembersModal> = {
  title: 'Services/Cognito/GroupMembersModal',
  component: CognitoGroupMembersModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    userPoolId: 'us-east-1_abc123',
    groupName: 'admins',
    users: [
      { Username: 'alice', UserStatus: 'CONFIRMED' },
      { Username: 'bob', UserStatus: 'CONFIRMED' },
      { Username: 'carol', UserStatus: 'FORCE_CHANGE_PASSWORD' }
    ],
    members: [
      { Username: 'alice', UserStatus: 'CONFIRMED' }
    ],
    loading: false
  },
  render: (args) => ({ components: { CognitoGroupMembersModal }, setup: () => ({ args }), template: '<div class="h-96"><CognitoGroupMembersModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: {
    open: true,
    userPoolId: 'us-east-1_abc123',
    groupName: 'admins',
    users: [],
    members: [],
    loading: true
  },
  render: (args) => ({ components: { CognitoGroupMembersModal }, setup: () => ({ args }), template: '<div class="h-96"><CognitoGroupMembersModal v-bind="args" /></div>' })
};

export const Empty: Story = {
  args: {
    open: true,
    userPoolId: 'us-east-1_abc123',
    groupName: 'admins',
    users: [{ Username: 'alice', UserStatus: 'CONFIRMED' }],
    members: [],
    loading: false
  },
  render: (args) => ({ components: { CognitoGroupMembersModal }, setup: () => ({ args }), template: '<div class="h-96"><CognitoGroupMembersModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: {
    open: false,
    userPoolId: 'us-east-1_abc123',
    groupName: 'admins',
    users: [],
    members: [],
    loading: false
  },
  render: (args) => ({ components: { CognitoGroupMembersModal }, setup: () => ({ args }), template: '<div class="h-96"><CognitoGroupMembersModal v-bind="args" /></div>' })
};