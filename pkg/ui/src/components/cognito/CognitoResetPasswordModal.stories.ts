import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoResetPasswordModal from './CognitoResetPasswordModal.vue';

const meta: Meta<typeof CognitoResetPasswordModal> = {
  title: 'Services/Cognito/ResetPasswordModal',
  component: CognitoResetPasswordModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    username: 'alice'
  },
  render: (args) => ({ components: { CognitoResetPasswordModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoResetPasswordModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: {
    open: false,
    username: 'alice'
  },
  render: (args) => ({ components: { CognitoResetPasswordModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoResetPasswordModal v-bind="args" /></div>' })
};