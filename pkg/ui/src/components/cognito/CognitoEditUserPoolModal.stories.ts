import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoEditUserPoolModal from './CognitoEditUserPoolModal.vue';

const meta: Meta<typeof CognitoEditUserPoolModal> = {
  title: 'Services/Cognito/EditUserPoolModal',
  component: CognitoEditUserPoolModal,
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
    poolName: 'my-user-pool',
    mfaConfiguration: 'ON',
    deletionProtection: 'ACTIVE'
  },
  render: (args) => ({ components: { CognitoEditUserPoolModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoEditUserPoolModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: {
    open: true,
    userPoolId: 'us-east-1_abc123',
    poolName: 'my-user-pool'
  },
  render: (args) => ({ components: { CognitoEditUserPoolModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoEditUserPoolModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: {
    open: false,
    userPoolId: 'us-east-1_abc123',
    poolName: 'my-user-pool'
  },
  render: (args) => ({ components: { CognitoEditUserPoolModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoEditUserPoolModal v-bind="args" /></div>' })
};