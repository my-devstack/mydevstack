import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoEditUserModal from './CognitoEditUserModal.vue';

const meta: Meta<typeof CognitoEditUserModal> = {
  title: 'Services/Cognito/EditUserModal',
  component: CognitoEditUserModal,
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
    username: 'alice',
    email: 'alice@example.com',
    phoneNumber: '+15551234567'
  },
  render: (args) => ({ components: { CognitoEditUserModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoEditUserModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: {
    open: true,
    userPoolId: 'us-east-1_abc123',
    username: 'alice'
  },
  render: (args) => ({ components: { CognitoEditUserModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoEditUserModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: {
    open: false,
    userPoolId: 'us-east-1_abc123',
    username: 'alice'
  },
  render: (args) => ({ components: { CognitoEditUserModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoEditUserModal v-bind="args" /></div>' })
};