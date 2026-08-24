import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoCreateUserPoolModal from './CognitoCreateUserPoolModal.vue';

const meta: Meta<typeof CognitoCreateUserPoolModal> = {
  title: 'Services/Cognito/CreateUserPoolModal',
  component: CognitoCreateUserPoolModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  args: { open: true },
  render: (args) => ({ components: { CognitoCreateUserPoolModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoCreateUserPoolModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { CognitoCreateUserPoolModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoCreateUserPoolModal v-bind="args" /></div>' })
};