import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoTestLoginModal from './CognitoTestLoginModal.vue';

const meta: Meta<typeof CognitoTestLoginModal> = {
  title: 'Services/Cognito/TestLoginModal',
  component: CognitoTestLoginModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    username: 'alice',
    userPoolId: 'us-east-1_abc123',
    clients: [
      { ClientId: 'client-1', ClientName: 'web-app' },
      { ClientId: 'client-2', ClientName: 'mobile-app' }
    ]
  },
  render: (args) => ({ components: { CognitoTestLoginModal }, setup: () => ({ args }), template: '<div class="h-96"><CognitoTestLoginModal v-bind="args" /></div>' })
};

export const WithResult: Story = {
  args: {
    open: true,
    username: 'alice',
    userPoolId: 'us-east-1_abc123',
    clients: [{ ClientId: 'client-1', ClientName: 'web-app' }],
    authResult: {
      AuthenticationResult: {
        AccessToken: 'eyJhbGciOiJIUzI1NiJ9.example',
        IdToken: 'eyJhbGciOiJIUzI1NiJ9.example',
        RefreshToken: 'refresh-token',
        ExpiresIn: 3600
      }
    }
  },
  render: (args) => ({ components: { CognitoTestLoginModal }, setup: () => ({ args }), template: '<div class="h-96"><CognitoTestLoginModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: {
    open: false,
    username: 'alice',
    userPoolId: 'us-east-1_abc123',
    clients: []
  },
  render: (args) => ({ components: { CognitoTestLoginModal }, setup: () => ({ args }), template: '<div class="h-96"><CognitoTestLoginModal v-bind="args" /></div>' })
};