import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoCreateUserPoolClientModal from './CognitoCreateUserPoolClientModal.vue';

const meta: Meta<typeof CognitoCreateUserPoolClientModal> = {
  title: 'Services/Cognito/CreateUserPoolClientModal',
  component: CognitoCreateUserPoolClientModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { CognitoCreateUserPoolClientModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoCreateUserPoolClientModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { CognitoCreateUserPoolClientModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoCreateUserPoolClientModal v-bind="args" /></div>' })
};