import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoDeleteUserPoolClientModal from './CognitoDeleteUserPoolClientModal.vue';

const meta: Meta<typeof CognitoDeleteUserPoolClientModal> = {
  title: 'Services/Cognito/DeleteUserPoolClientModal',
  component: CognitoDeleteUserPoolClientModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    clientId: 'client-1',
    clientName: 'web-app'
  },
  render: (args) => ({ components: { CognitoDeleteUserPoolClientModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoDeleteUserPoolClientModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: {
    open: false,
    clientId: 'client-1',
    clientName: 'web-app'
  },
  render: (args) => ({ components: { CognitoDeleteUserPoolClientModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoDeleteUserPoolClientModal v-bind="args" /></div>' })
};