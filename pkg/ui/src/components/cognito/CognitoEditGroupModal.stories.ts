import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoEditGroupModal from './CognitoEditGroupModal.vue';

const meta: Meta<typeof CognitoEditGroupModal> = {
  title: 'Services/Cognito/EditGroupModal',
  component: CognitoEditGroupModal,
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
    description: 'Admin group',
    roleArn: 'arn:aws:iam::000000000000:role/admin',
    precedence: 5
  },
  render: (args) => ({ components: { CognitoEditGroupModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoEditGroupModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: {
    open: true,
    userPoolId: 'us-east-1_abc123',
    groupName: 'admins'
  },
  render: (args) => ({ components: { CognitoEditGroupModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoEditGroupModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: {
    open: false,
    userPoolId: 'us-east-1_abc123',
    groupName: 'admins'
  },
  render: (args) => ({ components: { CognitoEditGroupModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoEditGroupModal v-bind="args" /></div>' })
};