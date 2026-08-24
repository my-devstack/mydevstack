import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoCreateUserModal from './CognitoCreateUserModal.vue';

const meta: Meta<typeof CognitoCreateUserModal> = {
  title: 'Services/Cognito/CreateUserModal',
  component: CognitoCreateUserModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  args: { open: true },
  render: (args) => ({ components: { CognitoCreateUserModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoCreateUserModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { CognitoCreateUserModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoCreateUserModal v-bind="args" /></div>' })
};