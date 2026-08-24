import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoEditUserPoolClientModal from './CognitoEditUserPoolClientModal.vue';

const meta: Meta<typeof CognitoEditUserPoolClientModal> = {
  title: 'Services/Cognito/EditUserPoolClientModal',
  component: CognitoEditUserPoolClientModal,
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
    clientId: '1abc2def3ghi4jkl5mno6pqr7',
    clientName: 'web-app',
    refreshTokenValidity: 30,
    accessTokenValidity: 60,
    idTokenValidity: 60
  },
  render: (args) => ({ components: { CognitoEditUserPoolClientModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoEditUserPoolClientModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: {
    open: false,
    userPoolId: 'us-east-1_abc123',
    clientId: '1abc2def3ghi4jkl5mno6pqr7',
    clientName: 'web-app'
  },
  render: (args) => ({ components: { CognitoEditUserPoolClientModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoEditUserPoolClientModal v-bind="args" /></div>' })
};