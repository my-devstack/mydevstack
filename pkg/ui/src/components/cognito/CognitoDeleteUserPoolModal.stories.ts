import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoDeleteUserPoolModal from './CognitoDeleteUserPoolModal.vue';

const meta: Meta<typeof CognitoDeleteUserPoolModal> = {
  title: 'Services/Cognito/DeleteUserPoolModal',
  component: CognitoDeleteUserPoolModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false, userPoolId: 'us-east-1_abc123', userPoolName: 'my-user-pool' }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Delete: Story = {
  args: { open: true },
  render: (args) => ({ components: { CognitoDeleteUserPoolModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoDeleteUserPoolModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { CognitoDeleteUserPoolModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoDeleteUserPoolModal v-bind="args" /></div>' })
};