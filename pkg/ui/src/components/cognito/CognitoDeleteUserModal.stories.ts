import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoDeleteUserModal from './CognitoDeleteUserModal.vue';

const meta: Meta<typeof CognitoDeleteUserModal> = {
  title: 'Services/Cognito/DeleteUserModal',
  component: CognitoDeleteUserModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false, username: 'alice' }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Delete: Story = {
  args: { open: true },
  render: (args) => ({ components: { CognitoDeleteUserModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoDeleteUserModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { CognitoDeleteUserModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoDeleteUserModal v-bind="args" /></div>' })
};